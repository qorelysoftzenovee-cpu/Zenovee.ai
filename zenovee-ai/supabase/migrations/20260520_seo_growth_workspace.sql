create table if not exists public.seo_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'seo-growth-os',
  name text not null,
  primary_topic text not null,
  target_market text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  cluster_name text not null,
  intent text,
  keywords jsonb not null default '[]'::jsonb,
  priority integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_article_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  cluster_id uuid references public.seo_keyword_clusters(id) on delete set null,
  title text not null,
  slug text,
  outline_markdown text,
  faq_schema jsonb not null default '[]'::jsonb,
  internal_links jsonb not null default '[]'::jsonb,
  status text not null default 'planned' check (status in ('planned','drafting','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_seo_projects_updated_at on public.seo_projects;
create trigger trg_seo_projects_updated_at before update on public.seo_projects for each row execute function public.set_updated_at();
drop trigger if exists trg_seo_keyword_clusters_updated_at on public.seo_keyword_clusters;
create trigger trg_seo_keyword_clusters_updated_at before update on public.seo_keyword_clusters for each row execute function public.set_updated_at();
drop trigger if exists trg_seo_article_plans_updated_at on public.seo_article_plans;
create trigger trg_seo_article_plans_updated_at before update on public.seo_article_plans for each row execute function public.set_updated_at();

alter table public.seo_projects enable row level security;
alter table public.seo_keyword_clusters enable row level security;
alter table public.seo_article_plans enable row level security;

drop policy if exists seo_projects_rw_own on public.seo_projects;
create policy seo_projects_rw_own on public.seo_projects
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists seo_keyword_clusters_rw_own on public.seo_keyword_clusters;
create policy seo_keyword_clusters_rw_own on public.seo_keyword_clusters
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists seo_article_plans_rw_own on public.seo_article_plans;
create policy seo_article_plans_rw_own on public.seo_article_plans
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
