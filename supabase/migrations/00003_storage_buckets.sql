-- ============================================================================
-- Storage Buckets for workout images and avatars
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('workout-images', 'workout-images', true),
  ('avatars', 'avatars', true);

-- WORKOUT IMAGES policies
create policy "Authenticated users can upload workout images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workout-images');

create policy "Anyone can view workout images"
  on storage.objects for select
  using (bucket_id = 'workout-images');

create policy "Users can delete own workout images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workout-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- AVATARS policies
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
