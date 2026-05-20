-- Production-grade tool execution + credits engine

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Pricing configuration
-- ---------------------------------------------------------------------------
create table if not exists public.tool_pricing (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null unique,
  credits_cost integer not null check (credits_cost > 0),
  is_active boolean not null default true,
  cooldown_seconds integer not null default 0 check (cooldown_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tool_pricing (tool_id, credits_cost, is_active, cooldown_seconds, metadata)
values
  ('seo-article-generator', 15, true, 180, '{"category":"seo","tier":"heavy"}'::jsonb),
  ('ad-copy-generator', 5, true, 20, '{"category":"marketing","tier":"standard"}'::jsonb),
  ('customer-persona-builder', 8, true, 30, '{"category":"strategy","tier":"standard"}'::jsonb),
  ('background-remover', 40, false, 300, '{"category":"design","tier":"image"}'::jsonb),
  ('landing-page-copy-generator', 12, true, 90, '{"category":"copywriting","tier":"heavy"}'::jsonb),
  ('browser-rewrite', 5, true, 10, '{"category":"browser","tier":"standard"}'::jsonb),
  ('browser-summarize', 5, true, 10, '{"category":"browser","tier":"standard"}'::jsonb),
  ('browser-improve-writing', 6, true, 15, '{"category":"browser","tier":"standard"}'::jsonb),
  ('browser-seo-helper', 15, true, 60, '{"category":"browser","tier":"seo"}'::jsonb),
  ('browser-ad-copy', 12, true, 45, '{"category":"browser","tier":"marketing"}'::jsonb)
on conflict (tool_id) do update
set credits_cost = excluded.credits_cost,
    is_active = excluded.is_active,
    cooldown_seconds = excluded.cooldown_seconds,
    metadata = excluded.metadata;

-- ---------------------------------------------------------------------------
-- Execution + usage + API logs
-- ---------------------------------------------------------------------------
create table if not exists public.tool_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  tool_name text not null,
  idempotency_key text,
  status text not null check (status in ('pending', 'running', 'success', 'failed', 'blocked')),
  input jsonb,
  output jsonb,
  error_message text,
  credits_charged integer not null default 0,
  api_model text,
  api_provider text,
  token_estimate integer not null default 0,
  estimated_api_cost numeric(12,6) not null default 0,
  execution_ms integer,
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create index if not exists idx_tool_executions_user_created on public.tool_executions(user_id, created_at desc);
create index if not exists idx_tool_executions_status_created on public.tool_executions(status, created_at desc);
create index if not exists idx_tool_executions_tool_created on public.tool_executions(tool_id, created_at desc);

create table if not exists public.tool_usage_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.tool_executions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  credits_consumed integer not null default 0,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tool_usage_logs_user_created on public.tool_usage_logs(user_id, created_at desc);

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.tool_executions(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(12,6) not null default 0,
  status text not null check (status in ('success', 'failed')),
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_logs_user_created on public.api_usage_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ledger enhancements for rollback safety
-- ---------------------------------------------------------------------------
alter table public.credit_transactions add column if not exists execution_id uuid references public.tool_executions(id) on delete set null;
alter table public.credit_transactions add column if not exists reversal_of uuid references public.credit_transactions(id) on delete set null;

alter table public.user_credits add column if not exists subscription_credits integer not null default 0 check (subscription_credits >= 0);
alter table public.user_credits add column if not exists subscription_used integer not null default 0 check (subscription_used >= 0);
alter table public.user_credits add column if not exists addon_credits integer not null default 0 check (addon_credits >= 0);
alter table public.user_credits add column if not exists addon_used integer not null default 0 check (addon_used >= 0);
alter table public.user_credits add column if not exists billing_cycle_anchor timestamptz;
alter table public.user_credits add column if not exists next_reset_at timestamptz;

update public.user_credits
set subscription_credits = greatest(total_credits - used_credits, 0),
    subscription_used = 0,
    addon_credits = 0,
    addon_used = 0
where subscription_credits = 0 and addon_credits = 0 and total_credits > 0;

create or replace function public.recalculate_user_credit_totals()
returns trigger
language plpgsql
as $$
begin
  new.total_credits := new.subscription_credits + new.addon_credits;
  new.used_credits := new.subscription_used + new.addon_used;
  new.available_credits := greatest((new.subscription_credits - new.subscription_used) + (new.addon_credits - new.addon_used), 0);
  return new;
end;
$$;

drop trigger if exists trg_user_credits_recalculate on public.user_credits;
create trigger trg_user_credits_recalculate
before insert or update on public.user_credits
for each row execute function public.recalculate_user_credit_totals();

create or replace function public.allocate_subscription_credits(
  p_user_id uuid,
  p_credits integer,
  p_plan_id text,
  p_reference text,
  p_reset_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
) returns table(balance_before integer, balance_after integer)
language plpgsql
security definer
as $$
declare
  v_available integer;
  v_addon_remaining integer;
  v_existing record;
begin
  select balance_before, balance_after
  into v_existing
  from public.credit_transactions
  where user_id = p_user_id
    and transaction_type = 'subscription_credit'
    and reference = p_reference
  order by created_at desc
  limit 1;

  if v_existing.balance_after is not null then
    return query select v_existing.balance_before, v_existing.balance_after;
    return;
  end if;

  insert into public.user_credits (
    user_id, total_credits, used_credits, available_credits,
    subscription_credits, subscription_used, addon_credits, addon_used
  ) values (p_user_id, 0, 0, 0, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  select available_credits, greatest(addon_credits - addon_used, 0)
  into v_available, v_addon_remaining
  from public.user_credits
  where user_id = p_user_id
  for update;

  update public.user_credits
  set subscription_credits = p_credits,
      subscription_used = 0,
      billing_cycle_anchor = now(),
      next_reset_at = p_reset_at
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, transaction_type, credits, balance_before, balance_after,
    plan_id, reference, metadata
  ) values (
    p_user_id, 'subscription_credit', p_credits, v_available, p_credits + v_addon_remaining,
    p_plan_id, p_reference, p_metadata
  );

  return query select v_available, p_credits + v_addon_remaining;
end;
$$;

create or replace function public.add_topup_credits(
  p_user_id uuid,
  p_credits integer,
  p_plan_id text,
  p_reference text,
  p_metadata jsonb default '{}'::jsonb
) returns table(balance_before integer, balance_after integer)
language plpgsql
security definer
as $$
declare
  v_available integer;
  v_existing record;
begin
  select balance_before, balance_after
  into v_existing
  from public.credit_transactions
  where user_id = p_user_id
    and transaction_type = 'topup_credit'
    and reference = p_reference
  order by created_at desc
  limit 1;

  if v_existing.balance_after is not null then
    return query select v_existing.balance_before, v_existing.balance_after;
    return;
  end if;

  insert into public.user_credits (
    user_id, total_credits, used_credits, available_credits,
    subscription_credits, subscription_used, addon_credits, addon_used
  ) values (p_user_id, 0, 0, 0, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  select available_credits
  into v_available
  from public.user_credits
  where user_id = p_user_id
  for update;

  update public.user_credits
  set addon_credits = addon_credits + p_credits
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, transaction_type, credits, balance_before, balance_after,
    plan_id, reference, metadata
  ) values (
    p_user_id, 'topup_credit', p_credits, v_available, v_available + p_credits,
    p_plan_id, p_reference, p_metadata
  );

  return query select v_available, v_available + p_credits;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic debit / refund functions
-- ---------------------------------------------------------------------------
create or replace function public.debit_user_credits(
  p_user_id uuid,
  p_credits integer,
  p_reference text,
  p_execution_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns table(balance_before integer, balance_after integer, transaction_id uuid)
language plpgsql
security definer
as $$
declare
  v_available integer;
  v_subscription_remaining integer;
  v_addon_remaining integer;
  v_subscription_debit integer;
  v_addon_debit integer;
  v_tx_id uuid;
begin
  if p_credits <= 0 then
    raise exception 'Credits must be > 0';
  end if;

  insert into public.user_credits (
    user_id, total_credits, used_credits, available_credits,
    subscription_credits, subscription_used, addon_credits, addon_used
  ) values (p_user_id, 0, 0, 0, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  select available_credits,
         greatest(subscription_credits - subscription_used, 0),
         greatest(addon_credits - addon_used, 0)
  into v_available, v_subscription_remaining, v_addon_remaining
  from public.user_credits
  where user_id = p_user_id
  for update;

  if v_available < p_credits then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  v_subscription_debit := least(v_subscription_remaining, p_credits);
  v_addon_debit := p_credits - v_subscription_debit;

  update public.user_credits
  set subscription_used = subscription_used + v_subscription_debit,
      addon_used = addon_used + v_addon_debit
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, transaction_type, credits, balance_before, balance_after,
    reference, metadata, execution_id
  ) values (
    p_user_id, 'usage_debit', -p_credits, v_available, v_available - p_credits,
    p_reference,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'subscription_debit', v_subscription_debit,
      'addon_debit', v_addon_debit
    ),
    p_execution_id
  ) returning id into v_tx_id;

  return query select v_available, v_available - p_credits, v_tx_id;
end;
$$;

create or replace function public.refund_user_credits(
  p_user_id uuid,
  p_original_tx uuid,
  p_reference text,
  p_execution_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns table(balance_before integer, balance_after integer, transaction_id uuid)
language plpgsql
security definer
as $$
declare
  v_original record;
  v_available integer;
  v_refund integer;
  v_subscription_refund integer;
  v_addon_refund integer;
  v_tx_id uuid;
begin
  select * into v_original
  from public.credit_transactions
  where id = p_original_tx and user_id = p_user_id and transaction_type = 'usage_debit'
  for update;

  if v_original.id is null then
    raise exception 'ORIGINAL_TX_NOT_FOUND';
  end if;

  if exists(select 1 from public.credit_transactions where reversal_of = p_original_tx) then
    raise exception 'ALREADY_REFUNDED';
  end if;

  v_refund := abs(v_original.credits);
  v_subscription_refund := coalesce((v_original.metadata ->> 'subscription_debit')::integer, 0);
  v_addon_refund := coalesce((v_original.metadata ->> 'addon_debit')::integer, greatest(v_refund - v_subscription_refund, 0));

  select available_credits
  into v_available
  from public.user_credits
  where user_id = p_user_id
  for update;

  update public.user_credits
  set subscription_used = greatest(0, subscription_used - v_subscription_refund),
      addon_used = greatest(0, addon_used - v_addon_refund)
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, transaction_type, credits, balance_before, balance_after,
    reference, metadata, execution_id, reversal_of
  ) values (
    p_user_id, 'refund', v_refund, v_available, v_available + v_refund,
    p_reference,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'subscription_refund', v_subscription_refund,
      'addon_refund', v_addon_refund
    ),
    p_execution_id, p_original_tx
  ) returning id into v_tx_id;

  return query select v_available, v_available + v_refund, v_tx_id;
end;
$$;

drop trigger if exists trg_tool_pricing_updated_at on public.tool_pricing;
create trigger trg_tool_pricing_updated_at before update on public.tool_pricing
for each row execute function public.set_updated_at();

drop trigger if exists trg_tool_executions_updated_at on public.tool_executions;
create trigger trg_tool_executions_updated_at before update on public.tool_executions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tool_pricing enable row level security;
alter table public.tool_executions enable row level security;
alter table public.tool_usage_logs enable row level security;
alter table public.api_usage_logs enable row level security;

drop policy if exists tool_pricing_select_all_authenticated on public.tool_pricing;
create policy tool_pricing_select_all_authenticated on public.tool_pricing
for select using (auth.uid() is not null or public.is_admin());

drop policy if exists tool_pricing_service_write on public.tool_pricing;
create policy tool_pricing_service_write on public.tool_pricing
for all using (auth.role() = 'service_role' or public.is_admin())
with check (auth.role() = 'service_role' or public.is_admin());

drop policy if exists tool_executions_select_own on public.tool_executions;
create policy tool_executions_select_own on public.tool_executions
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists tool_executions_service_write on public.tool_executions;
create policy tool_executions_service_write on public.tool_executions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists tool_usage_logs_select_own on public.tool_usage_logs;
create policy tool_usage_logs_select_own on public.tool_usage_logs
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists tool_usage_logs_service_write on public.tool_usage_logs;
create policy tool_usage_logs_service_write on public.tool_usage_logs
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists api_usage_logs_select_own on public.api_usage_logs;
create policy api_usage_logs_select_own on public.api_usage_logs
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists api_usage_logs_service_write on public.api_usage_logs;
create policy api_usage_logs_service_write on public.api_usage_logs
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
