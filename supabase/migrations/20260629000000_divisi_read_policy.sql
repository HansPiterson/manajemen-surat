-- Drop existing policies if any
drop policy if exists "Allow public read access to divisi" on public.divisi;
drop policy if exists "Allow insert for self registration" on public.users;

-- Allow all users (including unauthenticated ones on Login page) to view active divisions
create policy "Allow public read access to divisi" on public.divisi
  for select to public
  using (is_active = true);

-- Allow newly signed up users to insert their own profile record into public.users
create policy "Allow insert for self registration" on public.users
  for insert to public
  with check (auth.uid() = id);
