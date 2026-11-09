# Məlum problemlər (ADIAK 1.0 → növbəti yeniləmə)

Bu problemlər Samsung Galaxy S25 cihazında ADIAK 1.0 imzalanmış APK ilə aparılan sınaqda (2026-11-09) aşkarlanıb.
Kritik deyil; 1.0 buraxılışını gecikdirmir və növbəti yeniləmədə (1.0.1) düzəldiləcək.

| # | Problem | Təsir | Plan |
|---|---|---|---|
| 1 | **Admin/şagird sayı səhvi** — siyahı və statistikalarda adminlər şagird kimi sayılır (və ya əksinə), ona görə saylar real şagird sayı ilə üst-üstə düşmür. | Müəllim və admin yanlış rəqəm görür. | Saylarda yalnız `role = 'student'` və admin olmayan profillər hesablanacaq; admin/müəllim ayrıca göstəriləcək. |
| 2 | **Qrup siyahılarında admin adları görünmür** — qrup üzvləri siyahısında admin hesabının adı boş və ya göstərilmir. | Kimin qrupda olduğu aydın deyil. | Qrup üzvləri siyahısında bütün üzvlərin adı və rol nişanı göstəriləcək. |
| 3 | **Yeni funksiyaların yeri qarışıqdır** — Təqdimat Mərkəzi, Müəllim Studiyası, Sinif Mərkəzi və bildirişlərə keçid istifadəçi üçün kifayət qədər aydın deyil. | Yeni istifadəçilər funksiyaları tapmaqda çətinlik çəkir. | Ana səhifədə və menyuda aydın giriş nöqtələri, qısa tanıtım ipuçları. |

Hər problem GitHub-da ayrıca "issue" kimi də qeydə alınıb.
