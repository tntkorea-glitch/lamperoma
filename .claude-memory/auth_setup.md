---
name: Auth setup
description: Lamperoma 인증 구성 — NextAuth v5, JWT 세션, Google + Credentials, 카카오/네이버는 UI만
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
- **NextAuth v5 beta** (`next-auth@^5.0.0-beta.31`) + App Router 네이티브 구조.
- 핵심 파일:
  - `src/lib/auth.ts` — `NextAuth(...)` 호출, `handlers/auth/signIn/signOut` export. Credentials authorize는 현재 stub (항상 null) — 실제 DB 연동 필요.
  - `src/app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers;`
  - `src/components/providers/SessionProvider.tsx` — `"use client"` 래퍼, layout에서 SSR children 감쌈.
  - `src/types/next-auth.d.ts` — Session.user.id, JWT.id 확장.
  - `src/app/login/page.tsx` — 이메일/비번 폼 + Google/카카오/네이버 버튼 (카카오·네이버는 `alert("준비 중")`).
  - `src/components/auth/AuthGuard.tsx` — 미로그인 시 `/login` 리다이렉트, 로딩 스피너.
- **환경변수** (`.env.local` 키만 채움, 값은 사용자 입력 대기):
  - `AUTH_SECRET` — 스킬 실행 시 랜덤 32바이트로 자동 채움 (교체해도 무방).
  - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google Cloud Console에서 받아 입력 필요.
- **Google OAuth redirect URI**:
  - 로컬: `http://localhost:3011/api/auth/callback/google`
  - 배포: `https://<vercel-domain>/api/auth/callback/google`
- 세션 전략: JWT (DB 없음). 추후 Prisma/Supabase 붙이면 `@auth/prisma-adapter` 등 교체.

**Why:** 신규 프로젝트이므로 v4가 아닌 v5 네이티브로 셋업 (App Router 호환성 + 미래 대비).
**How to apply:** Credentials 실제 인증 로직 추가할 때 `authorize` 함수 채우기. 카카오/네이버 실제 연동 요청 오면 provider 추가하고 placeholder alert 제거. Vercel 배포 시 `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` 을 Vercel 환경변수에도 등록 필요 (AUTH_URL은 자동 감지됨).
