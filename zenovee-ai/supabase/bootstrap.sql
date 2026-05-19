-- Supabase bootstrap for Zenovee AI (production persistence)
-- Includes schema, constraints, indexes, RLS, role-based policies, and realtime publication.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utility functions
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

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
      and u.status = 'ACTIVE'
  );
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'BANNED')),
  plan text not null default 'starter',
  credits_balance integer not null default 0 check (credits_balance >= 0),
  avatar_url text,
  signup_date timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan_name text not null,
  plan_id text generated always as (plan_name) stored,
  status text not null check (status in ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
  renewal_date timestamptz,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
  razorpay_subscription_id text unique,
  current_period_end timestamptz,
  next_renewal_at timestamptz,
  last_payment_at timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  pending_plan_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  credits_added integer not null default 0,
  credits_consumed integer not null default 0,
  remaining_balance integer not null default 0 check (remaining_balance >= 0),
  balance integer generated always as (remaining_balance) stored,
  reset_date timestamptz,
  reset_interval text default 'monthly' check (reset_interval in ('weekly', 'monthly', 'quarterly', 'yearly', 'none')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_credits_user_created on public.credits(user_id, created_at desc);

create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  tool_name text not null,
  credits_consumed integer not null default 0,
  cost integer generated always as (credits_consumed) stored,
  ai_model text,
  provider text,
  generation_duration_ms integer,
  input jsonb not null,
  output jsonb not null,
  api_cost numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_usage_id uuid references public.tool_usage(id) on delete set null,
  tool_id text,
  prompt text,
  output text,
  exports jsonb,
  storage_path text,
  file_type text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payment_amount numeric(12,2) not null,
  amount numeric(12,2) generated always as (payment_amount) stored,
  plan text not null,
  status text not null check (status in ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CREDIT_TOPUP')),
  currency text not null default 'INR',
  invoice_id text,
  razorpay_transaction_id text,
  razorpay_payment_id text generated always as (razorpay_transaction_id) stored,
  order_id text,
  subscription_id text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  action text not null,
  credit_change integer,
  ban_state text,
  manual_adjustment jsonb,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  provider text not null,
  model text not null,
  token_usage integer not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer generated always as (token_usage) stored,
  cost numeric(12,6) not null default 0,
  failure_count integer not null default 0,
  status text not null default 'success' check (status in ('success', 'failed')),
  latency_ms integer,
  request_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  issue text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abuse_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  ip_address text,
  category text not null,
  score numeric(10,4) not null,
  details jsonb,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Compatibility tables already used by app logic.
create table if not exists public.billing_plans (
  app_plan_id text primary key,
  razorpay_plan_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  user_id uuid references public.users(id) on delete set null,
  subscription_id text,
  payment_id text,
  payload jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  ip_address text not null,
  usage_class text not null,
  plan_id text not null,
  status text not null,
  prompt_chars integer not null,
  failure_reason text,
  abuse_score numeric not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_abuse_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ip_address text not null,
  flag_type text not null,
  score numeric not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_cooldowns (
  scope_key text primary key,
  reason text not null,
  cooldown_until timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.seo_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('pageview', 'conversion', 'ranking', 'traffic')),
  page_path text not null,
  referrer text,
  event_label text,
  ip_address text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_credits_updated_at on public.credits;
create trigger trg_credits_updated_at before update on public.credits
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_support_requests_updated_at on public.support_requests;
create trigger trg_support_requests_updated_at before update on public.support_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_billing_plans_updated_at on public.billing_plans;
create trigger trg_billing_plans_updated_at before update on public.billing_plans
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes for scalable queries and pagination
-- ---------------------------------------------------------------------------

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_plan on public.users(plan);
create index if not exists idx_users_last_login on public.users(last_login_at desc);

create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_renewal on public.subscriptions(renewal_date);
create index if not exists idx_subscriptions_user_updated on public.subscriptions(user_id, updated_at desc);

create index if not exists idx_tool_usage_user_created on public.tool_usage(user_id, created_at desc);
create index if not exists idx_tool_usage_tool_created on public.tool_usage(tool_id, created_at desc);

create index if not exists idx_generation_history_user_created on public.generation_history(user_id, created_at desc);
create index if not exists idx_generation_history_tool_usage on public.generation_history(tool_usage_id);

create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_status_created on public.payments(status, created_at desc);
create index if not exists idx_payments_invoice on public.payments(invoice_id);

create index if not exists idx_admin_logs_admin_created on public.admin_logs(admin_user_id, created_at desc);
create index if not exists idx_admin_logs_target_created on public.admin_logs(target_user_id, created_at desc);

create index if not exists idx_api_usage_user_created on public.api_usage(user_id, created_at desc);
create index if not exists idx_api_usage_model_created on public.api_usage(model, created_at desc);
create index if not exists idx_api_usage_status_created on public.api_usage(status, created_at desc);

create index if not exists idx_support_requests_user_status on public.support_requests(user_id, status, created_at desc);
create index if not exists idx_support_requests_status_created on public.support_requests(status, created_at desc);

create index if not exists idx_abuse_flags_user_created on public.abuse_flags(user_id, created_at desc);
create index if not exists idx_abuse_flags_reviewed_created on public.abuse_flags(reviewed, created_at desc);

create index if not exists idx_ai_request_logs_user_created on public.ai_request_logs(user_id, created_at desc);
create index if not exists idx_ai_request_logs_ip_created on public.ai_request_logs(ip_address, created_at desc);
create index if not exists idx_ai_abuse_flags_user_created on public.ai_abuse_flags(user_id, created_at desc);
create index if not exists idx_seo_analytics_events_page_created on public.seo_analytics_events(page_path, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security + policies
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credits enable row level security;
alter table public.tool_usage enable row level security;
alter table public.generation_history enable row level security;
alter table public.payments enable row level security;
alter table public.admin_logs enable row level security;
alter table public.api_usage enable row level security;
alter table public.support_requests enable row level security;
alter table public.abuse_flags enable row level security;
alter table public.billing_plans enable row level security;
alter table public.billing_events enable row level security;
alter table public.ai_request_logs enable row level security;
alter table public.ai_abuse_flags enable row level security;
alter table public.ai_cooldowns enable row level security;
alter table public.seo_analytics_events enable row level security;

-- users
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select using (auth.uid() = id or public.is_admin());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
for insert with check (auth.uid() = id or public.is_admin());

-- subscriptions
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
for select using (auth.uid() = user_id or public.is_admin());

-- credits
drop policy if exists credits_select_own on public.credits;
create policy credits_select_own on public.credits
for select using (auth.uid() = user_id or public.is_admin());

-- tool usage
drop policy if exists tool_usage_select_own on public.tool_usage;
create policy tool_usage_select_own on public.tool_usage
for select using (auth.uid() = user_id or public.is_admin());

-- generation history
drop policy if exists generation_history_select_own on public.generation_history;
create policy generation_history_select_own on public.generation_history
for select using (auth.uid() = user_id or public.is_admin());

-- payments
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
for select using (auth.uid() = user_id or public.is_admin());

-- api usage
drop policy if exists api_usage_select_own on public.api_usage;
create policy api_usage_select_own on public.api_usage
for select using (auth.uid() = user_id or public.is_admin());

-- support requests
drop policy if exists support_requests_select_own on public.support_requests;
create policy support_requests_select_own on public.support_requests
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists support_requests_insert_own on public.support_requests;
create policy support_requests_insert_own on public.support_requests
for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists support_requests_update_own on public.support_requests;
create policy support_requests_update_own on public.support_requests
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

-- abuse flags
drop policy if exists abuse_flags_select_own on public.abuse_flags;
create policy abuse_flags_select_own on public.abuse_flags
for select using (auth.uid() = user_id or public.is_admin());

-- admin logs (admins only)
drop policy if exists admin_logs_admin_only on public.admin_logs;
create policy admin_logs_admin_only on public.admin_logs
for all using (public.is_admin())
with check (public.is_admin());

-- internal/protection logs
drop policy if exists ai_request_logs_select_own on public.ai_request_logs;
create policy ai_request_logs_select_own on public.ai_request_logs
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_abuse_flags_select_own on public.ai_abuse_flags;
create policy ai_abuse_flags_select_own on public.ai_abuse_flags
for select using (auth.uid() = user_id or public.is_admin());

-- billing events/plans/cooldowns are admin readable only
drop policy if exists billing_plans_admin_only on public.billing_plans;
create policy billing_plans_admin_only on public.billing_plans
for select using (public.is_admin());

drop policy if exists billing_events_select_admin_or_owner on public.billing_events;
create policy billing_events_select_admin_or_owner on public.billing_events
for select using (public.is_admin() or auth.uid() = user_id);

drop policy if exists ai_cooldowns_admin_only on public.ai_cooldowns;
create policy ai_cooldowns_admin_only on public.ai_cooldowns
for select using (public.is_admin());

drop policy if exists seo_analytics_events_admin_only on public.seo_analytics_events;
create policy seo_analytics_events_admin_only on public.seo_analytics_events
for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.subscriptions;
alter publication supabase_realtime add table public.tool_usage;
alter publication supabase_realtime add table public.api_usage;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.admin_logs;
