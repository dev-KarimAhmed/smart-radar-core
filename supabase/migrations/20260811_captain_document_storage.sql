-- Private storage for captain verification documents.
-- Run after 20260810_captain_auth_profile_fields.sql.

insert into storage.buckets (id, name, public)
values ('captain-documents', 'captain-documents', false)
on conflict (id) do update set public = false;

drop policy if exists captain_documents_insert_own on storage.objects;
create policy captain_documents_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'captain-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists captain_documents_select_own on storage.objects;
create policy captain_documents_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'captain-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists captain_documents_update_own on storage.objects;
create policy captain_documents_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'captain-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'captain-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists captain_documents_delete_own on storage.objects;
create policy captain_documents_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'captain-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
