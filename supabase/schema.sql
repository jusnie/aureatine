-- Run in Supabase SQL Editor. Balances are readable by their owner only.
-- Only trusted server-side administration can award points. No client writes.
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
revoke all on public.wallets from anon, authenticated;
grant select on public.wallets to authenticated;
drop policy if exists "Read own balance" on public.wallets;
create policy "Read own balance" on public.wallets for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.create_rewards_wallet()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.wallets (user_id, points) values (new.id, 0) on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.create_rewards_wallet() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet after insert on auth.users for each row execute function public.create_rewards_wallet();
insert into public.wallets(user_id, points) select id, 0 from auth.users on conflict do nothing;
