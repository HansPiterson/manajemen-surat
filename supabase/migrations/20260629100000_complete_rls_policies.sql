-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.divisi enable row level security;
alter table public.surat_ekspedisi enable row level security;

-- ----------------------------------------------------
-- POLICIES FOR public.users
-- ----------------------------------------------------
drop policy if exists "Allow select for authenticated users" on public.users;
create policy "Allow select for authenticated users" on public.users
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Allow update for owners" on public.users;
create policy "Allow update for owners" on public.users
  for update to authenticated
  using (auth.uid() = id);

-- ----------------------------------------------------
-- POLICIES FOR public.divisi
-- ----------------------------------------------------
drop policy if exists "Allow insert for admin" on public.divisi;
create policy "Allow insert for admin" on public.divisi
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Allow update for admin" on public.divisi;
create policy "Allow update for admin" on public.divisi
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow delete for admin" on public.divisi;
create policy "Allow delete for admin" on public.divisi
  for delete to authenticated
  using (public.is_admin());

-- ----------------------------------------------------
-- POLICIES FOR public.surat_ekspedisi
-- ----------------------------------------------------
drop policy if exists "Allow select for users" on public.surat_ekspedisi;
create policy "Allow select for users" on public.surat_ekspedisi
  for select to authenticated
  using (
    public.is_admin() 
    or divisi_pengirim_id = public.current_divisi_id() 
    or divisi_tujuan_id = public.current_divisi_id()
  );

drop policy if exists "Allow insert for admin" on public.surat_ekspedisi;
create policy "Allow insert for admin" on public.surat_ekspedisi
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Allow update for admin" on public.surat_ekspedisi;
create policy "Allow update for admin" on public.surat_ekspedisi
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow update for division sender" on public.surat_ekspedisi;
create policy "Allow update for division sender" on public.surat_ekspedisi
  for update to authenticated
  using (divisi_pengirim_id = public.current_divisi_id())
  with check (divisi_pengirim_id = public.current_divisi_id());

drop policy if exists "Allow delete for admin" on public.surat_ekspedisi;
create policy "Allow delete for admin" on public.surat_ekspedisi
  for delete to authenticated
  using (public.is_admin());
