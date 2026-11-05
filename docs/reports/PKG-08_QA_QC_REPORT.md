# QA/QC AUDIT REPORT: PKG-08 - Kiosk & HMAC Ticket Scanning

> Target: `feature/pkg-08-kiosk-hmac-scanner` vs `main`
> Date: 2026-11-05
> SSOT: `docs/srs_v3_1_3.md`, `docs/plans/03_phase_2_domain_features_and_business_logic.md`, `docs/plans/Phase_2_Work_Packages.md`, `docs/openapi_v3.2.3.yml`, `docs/database_design_v3.1.2.md`

## I. Scope and traceability

| Work item | Implemented surface | Verification target |
|---|---|---|
| CEH-P2-OPS-01 / UC-OPS-01 | Kiosk session, hashed token, RFC 6238 TOTP +/- 1 period, gate controls | Kiosk token invalid/expired, six-digit `CEH1K` payload, T-30m and T-end-25m gates |
| CEH-P2-OPS-02 / UC-OPS-02, UC-OPS-05 | Event-scoped staff assignment and HMAC QR scan | `hash_equals`, payload/event/ticket binding, row lock, duplicate scan states |
| CEH-P2-OPS-03 / UC-OPS-03 | Self check-in/out, device binding, attendance ratio | TOTP expiry, suspicious device flag, 100/50/0% DRL thresholds |
| CEH-P2-OPS-04 / UC-OPS-04 | Manual override and attendance audit trail | validation, `DRL_LOCKED`, `nhat_ky_diem_danh` persistence |

## II. Findings

### P0 - Blocker

None found after containerized runtime verification.

### P1 - Contract and integrity

None found by contract review or focused integration tests. Self-attendance accepts the OpenAPI-required `X-Device-Id` header and normalizes it into the service input.

### P2 - Non-blocking repository baseline issue

The complete Pint run still reports 18 pre-existing style violations in unrelated files, including `Pkg04DiscoveryFeatureTest.php` and `Pkg04SmartActionTest.php`. All PKG-08 files pass the focused Pint check.

## III. Evidence

- Docker Compose services: app, MySQL, Mailpit, and mock server are running; MySQL and Mailpit report healthy.
- `php artisan about`: Laravel 13.38, PHP 8.4.27, MySQL connection available, migrations clean.
- Focused Pint: all 18 PKG-08 changed PHP files pass `vendor/bin/pint --test`.
- `git diff --check`: passed before commit update.
- `php artisan route:list --path=attendance`, `--path=kiosk`, and `--path=staff/my-events`: passed and exposed root plus `/api/v1` contracts.
- `php artisan test tests/Feature/KioskAndAttendanceTest.php`: 3 passed, 11 assertions.
- `php artisan test --compact`: full backend suite completed without failures.
- Feature coverage includes rotating kiosk TOTP/token hashing, tampered HMAC rejection before ticket lookup, event scoping, and replay-safe staff scanning.

## IV. Verdict

**PKG-08 passes containerized QA/QC.** The feature branch is ready for review. The only remaining repository-level warning is the unrelated baseline Pint debt described above.
