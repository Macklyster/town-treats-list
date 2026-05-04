-- ============ ROLES ============
create type public.app_role as enum ('admin', 'lojista', 'consumer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles public read" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert
  with check (auth.uid() = id);

-- trigger to create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'consumer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ CATEGORIES ============
create table public.categories (
  slug text primary key,
  name text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.categories (slug, name, icon, sort_order) values
  ('alimentacao', 'Alimentação', 'UtensilsCrossed', 1),
  ('beleza-saude', 'Beleza & Saúde', 'Sparkles', 2),
  ('lojas-moda', 'Lojas & Moda', 'ShoppingBag', 3);

-- ============ PLANS ============
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_cents int not null default 0,
  stripe_price_id text,
  features jsonb not null default '[]'::jsonb,
  max_offers int not null default 5,
  featured_slots int not null default 0,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy "plans public read" on public.plans for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "admins manage plans" on public.plans for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.plans (slug, name, price_cents, features, max_offers, featured_slots, sort_order) values
  ('basico', 'Básico', 4900, '["Até 5 ofertas ativas","Página da loja","Suporte por e-mail"]'::jsonb, 5, 0, 1),
  ('destaque', 'Destaque', 9900, '["Até 15 ofertas ativas","1 vaga em Destaque","Página da loja com galeria","Suporte prioritário"]'::jsonb, 15, 1, 2),
  ('plus', 'Plus', 19900, '["Ofertas ilimitadas","3 vagas em Destaque","Banner rotativo","Relatórios mensais","Suporte dedicado"]'::jsonb, 9999, 3, 3);

-- ============ STORES ============
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  address text,
  phone text,
  whatsapp text,
  instagram text,
  logo_url text,
  cover_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.stores enable row level security;
create trigger stores_updated before update on public.stores
  for each row execute function public.set_updated_at();

create policy "approved stores public read" on public.stores for select
  using (approved = true or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owners insert stores" on public.stores for insert
  with check (owner_id = auth.uid());
create policy "owners update own store" on public.stores for update
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owners delete own store" on public.stores for delete
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ OFFERS ============
create type public.offer_status as enum ('pending', 'approved', 'rejected', 'paused');
create type public.offer_type as enum ('desconto', 'cupom', 'brinde');

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  category_slug text references public.categories(slug) not null,
  title text not null,
  type offer_type not null default 'desconto',
  image_url text,
  original_price numeric(10,2) not null default 0,
  promo_price numeric(10,2) not null default 0,
  description text,
  conditions text,
  valid_until date,
  status offer_status not null default 'pending',
  featured boolean not null default false,
  popularity int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.offers enable row level security;
create trigger offers_updated before update on public.offers
  for each row execute function public.set_updated_at();

create index offers_store_idx on public.offers(store_id);
create index offers_category_idx on public.offers(category_slug);
create index offers_status_idx on public.offers(status);

create policy "approved offers public read" on public.offers for select
  using (
    status = 'approved'
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );
create policy "owners insert offers" on public.offers for insert
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "owners update own offers" on public.offers for update
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );
create policy "owners delete own offers" on public.offers for delete
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );

-- ============ SUBSCRIPTIONS ============
create type public.subscription_status as enum ('trialing','active','past_due','canceled','incomplete','unpaid');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  plan_id uuid references public.plans(id) not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create trigger subs_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

create policy "owner read own subs" on public.subscriptions for select
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );
create policy "admins manage subs" on public.subscriptions for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));