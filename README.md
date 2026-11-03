# ADIAK Team Maker

Şagirdlər üçün komanda qurma və qrup söhbəti saytı. Saytın iki hissəsi var:

| Hissə | Ünvan | Təyinatı |
|---|---|---|
| **Şagird saytı** | `/` (`index.html`) | Giriş, qruplar, söhbət, profil |
| **Admin paneli** | `/admin/` | İnsanlar, qruplar, çatlar, gün sonu, idxal, ayarlar |

Sayt telefona **tətbiq kimi yüklənə bilər** (PWA) və internet yoxdursa açılış ekranını göstərir.
Verilənlər bazası kimi **Supabase** istifadə olunur.

---

## Qovluq quruluşu

```
adiak-groups/
├── index.html                 Şagird saytının əsas səhifəsi
├── manifest.webmanifest       PWA ayarları (ad, rəng, ikonlar)
├── sw.js                      Service worker (kökdə qalmalıdır!)
├── README.md                  Bu fayl
│
├── admin/
│   └── index.html             Admin panelinin səhifəsi
│
├── assets/
│   ├── css/
│   │   ├── style.css          Şagird saytının görünüşü
│   │   └── admin.css          Admin panelinin görünüşü
│   │
│   ├── js/
│   │   ├── shared/            İki hissənin ORTAQ faylları
│   │   │   ├── config.js      Supabase URL və açar
│   │   │   └── i18n.js        AZ / EN tərcümə mühərriki
│   │   ├── app/               Şagird saytının kodu
│   │   │   ├── core.js        Köməkçilər, vəziyyət, səslər, real vaxt məlumat
│   │   │   ├── pages.js       Ekrandakı bütün HTML (kartlar, səhifələr, profil)
│   │   │   └── main.js        Düymə əməlləri, giriş/çıxış, boot()
│   │   └── admin/             Admin panelinin kodu
│   │       ├── admin.js       Panelin əsas məntiqi
│   │       └── i18n-admin.js  Panelin tərcüməsi
│   │
│   └── icons/                 PWA ikonları (192, 512, maskable, Apple)
│
└── docs/
    └── qrcode.png             Saytın QR kodu (paylaşmaq üçün)
```

> `sw.js` və `manifest.webmanifest` **kökdə** qalmalıdır, çünki service worker yalnız
> yerləşdiyi qovluğu və onun altını idarə edə bilir.

---

## Skriptlərin yüklənmə sırası

Sıra vacibdir, dəyişdirmə.

**Şagird saytı (`index.html`):**
`config.js` → `i18n.js` → `core.js` → `pages.js` → `main.js`

**Admin paneli (`admin/index.html`):**
`config.js` → `i18n.js` → `i18n-admin.js` → `admin.js`

Hər iki səhifənin sonunda yoxlama skripti var: hansısa fayl yüklənməyibsə, boş ekran
əvəzinə çatışan faylın adını göstərir.

---

## Quraşdırma

1. Supabase layihəsinin **URL** və **anon** açarını `assets/js/shared/config.js` faylına yaz.
   *(Yalnız anon açar yazılır. `service_role` açarını bura heç vaxt yazma.)*
2. Bütün qovluğu qovluq quruluşunu dəyişmədən GitHub-a yüklə.
3. **Settings → Pages** bölməsində `main` branch-ı və `/ (root)` seçərək yayımla.

Yerli yoxlama üçün (service worker `file://` ilə işləmir):

```bash
python3 -m http.server 8000
# Şagird saytı: http://localhost:8000/
# Admin paneli: http://localhost:8000/admin/
```

---

## Dəyişiklik edərkən

| Nəyi dəyişmək istəyirsən | Hansı fayl |
|---|---|
| Rənglər, kartlar, animasiyalar | `assets/css/style.css` (admin üçün `admin.css`) |
| Ekrandakı HTML və səhifələr | `assets/js/app/pages.js` |
| Düymələrin əməlləri, giriş/çıxış | `assets/js/app/main.js` |
| Yeni mətn / tərcümə | `assets/js/shared/i18n.js` (admin üçün `i18n-admin.js`) |
| Supabase ayarları | `assets/js/shared/config.js` |
| Tətbiqin adı, ikonu, rəngi | `manifest.webmanifest` |

**Yeni tərcümə əlavə etmək:** kodda mətni `tr("English mətn")` ilə yaz, azərbaycancasını
`i18n.js` içindəki AZ lüğətinə əlavə et.

**Service worker keşi:** `sw.js` içindəki fayl siyahısını (`SHELL`) dəyişəndə və ya yeni fayl
əlavə edəndə `V = "adiak-v2"` dəyərini artır (`adiak-v3` və s.), köhnə keş silinsin.

---

## Qeydlər

- Supabase kitabxanası CDN-dən yüklənir, ona görə ilk açılışda internet lazımdır.
- `sw.js` həmişə əvvəlcə internetdən yükləyir (yeni versiya dərhal görünür), internet yoxdursa
  yaddaşdakı surəti göstərir. Başqa mənbələrə (Supabase və s.) toxunmur.
- Admin panelində hər əməliyyat bazada ayrıca yetki ilə qorunur; panel yalnız lazım olan
  düymələri göstərir.
