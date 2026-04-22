-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('lesson-images', 'lesson-images', true)
on conflict (id) do nothing;

-- Storage policies
-- 원장: 자기 수업 이미지 업로드/삭제
create policy "teacher uploads lesson images" on storage.objects
  for insert with check (
    bucket_id = 'lesson-images'
    and auth.uid() is not null
  );

create policy "teacher updates lesson images" on storage.objects
  for update using (
    bucket_id = 'lesson-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "teacher deletes lesson images" on storage.objects
  for delete using (
    bucket_id = 'lesson-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "public reads lesson images" on storage.objects
  for select using (bucket_id = 'lesson-images');
