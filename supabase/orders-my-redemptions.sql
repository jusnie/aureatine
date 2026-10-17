-- Run once in the Supabase SQL Editor. Lets a signed-in member read only their own redemptions (status, size, collection).
create or replace function public.get_my_reward_orders()
returns table (
  id uuid,
  item_id text,
  status text,
  selected_size text,
  points_spent integer,
  created_at timestamptz,
  completed_at timestamptz,
  collected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.item_id, r.status, r.selected_size, r.points_spent, r.created_at, r.completed_at, r.collected_at
  from public.reward_redemptions r
  where r.user_id = auth.uid()
  order by r.created_at desc
  limit 100;
$$;

revoke all on function public.get_my_reward_orders() from public, anon;
grant execute on function public.get_my_reward_orders() to authenticated;
