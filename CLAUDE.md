@AGENTS.md

## 세션 시작 시 자동 실행 (필수)
매 세션 시작 시 사용자의 첫 메시지를 처리하기 전에:
```bash
[ -f setup.sh ] && { [ ! -f .git/hooks/pre-commit ] || [ ! -d node_modules ]; } && bash setup.sh
git pull
```

## Lamperoma 프로젝트 구조

**목적**: 네일 아크릴 교육 수강일지 관리 시스템 (원장 ↔ 수강생)

**스택**
- Next.js 16 App Router + TS + Tailwind v4
- 인증/DB/Storage: Supabase (Google OAuth via Supabase Auth)
- 알림 레이어: `src/lib/notifications/` — 인앱(항상) + 이메일(Resend) + SMS/알림톡(Solapi 스켈레톤)
- 개발 포트: **3011**

**핵심 개념 (멀티테넌트)**
- 원장 = tenant. `teachers` 테이블. `ADMIN_EMAILS` env에 포함된 이메일로 로그인 시 자동 생성
- 수강생 = `students`, 원장 초대링크(`invites`)로만 가입 가능
- 한 원장이 자기 수강생·코스·일지만 보게 Supabase **RLS**로 강제

**경로**
- `/login` · `/auth/callback` · `/auth/signout`
- `/invite/[token]` (랜딩) → `/invite/[token]/accept` (수락·student row 생성)
- 원장: `/teacher` · `/teacher/invites` · `/teacher/students/[id]` · `/teacher/sessions/[id]`
- 수강생: `/student` · `/student/sessions/[id]`

**Supabase 프로젝트 초기 셋업** (사용자가 수동 1회)
1. supabase.com 에서 프로젝트 생성 (Region: Northeast Asia Seoul)
2. Settings → API 에서 URL / anon key / service_role key 복사 → `.env.local`
3. Authentication → Providers → Google 활성화 + Google OAuth Client ID/Secret 입력
4. Authentication → URL Configuration: Site URL `http://localhost:3011`, Redirect URLs `http://localhost:3011/**`
5. Google Cloud Console 에서 승인된 리디렉션 URI에 `https://<ref>.supabase.co/auth/v1/callback` 추가
6. `supabase/migrations/*.sql` 을 Supabase SQL Editor에서 실행 (또는 `npx supabase db push` after `supabase link`)
