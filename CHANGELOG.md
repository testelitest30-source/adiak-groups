# Changelog

butun qeydolunasi deyisiklikler buradadi
format keep a changelog tipindedi

## [Unreleased]

_yayimlanmayan deyisiklik yoxdu_

## [1.1.0] - 2026-11-06

stabillik ve gorunum duzelisleri,server terefi deyisiklik yoxdu

### Added

- svg ikonlari ve favicon
- lokal snapshot'dan suretli yuklenme (data arxaplanda sinxronizasiya olur)
- saniyede 1 mesaj atma istek limiti (istifadeci terefinde)
- medallar ucun profile'da ve home'da tablar
- telefon ve mobil ucun responsiv dizayn
- offlayn admin paneli (deyisiklik etmek ucun internet helede lazimdir)

### Changed

- dizay,rengler,ui ikonlari
- daha tutarli kenar yuvarlaqlasdirmasi ve daha yumsag kolgeler
- her defe yerine yalniz deyisikliklerde supabase sorgulari
- yalniz gorunende yuklenen cat sekilleri
- mobilde admin cedvelleri ve filtrler

### Fixed

- profili acanda artiq animasiyalar tekrarlanmir
- xos gelmisiniz/medallar arasi titreme
- baglanti problemlerinde aydin xeta idareetmesi ve yeniden cehd
- daha tehlukesiz mesaj silme/reaksiya ve admin kopyala/eksport hadiseleri
- canli sessiya yoxlanisi ve yeniden qosulma

### Removed

- home sehifesindeki suretli kecidler
- sag altda duran "yaradanlar" penceresi
- istifade olunmayan asset'ler ve cache-busting parametrleri

### Security

- admin parol kopyalama ve stiker yollari ucun tehlukesiz escaping

### Notes

- Supabase sxemi, RLS prinsipleri ve RPC funksiyalari deyisilmedi
- cat rate-limit'i istifadeci terefindedi
- lokal snapshot her istifadecide ayridir ve hesabdan cixisda silinir
- easter egg:lider taci ikonunun adi "yusf.svg"-dir
- elave qeyd:ui ikonlari hazirlamaq ucun "muse spark 1.3" modelinden,kod tamamlama ucun "deepseek v4.1 flash" modeli istifade olunub
