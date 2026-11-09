# Backup & keystore preservation

The Android signing key proves every update comes from you. **If it is lost, installed apps can never be updated under the same identity.**

Files (delivered privately, never committed): `adiak-release.jks`, `adiak-release.jks.base64.txt`, `ADIAK-signing-secrets.txt` (passwords, alias, certificate SHA-256).

## One-time setup (GitHub → Settings → Secrets and variables → Actions)
`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_CERT_SHA256` — values from `ADIAK-signing-secrets.txt`. Then run **Actions → Android release → Run workflow**: it builds a signed APK + AAB and verifies the certificate.

## Keep
* Two offline copies (encrypted USB + password manager). Never email or chat the password.
* Database: confirm Supabase backups before every approved migration batch.
