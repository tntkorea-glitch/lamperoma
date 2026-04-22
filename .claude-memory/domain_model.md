---
name: Domain model
description: Lamperoma 데이터 모델 — 멀티테넌트 원장/수강생/수강일지 구조 + RLS 정책
type: project
originSessionId: 6cc64c39-d23f-473c-a27e-fa0de549ce20
---
**핵심 엔티티** (스키마: `supabase/migrations/20260423000001_initial_schema.sql`)

- `teachers` — PK = auth.users.id. 원장 (tenant root)
- `students` — PK = auth.users.id, FK `teacher_id`. 한 학생은 한 원장에만 속함 (teacher 이동은 accept 플로우가 허용)
- `invites` — 원장이 발급. 토큰은 `randomBytes(16).toString("base64url")`. `expires_at` 30일 기본
- `courses` — 원장 × 학생 × 과정명 × 총 회차(기본 10). `status`: active/paused/completed/cancelled
- `course_sessions` — course_id + session_no unique. `status`: pending/in_progress/logged/completed
- `lesson_logs` — session_id **unique** (1:1). `published_at`이 null이면 임시저장. fields: title, content, strengths, improvements, next_prep, images[]
- `comments` — session_id × author_id × author_role('teacher'|'student'). 양방향 스레드
- `notifications` — user_id 별 인앱 큐 + sent_email_at / sent_sms_at / sent_kakao_at 이력

**RLS 핵심 규칙**
- teacher는 자기 id 가 `teacher_id` 인 row만 CRUD (students, invites, courses, course_sessions via course join, lesson_logs via session→course join)
- student는 `auth.uid() = id` or `auth.uid() = student_id` 인 row만 select
- 학생의 lesson_log select은 `published_at is not null` 조건 추가 (임시저장 상태 못 봄)
- comment insert는 author_role 이 본인 role 과 일치 + 해당 session 소유자 체크
- invite select/insert/update는 teacher 본인만. 학생 가입 플로우는 `service_role` 우회 필요

**초대 플로우**
1. 원장이 `/teacher/invites/new` 에서 토큰 생성 (DB insert)
2. `/invite/[token]` 랜딩: 유효성 체크 후 구글 로그인으로 유도 (`?invite=<token>&next=/invite/<token>/accept`)
3. 로그인 후 `/auth/callback` → invite 쿼리 있으면 accept 페이지로
4. `/invite/[token]/accept` (server component): `service_role` 로 teachers 체크(원장계정 금지) → students insert(or teacher_id 갱신) → invite.used_at 기록 → `/student` 리다이렉트

**Storage**
- 버킷: `lesson-images` (public). 경로 규칙: `{auth_uid}/{session_id}/{filename}` — RLS가 폴더명으로 권한 체크

**확장 포인트**
- 수강생이 여러 원장에 동시 가입해야 한다면 `students` 를 N:M 중계 테이블로 리팩토링 필요 (현재는 학생 한 명 = 원장 한 명)
- 일지 템플릿 커스터마이즈: `lesson_logs.topics[]` 필드는 이미 있음. UI만 추가하면 됨
- 코스별 시간표/수업일 추적이 필요하면 `course_sessions.scheduled_at` 활용

**Why:** 멀티테넌트를 RLS로 DB레벨 격리해서 애플리케이션 버그가 권한 우회로 이어지지 않게 함.
**How to apply:** 새 테이블 추가 시 반드시 RLS 활성화 + 4종 policy(select/insert/update/delete) 정의. teacher/student 분기는 기존 패턴(`auth.uid()` vs `exists` join) 따라가기.
