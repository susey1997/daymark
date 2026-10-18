-- Run once in Supabase SQL Editor for the Daymark project.
create table if not exists public.daymark_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.daymark_data enable row level security;
revoke all on table public.daymark_data from anon, authenticated;
grant select, insert, update, delete on table public.daymark_data to authenticated;

drop policy if exists "Users can read their own Daymark data" on public.daymark_data;
create policy "Users can read their own Daymark data"
  on public.daymark_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Daymark data" on public.daymark_data;
create policy "Users can create their own Daymark data"
  on public.daymark_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Daymark data" on public.daymark_data;
create policy "Users can update their own Daymark data"
  on public.daymark_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Daymark data" on public.daymark_data;
create policy "Users can delete their own Daymark data"
  on public.daymark_data for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Enable live updates so signed-in devices refresh when another device saves.
alter publication supabase_realtime add table public.daymark_data;

