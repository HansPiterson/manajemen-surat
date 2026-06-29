-- ----------------------------------------------------
-- ADD is_kurir() FUNCTION
-- ----------------------------------------------------
create or replace function public.is_kurir()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'kurir', false);
$$;

-- ----------------------------------------------------
-- UPDATE POLICIES FOR public.surat_ekspedisi
-- ----------------------------------------------------
drop policy if exists "Allow select for users" on public.surat_ekspedisi;
create policy "Allow select for users" on public.surat_ekspedisi
  for select to authenticated
  using (
    public.is_admin() 
    or public.is_kurir()
    or divisi_pengirim_id = public.current_divisi_id() 
    or divisi_tujuan_id = public.current_divisi_id()
  );
