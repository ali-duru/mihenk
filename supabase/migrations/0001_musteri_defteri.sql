-- =====================================================================
-- Mihenk: firma, kullanıcı, müşteri ve emanet/borç hareketleri
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Firmalar ve üyelik ----------
create table public.firms (
  id         uuid primary key default gen_random_uuid(),
  ad         text not null check (char_length(ad) between 2 and 120),
  created_at timestamptz not null default now()
);

create type public.firm_role as enum ('sahip', 'personel');

create table public.firm_members (
  firm_id    uuid not null references public.firms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rol        public.firm_role not null default 'personel',
  ad_soyad   text,
  created_at timestamptz not null default now(),
  primary key (firm_id, user_id)
);
-- Bir kullanıcı tek firmaya bağlı (current_firm_id bunu varsayar)
create unique index firm_members_user_uq on public.firm_members(user_id);

create or replace function public.current_firm_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select firm_id from public.firm_members where user_id = auth.uid()
$$;

create or replace function public.is_firm_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.firm_members
    where user_id = auth.uid() and rol = 'sahip'
  )
$$;

revoke all on function public.current_firm_id() from public, anon;
revoke all on function public.is_firm_owner()  from public, anon;
grant execute on function public.current_firm_id() to authenticated;
grant execute on function public.is_firm_owner()  to authenticated;

-- ---------- Müşteriler ----------
-- TC kimlik no uygulama tarafında AES-256-GCM ile şifrelenir; anahtar
-- veritabanında durmaz. Arama/tekillik için ayrı HMAC özeti tutulur.
create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  firm_id        uuid not null default public.current_firm_id()
                   references public.firms(id) on delete restrict,
  ad             text not null check (char_length(ad) between 1 and 80),
  soyad          text not null check (char_length(soyad) between 1 and 80),
  tc_kimlik_enc  text not null,
  tc_kimlik_hash text not null,
  tc_maske       text not null,
  telefon        text,
  adres          text,
  created_by     uuid default auth.uid() references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (firm_id, tc_kimlik_hash),
  unique (id, firm_id)
);
create index customers_firm_name_idx on public.customers (firm_id, soyad, ad);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- ---------- Ürün türleri ----------
create type public.birim as enum ('gram', 'adet');

create table public.item_types (
  id                uuid primary key default gen_random_uuid(),
  firm_id           uuid not null default public.current_firm_id()
                      references public.firms(id) on delete cascade,
  ad                text not null,
  birim             public.birim not null,
  varsayilan_milyem smallint not null check (varsayilan_milyem between 1 and 1000),
  birim_gram        numeric(10,3),
  aktif             boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (firm_id, ad),
  unique (id, firm_id),
  check ((birim = 'adet' and birim_gram > 0) or (birim = 'gram' and birim_gram is null))
);

-- ---------- Hareketler (defter) ----------
-- kasadan_alis   : müşteri kasadan mal aldı        -> müşteri borçlanır (+)
-- alis_iadesi    : müşteri aldığını geri getirdi    -> müşterinin borcu azalır (-)
-- emanet_birakma : müşteri firmaya emanet bıraktı   -> firma borçlanır (-)
-- emanet_iadesi  : firma emaneti müşteriye verdi    -> firmanın borcu azalır (+)
-- Bakiye > 0: müşteri borçlu, < 0: firma borçlu (müşterinin emaneti var)
create type public.hareket_tipi as enum
  ('kasadan_alis', 'alis_iadesi', 'emanet_birakma', 'emanet_iadesi');

create table public.customer_movements (
  id           bigint generated always as identity primary key,
  firm_id      uuid not null default public.current_firm_id(),
  customer_id  uuid not null,
  item_type_id uuid not null,
  tip          public.hareket_tipi not null,
  milyem       smallint not null check (milyem between 1 and 1000),
  adet         integer check (adet > 0),
  gram         numeric(12,3) not null check (gram > 0),
  has_gram     numeric(12,3) generated always as (round(gram * milyem / 1000.0, 3)) stored,
  yon          smallint generated always as (
                 case when tip in ('kasadan_alis', 'emanet_iadesi') then 1 else -1 end
               ) stored,
  aciklama     text check (char_length(aciklama) <= 500),
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  -- Müşteri ve ürün türü mutlaka aynı firmaya ait olmalı
  foreign key (customer_id, firm_id)  references public.customers(id, firm_id)  on delete restrict,
  foreign key (item_type_id, firm_id) references public.item_types(id, firm_id) on delete restrict
);
create index movements_customer_idx on public.customer_movements (customer_id, created_at desc);

create or replace function public.movement_before_insert()
returns trigger language plpgsql set search_path = '' as $$
declare t record;
begin
  select birim, birim_gram, varsayilan_milyem into t
  from public.item_types where id = new.item_type_id and firm_id = new.firm_id;
  if not found then raise exception 'Ürün türü bulunamadı'; end if;

  new.milyem := coalesce(new.milyem, t.varsayilan_milyem);

  if t.birim = 'adet' then
    if new.adet is null then raise exception 'Adetli üründe adet zorunlu'; end if;
    new.gram := round(new.adet * t.birim_gram, 3);   -- gram sunucuda hesaplanır
  else
    new.adet := null;
    if new.gram is null then raise exception 'Gram zorunlu'; end if;
  end if;

  new.created_by := coalesce(auth.uid(), new.created_by);
  new.created_at := now();
  return new;
end $$;

create trigger movements_before_insert before insert on public.customer_movements
  for each row execute function public.movement_before_insert();

-- ---------- Bakiye görünümleri ----------
create view public.customer_balances with (security_invoker = true) as
select m.firm_id, m.customer_id, m.item_type_id, t.ad as urun, t.birim, m.milyem,
       sum(m.yon * coalesce(m.adet, 0)) as net_adet,
       sum(m.yon * m.gram)              as net_gram,
       sum(m.yon * m.has_gram)          as net_has
from public.customer_movements m
join public.item_types t on t.id = m.item_type_id
group by m.firm_id, m.customer_id, m.item_type_id, t.ad, t.birim, m.milyem
having sum(m.yon * m.gram) <> 0;

create view public.customer_has_totals with (security_invoker = true) as
select customer_id, sum(yon * has_gram) as net_has
from public.customer_movements
group by customer_id;

-- ---------- Yeni kullanıcı: firma + sahip üyeliği + varsayılan ürünler ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_firm uuid;
begin
  if coalesce(trim(new.raw_user_meta_data->>'firma_adi'), '') = '' then
    return new;  -- davetle eklenen personel: üyelik ayrıca tanımlanır
  end if;

  insert into public.firms (ad) values (trim(new.raw_user_meta_data->>'firma_adi'))
  returning id into v_firm;

  insert into public.firm_members (firm_id, user_id, rol, ad_soyad)
  values (v_firm, new.id, 'sahip', nullif(trim(new.raw_user_meta_data->>'ad_soyad'), ''));

  insert into public.item_types (firm_id, ad, birim, varsayilan_milyem, birim_gram) values
    (v_firm, '22 ayar bilezik',    'gram', 916, null),
    (v_firm, '22 ayar takı',       'gram', 916, null),
    (v_firm, '14 ayar takı',       'gram', 585, null),
    (v_firm, '24 ayar gram altın', 'gram', 995, null),
    (v_firm, 'Çeyrek altın',       'adet', 916, 1.750),
    (v_firm, 'Yarım altın',        'adet', 916, 3.500),
    (v_firm, 'Tam altın',          'adet', 916, 7.000),
    (v_firm, 'Cumhuriyet altını',  'adet', 916, 7.216);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.firms              enable row level security;
alter table public.firm_members       enable row level security;
alter table public.customers          enable row level security;
alter table public.item_types         enable row level security;
alter table public.customer_movements enable row level security;

create policy firms_select on public.firms for select to authenticated
  using (id = (select public.current_firm_id()));
create policy firms_update on public.firms for update to authenticated
  using (id = (select public.current_firm_id()) and (select public.is_firm_owner()))
  with check (id = (select public.current_firm_id()));

create policy members_select on public.firm_members for select to authenticated
  using (firm_id = (select public.current_firm_id()));

create policy customers_select on public.customers for select to authenticated
  using (firm_id = (select public.current_firm_id()));
create policy customers_insert on public.customers for insert to authenticated
  with check (firm_id = (select public.current_firm_id()));
create policy customers_update on public.customers for update to authenticated
  using (firm_id = (select public.current_firm_id()))
  with check (firm_id = (select public.current_firm_id()));

create policy item_types_select on public.item_types for select to authenticated
  using (firm_id = (select public.current_firm_id()));
create policy item_types_insert on public.item_types for insert to authenticated
  with check (firm_id = (select public.current_firm_id()) and (select public.is_firm_owner()));
create policy item_types_update on public.item_types for update to authenticated
  using (firm_id = (select public.current_firm_id()) and (select public.is_firm_owner()))
  with check (firm_id = (select public.current_firm_id()));

create policy movements_select on public.customer_movements for select to authenticated
  using (firm_id = (select public.current_firm_id()));
create policy movements_insert on public.customer_movements for insert to authenticated
  with check (firm_id = (select public.current_firm_id()) and created_by = (select auth.uid()));

-- Hareketler değiştirilemez/silinemez: düzeltme ters kayıtla yapılır
revoke all on public.firms, public.firm_members, public.customers,
              public.item_types, public.customer_movements from anon;
revoke all on public.customer_balances, public.customer_has_totals from anon;
revoke update, delete, truncate on public.customer_movements from authenticated;
revoke delete, truncate on public.customers, public.firm_members from authenticated;
grant select on public.customer_balances, public.customer_has_totals to authenticated;
