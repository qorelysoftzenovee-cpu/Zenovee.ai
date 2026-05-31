create or replace function public.sync_auth_user_to_public_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (
    id,
    email,
    name
  ) values (
    new.id,
    lower(new.email),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '')
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.users.name);

  insert into public.user_credits (
    user_id,
    total_credits,
    used_credits,
    available_credits,
    subscription_credits,
    subscription_used,
    addon_credits,
    addon_used,
    updated_at
  ) values (
    new.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_sync_auth_user_to_public_user on auth.users;
create trigger trg_sync_auth_user_to_public_user
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_auth_user_to_public_user();

with auth_user_backfill as (
  insert into public.users (
    id,
    email,
    name
  )
  select
    au.id,
    lower(au.email),
    nullif(trim(coalesce(au.raw_user_meta_data ->> 'name', '')), '')
  from auth.users au
  left join public.users pu on pu.id = au.id
  where pu.id is null
  on conflict (id) do nothing
  returning id
),
existing_zero_credit_repair as (
  update public.user_credits uc
  set total_credits = seeded.seed_credits,
      available_credits = seeded.seed_credits,
      subscription_credits = seeded.seed_credits,
      subscription_used = 0,
      updated_at = now()
  from (
    select
      u.id as user_id,
      case plan_context.plan_id
        when 'starter' then 10000
        when 'growth' then 35000
        when 'scale' then 75000
        else 0
      end as seed_credits
    from public.users u
    join public.user_credits existing_uc on existing_uc.user_id = u.id
    join lateral (
      select coalesce(
        (select s.plan_id from public.subscriptions s where s.user_id = u.id order by s.updated_at desc limit 1),
        (select p.plan from public.payments p where p.user_id = u.id and p.status = 'SUCCESS' order by p.created_at desc limit 1)
      ) as plan_id
    ) plan_context on true
    where plan_context.plan_id is not null
      and coalesce(existing_uc.total_credits, 0) = 0
      and coalesce(existing_uc.available_credits, 0) = 0
      and coalesce(existing_uc.subscription_credits, 0) = 0
  ) seeded
  where uc.user_id = seeded.user_id
  returning uc.user_id
),
entitled_credit_backfill as (
  insert into public.user_credits (
    user_id,
    total_credits,
    used_credits,
    available_credits,
    subscription_credits,
    subscription_used,
    addon_credits,
    addon_used,
    updated_at
  )
  select
    u.id,
    case plan_context.plan_id
      when 'starter' then 10000
      when 'growth' then 35000
      when 'scale' then 75000
      else 0
    end,
    0,
    case plan_context.plan_id
      when 'starter' then 10000
      when 'growth' then 35000
      when 'scale' then 75000
      else 0
    end,
    case plan_context.plan_id
      when 'starter' then 10000
      when 'growth' then 35000
      when 'scale' then 75000
      else 0
    end,
    0,
    0,
    0,
    now()
  from public.users u
  left join public.user_credits uc on uc.user_id = u.id
  join lateral (
    select coalesce(
      (select s.plan_id from public.subscriptions s where s.user_id = u.id order by s.updated_at desc limit 1),
      (select p.plan from public.payments p where p.user_id = u.id and p.status = 'SUCCESS' order by p.created_at desc limit 1)
    ) as plan_id
  ) plan_context on true
  where uc.user_id is null
    and plan_context.plan_id is not null
  on conflict (user_id) do nothing
  returning user_id
)
insert into public.user_credits (
  user_id,
  total_credits,
  used_credits,
  available_credits,
  subscription_credits,
  subscription_used,
  addon_credits,
  addon_used,
  updated_at
)
select
  u.id,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  now()
from public.users u
left join public.user_credits uc on uc.user_id = u.id
where uc.user_id is null
on conflict (user_id) do nothing;