-- Performans: eksik indeksler ve sayfa başına tek sorgu yapan görünümler

-- Rapor ve RLS filtreleri hareketleri firma bazında tarar
create index if not exists movements_firm_customer_idx
  on public.customer_movements (firm_id, customer_id);
create index if not exists movements_item_type_idx
  on public.customer_movements (item_type_id);

-- Ad, soyad ve telefonda "içinde geçen" arama (ilike '%...%') için trigram indeksleri
create extension if not exists pg_trgm;
create index if not exists customers_ad_trgm      on public.customers using gin (ad gin_trgm_ops);
create index if not exists customers_soyad_trgm   on public.customers using gin (soyad gin_trgm_ops);
create index if not exists customers_telefon_trgm on public.customers using gin (telefon gin_trgm_ops);

-- Müşteri listesi: müşteri + net has tek sorguda (önceden iki ayrı istek)
create or replace view public.customer_list with (security_invoker = true) as
select c.id, c.firm_id, c.ad, c.soyad, c.tc_maske, c.tc_kimlik_hash, c.telefon,
       coalesce(t.net_has, 0) as net_has
from public.customers c
left join lateral (
  select sum(m.yon * m.has_gram) as net_has
  from public.customer_movements m
  where m.customer_id = c.id
) t on true;

-- Bakiye raporu: yalnızca açık bakiyesi olan müşteriler, isimleriyle birlikte
-- (önceden tüm müşteriler ayrıca çekilip uygulamada eşleştiriliyordu)
create or replace view public.customer_balance_report with (security_invoker = true) as
select b.customer_id, c.ad, c.soyad, c.telefon,
       b.urun, b.birim, b.milyem, b.net_adet, b.net_gram, b.net_has
from public.customer_balances b
join public.customers c on c.id = b.customer_id;

revoke all on public.customer_list, public.customer_balance_report from anon;
grant select on public.customer_list, public.customer_balance_report to authenticated;
