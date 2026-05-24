-- Credit execution hardening: reservation lifecycle audit + stronger idempotency guardrails

create extension if not exists pgcrypto;

create table if not exists public.credit_execution_audit (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.tool_executions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  idempotency_key text,
  phase text not null check (phase in ('reserved', 'finalized', 'refunded', 'failed')),
  credit_transaction_id uuid references public.credit_transactions(id) on delete set null,
  credits integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_exec_audit_execution_created
  on public.credit_execution_audit(execution_id, created_at desc);

create index if not exists idx_credit_exec_audit_user_created
  on public.credit_execution_audit(user_id, created_at desc);

-- Prevent duplicate usage debit against the same execution reference.
create unique index if not exists uq_credit_tx_usage_debit_execution_reference
  on public.credit_transactions(user_id, execution_id, reference)
  where transaction_type = 'usage_debit' and execution_id is not null;

-- Strengthen debit idempotency: if same execution/reference already debited, return existing row.
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
  v_existing record;
begin
  if p_credits <= 0 then
    raise exception 'Credits must be > 0';
  end if;

  if p_execution_id is not null then
    select id, balance_before, balance_after
    into v_existing
    from public.credit_transactions
    where user_id = p_user_id
      and transaction_type = 'usage_debit'
      and execution_id = p_execution_id
      and reference = p_reference
    order by created_at desc
    limit 1;

    if v_existing.id is not null then
      return query select v_existing.balance_before, v_existing.balance_after, v_existing.id;
      return;
    end if;
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

alter table public.credit_execution_audit enable row level security;

drop policy if exists credit_execution_audit_select_own on public.credit_execution_audit;
create policy credit_execution_audit_select_own on public.credit_execution_audit
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists credit_execution_audit_service_write on public.credit_execution_audit;
create policy credit_execution_audit_service_write on public.credit_execution_audit
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
