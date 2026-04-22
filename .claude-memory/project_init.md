---
name: Project init
description: Lamperoma 초기 셋업 상태 — 기술 스택, 포트, 저장소, 미결 사항
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
- 생성일: 2026-04-23
- 저장소: https://github.com/tntkorea-glitch/lamperoma (public)
- 스택: Next.js 16.2.4 + React 19.2.4 + TypeScript + Tailwind v4 + App Router + src/ 구조
- **개발 포트: 3011 고정** (package.json `dev`/`start` 둘 다 `-p 3011`). 로그인 추가 시 Google OAuth redirect URI는 `http://localhost:3011/api/auth/callback/google`.
- 적용된 공통 셋업: gitleaks pre-commit, .claude-memory/, public/inapp-guard.js (head 최상단 beforeInteractive), .claude/settings.json (SessionStart 자동 pull + Stop 자동 commit), vercel.json.
- 아직 미결정: 서비스 도메인/브랜드 컨셉, 로그인 여부, Vercel 링크. 사용자가 용도 알려주면 이후 방향 결정.

**Why:** 여러 프로젝트 동시 실행 시 포트 충돌 방지 + 기존 프로젝트들과 동일한 자동화 훅 환경 유지를 위해 /new 스킬 표준대로 셋업.
**How to apply:** 로그인 붙일 땐 `/login` 스킬 호출, Google Cloud Console에 3011 포트 redirect URI 등록 안내 필요. `npm run dev`는 항상 3011에서 뜸.
