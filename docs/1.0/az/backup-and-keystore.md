# Ehtiyat nüsxə və imza açarı

Android imza açarı hər yeniləmənin sizdən gəldiyini sübut edir. **Açar itərsə, quraşdırılmış tətbiq eyni kimliklə heç vaxt yenilənə bilməz.**

Fayllar (gizli verilir, git-ə yazılmır): `adiak-release.jks`, `adiak-release.jks.base64.txt`, `ADIAK-signing-secrets.txt`.

## Bir dəfəlik quraşdırma (GitHub → Settings → Secrets and variables → Actions)
`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_CERT_SHA256` — dəyərlər `ADIAK-signing-secrets.txt` faylındadır. Sonra **Actions → Android release → Run workflow**.

## Saxlayın
* İki oflayn nüsxə (şifrəli USB + parol meneceri). Parolu e-poçt və ya çatla göndərməyin.
* Hər təsdiqlənmiş miqrasiyadan əvvəl Supabase ehtiyat nüsxəsini yoxlayın.
