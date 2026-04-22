---
name: Feature status
description: Lamperoma 2026-04-23 기준 구현 완료 범위 + 남은 TODO. 어디까지 됐고 뭐가 안 됐는지 한눈에.
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
## ✅ 구현 완료
- **3단계 역할**: admin / teacher / student + ADMIN_EMAILS 자동 승격
- **초대 플로우**: admin → teacher (teacher_invites), teacher → student (invites)
- **원장 대시보드**: 수강생 목록 + 검색 필터 + 초대링크 발급
- **수강생 상세**: 과정 개설, 상태 변경 (active/paused/completed/cancelled) 드롭다운
- **회차 관리**: session upsert, scheduled_at 편집(원장), 학생쪽 예정일 표시
- **수강일지 편집기**: 제목/본문/잘한점/개선점/다음준비물/이미지 업로드 (서버액션 경유), 임시저장/공개
- **양방향 코멘트 스레드**: 이미지 첨부 가능, router.refresh 기반
- **관리자 대시보드**: stat 카드 4개(링크 연결), 최근 가입 원장 리스트
- **관리자 서브페이지**: `/admin/teachers`, `/admin/students`, `/admin/courses`, `/admin/users` 모두 검색 필터
- **사용자 관리**: `/admin/users` 에서 원장 지정/해제, 수강생 배정/해제, 역할 변경
- **프로필 수정**: `/teacher/settings`, `/student/settings`
- **알림 레이어**: inapp 항상 작동, Resend/Solapi 스켈레톤 (env 비면 skip)
- **🔔 벨 알림 UI**: 3 layout 모두 적용, 30초 폴링, 드롭다운 열 때 자동 읽음 처리
- **랜딩 페이지**: `/` 로그아웃 방문자용 (hero + 3역할 카드 + 초대 안내)

## 🟡 미완
- **Resend 실발송**: API 키만 넣으면 동작 (도메인 인증 + `noreply@lamperoma.app` 교체 필요)
- **Solapi 실발송**: 가입 + 사업자번호 + 발신번호 등록 + (선택) 알림톡 템플릿 승인
- **배포**: Vercel 연결 안 됨. `vercel link` + env push + Google OAuth 프로덕션 redirect URI 추가 필요
- **실사용자 테스트**: 아직 실제 원장·수강생 투입 안 함
- **세부 UX**: 일지 템플릿 `topics[]` 입력 UI 없음, 과정 전환 이력/로그 없음

**Why:** 4번 "운영 자잘한 것들" + 벨 UI 일괄 완료 (2026-04-23 심야). MVP 기능 완성도 95%로 배포 직전 상태.
**How to apply:** 새 요청 들어오면 위 ✅ 목록 확인하고 중복 구현 피하기. 🟡 순서대로 처리하면 프로덕션 진입 가능.
