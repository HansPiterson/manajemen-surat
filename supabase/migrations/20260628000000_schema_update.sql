ALTER TYPE surat_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE surat_status ADD VALUE IF NOT EXISTS 'dikirim';

ALTER TABLE public.surat_ekspedisi
ADD COLUMN IF NOT EXISTS foto_latitude double precision,
ADD COLUMN IF NOT EXISTS foto_longitude double precision;

ALTER TABLE public.surat_ekspedisi
ALTER COLUMN status SET DEFAULT 'draft';

create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_divisi_id()
returns uuid language sql stable security definer set search_path = public as $$
  select divisi_id from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

drop policy if exists surat_divisi_insert on public.surat_ekspedisi;
create policy surat_divisi_insert on public.surat_ekspedisi
  for insert to authenticated
  with check (
    not public.is_admin()
    and divisi_pengirim_id = public.current_divisi_id()
    and status = 'draft'
  );
