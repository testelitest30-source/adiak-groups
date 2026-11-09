# Sahib bələdçisi (İdarəetmə Mərkəzi)

**Admin paneli**ni (`admin/index.html`) açın və sahib hesabı ilə daxil olun.
* **Əməliyyatlar** — tələbə, müəllim, sinif, komanda sayı, son 15 dəqiqədə aktiv olanlar, gələn təqdimatlar, 24 saatdakı bildirişlər və uğursuz push-lar, profilsiz hesablar, canlı sessiyalar.
* **Təqdimatlar** — bütün siniflərin təqdimatları (idarəsi Müəllim Studiyasındadır).
* **Çatdırılma** — Android push növbəsi (növbədə / göndərildi / təkrar / uğursuz / etibarsız), aktiv cihazlar, son xətalar. Tokenlər heç vaxt göstərilmir.
* **Audit jurnalı** — püşk, təsdiq, qaytarma, qiymət, canlı düzəlişlər və platforma dəyişiklikləri, səbəbi ilə birlikdə.
* **Platforma** *(yalnız sahib)* — funksiya açarları (Təqdimat Mərkəzi, canlı rejim, tapşırıqlar, Android push, texniki xidmət rejimi və mesajı) və sahibliyin ötürülməsi. Hər dəyişiklik audit olunur.
* **Diaqnostika** *(yalnız sahib)* — fon işləri (pg_cron), yaddaş, xətalar, miqrasiyalar, profili olmayan hesablar (silinmir), yığım versiyası.
* Köhnə bölmələr (İnsanlar, Qruplar, Siniflər, Taglar, Çatlar, Parollar, Günü bağla, İdxal, Ayarlar) əvvəlki kimi işləyir.
Ehtiyat nüsxələr Supabase panelində (Database → Backups) idarə olunur.
