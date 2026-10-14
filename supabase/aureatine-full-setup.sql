-- AUREATINE: COMPLETE DATABASE SETUP
-- Run this ONE file in your Supabase project's SQL Editor as the project owner.
-- Includes wallets, leaderboard, redeemables, profiles, private avatars, staff awards,
-- six-letter manual codes, and QR verification. Current rules:
-- APEX: 10 points per actual verified visit. Aureatine: floor(PHP spent / 5).
-- Does not create auth accounts, invent rewards/stock or change auth/SMTP settings.
-- OWNER-AUTHORIZED: grants ADMIN + both staff roles once to the existing confirmed username yasuda.dnz.
-- Existing earned points are preserved; no retroactive rate recalculation.
-- Intended for fresh installs or upgrades from this app's earlier scripts. Back up first.
-- Other staff roles remain owner-managed. Duplicate display names stop the migration for review.
-- Entire installation is one transaction: errors roll back all changes in this run.
BEGIN;

-- BEGIN MODULE: schema.sql
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
-- END MODULE: schema.sql

-- BEGIN MODULE: leaderboard.sql
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
-- END MODULE: leaderboard.sql

-- BEGIN MODULE: redemption-counts.sql
-- Register matching stable item IDs from src/redeemables.js before publishing items.

create table if not exists public.reward_catalog_items (
  id text primary key check (length(id) between 1 and 100),
  published boolean not null default false
);
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  -- Unique business transaction reference makes webhook/worker retries idempotent.
  transaction_ref text not null unique check (length(transaction_ref) between 1 and 200),
  item_id text not null references public.reward_catalog_items(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','completed','cancelled','refunded')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint completed_requires_timestamp check (status <> 'completed' or completed_at is not null)
);
create index if not exists redemption_completed_members on public.reward_redemptions(item_id,user_id) where status='completed';
alter table public.reward_catalog_items enable row level security;
alter table public.reward_redemptions enable row level security;
revoke all on public.reward_catalog_items, public.reward_redemptions from anon, authenticated;
grant select, insert, update, delete on public.reward_catalog_items, public.reward_redemptions to service_role;
-- No client policies: only trusted server/service-role writes may change these records.
create or replace function public.get_reward_redemption_counts(item_ids text[])
returns table(item_id text, member_count bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, count(distinct r.user_id)
  from public.reward_catalog_items c
  left join public.reward_redemptions r on r.item_id=c.id and r.status='completed'
  where c.published=true
    and c.id in (select unnest(item_ids) limit 100)
  group by c.id;
$$;
revoke all on function public.get_reward_redemption_counts(text[]) from public;
grant execute on function public.get_reward_redemption_counts(text[]) to anon, authenticated;
comment on function public.get_reward_redemption_counts(text[]) is 'Public aggregate only. Distinct members with at least one currently completed redemption, for published items only.';
-- END MODULE: redemption-counts.sql

-- BEGIN MODULE: redeem-item.sql
-- A completed redemption means points exchanged and stock reserved, NOT collected.

alter table public.reward_catalog_items add column if not exists points_cost integer check(points_cost > 0);
alter table public.reward_catalog_items add column if not exists redeem_enabled boolean not null default false;
create table if not exists public.reward_variants (
  item_id text not null references public.reward_catalog_items(id),
  size text not null default '', -- empty string for a size-free accessory
  stock integer not null default 0 check(stock >= 0),
  primary key(item_id,size)
);
alter table public.reward_variants enable row level security;
revoke all on public.reward_variants from anon, authenticated;
grant all on public.reward_variants to service_role;
alter table public.reward_redemptions add column if not exists selected_size text;
alter table public.reward_redemptions add column if not exists points_spent integer;
alter table public.reward_redemptions add column if not exists collected_at timestamptz;
create or replace function public.redeem_reward(p_item_id text, p_size text, p_request_id uuid, p_expected_points integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); wallet_points integer; cost integer; stock_left integer;
  existing public.reward_redemptions%rowtype; new_id uuid; tx text;
begin
  if uid is null then return jsonb_build_object('ok',false,'code','SIGN_IN'); end if;
  if p_request_id is null or p_size is null then return jsonb_build_object('ok',false,'code','INVALID_REQUEST'); end if;
  tx := 'web:' || uid::text || ':' || p_request_id::text;
  -- Serialize operations for one wallet; never accept a balance/user ID from the browser.
  select points into wallet_points from public.wallets where user_id=uid for update;
  if not found then return jsonb_build_object('ok',false,'code','WALLET_UNAVAILABLE'); end if;
  select * into existing from public.reward_redemptions where transaction_ref=tx;
  if found then
    if existing.item_id<>p_item_id or existing.selected_size is distinct from p_size then
      return jsonb_build_object('ok',false,'code','REQUEST_CONFLICT');
    end if;
    if existing.status<>'completed' then return jsonb_build_object('ok',false,'code','CLAIM_CHANGED'); end if;
    return jsonb_build_object('ok',true,'code','REDEEMED','redemption_id',existing.id,'balance',wallet_points,'points_spent',existing.points_spent);
  end if;
  select points_cost into cost from public.reward_catalog_items
    where id=p_item_id and published and redeem_enabled for update;
  if not found or cost is null then return jsonb_build_object('ok',false,'code','UNAVAILABLE'); end if;
  if p_expected_points is distinct from cost then return jsonb_build_object('ok',false,'code','PRICE_CHANGED'); end if;
  if wallet_points < cost then return jsonb_build_object('ok',false,'code','NOT_ENOUGH_POINTS','balance',wallet_points); end if;
  select stock into stock_left from public.reward_variants where item_id=p_item_id and size=p_size for update;
  if not found then return jsonb_build_object('ok',false,'code','INVALID_SIZE'); end if;
  if stock_left<1 then return jsonb_build_object('ok',false,'code','OUT_OF_STOCK'); end if;
  update public.wallets set points=points-cost,updated_at=now() where user_id=uid;
  update public.reward_variants set stock=stock-1 where item_id=p_item_id and size=p_size;
  insert into public.reward_redemptions(transaction_ref,item_id,user_id,status,completed_at,selected_size,points_spent)
    values(tx,p_item_id,uid,'completed',now(),p_size,cost) returning id into new_id;
  return jsonb_build_object('ok',true,'code','REDEEMED','redemption_id',new_id,'balance',wallet_points-cost,'points_spent',cost);
end;
$$;
revoke all on function public.redeem_reward(text,text,uuid,integer) from public, anon;
grant execute on function public.redeem_reward(text,text,uuid,integer) to authenticated;
comment on function public.get_reward_redemption_counts(text[]) is 'Unique members with currently completed point-exchange claims (not proof of collection).';
-- END MODULE: redeem-item.sql

-- BEGIN MODULE: member-profiles.sql
-- Public app key cannot install this migration or appoint staff.

create table if not exists public.member_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Member' check(char_length(trim(display_name)) between 2 and 60),
 username text not null unique check(username ~ '^[a-z0-9_]{3,40}$'),
 member_code uuid not null unique default gen_random_uuid(),
 avatar_path text check(avatar_path is null or avatar_path = user_id::text || '/avatar.webp'),
 created_at timestamptz not null default now()
);
create table if not exists public.staff_members (
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('apex','aureatine')),
 primary key(user_id,role)
);
create table if not exists public.member_point_events (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 user_id uuid references auth.users(id) on delete set null,
 staff_id uuid references auth.users(id) on delete set null,
 kind text not null check(kind in ('visit','purchase')),
 reference text not null check(reference ~ '^[A-Z0-9][A-Z0-9._/-]{2,79}$'),
 amount_centavos integer,
 points integer not null check(points>=0),
 created_at timestamptz not null default now(),
 unique(kind,reference)
);
alter table public.member_profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.member_point_events enable row level security;
revoke all on public.member_profiles,public.staff_members,public.member_point_events from anon,authenticated;
grant select on public.member_profiles,public.staff_members,public.member_point_events to authenticated;
grant update(display_name,username,avatar_path) on public.member_profiles to authenticated;
grant all on public.member_profiles,public.staff_members,public.member_point_events to service_role;
drop policy if exists member_read_self on public.member_profiles;
create policy member_read_self on public.member_profiles for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists member_edit_self on public.member_profiles;
create policy member_edit_self on public.member_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists staff_read_self on public.staff_members;
create policy staff_read_self on public.staff_members for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists event_read_own on public.member_point_events;
create policy event_read_own on public.member_point_events for select to authenticated using(user_id=(select auth.uid()) or staff_id=(select auth.uid()));
create or replace function public.create_member_profile()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.member_profiles(user_id,username,display_name)
 values(new.id,'member_'||replace(new.id::text,'-',''),
 case when char_length(trim(coalesce(new.raw_user_meta_data->>'full_name','')))>=2
 then left(trim(new.raw_user_meta_data->>'full_name'),60) else 'Member '||replace(new.id::text,'-','') end) on conflict(user_id) do nothing;
 return new;
end;$$;
revoke all on function public.create_member_profile() from public,anon,authenticated;
drop trigger if exists on_auth_user_member_profile on auth.users;
create trigger on_auth_user_member_profile after insert on auth.users for each row execute function public.create_member_profile();
insert into public.member_profiles(user_id,username,display_name)
 select id,'member_'||replace(id::text,'-',''),
 case when char_length(trim(coalesce(raw_user_meta_data->>'full_name','')))>=2
 then left(trim(raw_user_meta_data->>'full_name'),60) else 'Member '||replace(id::text,'-','') end from auth.users
 on conflict(user_id) do nothing;
create or replace function public.rotate_member_code()
returns uuid language plpgsql security definer set search_path='' as $$
declare code uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 update public.member_profiles set member_code=gen_random_uuid() where user_id=auth.uid() returning member_code into code;
 return code;
end;$$;
revoke all on function public.rotate_member_code() from public,anon;
grant execute on function public.rotate_member_code() to authenticated;
create or replace function public.verify_member(p_code uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare profile public.member_profiles%rowtype;
begin
 if not exists(select 1 from public.staff_members where user_id=auth.uid()) then
 return jsonb_build_object('ok',false,'code','STAFF_ONLY'); end if;
 select * into profile from public.member_profiles where member_code=p_code;
 if not found then return jsonb_build_object('ok',false,'code','INVALID_CODE'); end if;
 return jsonb_build_object('ok',true,'display_name',profile.display_name,'username',profile.username,'avatar_path',profile.avatar_path);
end;$$;
revoke all on function public.verify_member(uuid) from public,anon;
grant execute on function public.verify_member(uuid) to authenticated;
create or replace function public.award_member_points(p_code uuid,p_kind text,p_reference text,p_amount_centavos integer,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare staff uuid:=auth.uid(); member uuid; award integer; ref text:=upper(trim(p_reference)); balance integer;
 old public.member_point_events%rowtype; event_id uuid;
begin
 if p_kind is null or p_kind not in ('visit','purchase') or not exists(
 select 1 from public.staff_members where user_id=staff and role=case when p_kind='visit' then 'apex' else 'aureatine' end)
 then return jsonb_build_object('ok',false,'code','STAFF_ONLY'); end if;
 if p_request_id is null or ref is null or ref !~ '^[A-Z0-9][A-Z0-9._/-]{2,79}$' then return jsonb_build_object('ok',false,'code','INVALID_REFERENCE'); end if;
 select user_id into member from public.member_profiles where member_code=p_code for share;
 if not found then return jsonb_build_object('ok',false,'code','INVALID_CODE'); end if;
 if member=staff then return jsonb_build_object('ok',false,'code','SELF_AWARD'); end if;
 if p_kind='purchase' then
  if p_amount_centavos is null or p_amount_centavos<1 or p_amount_centavos>100000000 then return jsonb_build_object('ok',false,'code','INVALID_AMOUNT'); end if;
  award:=p_amount_centavos/500;
 else
  if p_amount_centavos is not null then return jsonb_build_object('ok',false,'code','INVALID_AMOUNT'); end if;
  award:=10;
 end if;
 -- Lock member wallet to serialize credit/debit operations. Database constraints also protect references globally.
 select points into balance from public.wallets where user_id=member for update;
 if not found then return jsonb_build_object('ok',false,'code','WALLET_UNAVAILABLE'); end if;
 select * into old from public.member_point_events where request_id=p_request_id;
 if found then
  if old.user_id is distinct from member or old.staff_id is distinct from staff or old.kind<>p_kind or old.reference<>ref or old.amount_centavos is distinct from p_amount_centavos then
   return jsonb_build_object('ok',false,'code','REQUEST_CONFLICT'); end if;
  return jsonb_build_object('ok',true,'event_id',old.id,'points',old.points,'replayed',true);
 end if;
 if exists(select 1 from public.member_point_events where kind=p_kind and reference=ref) then return jsonb_build_object('ok',false,'code','DUPLICATE_REFERENCE'); end if;
 if balance::bigint+award>2147483647 then return jsonb_build_object('ok',false,'code','BALANCE_LIMIT'); end if;
 insert into public.member_point_events(request_id,user_id,staff_id,kind,reference,amount_centavos,points)
 values(p_request_id,member,staff,p_kind,ref,p_amount_centavos,award) returning id into event_id;
 update public.wallets set points=points+award,updated_at=now() where user_id=member;
 return jsonb_build_object('ok',true,'event_id',event_id,'points',award,'replayed',false);
exception when unique_violation then
 -- This exception rolls back all writes in the block, including any wallet mutation.
 return jsonb_build_object('ok',false,'code','DUPLICATE_REFERENCE');
end;$$;
revoke all on function public.award_member_points(uuid,text,text,integer,uuid) from public,anon;
grant execute on function public.award_member_points(uuid,text,text,integer,uuid) to authenticated;
-- END MODULE: member-profiles.sql

-- BEGIN MODULE: profile-photos.sql
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('member-avatars','member-avatars',false,2097152,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
drop policy if exists avatar_read on storage.objects;
create policy avatar_read on storage.objects for select to authenticated using(
 bucket_id='member-avatars' and ((storage.foldername(name))[1]=(select auth.uid())::text
 or exists(select 1 from public.staff_members where user_id=(select auth.uid())))
);
drop policy if exists avatar_insert on storage.objects;
create policy avatar_insert on storage.objects for insert to authenticated with check(
 bucket_id='member-avatars' and name=(select auth.uid())::text||'/avatar.webp'
);
drop policy if exists avatar_update on storage.objects;
create policy avatar_update on storage.objects for update to authenticated using(
 bucket_id='member-avatars' and name=(select auth.uid())::text||'/avatar.webp'
) with check(bucket_id='member-avatars' and name=(select auth.uid())::text||'/avatar.webp');
drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects for delete to authenticated using(
 bucket_id='member-avatars' and name=(select auth.uid())::text||'/avatar.webp'
);
-- END MODULE: profile-photos.sql

-- BEGIN MODULE: member-short-codes.sql
-- Six-letter manual aliases, long QR IDs preserved; authorized staff only.

alter table public.member_profiles add column if not exists manual_code text;
create unique index if not exists member_manual_code_unique on public.member_profiles(manual_code);
create or replace function public.generate_member_manual_code()
returns text language plpgsql security definer set search_path='' as $$
declare candidate text; bytes bytea; alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; attempt integer; i integer;
begin
 -- Serialize alias allocation across signup/rotation, including concurrent transactions.
 perform pg_advisory_xact_lock(715913);
 for attempt in 1..100 loop
  bytes:=decode(replace(gen_random_uuid()::text,'-',''),'hex');candidate:='';
  for i in 0..5 loop candidate:=candidate||substr(alphabet,1+(get_byte(bytes,i)%24),1); end loop;
  if not exists(select 1 from public.member_profiles where manual_code=candidate) then return candidate; end if;
 end loop;
 raise exception 'Unable to allocate a member code. Please retry.';
end;$$;
revoke all on function public.generate_member_manual_code() from public,anon,authenticated;
update public.member_profiles set manual_code=public.generate_member_manual_code() where manual_code is null;
alter table public.member_profiles alter column manual_code set default public.generate_member_manual_code();
alter table public.member_profiles alter column manual_code set not null;
alter table public.member_profiles drop constraint if exists member_manual_code_format;
alter table public.member_profiles add constraint member_manual_code_format check(manual_code ~ '^[A-HJ-NP-Z]{6}$');
-- Existing column-level profile editing grants do not permit updating this alias.
create table if not exists public.member_lookup_limits(
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null default now(), attempts integer not null default 1
);
alter table public.member_lookup_limits enable row level security;
revoke all on public.member_lookup_limits from anon,authenticated;
grant all on public.member_lookup_limits to service_role;
create or replace function public.allow_member_lookup()
returns boolean language plpgsql security definer set search_path='' as $$
declare count_now integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.member_lookup_limits(user_id) values(auth.uid())
 on conflict(user_id) do update set
 attempts=case when member_lookup_limits.window_start <= now()-interval '5 minutes' then 1 else least(member_lookup_limits.attempts+1,61) end,
 window_start=case when member_lookup_limits.window_start <= now()-interval '5 minutes' then now() else member_lookup_limits.window_start end
 returning attempts into count_now;
 return count_now<=60;
end;$$;
revoke all on function public.allow_member_lookup() from public,anon,authenticated;
-- Avoid ambiguous PostgREST overloads when JSON strings contain UUIDs or aliases.
drop function if exists public.verify_member(uuid);
drop function if exists public.award_member_points(uuid,text,text,integer,uuid);
revoke all on function public.rotate_member_code() from public,anon,authenticated;
create or replace function public.rotate_member_codes()
returns jsonb language plpgsql security definer set search_path='' as $$
declare code uuid; short_code text;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 update public.member_profiles set member_code=gen_random_uuid(),manual_code=public.generate_member_manual_code()
 where user_id=auth.uid() returning member_code,manual_code into code,short_code;
 return jsonb_build_object('member_code',code,'manual_code',short_code);
end;$$;
revoke all on function public.rotate_member_codes() from public,anon;
grant execute on function public.rotate_member_codes() to authenticated;
create or replace function public.verify_member(p_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare profile public.member_profiles%rowtype;
begin
 if not exists(select 1 from public.staff_members where user_id=auth.uid()) then
 return jsonb_build_object('ok',false,'code','STAFF_ONLY'); end if;
 if not public.allow_member_lookup() then return jsonb_build_object('ok',false,'code','LOOKUP_LIMIT'); end if;
 select * into profile from public.member_profiles where (manual_code=upper(trim(p_code)) or member_code=case when trim(p_code) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then trim(p_code)::uuid else null end);
 if not found then return jsonb_build_object('ok',false,'code','INVALID_CODE'); end if;
 return jsonb_build_object('ok',true,'display_name',profile.display_name,'username',profile.username,'avatar_path',profile.avatar_path);
end;$$;
revoke all on function public.verify_member(text) from public,anon;
grant execute on function public.verify_member(text) to authenticated;
create or replace function public.award_member_points(p_code text,p_kind text,p_reference text,p_amount_centavos integer,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare staff uuid:=auth.uid(); member uuid; award integer; ref text:=case when p_kind='visit' and nullif(trim(coalesce(p_reference,'')),'') is null and p_request_id is not null then 'VISIT-'||to_char(now() at time zone 'Asia/Manila','YYYYMMDD')||'-'||upper(substr(replace(p_request_id::text,'-',''),1,10)) else upper(trim(p_reference)) end; balance integer;
 old public.member_point_events%rowtype; event_id uuid;
begin
 if p_kind is null or p_kind not in ('visit','purchase') or not exists(
 select 1 from public.staff_members where user_id=staff and role=case when p_kind='visit' then 'apex' else 'aureatine' end)
 then return jsonb_build_object('ok',false,'code','STAFF_ONLY'); end if;
 if p_request_id is null or ref is null or ref !~ '^[A-Z0-9][A-Z0-9._/-]{2,79}$' then return jsonb_build_object('ok',false,'code','INVALID_REFERENCE'); end if;
 if not public.allow_member_lookup() then return jsonb_build_object('ok',false,'code','LOOKUP_LIMIT'); end if;
 select user_id into member from public.member_profiles where (manual_code=upper(trim(p_code)) or member_code=case when trim(p_code) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then trim(p_code)::uuid else null end) for share;
 if not found then return jsonb_build_object('ok',false,'code','INVALID_CODE'); end if;
 if member=staff then return jsonb_build_object('ok',false,'code','SELF_AWARD'); end if;
 if p_kind='purchase' then
  if p_amount_centavos is null or p_amount_centavos<1 or p_amount_centavos>100000000 then return jsonb_build_object('ok',false,'code','INVALID_AMOUNT'); end if;
  award:=p_amount_centavos/500;
 else
  if p_amount_centavos is not null then return jsonb_build_object('ok',false,'code','INVALID_AMOUNT'); end if;
  award:=10;
 end if;
 -- Lock member wallet to serialize credit/debit operations. Database constraints also protect references globally.
 select points into balance from public.wallets where user_id=member for update;
 if not found then return jsonb_build_object('ok',false,'code','WALLET_UNAVAILABLE'); end if;
 select * into old from public.member_point_events where request_id=p_request_id;
 if found then
  if old.user_id is distinct from member or old.staff_id is distinct from staff or old.kind<>p_kind or old.reference<>ref or old.amount_centavos is distinct from p_amount_centavos then
   return jsonb_build_object('ok',false,'code','REQUEST_CONFLICT'); end if;
  return jsonb_build_object('ok',true,'event_id',old.id,'points',old.points,'replayed',true,'member_name',(select display_name from public.member_profiles where user_id=member));
 end if;
 if exists(select 1 from public.member_point_events where kind=p_kind and reference=ref) then return jsonb_build_object('ok',false,'code','DUPLICATE_REFERENCE'); end if;
 if balance::bigint+award>2147483647 then return jsonb_build_object('ok',false,'code','BALANCE_LIMIT'); end if;
 insert into public.member_point_events(request_id,user_id,staff_id,kind,reference,amount_centavos,points)
 values(p_request_id,member,staff,p_kind,ref,p_amount_centavos,award) returning id into event_id;
 update public.wallets set points=points+award,updated_at=now() where user_id=member;
 return jsonb_build_object('ok',true,'event_id',event_id,'points',award,'replayed',false,'member_name',(select display_name from public.member_profiles where user_id=member));
exception when unique_violation then
 -- This exception rolls back all writes in the block, including any wallet mutation.
 return jsonb_build_object('ok',false,'code','DUPLICATE_REFERENCE');
end;$$;
revoke all on function public.award_member_points(text,text,text,integer,uuid) from public,anon;
grant execute on function public.award_member_points(text,text,text,integer,uuid) to authenticated;
-- END MODULE: member-short-codes.sql

-- BEGIN MODULE: member-tasks
-- Editable identity; usernames remain unique ignoring case/outer spaces.
alter table public.member_profiles drop constraint if exists member_profiles_username_check;
alter table public.member_profiles add constraint member_profiles_username_check check(char_length(trim(username)) between 3 and 40 and username !~ '[[:cntrl:]]');
alter table public.member_profiles drop constraint if exists member_profiles_display_name_check;
alter table public.member_profiles add constraint member_profiles_display_name_check check(char_length(trim(display_name)) between 1 and 60 and display_name !~ '[[:cntrl:]]');
create unique index if not exists member_username_casefold on public.member_profiles(lower(trim(username)));
alter table public.leaderboard_profiles drop constraint if exists leaderboard_profiles_display_name_check;
alter table public.leaderboard_profiles add constraint leaderboard_profiles_display_name_check check(char_length(trim(display_name)) between 1 and 60);
-- Existing opted-in members now show the LIVE profile display name, not a second alias.
create or replace view public.public_leaderboard with (security_barrier=true) as
select rank() over(order by w.points desc) as rank,p.display_name,w.points
from public.leaderboard_profiles l join public.member_profiles p on p.user_id=l.user_id
join public.wallets w on w.user_id=p.user_id where l.opted_in=true;
revoke all on public.public_leaderboard from public;
grant select on public.public_leaderboard to anon,authenticated;
revoke insert,update on public.leaderboard_profiles from authenticated;
create or replace function public.set_leaderboard_participation(p_opted_in boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_opted_in is null then raise exception 'Sign in required'; end if;
 insert into public.leaderboard_profiles(user_id,display_name,opted_in)
 select user_id,left(display_name,30),p_opted_in from public.member_profiles where user_id=auth.uid()
 on conflict(user_id) do update set opted_in=excluded.opted_in,display_name=excluded.display_name;
 return p_opted_in;
end;$$;
revoke all on function public.set_leaderboard_participation(boolean) from public,anon;
grant execute on function public.set_leaderboard_participation(boolean) to authenticated;
create table if not exists public.member_task_claims(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 task text not null check(task in ('signup','daily','gym_five_days','cardio')),
 period_key text not null,
 claim_day date not null,
 points integer not null check(points>0),
 created_at timestamptz not null default now(),
 unique(user_id,task,period_key)
);
alter table public.member_task_claims drop constraint if exists member_task_claims_task_check;
alter table public.member_task_claims add constraint member_task_claims_task_check check(task in ('signup','daily','gym_five_days','cardio'));
alter table public.member_task_claims enable row level security;
revoke all on public.member_task_claims from anon,authenticated;
grant select on public.member_task_claims to authenticated;
grant all on public.member_task_claims to service_role;
drop policy if exists task_read_self on public.member_task_claims;
create policy task_read_self on public.member_task_claims for select to authenticated using(user_id=(select auth.uid()));
create index if not exists member_visit_dates on public.member_point_events(user_id,created_at) where kind='visit';
create or replace function public.claim_member_task(p_task text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); today date:=(now() at time zone 'Asia/Manila')::date;
 amount integer; period text; current_points integer; days_count integer; claim_id uuid;
begin
 if uid is null then return jsonb_build_object('ok',false,'code','SIGN_IN'); end if;
 if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then
 return jsonb_build_object('ok',false,'code','CONFIRM_EMAIL'); end if;
 if p_task='signup' then amount:=15;period:='once';
 elsif p_task='daily' then amount:=5;period:=today::text;
 elsif p_task='cardio' then amount:=30;period:=today::text;
 elsif p_task='gym_five_days' then amount:=25;period:='once';
 else return jsonb_build_object('ok',false,'code','INVALID_TASK'); end if;
 select points into current_points from public.wallets where user_id=uid for update;
 if not found then return jsonb_build_object('ok',false,'code','WALLET_UNAVAILABLE'); end if;
 if exists(select 1 from public.member_task_claims where user_id=uid and task=p_task and period_key=period) then
 return jsonb_build_object('ok',true,'awarded',false,'points',0,'balance',current_points,'code','ALREADY_CLAIMED','day',today); end if;
 if p_task='gym_five_days' then
  select count(distinct (created_at at time zone 'Asia/Manila')::date)::integer into days_count
  from public.member_point_events where user_id=uid and kind='visit' and created_at<=now();
  if days_count<5 then return jsonb_build_object('ok',false,'code','TASK_INCOMPLETE','gym_days',days_count); end if;
 end if;
 if current_points::bigint+amount>2147483647 then return jsonb_build_object('ok',false,'code','BALANCE_LIMIT'); end if;
 insert into public.member_task_claims(user_id,task,period_key,claim_day,points)
 values(uid,p_task,period,today,amount) returning id into claim_id;
 update public.wallets set points=points+amount,updated_at=now() where user_id=uid;
 return jsonb_build_object('ok',true,'awarded',true,'points',amount,'balance',current_points+amount,'claim_id',claim_id,'day',today);
end;$$;
revoke all on function public.claim_member_task(text) from public,anon;
grant execute on function public.claim_member_task(text) to authenticated;
create or replace function public.member_streak_summary(p_user uuid,p_kind text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare today date:=(now() at time zone 'Asia/Manila')::date; d date; previous date;
 current_streak integer:=0; best integer:=0; run integer:=0; current_active boolean:=true;
begin
 for d in select distinct day from (
 select claim_day as day from public.member_task_claims where user_id=p_user and task='daily' and p_kind='daily'
 union all select (created_at at time zone 'Asia/Manila')::date from public.member_point_events where user_id=p_user and kind='visit' and p_kind='gym'
 ) dates where day<=today order by day desc loop
  if previous is null or d=previous-1 then run:=run+1; else run:=1; end if;
  best:=greatest(best,run);
  if current_active then
   if previous is null then
    if d>=today-1 then current_streak:=1; else current_active:=false; end if;
   elsif d=previous-1 then current_streak:=current_streak+1; else current_active:=false; end if;
  end if;
  previous:=d;
 end loop;
 return jsonb_build_object('current',current_streak,'best',best);
end;$$;
revoke all on function public.member_streak_summary(uuid,text) from public,anon,authenticated;
create or replace function public.get_member_tasks()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); today date:=(now() at time zone 'Asia/Manila')::date; gym_days integer; position bigint;
begin
 if uid is null then return jsonb_build_object('ok',false,'code','SIGN_IN'); end if;
 select count(distinct (created_at at time zone 'Asia/Manila')::date)::integer into gym_days from public.member_point_events where user_id=uid and kind='visit' and created_at<=now();
 select r into position from (select w.user_id,rank() over(order by w.points desc) r from public.wallets w join public.leaderboard_profiles p on p.user_id=w.user_id where p.opted_in) ranks where user_id=uid;
 return jsonb_build_object('ok',true,'today',today,'next_reset',(today+1)::timestamp at time zone 'Asia/Manila',
 'signup_claimed',exists(select 1 from public.member_task_claims where user_id=uid and task='signup'),
 'daily_claimed',exists(select 1 from public.member_task_claims where user_id=uid and task='daily' and period_key=today::text),
 'cardio_claimed',exists(select 1 from public.member_task_claims where user_id=uid and task='cardio' and period_key=today::text),
 'gym_claimed',exists(select 1 from public.member_task_claims where user_id=uid and task='gym_five_days'),
 'gym_days',gym_days,'daily_streak',public.member_streak_summary(uid,'daily'),'gym_streak',public.member_streak_summary(uid,'gym'),
 'leaderboard_rank',position,'history',(select coalesce(jsonb_agg(h),'[]'::jsonb) from (select task,points,claim_day from public.member_task_claims where user_id=uid order by created_at desc limit 10) h));
end;$$;
revoke all on function public.get_member_tasks() from public,anon;
grant execute on function public.get_member_tasks() to authenticated;
-- END MODULE: member-tasks

-- Admin assignments are owner-managed, never editable through member profiles.
create table if not exists public.app_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.app_admins enable row level security;
revoke all on public.app_admins from public,anon,authenticated;
grant all on public.app_admins to service_role;
-- Display labels only: APEX and AUREATINE are granted by owner seeds; MEMBER, STUDENT and STAFF are assigned by label managers.
-- Labels grant no database privileges beyond the existing admin/staff rows. A member may hold several labels.
create table if not exists public.owner_labels(user_id uuid references auth.users(id) on delete cascade,label text not null check(label in ('APEX','AUREATINE','MEMBER','STUDENT','STAFF')),created_at timestamptz not null default now(),primary key(user_id,label));
alter table public.owner_labels enable row level security;
revoke all on public.owner_labels from public,anon,authenticated;
grant all on public.owner_labels to service_role;
-- Upgrade owner_labels from an earlier draft that had no label column. Draft rows carry no label and
-- grant no admin rights (admin lives in app_admins), so they are cleared before labels are enforced.
alter table public.owner_labels add column if not exists label text;
delete from public.owner_labels where label is null;
alter table public.owner_labels alter column label set not null;
alter table public.owner_labels drop constraint if exists owner_labels_label_check;
alter table public.owner_labels add constraint owner_labels_label_check check(label in ('APEX','AUREATINE','MEMBER','STUDENT','STAFF'));
do $$begin
 if not exists(select 1 from pg_constraint c where c.conrelid='public.owner_labels'::regclass and c.contype='p' and array_length(c.conkey,1)=2) then
  alter table public.owner_labels drop constraint if exists owner_labels_pkey;
  alter table public.owner_labels add primary key(user_id,label);
 end if;
end$$;
drop function if exists public.get_my_owner_status();
-- BEGIN MODULE: personal-leaderboard-standing
-- Match the signed-in account on the server, never by a non-unique display name.
alter table public.member_profiles add column if not exists community_id uuid not null default gen_random_uuid();
alter table public.member_profiles add column if not exists share_leaderboard_photo boolean not null default false;
grant update(share_leaderboard_photo) on public.member_profiles to authenticated;
drop function if exists public.get_leaderboard_entries();
create function public.get_leaderboard_entries()
returns table(rank bigint,display_name text,points integer,is_current_user boolean,leaderboard_avatar_path text,is_admin boolean,community_id uuid,labels text[])
language sql stable security definer set search_path='' as $$
 select rank() over(order by w.points desc),p.display_name,w.points,
 coalesce(p.user_id=auth.uid(),false),
 case when p.share_leaderboard_photo and p.avatar_path is not null then p.community_id::text||'/avatar.webp' else null end,
 exists(select 1 from public.app_admins a where a.user_id=p.user_id),p.community_id,
 coalesce((select array_agg(o.label order by o.label) from public.owner_labels o where o.user_id=p.user_id),'{}'::text[])
 from public.member_profiles p join public.wallets w on w.user_id=p.user_id
 join public.leaderboard_profiles l on l.user_id=p.user_id
 where l.opted_in=true
 order by w.points desc,p.display_name,p.user_id limit 50;
$$;
revoke all on function public.get_leaderboard_entries() from public;
grant execute on function public.get_leaderboard_entries() to anon,authenticated;
create or replace function public.get_my_leaderboard_standing()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); member_name text; member_points integer; opted boolean; position bigint; list_position bigint; total bigint;
begin
 if uid is null then return jsonb_build_object('ok',false,'code','SIGN_IN'); end if;
 select p.display_name,w.points,coalesce(l.opted_in,false) into member_name,member_points,opted
 from public.member_profiles p join public.wallets w on w.user_id=p.user_id
 left join public.leaderboard_profiles l on l.user_id=p.user_id where p.user_id=uid;
 if not found then return jsonb_build_object('ok',false,'code','PROFILE_NOT_READY'); end if;
 select r,n into position,list_position from (
 select p.user_id,rank() over(order by w.points desc) r,
 row_number() over(order by w.points desc,p.display_name,p.user_id) n
 from public.member_profiles p join public.wallets w on w.user_id=p.user_id
 join public.leaderboard_profiles l on l.user_id=p.user_id where l.opted_in=true
 ) standings where user_id=uid;
 select count(*) into total from public.member_profiles p join public.wallets w on w.user_id=p.user_id
 join public.leaderboard_profiles l on l.user_id=p.user_id where l.opted_in=true;
 return jsonb_build_object('ok',true,'display_name',member_name,'points',member_points,'opted_in',opted,
 'rank',position,'in_top_50',coalesce(list_position<=50,false),'total_members',total);
end;$$;
revoke all on function public.get_my_leaderboard_standing() from public,anon;
grant execute on function public.get_my_leaderboard_standing() to authenticated;
-- END MODULE: personal-leaderboard-standing

-- BEGIN MODULE: member-community
alter table public.member_profiles add column if not exists community_id uuid not null default gen_random_uuid();
create unique index if not exists member_community_id_unique on public.member_profiles(community_id);
alter table public.member_profiles add column if not exists bio text not null default '';
alter table public.member_profiles add column if not exists facebook_url text not null default '';
alter table public.member_profiles add column if not exists instagram_url text not null default '';
alter table public.member_profiles add column if not exists tiktok_url text not null default '';
alter table public.member_profiles drop constraint if exists member_bio_valid;
alter table public.member_profiles add constraint member_bio_valid check(char_length(bio)<=300);
alter table public.member_profiles drop constraint if exists member_social_urls_valid;
alter table public.member_profiles add constraint member_social_urls_valid check(
 (facebook_url='' or (char_length(facebook_url)<=500 and facebook_url ~ '^https://(www\.|m\.)?facebook\.com(/[[:graph:]]*)?$')) and
 (instagram_url='' or (char_length(instagram_url)<=500 and instagram_url ~ '^https://(www\.)?instagram\.com(/[[:graph:]]*)?$')) and
 (tiktok_url='' or (char_length(tiktok_url)<=500 and tiktok_url ~ '^https://(www\.)?tiktok\.com(/[[:graph:]]*)?$')));
grant update(bio,facebook_url,instagram_url,tiktok_url) on public.member_profiles to authenticated;
create table if not exists public.member_follows(
 follower uuid not null references auth.users(id) on delete cascade,
 followed uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(follower,followed),check(follower<>followed));
create index if not exists member_follows_target on public.member_follows(followed);
create table if not exists public.member_friendships(
 low_id uuid not null references auth.users(id) on delete cascade,
 high_id uuid not null references auth.users(id) on delete cascade,
 requested_by uuid not null references auth.users(id) on delete cascade,
 status text not null check(status in ('pending','accepted','declined','cancelled')),
 updated_at timestamptz not null default now(),primary key(low_id,high_id),
 check(low_id<high_id and requested_by in (low_id,high_id)));
create index if not exists member_friendships_high on public.member_friendships(high_id);
create table if not exists public.member_blocks(blocker uuid not null references auth.users(id) on delete cascade,blocked uuid not null references auth.users(id) on delete cascade,primary key(blocker,blocked),check(blocker<>blocked));
create table if not exists public.member_social_rate(user_id uuid primary key references auth.users(id) on delete cascade,window_start timestamptz not null default now(),hits integer not null default 0);
alter table public.member_follows enable row level security;
alter table public.member_friendships enable row level security;
alter table public.member_blocks enable row level security;
alter table public.member_social_rate enable row level security;
revoke all on public.member_follows,public.member_friendships,public.member_blocks,public.member_social_rate from public,anon,authenticated;
grant all on public.member_follows,public.member_friendships,public.member_blocks,public.member_social_rate to service_role;
create or replace function public.member_community_card(p_user uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.community_id,'display_name',p.display_name,'username',p.username,'bio',p.bio,
 'facebook_url',p.facebook_url,'instagram_url',p.instagram_url,'tiktok_url',p.tiktok_url,'is_me',p.user_id=auth.uid(),
 'friends',(select count(*) from public.member_friendships f where f.status='accepted' and p.user_id in(f.low_id,f.high_id)),
 'followers',(select count(*) from public.member_follows f where f.followed=p.user_id),
 'following',(select count(*) from public.member_follows f where f.follower=p.user_id),
 'is_following',exists(select 1 from public.member_follows f where f.follower=auth.uid() and f.followed=p.user_id),
 'blocked',exists(select 1 from public.member_blocks b where b.blocker=auth.uid() and b.blocked=p.user_id),
 'relationship',coalesce((select case when f.status='accepted' then 'friends' when f.status='pending' then case when f.requested_by=auth.uid() then 'outgoing' else 'incoming' end else 'none' end from public.member_friendships f where f.low_id=least(p.user_id,auth.uid()) and f.high_id=greatest(p.user_id,auth.uid())),'none'))
 from public.member_profiles p where p.user_id=p_user;
$$;
revoke all on function public.member_community_card(uuid) from public,anon,authenticated;
create or replace function public.get_my_community_profile() returns jsonb language sql stable security definer set search_path='' as $$select public.member_community_card(auth.uid())$$;
revoke all on function public.get_my_community_profile() from public,anon;
grant execute on function public.get_my_community_profile() to authenticated;
create or replace function public.search_community(p_query text default '',p_filter text default 'all',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_filter not in ('all','requests','friends','followers','following','blocked') or p_filter is null then raise exception 'Invalid filter';end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or char_length(coalesce(p_query,''))>60 then raise exception 'Invalid search';end if;
 with selected as (
 select p.user_id,p.display_name,p.community_id from public.member_profiles p where p.user_id<>auth.uid()
 and (coalesce(btrim(p_query),'')='' or strpos(lower(p.display_name),lower(btrim(p_query)))>0 or strpos(lower(p.username),lower(btrim(p_query)))>0)
 and not exists(select 1 from public.member_blocks b where b.blocker=p.user_id and b.blocked=auth.uid())
 and (case when p_filter='blocked' then exists(select 1 from public.member_blocks b where b.blocker=auth.uid() and b.blocked=p.user_id) else not exists(select 1 from public.member_blocks b where b.blocker=auth.uid() and b.blocked=p.user_id) end)
 and (p_filter in ('all','blocked') or (p_filter in ('requests','friends') and exists(select 1 from public.member_friendships f where f.low_id=least(p.user_id,auth.uid()) and f.high_id=greatest(p.user_id,auth.uid()) and ((p_filter='friends' and f.status='accepted') or(p_filter='requests' and f.status='pending' and f.requested_by=p.user_id))))
 or(p_filter='followers' and exists(select 1 from public.member_follows f where f.follower=p.user_id and f.followed=auth.uid()))
 or(p_filter='following' and exists(select 1 from public.member_follows f where f.follower=auth.uid() and f.followed=p.user_id)))
 order by p.display_name,p.community_id limit 21 offset p_offset), numbered as(select *,row_number() over(order by display_name,community_id) n from selected)
 select jsonb_build_object('items',coalesce(jsonb_agg(public.member_community_card(user_id) order by n) filter(where n<=20),'[]'::jsonb),'has_more',count(*)>20) into result from numbered;
 return result;
end;$$;
revoke all on function public.search_community(text,text,integer) from public,anon;
grant execute on function public.search_community(text,text,integer) to authenticated;
create or replace function public.community_action(p_target uuid,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target_uid uuid; lo uuid; hi uuid; r public.member_friendships%rowtype; rate public.member_social_rate%rowtype;
begin
 if uid is null then return jsonb_build_object('ok',false,'code','SIGN_IN');end if;
 if p_action is null or p_action not in('follow','unfollow','request','accept','decline','cancel','unfriend','block','unblock') then return jsonb_build_object('ok',false,'code','INVALID_ACTION');end if;
 if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then return jsonb_build_object('ok',false,'code','CONFIRM_EMAIL');end if;
 select user_id into target_uid from public.member_profiles where community_id=p_target;
 if target_uid is null or target_uid=uid then return jsonb_build_object('ok',false,'code','INVALID_MEMBER');end if;
 insert into public.member_social_rate(user_id) values(uid) on conflict do nothing;
 select * into rate from public.member_social_rate where user_id=uid for update;
 if rate.window_start<=now()-interval '5 minutes' then update public.member_social_rate set window_start=now(),hits=1 where user_id=uid;
 elsif rate.hits>=60 then return jsonb_build_object('ok',false,'code','RATE_LIMIT');
 else update public.member_social_rate set hits=hits+1 where user_id=uid;end if;
 lo:=least(uid,target_uid);hi:=greatest(uid,target_uid);
 perform pg_advisory_xact_lock(hashtextextended(lo::text||hi::text,0));
 if p_action='block' then
 insert into public.member_blocks values(uid,target_uid) on conflict do nothing;
 delete from public.member_follows where (follower=uid and followed=target_uid) or(follower=target_uid and followed=uid);
 update public.member_friendships set status='cancelled',updated_at=now() where low_id=lo and high_id=hi;
 elsif p_action='unblock' then delete from public.member_blocks where blocker=uid and blocked=target_uid;
 else
 if exists(select 1 from public.member_blocks where (blocker=uid and blocked=target_uid) or(blocker=target_uid and blocked=uid)) then return jsonb_build_object('ok',false,'code','UNAVAILABLE');end if;
 if p_action='follow' then insert into public.member_follows(follower,followed) values(uid,target_uid) on conflict do nothing;
 elsif p_action='unfollow' then delete from public.member_follows where follower=uid and followed=target_uid;
 else
 select * into r from public.member_friendships where low_id=lo and high_id=hi for update;
 if p_action='request' then
 if r.status in('accepted','pending') then return jsonb_build_object('ok',true);end if;
 if r.updated_at>now()-interval '24 hours' then return jsonb_build_object('ok',false,'code','REQUEST_COOLDOWN');end if;
 insert into public.member_friendships(low_id,high_id,requested_by,status) values(lo,hi,uid,'pending') on conflict(low_id,high_id) do update set requested_by=uid,status='pending',updated_at=now();
 elsif p_action in('accept','decline') then
 if r.requested_by=uid or r.status is null or (r.status<>'pending' and not(p_action='accept' and r.status='accepted')) then return jsonb_build_object('ok',false,'code','REQUEST_UNAVAILABLE');end if;
 update public.member_friendships set status=case when p_action='accept' then 'accepted' else 'declined' end,updated_at=now() where low_id=lo and high_id=hi;
 elsif p_action='cancel' then
 if r.requested_by<>uid or r.status is distinct from 'pending' then return jsonb_build_object('ok',false,'code','REQUEST_UNAVAILABLE');end if;
 update public.member_friendships set status='cancelled',updated_at=now() where low_id=lo and high_id=hi;
 elsif p_action='unfriend' then
 if r.status is distinct from 'accepted' then return jsonb_build_object('ok',false,'code','REQUEST_UNAVAILABLE');end if;
 update public.member_friendships set status='cancelled',updated_at=now() where low_id=lo and high_id=hi;
 end if;end if;end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.community_action(uuid,text) from public,anon;
grant execute on function public.community_action(uuid,text) to authenticated;
-- END MODULE: member-community

-- BEGIN MODULE: consented-leaderboard-photos
-- A separate PRIVATE bucket holds a copy of the consented image, not the original UUID path.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('leaderboard-avatars','leaderboard-avatars',false,2097152,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
create or replace function public.can_access_leaderboard_avatar(p_name text,p_owner_only boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.member_profiles p where p_name=p.community_id::text||'/avatar.webp'
 and (p.user_id=auth.uid() or(not p_owner_only and p.share_leaderboard_photo and p.avatar_path is not null
 and exists(select 1 from public.leaderboard_profiles l where l.user_id=p.user_id and l.opted_in))));
$$;
revoke all on function public.can_access_leaderboard_avatar(text,boolean) from public;
grant execute on function public.can_access_leaderboard_avatar(text,boolean) to anon,authenticated;
grant usage on schema storage to anon;
grant select on storage.objects to anon;
drop policy if exists leaderboard_avatar_read on storage.objects;
create policy leaderboard_avatar_read on storage.objects for select to anon,authenticated using(bucket_id='leaderboard-avatars' and public.can_access_leaderboard_avatar(name,false));
drop policy if exists leaderboard_avatar_insert on storage.objects;
create policy leaderboard_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='leaderboard-avatars' and public.can_access_leaderboard_avatar(name,true));
drop policy if exists leaderboard_avatar_update on storage.objects;
create policy leaderboard_avatar_update on storage.objects for update to authenticated using(bucket_id='leaderboard-avatars' and public.can_access_leaderboard_avatar(name,true)) with check(bucket_id='leaderboard-avatars' and public.can_access_leaderboard_avatar(name,true));
drop policy if exists leaderboard_avatar_delete on storage.objects;
create policy leaderboard_avatar_delete on storage.objects for delete to authenticated using(bucket_id='leaderboard-avatars' and public.can_access_leaderboard_avatar(name,true));
-- END MODULE: consented-leaderboard-photos

-- BEGIN MODULE: unique-names-and-admin-moderation
-- Stop instead of silently renaming real members when legacy duplicates exist.
do $$begin
 if exists(select 1 from public.member_profiles group by lower(trim(display_name)) having count(*)>1) then
 raise exception 'Duplicate display names exist. Review member_profiles and ask affected members to choose unique names before rerunning this full setup.';
 end if;
end$$;
create unique index if not exists member_display_name_casefold on public.member_profiles(lower(trim(display_name)));
create or replace function public.check_member_names(p_display_name text,p_username text default null) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('display_taken',exists(select 1 from public.member_profiles p where lower(trim(p.display_name))=lower(trim(p_display_name)) and p.user_id is distinct from auth.uid()),'username_taken',exists(select 1 from public.member_profiles p where lower(trim(p.username))=lower(trim(p_username)) and p.user_id is distinct from auth.uid()));
$$;
revoke all on function public.check_member_names(text,text) from public;
grant execute on function public.check_member_names(text,text) to anon,authenticated;
create or replace function public.get_my_admin_status() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.app_admins where user_id=auth.uid())$$;
revoke all on function public.get_my_admin_status() from public,anon;
grant execute on function public.get_my_admin_status() to authenticated;
drop function if exists public.get_my_owner_label();
create or replace function public.get_my_labels() returns text[] language sql stable security definer set search_path='' as $$select coalesce(array_agg(o.label order by o.label),'{}'::text[]) from public.owner_labels o where o.user_id=auth.uid()$$;
revoke all on function public.get_my_labels() from public,anon;
grant execute on function public.get_my_labels() to authenticated;
-- Label managers: admins who hold an APEX or AUREATINE label.
create or replace function public.get_my_label_manager() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.app_admins a where a.user_id=auth.uid()) and exists(select 1 from public.owner_labels o where o.user_id=auth.uid() and o.label in ('APEX','AUREATINE'))$$;
revoke all on function public.get_my_label_manager() from public,anon;
grant execute on function public.get_my_label_manager() to authenticated;
create table if not exists public.admin_member_audit(id uuid primary key default gen_random_uuid(),actor uuid references auth.users(id) on delete set null,member_id uuid references auth.users(id) on delete set null,action text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table if not exists public.admin_setup_markers(name text primary key,assigned_user uuid not null,created_at timestamptz not null default now());
alter table public.admin_member_audit enable row level security;
alter table public.admin_setup_markers enable row level security;
revoke all on public.admin_member_audit,public.admin_setup_markers from public,anon,authenticated;
grant all on public.admin_member_audit,public.admin_setup_markers to service_role;
-- Owner-only resolver supports an exact username OR exact email, without exposing emails to the UI.
create or replace function public.owner_grant_admin(p_identifier text,p_lookup text default 'username') returns uuid language plpgsql security definer set search_path='' as $$
declare target_id uuid;
begin
 if p_lookup='username' then select p.user_id into target_id from public.member_profiles p join auth.users u on u.id=p.user_id where lower(trim(p.username))=lower(trim(p_identifier)) and u.email_confirmed_at is not null;
 elsif p_lookup='email' then select id into target_id from auth.users where lower(email)=lower(trim(p_identifier)) and email_confirmed_at is not null;
 else raise exception 'Use username or email';end if;
 if target_id is null then raise exception 'No confirmed account matches the exact identifier';end if;
 insert into public.app_admins(user_id) values(target_id) on conflict do nothing;
 insert into public.staff_members(user_id,role) values(target_id,'apex'),(target_id,'aureatine') on conflict do nothing;
 insert into public.admin_member_audit(actor,member_id,action,details) values(auth.uid(),target_id,'owner_admin_grant',jsonb_build_object('lookup',p_lookup));
 return target_id;
end;$$;
revoke all on function public.owner_grant_admin(text,text) from public,anon,authenticated;
grant execute on function public.owner_grant_admin(text,text) to service_role;
-- One-time assignment only. Renaming/deleting the account never transfers this grant to a reused username.
do $$declare assigned uuid;begin
 if not exists(select 1 from public.admin_setup_markers where name='initial-admin-yasuda.dnz') then
 if exists(select 1 from public.member_profiles p join auth.users u on u.id=p.user_id where lower(trim(p.username))='yasuda.dnz' and u.email_confirmed_at is not null) then
 assigned:=public.owner_grant_admin('yasuda.dnz','username');
 insert into public.admin_setup_markers(name,assigned_user) values('initial-admin-yasuda.dnz',assigned);
 else raise notice 'ADMIN NOT ASSIGNED: no existing email-confirmed username yasuda.dnz. Verify that account before rerunning.';end if;end if;
end$$;
create or replace function public.admin_search_members(p_query text default '',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.get_my_admin_status() then raise exception 'Admin access required' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or length(coalesce(p_query,''))>60 then raise exception 'Invalid search';end if;
 select coalesce(jsonb_agg(item),'[]'::jsonb) into result from (
 select jsonb_build_object('id',p.community_id,'display_name',p.display_name,'username',p.username,'bio',p.bio,'share_photo',p.share_leaderboard_photo,'opted_in',coalesce(l.opted_in,false),'is_admin',exists(select 1 from public.app_admins a where a.user_id=p.user_id),'labels',coalesce((select array_agg(o.label order by o.label) from public.owner_labels o where o.user_id=p.user_id),'{}'::text[])) item
 from public.member_profiles p left join public.leaderboard_profiles l on l.user_id=p.user_id
 where coalesce(trim(p_query),'')='' or strpos(lower(p.display_name),lower(trim(p_query)))>0 or strpos(lower(p.username),lower(trim(p_query)))>0
 order by p.display_name,p.community_id limit 21 offset p_offset) results;
 return result;
end;$$;
revoke all on function public.admin_search_members(text,integer) from public,anon;
grant execute on function public.admin_search_members(text,integer) to authenticated;
create or replace function public.admin_update_member(p_id uuid,p_display_name text,p_username text,p_bio text,p_hide_leaderboard boolean default false,p_hide_photo boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.member_profiles%rowtype; collision text;
begin
 if not public.get_my_admin_status() then raise exception 'Admin access required' using errcode='42501';end if;
 if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 60 or p_username is null or char_length(trim(p_username)) not between 3 and 40 or p_bio is null or char_length(p_bio)>300 or (p_display_name||p_username) ~ '[[:cntrl:]]' then return jsonb_build_object('ok',false,'code','INVALID_INPUT');end if;
 select * into target from public.member_profiles where community_id=p_id for update;
 if not found then return jsonb_build_object('ok',false,'code','NOT_FOUND');end if;
 update public.member_profiles set display_name=trim(p_display_name),username=trim(p_username),bio=p_bio,share_leaderboard_photo=case when p_hide_photo then false else share_leaderboard_photo end where user_id=target.user_id;
 if p_hide_leaderboard then update public.leaderboard_profiles set opted_in=false where user_id=target.user_id;end if;
 insert into public.admin_member_audit(actor,member_id,action,details) values(auth.uid(),target.user_id,'moderate_profile',jsonb_build_object('before',jsonb_build_object('display_name',target.display_name,'username',target.username,'bio',target.bio),'after',jsonb_build_object('display_name',trim(p_display_name),'username',trim(p_username),'bio',p_bio),'hide_leaderboard',coalesce(p_hide_leaderboard,false),'hide_photo',coalesce(p_hide_photo,false)));
 return jsonb_build_object('ok',true);
exception when unique_violation then get stacked diagnostics collision=constraint_name;
 return jsonb_build_object('ok',false,'code',case when collision='member_display_name_casefold' then 'DISPLAY_TAKEN' else 'USERNAME_TAKEN' end);
end;$$;
revoke all on function public.admin_update_member(uuid,text,text,text,boolean,boolean) from public,anon;
grant execute on function public.admin_update_member(uuid,text,text,text,boolean,boolean) to authenticated;
-- One-time owner-authorized seeds. Each runs only when that exact confirmed username exists; otherwise it leaves a notice and can be rerun later.
-- @apex.fg is the APEX social handle, not a member account, so it is never seeded.
do $$declare assigned uuid;begin
 if not exists(select 1 from public.admin_setup_markers where name='initial-admin-gianpogi') then
  if exists(select 1 from public.member_profiles p join auth.users u on u.id=p.user_id where lower(trim(p.username))='gianpogi' and u.email_confirmed_at is not null) then
   assigned:=public.owner_grant_admin('gianpogi','username');
   insert into public.admin_setup_markers(name,assigned_user) values('initial-admin-gianpogi',assigned);
  else raise notice 'ADMIN NOT ASSIGNED: no existing email-confirmed username gianpogi. Verify that account before rerunning.';end if;
 end if;
 if not exists(select 1 from public.admin_setup_markers where name='initial-owner-label-gianpogi') then
  if exists(select 1 from public.member_profiles p join auth.users u on u.id=p.user_id where lower(trim(p.username))='gianpogi' and u.email_confirmed_at is not null) then
   assigned:=(select p.user_id from public.member_profiles p where lower(trim(p.username))='gianpogi');
   insert into public.owner_labels(user_id,label) values(assigned,'APEX') on conflict do nothing;
   insert into public.admin_setup_markers(name,assigned_user) values('initial-owner-label-gianpogi',assigned);
  else raise notice 'APEX LABEL NOT ASSIGNED: no existing email-confirmed username gianpogi.';end if;
 end if;
 if not exists(select 1 from public.admin_setup_markers where name='initial-owner-label-yasuda.dnz') then
  if exists(select 1 from public.member_profiles p join auth.users u on u.id=p.user_id where lower(trim(p.username))='yasuda.dnz' and u.email_confirmed_at is not null) then
   assigned:=(select p.user_id from public.member_profiles p where lower(trim(p.username))='yasuda.dnz');
   insert into public.owner_labels(user_id,label) values(assigned,'AUREATINE') on conflict do nothing;
   insert into public.admin_setup_markers(name,assigned_user) values('initial-owner-label-yasuda.dnz',assigned);
  else raise notice 'AUREATINE LABEL NOT ASSIGNED: no existing email-confirmed username yasuda.dnz.';end if;
 end if;
end$$;

-- END MODULE: unique-names-and-admin-moderation

-- BEGIN MODULE: leaderboard-member-profile
-- Public community IDs are not auth IDs, QR codes or membership credentials.
-- Bio/social visibility stays authenticated-only, matching community search.
create or replace function public.get_leaderboard_member_profile(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target_uid uuid; card jsonb; position bigint; member_points integer; photo_path text;
begin
 if auth.uid() is null then return jsonb_build_object('ok',false,'code','SIGN_IN'); end if;
 select p.user_id into target_uid from public.member_profiles p where p.community_id=p_member;
 if target_uid is null or exists(select 1 from public.member_blocks b
   where (b.blocker=auth.uid() and b.blocked=target_uid) or (b.blocker=target_uid and b.blocked=auth.uid())) then
   return jsonb_build_object('ok',false,'code','UNAVAILABLE');
 end if;
 card:=public.member_community_card(target_uid);
 -- Rank across ALL opted-in members, not only the first 50 or the viewer's search.
 select r,points into position,member_points from (
   select p.user_id,w.points,rank() over(order by w.points desc) r
   from public.member_profiles p join public.wallets w on w.user_id=p.user_id
   join public.leaderboard_profiles l on l.user_id=p.user_id where l.opted_in=true
 ) standings where user_id=target_uid;
 select p.community_id::text||'/avatar.webp' into photo_path
 from public.member_profiles p join public.leaderboard_profiles l on l.user_id=p.user_id
 where p.user_id=target_uid and l.opted_in and p.share_leaderboard_photo and p.avatar_path is not null;
 return jsonb_build_object('ok',true,'profile',card||jsonb_build_object(
   'rank',position,'points',member_points,'leaderboard_avatar_path',photo_path,
   'is_admin',exists(select 1 from public.app_admins a where a.user_id=target_uid),'labels',coalesce((select array_agg(o.label order by o.label) from public.owner_labels o where o.user_id=target_uid),'{}'::text[])));
end;$$;
revoke all on function public.get_leaderboard_member_profile(uuid) from public,anon;
grant execute on function public.get_leaderboard_member_profile(uuid) to authenticated;
-- END MODULE: leaderboard-member-profile

-- Label assignment: only label managers can set MEMBER, STUDENT or STAFF. APEX and AUREATINE stay owner-seeded.
create or replace function public.admin_set_member_labels(p_member uuid,p_labels text[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid; wanted text[];
begin
 if not public.get_my_label_manager() then raise exception 'Label manager access required' using errcode='42501'; end if;
 wanted:=coalesce(p_labels,'{}'::text[]);
 if exists(select 1 from unnest(wanted) as t(l) where l not in ('MEMBER','STUDENT','STAFF')) then return jsonb_build_object('ok',false,'code','INVALID_LABEL'); end if;
 select p.user_id into target from public.member_profiles p where p.community_id=p_member;
 if target is null then return jsonb_build_object('ok',false,'code','NOT_FOUND'); end if;
 delete from public.owner_labels where user_id=target and label in ('MEMBER','STUDENT','STAFF') and not (label=any(wanted));
 insert into public.owner_labels(user_id,label) select target,t.l from unnest(wanted) as t(l) on conflict do nothing;
 insert into public.admin_member_audit(actor,member_id,action,details) values(auth.uid(),target,'set_labels',jsonb_build_object('labels',wanted));
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.admin_set_member_labels(uuid,text[]) from public,anon;
grant execute on function public.admin_set_member_labels(uuid,text[]) to authenticated;

-- Refresh REST function/table discovery after schema changes.
NOTIFY pgrst, 'reload schema';
COMMIT;
