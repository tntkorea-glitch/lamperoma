---
name: Auth setup
description: Lamperoma 인증 — Supabase Auth (Google OAuth), NextAuth에서 교체됨 (2026-04-23)
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
- **Supabase Auth + Google OAuth** 사용. NextAuth v5 셋업했다가 멀티테넌트 RLS 자동화를 위해 Supabase Auth로 전환.
- 핵심 파일:
  - `src/lib/supabase/client.ts` / `server.ts` / `admin.ts` / `middleware.ts` — 세 종류 클라이언트 + 미들웨어 helper
  - `middleware.ts` (루트) — 모든 라우트 세션 refresh + 비공개 경로 로그인 가드
  - `src/app/auth/callback/route.ts` — OAuth code → session 교환, invite 토큰이 있으면 accept로 연결
  - `src/app/auth/signout/route.ts` — POST 로 로그아웃
  - `src/app/login/page.tsx` — Google 버튼만 작동. 카카오·네이버는 alert stub
  - `src/lib/auth/bootstrap.ts` — `resolveRole(user)`: teacher→student→unassigned 분기. `ADMIN_EMAILS` env에 이메일 있으면 teacher row 자동 생성
  - `src/lib/auth/getUser.ts` — `getAuthedUser()` / `requireTeacher()` / `requireStudent()` server helpers
- **환경변수** (`.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAILS` — 쉼표 구분, 원장 승격 허용 이메일 목록
  - Google OAuth client id/secret 은 **Supabase 대시보드**에 등록하므로 앱 env에는 불필요 (백업용으로 남겨둠)
- **공개 경로** (middleware 에서 인증 미강제): `/`, `/login`, `/invite/*`, `/auth/*`
- Supabase URL Configuration: Site URL = `http://localhost:3011`, Redirect URLs = `http://localhost:3011/**`

**Why:** NextAuth 유지하면 RLS 수동 구현 필요. Supabase Auth는 JWT가 Postgres로 바로 연결돼서 RLS가 `auth.uid()` 로 자동 작동 → 멀티테넌트 격리 보장이 코드 없이 DB 레벨에서 됨.
**How to apply:** 새 기능에서 쿼리 작성할 때 `createSupabaseServerClient()` 쓰면 RLS 자동 적용. 우회가 필요할 때만 `createSupabaseAdminClient()` (service_role) 사용 — invite accept, bootstrap, cross-user 알림 insert 같은 관리자 작업.
