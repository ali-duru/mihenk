# Mihenk Müşteri Defteri

Next.js 15 (App Router) + Supabase. Firma hesabıyla giriş, müşteri kaydı (TC şifreli),
kasadan alınan / emanet bırakılan ziynet eşyası hareketleri ve has bazında bakiye.

## Kurulum

1. Supabase projesinde **SQL Editor**'da `supabase/migrations/` altındaki dosyaları sırayla (0001, 0002, 0003)
   yapıştırıp çalıştırın (ya da `supabase db push`).
2. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/confirm`
3. Ortam değişkenleri:
   ```bash
   cp .env.example .env.local
   openssl rand -base64 32   # TC_ENCRYPTION_KEY
   openssl rand -base64 32   # TC_HASH_KEY
   ```
4. `npm install && npm run dev`

## Nasıl çalışır

- **Kayıt**: `/kayit` ekranında firma adı ile hesap açılır. `auth.users` tetikleyicisi firmayı,
  sahip üyeliğini ve varsayılan ürün türlerini (bilezik, çeyrek, yarım, tam…) oluşturur.
- **Yetki**: Her tabloda RLS açık; kullanıcı yalnızca `current_firm_id()` ile eşleşen satırları
  görür. Super admin rolüne bu tablolarda politika yok. Service role anahtarı projede hiç kullanılmıyor.
- **TC kimlik no**: Sunucuda AES-256-GCM ile şifrelenir, anahtar veritabanında değil ortam
  değişkenindedir. Tekillik ve arama HMAC özetiyle yapılır; listede maske (`12*******34`) görünür.
- **Hareketler**: Değiştirilemez ve silinemez. Adetli üründe gram, veritabanında
  `adet × birim_gram` olarak hesaplanır; has = gram × milyem / 1000.
  Bakiye > 0 ise müşteri borçlu, < 0 ise firma borçlu (müşterinin emaneti var).

## Sonraki adımlar

- Müşteri kaydında yalnızca ad ve soyad zorunlu; TC, telefon, adres ve açıklama isteğe bağlı (`0002` migration)
- Müşteri düzenleme ekranı (RLS update politikası hazır)
- Personel daveti (üyelik `firm_members`'a sahip tarafından eklenir)
- Ürün türü yönetimi (yalnızca sahip; politika hazır)
- TC görüntüleme işlemleri için erişim günlüğü (KVKK)

## Performans notları

- Middleware ve layout oturumu `getClaims()` ile yerelde doğrular. Bunun hızlı olması için
  Supabase'de **JWT Signing Keys** (asimetrik anahtar) açık olmalı; eski HS256 gizli anahtarında
  getClaims her istekte Auth sunucusuna gider.
- Hızı her zaman `npm run build && npm start` ile ölçün. `next dev` sayfaları ilk açılışta derler.
- Vercel kullanılıyorsa fonksiyon bölgesi Supabase projesiyle aynı bölgede olmalı.
