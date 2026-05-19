-- Production billing infrastructure migration
-- Creates/aligns billing tables for Razorpay webhook processing with idempotency.

create extension if not exists pgcrypto;

-- Ensure admin helper exists for RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'ADMIN'
      and u.status = 'ACTIVE'
  );
$$;

-- ---------------------------------------------------------------------------
-- Billing events (idempotency + audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  user_id uuid references public.users(id) on delete set null,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'processed' check (processing_status in ('processed', 'duplicate', 'ignored', 'failed')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.billing_events add column if not exists razorpay_subscription_id text;
alter table public.billing_events add column if not exists razorpay_payment_id text;
alter table public.billing_events add column if not exists processing_status text not null default 'processed';
alter table public.billing_events add column if not exists processed_at timestamptz;

create index if not exists idx_billing_events_created on public.billing_events(created_at desc);
create index if not exists idx_billing_events_user_created on public.billing_events(user_id, created_at desc);
create index if not exists idx_billing_events_subscription on public.billing_events(razorpay_subscription_id);
create index if not exists idx_billing_events_payment on public.billing_events(razorpay_payment_id);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan_name text not null,
  status text not null check (status in ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
  razorpay_subscription_id text unique,
  renewal_date timestamptz,
  current_period_end timestamptz,
  next_renewal_at timestamptz,
  last_payment_at timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  pending_plan_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions add column if not exists billing_cycle text not null default 'monthly';
alter table public.subscriptions add column if not exists renewal_date timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists next_renewal_at timestamptz;
alter table public.subscriptions add column if not exists last_payment_at timestamptz;
alter table public.subscriptions add column if not exists grace_until timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists pending_plan_id text;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_razorpay on public.subscriptions(razorpay_subscription_id);
create index if not exists idx_subscriptions_next_renewal on public.subscriptions(next_renewal_at);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payment_amount numeric(12,2) not null,
  plan text not null,
  status text not null check (status in ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CREDIT_TOPUP')),
  currency text not null default 'INR',
  invoice_id text,
  razorpay_transaction_id text,
  order_id text,
  subscription_id text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments add column if not exists payment_amount numeric(12,2);
alter table public.payments add column if not exists plan text;
alter table public.payments add column if not exists status text;
alter table public.payments add column if not exists currency text default 'INR';
alter table public.payments add column if not exists invoice_id text;
alter table public.payments add column if not exists razorpay_transaction_id text;
alter table public.payments add column if not exists order_id text;
alter table public.payments add column if not exists subscription_id text;
alter table public.payments add column if not exists failure_reason text;
alter table public.payments add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_payments_razorpay_transaction_id
  on public.payments(razorpay_transaction_id)
  where razorpay_transaction_id is not null;

create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_subscription on public.payments(subscription_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_status_created on public.payments(status, created_at desc);

-- ---------------------------------------------------------------------------
-- User credits aggregate (single row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  total_credits integer not null default 0 check (total_credits >= 0),
  used_credits integer not null default 0 check (used_credits >= 0),
  available_credits integer not null default 0 check (available_credits >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (available_credits = total_credits - used_credits)
);

create index if not exists idx_user_credits_available on public.user_credits(available_credits desc);

-- ---------------------------------------------------------------------------
-- Credit transaction ledger
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('subscription_credit', 'topup_credit', 'usage_debit', 'manual_adjustment', 'refund')),
  credits integer not null,
  balance_before integer not null,
  balance_after integer not null,
  plan_id text,
  payment_id uuid references public.payments(id) on delete set null,
  billing_event_id uuid references public.billing_events(id) on delete set null,
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (balance_after >= 0)
);

create index if not exists idx_credit_transactions_user_created on public.credit_transactions(user_id, created_at desc);
create index if not exists idx_credit_transactions_type on public.credit_transactions(transaction_type, created_at desc);
create index if not exists idx_credit_transactions_payment on public.credit_transactions(payment_id);

-- ---------------------------------------------------------------------------
-- Updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_credits_updated_at on public.user_credits;
create trigger trg_user_credits_updated_at before update on public.user_credits
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.billing_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_credits_select_own on public.user_credits;
create policy user_credits_select_own on public.user_credits
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists credit_transactions_select_own on public.credit_transactions;
create policy credit_transactions_select_own on public.credit_transactions
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists billing_events_select_admin_or_owner on public.billing_events;
create policy billing_events_select_admin_or_owner on public.billing_events
for select using (public.is_admin() or auth.uid() = user_id);

-- Service-role writes only (webhooks/backend)
drop policy if exists subscriptions_service_write on public.subscriptions;
create policy subscriptions_service_write on public.subscriptions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists payments_service_write on public.payments;
create policy payments_service_write on public.payments
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists billing_events_service_write on public.billing_events;
create policy billing_events_service_write on public.billing_events
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists user_credits_service_write on public.user_credits;
create policy user_credits_service_write on public.user_credits
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists credit_transactions_service_write on public.credit_transactions;
create policy credit_transactions_service_write on public.credit_transactions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');