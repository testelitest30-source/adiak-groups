# ADIAK Team Maker

Şagirdlər üçün komanda qurma və qrup söhbəti saytı. Saytın iki hissəsi var:

| Hissə | Ünvan | Təyinatı |
|---|---|---|
| **Şagird saytı** | `/` (`index.html`) | Giriş, qruplar, söhbət, profil |
| **Admin paneli** | `/admin/` | İnsanlar, qruplar, çatlar, gün sonu, idxal, ayarlar |

Sayt telefona **tətbiq kimi yüklənə bilər** (PWA) və internet yoxdursa açılış ekranını göstərir.
Verilənlər bazası kimi **Supabase** istifadə olunur.

---

## Yeniliklər

Hamısı brauzer tərəfindədir, **verilənlər bazasında heç nə dəyişmir** (Supabase-ə əlavə SQL lazım deyil).

### Görünüş və rahatlıq
- **Mövzu seçimi:** Avtomatik / Açıq / Tünd. Yan menyudakı 🌓 düyməsi və Ayarlar vasitəsilə dəyişir, seçim yadda qalır.
- **Telefonda alt menyu:** Ana səhifə, Qruplar, Çat, Müraciətlər, Menyu. Oxunmamış say nişanları var, klaviatura açılanda gizlənir.
- **Ümumi axtarış (Ctrl+K və ya `/`):** şəxs, qrup, səhifə və əməliyyat tapır (`eli` yazanda `Əli` də tapılır). Telefonda menyudan açılır.
- **Klaviatura:** `Esc` ən üstdəki pəncərəni bağlayır.
- **Oflayn xəbərdarlığı:** internet kəsiləndə yuxarıda xəbərdarlıq çıxır.

### Oyunlaşdırma
- **Liderlər podiumu** və **Həftənin ulduzu** (son 7 gündə ən çox xal qazanan).
- **10 medal:** ilk xal, rütbələr, təqdimat sayı, yüksək bal, komanda, kapitan, sinif podiumu. Ana səhifədə və profildə görünür.
- **Növbəti rütbəyə nə qədər xal qalıb** məlumatı və **rütbə artanda bayram effekti**.
- **Xal qrafiki** profil pəncərəsində.
- **Komanda statistikası:** komanda xalı, orta xal və komandalar arasında yer.

### Qruplar və çat
- **Qruplar:** qrup adı və ya üzv adı ilə axtarış, "Boş yeri olanlar" / "Mənim" filtrləri.
- **Çat:** yarımçıq yazılan mesaj qaralama kimi saxlanır, `@ad` qeydləri rənglənir (qeyd olunanda bildiriş gəlir), "Yeni mesajlar" xətti, "aşağı" düyməsi, çat siyahısında axtarış, şəkil böyüdücü.
- Yuxarı sürüşdürüb köhnə mesajlara baxanda səhifə artıq özbaşına aşağı atmır.
- Çat pəncərəsi ekranın hündürlüyünə uyğunlaşır (əvvəl sabit 300 px idi).

### Alətlər səhifəsi 🧰
- **Təqdimat taymeri:** 3/5/7/10/15 dəq, ±1 dəq, son dəqiqədə rəng dəyişir, bitəndə siqnal və titrəmə. Başqa səhifəyə keçəndə yuxarıda kiçik taymer görünür, ekran sönmür.
- **Təsadüfi seçim:** qrup, bütün sinif və ya qrupsuzlar arasından. "Seçilmişləri keç" seçimi və **təsadüfi çıxış sırası** (surəti kopyalamaq olar).

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
│   │   ├── style.css          Şagird saytının əsas görünüşü
│   │   ├── features.css       Yeni funksiyaların görünüşü (mövzu, alt menyu, podium, alətlər...)
│   │   └── admin.css          Admin panelinin görünüşü
│   │
│   ├── js/
│   │   ├── shared/            İki hissənin ORTAQ faylları
│   │   │   ├── config.js      Supabase URL və açar
│   │   │   └── i18n.js        AZ / EN tərcümə mühərriki
│   │   ├── app/               Şagird saytının kodu
│   │   │   ├── core.js        Köməkçilər, vəziyyət, səslər, real vaxt məlumat
│   │   │   ├── pages.js       Ekrandakı bütün HTML (kartlar, səhifələr, profil)
│   │   │   ├── extras.js      Yeni funksiyalar (mövzu, axtarış, medallar, alətlər, çat əlavələri)
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
`config.js` → `i18n.js` → `core.js` → `pages.js` → `extras.js` → `main.js`

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
| Rənglər, kartlar, animasiyalar | `assets/css/style.css` (yeni funksiyalar: `features.css`, admin: `admin.css`) |
| Ekrandakı HTML və səhifələr | `assets/js/app/pages.js` |
| Düymələrin əməlləri, giriş/çıxış | `assets/js/app/main.js` |
| Mövzu, axtarış, medallar, taymer, təsadüfi seçim | `assets/js/app/extras.js` |
| Yeni mətn / tərcümə | `assets/js/shared/i18n.js` (admin üçün `i18n-admin.js`) |
| Supabase ayarları | `assets/js/shared/config.js` |
| Tətbiqin adı, ikonu, rəngi | `manifest.webmanifest` |

**Yeni tərcümə əlavə etmək:** kodda mətni `tr("English mətn")` ilə yaz, azərbaycancasını
`i18n.js` içindəki AZ lüğətinə əlavə et.

**Service worker keşi:** `sw.js` içindəki fayl siyahısını (`SHELL`) dəyişəndə və ya yeni fayl
əlavə edəndə `V = "adiak-v3"` dəyərini artır (`adiak-v4` və s.), köhnə keş silinsin.

---

## Qeydlər

- Supabase kitabxanası CDN-dən yüklənir, ona görə ilk açılışda internet lazımdır.
- `sw.js` həmişə əvvəlcə internetdən yükləyir (yeni versiya dərhal görünür), internet yoxdursa
  yaddaşdakı surəti göstərir. Başqa mənbələrə (Supabase və s.) toxunmur.
- Admin panelində hər əməliyyat bazada ayrıca yetki ilə qorunur; panel yalnız lazım olan
  düymələri göstərir.
