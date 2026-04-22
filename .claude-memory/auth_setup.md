---
name: Auth setup
description: Lamperoma 인증 — NextAuth v5 + Google OAuth (2026-04-23에 Supabase Auth에서 다시 전환)
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
- **NextAuth v5** (`next-auth@5.0.0-beta.31`) + Google Provider 사용. kakao-app 등 사용자의 다른 프로젝트와 동일 패턴 유지를 위해 Supabase Auth에서 전환.
- Supabase는 **DB + Storage** 전용. 모든 서버 쿼리는 `createSupabaseAdminClient()` (service_role) 사용.
- NextAuth의 `signIn` 콜백에서 Supabase `auth.admin.listUsers/createUser`로 auth.users row 보장 → `session.user.id` = Supabase auth.users.id 로 동기화. 기존 스키마(FK to auth.users) 전부 유지.
- 핵심 파일:
  - `src/lib/auth.ts` — NextAuth 설정 + `ensureSupabaseUser` 헬퍼
  - `src/app/api/auth/[...nextauth]/route.ts` — v5 `handlers` 라우트
  - `src/components/providers/SessionProvider.tsx` — 클라이언트 세션 래퍼
  - `middleware.ts` (루트) — `auth()` 기반 보호, 공개 경로 명시
  - `src/lib/supabase/admin.ts` — service_role 클라이언트 (서버 전용)
  - `src/lib/auth/bootstrap.ts` — `resolveRole(userId, email, name)`: admin→teacher→student→unassigned
  - `src/lib/auth/getUser.ts` — `getAuthedUser()` / `requireAdmin()` / `requireTeacher()` / `requireStudent()` server helpers
  - `src/lib/storage/upload.ts` — 이미지 업로드는 서버 액션 경유 (service_role 로 upload)
  - `src/types/next-auth.d.ts` — Session.user.id 타입 확장
- **환경변수** (`.env.local`):
  - `AUTH_SECRET` (NextAuth) — randomBytes(32).toString("base64")
  - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google Cloud Console
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAILS` — 쉼표 구분, admin 승격 허용 이메일 목록
- **Google OAuth redirect URI** (Google Cloud Console에 등록 필수):
  - NextAuth: `http://localhost:3011/api/auth/callback/google`
  - Supabase (구): `https://<ref>.supabase.co/auth/v1/callback` — 계속 두되 실제로는 미사용
- **공개 경로** (middleware): `/`, `/login`, `/invite/*`, `/teacher-invite/*`, `/api/auth/*`
- **역할 3단계**: admin (관리자, ADMIN_EMAILS) > teacher (원장, 초대받아 가입) > student (수강생, 원장 초대로 가입)

**Why:** 다른 프로젝트(kakao-app 등)와 동일한 NextAuth v5 패턴 유지 → 인증 로직 공유/재활용. RLS 자동 연동은 포기하고 service_role + 앱 레벨 권한 체크(`requireXxx`)로 처리.
**How to apply:** 새 페이지 만들 땐 `requireAdmin()` / `requireTeacher()` / `requireStudent()` 하나 호출로 가드. 데이터는 `createSupabaseAdminClient()` 로 조회. 브라우저에서 쓰는 건 `signIn("google")` / `useSession()` from `next-auth/react`.
