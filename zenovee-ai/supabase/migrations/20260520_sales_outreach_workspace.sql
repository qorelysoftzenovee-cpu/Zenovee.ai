create table if not exists public.sales_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'sales-outreach-os',
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  goal text,
  target_segment text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid references public.sales_campaigns(id) on delete set null,
  full_name text not null,
  company text,
  title text,
  profile_url text,
  email text,
  status text not null default 'new' check (status in ('new','contacted','replied','qualified','won','lost')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid not null references public.sales_campaigns(id) on delete cascade,
  prospect_id uuid references public.sales_prospects(id) on delete cascade,
  name text not null,
  channel text not null default 'email' check (channel in ('email','linkedin','inmail')),
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sequence_id uuid not null references public.sales_sequences(id) on delete cascade,
  step_order integer not null,
  step_type text not null default 'follow_up' check (step_type in ('icebreaker','pitch','objection','follow_up','proposal','upsell')),
  subject text,
  message text,
  delay_hours integer not null default 24,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sequence_id, step_order)
);

create index if not exists idx_sales_campaigns_user_created on public.sales_campaigns(user_id, created_at desc);
create index if not exists idx_sales_prospects_user_created on public.sales_prospects(user_id, created_at desc);
create index if not exists idx_sales_sequences_user_created on public.sales_sequences(user_id, created_at desc);

drop trigger if exists trg_sales_campaigns_updated_at on public.sales_campaigns;
create trigger trg_sales_campaigns_updated_at before update on public.sales_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_sales_prospects_updated_at on public.sales_prospects;
create trigger trg_sales_prospects_updated_at before update on public.sales_prospects
for each row execute function public.set_updated_at();

drop trigger if exists trg_sales_sequences_updated_at on public.sales_sequences;
create trigger trg_sales_sequences_updated_at before update on public.sales_sequences
for each row execute function public.set_updated_at();

drop trigger if exists trg_sales_sequence_steps_updated_at on public.sales_sequence_steps;
create trigger trg_sales_sequence_steps_updated_at before update on public.sales_sequence_steps
for each row execute function public.set_updated_at();

alter table public.sales_campaigns enable row level security;
alter table public.sales_prospects enable row level security;
alter table public.sales_sequences enable row level security;
alter table public.sales_sequence_steps enable row level security;

drop policy if exists sales_campaigns_rw_own on public.sales_campaigns;
create policy sales_campaigns_rw_own on public.sales_campaigns
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists sales_prospects_rw_own on public.sales_prospects;
create policy sales_prospects_rw_own on public.sales_prospects
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists sales_sequences_rw_own on public.sales_sequences;
create policy sales_sequences_rw_own on public.sales_sequences
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists sales_sequence_steps_rw_own on public.sales_sequence_steps;
create policy sales_sequence_steps_rw_own on public.sales_sequence_steps
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
