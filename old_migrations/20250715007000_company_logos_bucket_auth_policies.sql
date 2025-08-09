-- Allow authenticated users to delete from company
create policy "Allow authenticated delete from company"
  on storage.objects
  for delete
  using (
    bucket_id = 'company'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload to company
create policy "Allow authenticated upload to company"
  on storage.objects
  for insert
  with check (
    bucket_id = 'company'
    AND auth.role() = 'authenticated'
  );

-- Allow public read from company
create policy "Allow public read from company"
  on storage.objects
  for select
  using (
    bucket_id = 'company'
  ); 