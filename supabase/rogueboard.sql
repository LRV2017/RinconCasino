-- Rogueboard cloud accounts and saves
-- Run once in Supabase Dashboard -> SQL Editor.
-- The browser only receives a publishable key. Never expose service_role.

create table if not exists public.rogueboard_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save_version integer not null default 1,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rogueboard_saves_object check (jsonb_typeof(save_data) = 'object')
);

alter table public.rogueboard_saves enable row level security;

revoke all on table public.rogueboard_saves from anon;
revoke all on table public.rogueboard_saves from authenticated;
grant select, insert, update, delete on table public.rogueboard_saves to authenticated;

drop policy if exists "Players can read their own save" on public.rogueboard_saves;
create policy "Players can read their own save"
on public.rogueboard_saves
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own save" on public.rogueboard_saves;
create policy "Players can create their own save"
on public.rogueboard_saves
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own save" on public.rogueboard_saves;
create policy "Players can update their own save"
on public.rogueboard_saves
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Players can delete their own save" on public.rogueboard_saves;
create policy "Players can delete their own save"
on public.rogueboard_saves
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists rogueboard_saves_updated_at_idx
on public.rogueboard_saves (updated_at desc);
