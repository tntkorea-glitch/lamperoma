import pg from 'pg';
const { Client } = pg;

const OLD_DB = { host: 'aws-1-ap-northeast-2.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres.ifzllqbefmecrbpwibiu', password: 'gkdl2486$$$', ssl: { rejectUnauthorized: false } };
const NEW_DB = { host: 'aws-1-ap-northeast-2.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres.wrwaltyqxtczwzfjnkbj', password: 'gkdl2486$$$', ssl: { rejectUnauthorized: false } };

const PUBLIC_TABLES = [
  'teachers',
  'students',
  'invites',
  'courses',
  'course_sessions',
  'lesson_logs',
  'comments',
  'notifications',
  'admins',
  'teacher_invites',
  'app_settings',
];

async function migrate() {
  const src = new Client(OLD_DB);
  const dst = new Client(NEW_DB);

  await src.connect();
  await dst.connect();
  console.log('✓ 두 DB 연결 완료');

  // 1. auth.users 이관
  console.log('\n[1/2] auth.users 이관 중...');
  const { rows: authUsers } = await src.query(
    `SELECT id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token,
            confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new,
            email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data,
            raw_user_meta_data, is_super_admin, created_at, updated_at, phone,
            phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
            email_change_token_current, email_change_confirm_status, banned_until,
            reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, role, instance_id
     FROM auth.users`
  );
  console.log(`  → ${authUsers.length}명 발견`);

  // identities 이관
  const { rows: identities } = await src.query(
    `SELECT id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
     FROM auth.identities`
  );
  console.log(`  → identities ${identities.length}개 발견`);

  // auth.users insert
  for (const u of authUsers) {
    await dst.query(
      `INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token,
        confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new,
        email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data,
        raw_user_meta_data, is_super_admin, created_at, updated_at, phone,
        phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
        email_change_token_current, email_change_confirm_status, banned_until,
        reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, role, instance_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
      ) ON CONFLICT (id) DO NOTHING`,
      [
        u.id, u.email, u.encrypted_password, u.email_confirmed_at, u.invited_at, u.confirmation_token,
        u.confirmation_sent_at, u.recovery_token, u.recovery_sent_at, u.email_change_token_new,
        u.email_change, u.email_change_sent_at, u.last_sign_in_at, u.raw_app_meta_data,
        u.raw_user_meta_data, u.is_super_admin, u.created_at, u.updated_at, u.phone,
        u.phone_confirmed_at, u.phone_change, u.phone_change_token, u.phone_change_sent_at,
        u.email_change_token_current, u.email_change_confirm_status, u.banned_until,
        u.reauthentication_token, u.reauthentication_sent_at, u.is_sso_user, u.deleted_at, u.role, u.instance_id
      ]
    ).catch(e => console.warn(`    ⚠ auth.users ${u.email}: ${e.message}`));
  }
  console.log(`  ✓ auth.users 완료`);

  // auth.identities insert
  for (const i of identities) {
    await dst.query(
      `INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [i.id, i.user_id, i.identity_data, i.provider, i.last_sign_in_at, i.created_at, i.updated_at, i.provider_id]
    ).catch(e => console.warn(`    ⚠ identities: ${e.message}`));
  }
  console.log(`  ✓ auth.identities 완료`);

  // 2. public schema 이관
  console.log('\n[2/2] public 테이블 이관 중...');
  await dst.query('SET session_replication_role = replica'); // FK 제약 임시 해제

  for (const table of PUBLIC_TABLES) {
    const { rows } = await src.query(`SELECT * FROM public.${table}`);
    if (rows.length === 0) {
      console.log(`  - ${table}: 데이터 없음`);
      continue;
    }
    const cols = Object.keys(rows[0]);
    const placeholders = rows[0] && cols.map((_, i) => `$${i + 1}`).join(',');
    let count = 0;
    for (const row of rows) {
      await dst.query(
        `INSERT INTO public.${table} (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        cols.map(c => row[c])
      ).catch(e => console.warn(`    ⚠ ${table} row: ${e.message}`));
      count++;
    }
    console.log(`  ✓ ${table}: ${count}행`);
  }

  await dst.query('SET session_replication_role = DEFAULT'); // FK 복원

  await src.end();
  await dst.end();
  console.log('\n✅ 이관 완료!');
}

migrate().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
