# Inehsit Site — Kurulum ve Google Ads Rehberi

## Dosya Yapısı
- index.html — Ana landing page (Ürün Tanıtım + Proje Tanıtım)
- hediye.html — Hediye Videom landing page
- tesekkur.html — Form sonrası teşekkür sayfası (Google Ads dönüşüm sayfası)
- gizlilik.html — Gizlilik politikası (Google Ads için zorunlu)
- sartlar.html — Kullanım şartları
- shared.css — Ortak stil dosyası
- shared.js — Ortak JavaScript

## Hosting'e Yükleme
Tüm dosyaları hosting'inizin public_html klasörüne yükleyin.
Domain: inehsit.io → index.html
Alt sayfa: inehsit.io/hediye → hediye.html

## Google Ads Kurulumu

### 1. Google Tag Manager (GTM) veya Direct Tag
Her sayfanın <head> içindeki yorum satırlarını aktif edin:
```
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```
AW-XXXXXXXXX yerine kendi Google Ads hesabınızın ID'sini yazın.

### 2. Dönüşüm Takibi
tesekkur.html sayfasındaki conversion snippet'i aktif edin.
Bu sayfa form gönderiminden sonra otomatik açılır (shared.js içinde yönlendirme var).

### 3. Google Ads Reklam Sayfaları
- Ürün Tanıtım reklamları → index.html#iletisim
- Proje Tanıtım reklamları → index.html#iletisim
- Hediye Video reklamları → hediye.html#siparis
- Dönüşüm sayfası → tesekkur.html

### 4. Google Ads Politika Gereksinimleri
✅ Gizlilik politikası: gizlilik.html
✅ Kullanım şartları: sartlar.html
✅ Net fiyat/hizmet açıklaması: her sayfada mevcut
✅ İletişim bilgisi: footer'da mevcut

### 5. Örnek Video Ekleme (hediye.html)
hediye.html içinde bu satırı bulun ve aktif edin:
<!-- <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe> -->
VIDEO_ID yerine YouTube video ID'sini yazın.

### 6. Gerçek Logo/Marka İsimleri
Logo şeridindeki "Marka 1...10" yazılarını gerçek marka adlarıyla değiştirin.
index.html ve hediye.html içinde "logo-pill" class'lı divleri bulun.

### 7. Form Backend
shared.js içindeki submitForm() fonksiyonuna Formspree veya n8n webhook ekleyin:
```
fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  body: JSON.stringify({ name, phone, ... }),
  headers: { 'Content-Type': 'application/json' }
});
```

## İletişim
info@inehsit.io
