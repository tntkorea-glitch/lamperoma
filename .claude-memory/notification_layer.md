---
name: Notification layer
description: Lamperoma 알림 아키텍처 — 멀티 프로바이더 추상화, 일지 등록/댓글 시 병렬 발송
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
**구조**
- `src/lib/notifications/types.ts` — `NotificationProvider` interface (channel + send(payload))
- `src/lib/notifications/index.ts` — `sendNotification(payload)` 하나로 모든 채널 병렬 호출 + DB 이력 업데이트
- providers:
  - `inapp.ts` — 항상 작동 (admin client로 notifications row insert)
  - `email.ts` — Resend. `RESEND_API_KEY` 없으면 skip
  - `solapi.ts` — Solapi SMS + 알림톡. `SOLAPI_API_KEY/SECRET/SENDER` 없으면 skip. `SOLAPI_KAKAO_PFID` 있으면 알림톡 시도
- 카톡 공유 SDK (JavaScript) 는 클라이언트 사이드라 여기 없고, 필요 시 `components/` 에 별도 컴포넌트로 추가 예정

**호출 시점**
- `src/app/teacher/sessions/[id]/actions.ts#publishLessonLogAction` — 일지 공개 시 학생에게 `LESSON_LOG_PUBLISHED`
- `src/components/session/actions.ts#addCommentAction` — 댓글 insert 후 상대방에게 `TEACHER_COMMENT` / `STUDENT_COMMENT`

**확장 시 주의**
- Solapi 알림톡 템플릿은 `payload.type` 을 `templateId` 로 그대로 넘김. 알림톡 전환 시 Solapi에서 템플릿 ID 를 `LESSON_LOG_PUBLISHED` 등으로 맞춰 등록해야 함
- 새 채널(카톡 친구톡 등) 추가 시 `NotificationProvider` 구현체 하나 더 만들고 `index.ts` 의 `Promise.all` 에 추가
- 이메일 from 주소 `noreply@lamperoma.app` 는 플레이스홀더. 실제 배포 시 Resend에서 도메인 인증 후 교체 필요
- 인앱 알림 UI(벨 아이콘, 미읽음 배지)는 미구현 — `notifications` 테이블 query 해서 헤더에 추가하면 됨

**Why:** 지금은 인앱·이메일만 실동작, SMS/알림톡은 Solapi 가입 대기 중. env 기반 skip 패턴으로 프로덕션에 빈 키로 배포해도 터지지 않고, 키만 채우면 즉시 활성화.
**How to apply:** 사용자가 Solapi 가입 완료하면 `.env.local` 의 SOLAPI_* 채우기만으로 SMS 발송 시작. 알림톡 템플릿 승인받으면 `SOLAPI_KAKAO_PFID` 추가 → 자동 승격.
