create table if not exists public.linkedin_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'linkedin-authority-os',
  name text not null,
  audience_preset text,
  tone_preset text,
  template_preset text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.linkedin_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.linkedin_projects(id) on delete cascade,
  module_id text not null,
  title text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversion_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'conversion-copy-os',
  name text not null,
  funnel_stage text,
  emotional_angle text,
  ad_platform text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversion_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid not null references public.conversion_campaigns(id) on delete cascade,
  module_id text not null,
  variant_name text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.linkedin_projects enable row level security;
alter table public.linkedin_drafts enable row level security;
alter table public.conversion_campaigns enable row level security;
alter table public.conversion_variants enable row level security;

drop policy if exists linkedin_projects_rw_own on public.linkedin_projects;
create policy linkedin_projects_rw_own on public.linkedin_projects for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role') with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
drop policy if exists linkedin_drafts_rw_own on public.linkedin_drafts;
create policy linkedin_drafts_rw_own on public.linkedin_drafts for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role') with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
drop policy if exists conversion_campaigns_rw_own on public.conversion_campaigns;
create policy conversion_campaigns_rw_own on public.conversion_campaigns for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role') with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
drop policy if exists conversion_variants_rw_own on public.conversion_variants;
create policy conversion_variants_rw_own on public.conversion_variants for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role') with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
