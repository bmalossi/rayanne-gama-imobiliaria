-- Execute no SQL Editor do seu Supabase externo
-- MVP Rayanne Gama Imóveis - Schema + RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  creci text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create type public.app_role as enum ('admin', 'moderator', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null check (type in ('Apartamento', 'Casa', 'Terreno', 'Comercial', 'Cobertura')),
  transaction text not null check (transaction in ('Venda', 'Aluguel')),
  price numeric(14,2) not null check (price >= 0),
  area integer not null check (area > 0),
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  parking integer not null default 0,
  neighborhood text not null,
  city text not null,
  state text not null,
  features jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  status text not null default 'Novo' check (status in ('Novo', 'Em Contato', 'Qualificado', 'Fechado', 'Perdido')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Users can view own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles" on public.profiles
for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can view own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

create policy "Admins can manage all roles" on public.user_roles
for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can read active properties" on public.properties
for select to anon, authenticated
using (active = true or public.has_role(auth.uid(), 'admin') or auth.uid() = agent_id);

create policy "Agents create own properties" on public.properties
for insert to authenticated
with check (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));

create policy "Agents update own properties" on public.properties
for update to authenticated
using (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'))
with check (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));

create policy "Agents delete own properties" on public.properties
for delete to authenticated
using (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));

create policy "Public can create leads" on public.leads
for insert to anon, authenticated with check (true);

create policy "Agents read own leads" on public.leads
for select to authenticated
using (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));

create policy "Agents update own leads" on public.leads
for update to authenticated
using (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'))
with check (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));

create policy "Agents delete own leads" on public.leads
for delete to authenticated
using (auth.uid() = agent_id or public.has_role(auth.uid(), 'admin'));