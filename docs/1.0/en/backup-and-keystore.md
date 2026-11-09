# Backup & keystore preservation

The Android signing key proves every update comes from you. **If it is lost, installed apps can never be updated under the same identity.**

Files (delivered privately, never committed): `adiak-release.jks`, `adiak-release.jks.base64.txt`, `ADIAK-signing-secrets.txt` (passwords, alias, certificate SHA-256).

## One-time setup (GitHub → Settings → Secrets and variables → Actions)
1. Open the repository on GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Create these five secrets. The names are exact; each value comes from `ADIAK-signing-secrets.txt`:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_B64` | the **whole** content of `adiak-release.jks.base64.txt` (one long line) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password from the secrets file |
| `ANDROID_KEY_ALIAS` | `adiak` |
| `ANDROID_KEY_PASSWORD` | the key password from the secrets file |
| `ANDROID_CERT_SHA256` | `07:AC:03:5C:B0:3E:F4:35:E4:B0:E0:2E:9A:64:FD:06:AE:15:8E:E9:46:82:15:71:26:C6:E0:E2:58:5F:80:E0` |

3. The next push to the 1.0 branch (or **Actions → Android release → Run workflow** after merge) builds the signed APK + AAB, checks the certificate against `ANDROID_CERT_SHA256`, and uploads the artifact `adiak-release-…`. A GitHub Release is created only from a `v*` tag.

## Keep
* Two offline copies (encrypted USB + password manager). Never email or chat the password.
* Database: confirm Supabase backups before every approved migration batch.
