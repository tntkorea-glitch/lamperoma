-- 관리자가 토글하는 앱 전역 설정 (알림 발송 on/off 등)
-- 향후 다른 토글 추가 시 같은 테이블에 key-value 로 확장

create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- 관리자만 읽기/쓰기 (service_role 로 서버에서 접근)
create policy "admin reads settings" on public.app_settings
  for select using (exists (select 1 from public.admins where id = auth.uid()));

create policy "admin manages settings" on public.app_settings
  for all using (exists (select 1 from public.admins where id = auth.uid()))
  with check (exists (select 1 from public.admins where id = auth.uid()));

-- 기본값 seed: SMS 발송 비활성화
insert into public.app_settings (key, value) values
  ('sms_enabled', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
