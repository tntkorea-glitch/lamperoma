-- 관리자가 원장을 초대하기 위한 토큰 테이블
-- student invites 와 구조 유사, 다만 created_by 는 admins 를 참조

create table public.teacher_invites (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.admins(id) on delete cascade,
  token text not null unique,
  name text,
  email text,
  salon_name text,
  phone text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.teacher_invites (token);
create index on public.teacher_invites (created_by);

alter table public.teacher_invites enable row level security;

-- 관리자만 접근 가능
create policy "admin manages teacher invites" on public.teacher_invites
  for all using (exists (select 1 from public.admins where id = auth.uid()))
  with check (exists (select 1 from public.admins where id = auth.uid()));
