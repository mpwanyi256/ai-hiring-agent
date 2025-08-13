-- Ensure signed-contracts bucket exists and policies allow required access

-- Create bucket if not exists
insert into storage.buckets (id, name, public)
select 'signed-contracts', 'signed-contracts', true
where not exists (select 1 from storage.buckets where id = 'signed-contracts');

-- Allow public read of objects in signed-contracts
drop policy if exists "Public read access to signed-contracts" on storage.objects;
create policy "Public read access to signed-contracts"
  on storage.objects for select to public
  using (bucket_id = 'signed-contracts');

-- Allow authenticated users to insert into signed-contracts (e.g., company staff)
drop policy if exists "Authenticated can upload to signed-contracts" on storage.objects;
create policy "Authenticated can upload to signed-contracts"
  on storage.objects for insert to public
  with check (
    bucket_id = 'signed-contracts' and auth.role() = 'authenticated'
  );

-- Allow service role full access
drop policy if exists "Service role full access to signed-contracts" on storage.objects;
create policy "Service role full access to signed-contracts"
  on storage.objects for all to public
  using (bucket_id = 'signed-contracts' and auth.role() = 'service_role')
  with check (bucket_id = 'signed-contracts' and auth.role() = 'service_role'); 