-- Müşteri kaydında yalnızca ad ve soyad zorunlu.
-- TC kimlik no, telefon, adres ve açıklama isteğe bağlı.

alter table public.customers
  alter column tc_kimlik_enc  drop not null,
  alter column tc_kimlik_hash drop not null,
  alter column tc_maske       drop not null;

-- TC alanları ya üçü birden dolu ya da üçü birden boş olmalı
alter table public.customers
  add constraint customers_tc_tutarli check (
    (tc_kimlik_enc is null and tc_kimlik_hash is null and tc_maske is null) or
    (tc_kimlik_enc is not null and tc_kimlik_hash is not null and tc_maske is not null)
  );

-- Müşteriye serbest not
alter table public.customers
  add column if not exists aciklama text check (char_length(aciklama) <= 1000);

-- Not: unique (firm_id, tc_kimlik_hash) korunur. Postgres'te NULL değerler
-- birbirine eşit sayılmadığı için TC'siz müşteriler bu kısıta takılmaz.
