-- Run AFTER schema.sql. Public participation is opt-in, never automatic.
create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 30),
  opted_in boolean not null default false
);
alter table public.leaderboard_profiles enable row level security;
revoke all on public.leaderboard_profiles from anon, authenticated;
grant select, insert, update on public.leaderboard_profiles to authenticated;
drop policy if exists "Read own leaderboard settings" on public.leaderboard_profiles;
create policy "Read own leaderboard settings" on public.leaderboard_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own leaderboard settings" on public.leaderboard_profiles;
create policy "Create own leaderboard settings" on public.leaderboard_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own leaderboard settings" on public.leaderboard_profiles;
create policy "Update own leaderboard settings" on public.leaderboard_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Intentional owner-permission view. Run as the trusted database owner.
-- Exposes only opted-in display names, verified wallet points, and rank.
-- Does not expose user IDs, emails, or any private account information.
create or replace view public.public_leaderboard with (security_barrier = true) as
select rank() over (order by w.points desc) as rank, p.display_name, w.points
from public.leaderboard_profiles p
join public.wallets w on w.user_id = p.user_id
where p.opted_in = true;
revoke all on public.public_leaderboard from public;
grant select on public.public_leaderboard to anon, authenticated;
