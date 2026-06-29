-- 1. Create ENUM for account status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kurir_status') THEN
        CREATE TYPE kurir_status AS ENUM ('pending', 'approved', 'nonaktif');
    END IF;
END$$;

-- 2. Add status to users table, default 'approved' for backward compatibility
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status kurir_status DEFAULT 'approved';

-- 3. Add kurir_id to surat_ekspedisi
ALTER TABLE public.surat_ekspedisi ADD COLUMN IF NOT EXISTS kurir_id UUID REFERENCES public.users(id);

-- 4. Add 'kurir' to user_role ENUM if not exists
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kurir';
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

-- 5. RLS Policy for Users (Admin can update status)
-- Already handled by "Allow update for owners" or similar? Let's add an explicit admin update policy.
drop policy if exists "Allow update for admin" on public.users;
create policy "Allow update for admin" on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. RLS Policy for surat_ekspedisi (Kurir taking a task)
drop policy if exists "Allow update for kurir taking task" on public.surat_ekspedisi;
create policy "Allow update for kurir taking task" on public.surat_ekspedisi
  for update to authenticated
  using (
    public.is_kurir() 
    and status = 'draft' 
  )
  with check (
    public.is_kurir()
    and status = 'dikirim'
    and kurir_id = auth.uid()
  );

-- Also allow kurir to update their own tasks (uploading foto, changing to diterima)
drop policy if exists "Allow update for kurir own task" on public.surat_ekspedisi;
create policy "Allow update for kurir own task" on public.surat_ekspedisi
  for update to authenticated
  using (
    public.is_kurir()
    and kurir_id = auth.uid()
  )
  with check (
    public.is_kurir()
    and kurir_id = auth.uid()
  );
