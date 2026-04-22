-- Lamperoma: 네일 아크릴 수강일지 관리
-- 멀티테넌트: 원장(teacher)별로 수강생/코스/일지 격리. RLS로 강제.

-- ===============================================
-- Extensions
-- ===============================================
create extension if not exists "pgcrypto";

-- ===============================================
-- Tables
-- ===============================================

-- 원장 (auth.users 와 1:1, id는 auth user id 사용)
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  salon_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 수강생 (auth.users 와 1:1)
-- teacher_id 로 소속 원장 지정
create table public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  name text not null,
  email text not null,
  phone text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.students (teacher_id);

-- 초대링크 (원장별 발급, 수강생이 해당 토큰으로 가입)
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  token text not null unique,
  name text,
  email text,
  phone text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.invites (teacher_id);
create index on public.invites (token);

-- 수강 과정 (원장 ↔ 수강생의 한 "반")
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  total_sessions int not null default 10,
  started_at date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.courses (teacher_id);
create index on public.courses (student_id);

-- 회차 (한 코스의 N회차 수업 단위)
create table public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  session_no int not null,
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'logged', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, session_no)
);

create index on public.course_sessions (course_id);

-- 수강일지 (원장님이 회차별로 작성)
create table public.lesson_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions(id) on delete cascade unique,
  title text,
  content text not null default '',
  topics text[] not null default '{}',
  strengths text,
  improvements text,
  next_prep text,
  images text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 코멘트 (수강생 질문/원장 답변 스레드)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('teacher', 'student')),
  body text not null,
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index on public.comments (session_id, created_at);

-- 알림 (인앱 + 발송 이력)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  sent_email_at timestamptz,
  sent_sms_at timestamptz,
  sent_kakao_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id, created_at desc);
create index on public.notifications (user_id) where read_at is null;

-- ===============================================
-- updated_at 자동 갱신 트리거
-- ===============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.teachers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.students
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.course_sessions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lesson_logs
  for each row execute function public.set_updated_at();

-- ===============================================
-- 헬퍼 함수: 현재 로그인 유저가 해당 teacher 인지
-- ===============================================
create or replace function public.is_teacher(p_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = p_teacher_id;
$$;

create or replace function public.current_student_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select teacher_id from public.students where id = auth.uid();
$$;

-- ===============================================
-- RLS 활성화
-- ===============================================
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.invites enable row level security;
alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.lesson_logs enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- ===============================================
-- Policies: teachers
-- ===============================================
-- 원장 본인은 자기 row 읽기/수정
create policy "teacher self read" on public.teachers
  for select using (auth.uid() = id);
create policy "teacher self update" on public.teachers
  for update using (auth.uid() = id);

-- 수강생은 자기 원장 정보 읽기 가능 (연락처 표시용)
create policy "student reads own teacher" on public.teachers
  for select using (id = public.current_student_teacher_id());

-- ===============================================
-- Policies: students
-- ===============================================
-- 원장: 자기 소속 수강생 전체 CRUD
create policy "teacher manages own students" on public.students
  for all using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- 수강생: 자기 자신만 읽기/수정
create policy "student reads self" on public.students
  for select using (auth.uid() = id);
create policy "student updates self" on public.students
  for update using (auth.uid() = id);

-- ===============================================
-- Policies: invites
-- ===============================================
-- 원장: 자기 초대링크만 CRUD
create policy "teacher manages own invites" on public.invites
  for all using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- 초대링크 열람은 server-side service-role 에서만 (수강생 가입 플로우)

-- ===============================================
-- Policies: courses
-- ===============================================
create policy "teacher manages own courses" on public.courses
  for all using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "student reads own courses" on public.courses
  for select using (auth.uid() = student_id);

-- ===============================================
-- Policies: course_sessions
-- ===============================================
create policy "teacher manages sessions of own courses" on public.course_sessions
  for all using (
    exists (
      select 1 from public.courses c
      where c.id = course_sessions.course_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_sessions.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "student reads own sessions" on public.course_sessions
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_sessions.course_id and c.student_id = auth.uid()
    )
  );

-- ===============================================
-- Policies: lesson_logs
-- ===============================================
create policy "teacher manages own lesson logs" on public.lesson_logs
  for all using (
    exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = lesson_logs.session_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = lesson_logs.session_id and c.teacher_id = auth.uid()
    )
  );

create policy "student reads published lesson logs" on public.lesson_logs
  for select using (
    published_at is not null
    and exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = lesson_logs.session_id and c.student_id = auth.uid()
    )
  );

-- ===============================================
-- Policies: comments
-- ===============================================
-- 원장/수강생 모두 자기 세션 대화 읽기, 본인 작성 코멘트 생성
create policy "teacher reads comments of own sessions" on public.comments
  for select using (
    exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = comments.session_id and c.teacher_id = auth.uid()
    )
  );

create policy "student reads comments of own sessions" on public.comments
  for select using (
    exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = comments.session_id and c.student_id = auth.uid()
    )
  );

create policy "teacher writes comments" on public.comments
  for insert with check (
    author_id = auth.uid()
    and author_role = 'teacher'
    and exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = comments.session_id and c.teacher_id = auth.uid()
    )
  );

create policy "student writes comments" on public.comments
  for insert with check (
    author_id = auth.uid()
    and author_role = 'student'
    and exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = comments.session_id and c.student_id = auth.uid()
    )
  );

create policy "author deletes own comment" on public.comments
  for delete using (author_id = auth.uid());

-- ===============================================
-- Policies: notifications
-- ===============================================
create policy "user reads own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "user updates own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- insert 는 service-role 서버에서만
