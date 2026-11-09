# ADIAK 1.0 release checklist

- [ ] Supabase backup confirmed (Dashboard → Database → Backups)
- [ ] `tests/db/parity.sql` on production matches the baseline fingerprints
- [ ] Batch A applied → verify + advisors · M6 · Batch C + M9 · Batch B (pg_cron)
- [ ] Public sign-up disabled (Authentication → Sign In / Providers)
- [ ] `push-fcm` deployed; Delivery panel shows a successful test send
- [ ] Signing secrets added; `Android release` run green, certificate SHA-256 as expected
- [ ] Local suites green: `node tests/smoke.mjs`, `tokens-check`, `screens`, `intro`, `pres-ui`, `live-ui`, `studio-ui`, `control-ui`, `tests/edge/push-fcm.test.mjs`, `tests/db/run.sh`, `rollback.sh`, `tests/cli/markers.sh`
- [ ] Device check on Samsung S25 (`android-device-checklist.md`)
- [ ] PR merged to `main` (owner) · tag `v1.0.0` · GitHub Release published
