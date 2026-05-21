create table if not exists public.brand_studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'ai-brand-studio',
  name text not null,
  style_preset text,
  design_system_preset text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_studio_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.brand_studio_projects(id) on delete cascade,
  asset_type text not null,
  model_provider text not null default 'togetherai' check (model_provider in ('togetherai','flux','sdxl')),
  model_name text not null,
  prompt text not null,
  before_reference text,
  output_reference text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'generated' check (status in ('generated','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_studio_gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  generation_id uuid not null references public.brand_studio_generations(id) on delete cascade,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_brand_studio_projects_updated_at on public.brand_studio_projects;
create trigger trg_brand_studio_projects_updated_at before update on public.brand_studio_projects for each row execute function public.set_updated_at();
drop trigger if exists trg_brand_studio_generations_updated_at on public.brand_studio_generations;
create trigger trg_brand_studio_generations_updated_at before update on public.brand_studio_generations for each row execute function public.set_updated_at();
drop trigger if exists trg_brand_studio_gallery_items_updated_at on public.brand_studio_gallery_items;
create trigger trg_brand_studio_gallery_items_updated_at before update on public.brand_studio_gallery_items for each row execute function public.set_updated_at();

alter table public.brand_studio_projects enable row level security;
alter table public.brand_studio_generations enable row level security;
alter table public.brand_studio_gallery_items enable row level security;

drop policy if exists brand_studio_projects_rw_own on public.brand_studio_projects;
create policy brand_studio_projects_rw_own on public.brand_studio_projects
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists brand_studio_generations_rw_own on public.brand_studio_generations;
create policy brand_studio_generations_rw_own on public.brand_studio_generations
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists brand_studio_gallery_items_rw_own on public.brand_studio_gallery_items;
create policy brand_studio_gallery_items_rw_own on public.brand_studio_gallery_items
for all using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
