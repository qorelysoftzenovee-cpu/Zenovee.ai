-- Admin role hardening
-- Normalize roles to lowercase and provide a secure service-role promotion helper.

create extension if not exists pgcrypto;

update public.users
set role = lower(role)
where role is not null;

alter table public.users alter column role set default 'user';
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('user', 'admin'));

create index if not exists idx_users_role on public.users(role);

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

create or replace function public.promote_user_to_admin(target_email text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if auth.role() <> 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  update public.users
  set role = 'admin',
      updated_at = now()
  where lower(email) = lower(target_email)
  returning * into updated_user;

  if updated_user.id is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  return updated_user;
end;
$$;

revoke all on function public.promote_user_to_admin(text) from public;
grant execute on function public.promote_user_to_admin(text) to service_role;