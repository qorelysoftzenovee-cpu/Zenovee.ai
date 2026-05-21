create table if not exists public.workspace_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null unique,
  visibility text not null default 'public' check (visibility in ('public','private')),
  audience_presets jsonb not null default '[]'::jsonb,
  tone_presets jsonb not null default '[]'::jsonb,
  template_presets jsonb not null default '[]'::jsonb,
  model_override text,
  prompt_override jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_configs add column if not exists model_override text;
alter table public.workspace_configs add column if not exists prompt_override jsonb not null default '{}'::jsonb;

drop trigger if exists trg_workspace_configs_updated_at on public.workspace_configs;
create trigger trg_workspace_configs_updated_at before update on public.workspace_configs
for each row execute function public.set_updated_at();

alter table public.workspace_configs enable row level security;

drop policy if exists workspace_configs_select_admin on public.workspace_configs;
create policy workspace_configs_select_admin on public.workspace_configs
for select using (public.is_admin() or auth.role() = 'service_role');

drop policy if exists workspace_configs_write_admin on public.workspace_configs;
create policy workspace_configs_write_admin on public.workspace_configs
for all using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');
