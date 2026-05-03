-- 코스별 수강생에게 보여줄 커스텀 링크 (원장이 설정)
alter table public.courses
  add column if not exists links jsonb not null default '{}';
