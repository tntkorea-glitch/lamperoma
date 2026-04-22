-- 시스템 관리자 (원장보다 상위 등급)
-- ADMIN_EMAILS env 에 등록된 사용자가 로그인 시 자동 생성.
-- 관리자는 모든 teachers/students/courses/lesson_logs 를 볼 수 있어야 하는데,
-- 그건 RLS 대신 애플리케이션에서 service_role 클라이언트로 처리 (코드 레벨에서 admin 체크).

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- 자기 row 만 읽기 가능 (role check 용)
create policy "admin reads self" on public.admins
  for select using (auth.uid() = id);
