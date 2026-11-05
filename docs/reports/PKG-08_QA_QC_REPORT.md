# QA/QC AUDIT REPORT: PKG-08 — Hạ tầng Kiosk & Soát vé HMAC

> **Target**: `fix/pkg08-kiosk-audit` vs `origin/main`; includes remediation commit `6c3aa68` and the current uncommitted fixes
> **Date**: 2026-11-05
> **SSOT**: `docs/srs_v3_1_3.md`, `docs/plans/Phase_2_Work_Packages.md`, `docs/plans/03_phase_2_domain_features_and_business_logic.md`, `docs/openapi_v3.2.3.yml`

## I. EXECUTIVE SUMMARY

| Audit Dimension | Status | Evidence |
|---|---|---|
| Core business flow | **PASS** | Staff check-out computes attendance duration/DRL; early and fallback check-out record the effective event end. |
| API contract | **PASS** | Staff-scan response and error codes match OpenAPI; staff assignment responses include required schema fields. |
| Runtime integrity | **PASS** | Participant pagination has the correct return type; expired kiosk sessions are rejected before insert. |
| RBAC and event scoping | **PARTIAL** | Unassigned staff rejection, assigned-staff event listing and staff removal are covered; negative host authorization and staff date-window boundaries need more tests. |
| Test coverage | **PARTIAL** | Focused regression tests pass; several endpoint and exception paths remain untested. |
| NFR latency | **NOT RUN** | No dedicated PKG-08 benchmark; feature-test duration is not endpoint latency evidence. |
| Package isolation | **FAIL** | The branch still includes PKG-09 attendance/self-service and manual-override files from commit `49abd9f`. |

**Verdict: CONDITIONAL.** The audited business and contract defects listed below are fixed and focused tests pass. Do not treat this as package-isolated or NFR-certified until the PKG-09 scope is separated, TOTP tolerance is reconciled, and remaining tests/benchmark are completed.

## II. TRACEABILITY & VERIFICATION

### 1. SRS and task alignment

| Requirement | Status | Evidence |
|---|---|---|
| UC-OPS-01 kiosk session and TOTP | **PASS** | Independent token, six-digit TOTP, gate controls, early checkout timestamp and scheduled fallback are implemented. |
| UC-OPS-02 HMAC staff scan | **PASS** | HMAC verification, event validation, replay protection, checkout scoring and response schema are implemented. |
| UC-OPS-05 staff assignment | **PASS** | List/assign responses serialize the required `StaffAssignment` fields. |
| UC-OPS-03/04 implementation scope | **NOT APPLICABLE** | These tasks belong to PKG-09; their presence in the PKG-08 branch is tracked as a scope finding below. |

### 2. Package DoD and downstream readiness

- The backend fallback command is scheduled independently of the kiosk client.
- Staff check-out uses shared scoring logic and returns attendance duration and DRL.
- Full-suite regression and the PKG-08 latency target have not been verified in this run.
- TOTP acceptance differs between SRS (current and previous time step) and task-plan wording (±1 step, which can include a future step); the owner of the SSOT must decide the intended window.

## III. DEFECTS & FINDINGS

### Resolved by current branch changes

1. **Staff check-out omitted duration and DRL** — now uses `AttendanceScoringService`; threshold cases are covered.
2. **Early checkout omitted actual event end** — now stores `thoi_gian_ket_thuc_thuc_te`; fallback stores the planned end and writes its audit record.
3. **Staff-scan resource and error-code mismatch** — nested student fields, scan timestamp and DRL fields follow OpenAPI; wrong-event and not-checked-in responses use documented codes.
4. **Participant-list fatal return-type error** — service now returns `LengthAwarePaginator`, matching the value consumed by its controller.
5. **Staff assignment response omitted contract fields** — list and assign responses now include `ma_su_kien`, student identity and assignment timestamp.
6. **Kiosk session could violate the expiry CHECK constraint** — start is rejected after the configured session-expiry time.

### 🟠 P1 — Package boundary / specification decisions

1. **PKG-09 scope is bundled into PKG-08**
   Commit `49abd9f` includes `SelfAttendanceController`, `AttendanceOverrideController`, `AttendanceService`, `AttendanceOverrideService`, related requests and `ParticipantAttendanceResource`. These map to `CEH-P2-OPS-03/04`; manage them in a separate package review rather than counting them as PKG-08 acceptance.
2. **TOTP tolerance is inconsistent across SSOT documents**
   SRS accepts the current and previous 30-second step; the task plan says ±1 step. Resolve the contract before changing acceptance behavior.

### 🟡 P2 — Remaining verification

1. Add negative host-authorization coverage for staff list/assignment/removal and test staff access outside the event's effective date window.
2. Add a dedicated benchmark that measures staff-scan request latency against the ≤2.0-second NFR under representative load.
3. Test the exact check-out opening boundary in addition to the existing early-rejection and early-confirmation cases.

## IV. EMPIRICAL VERIFICATION EVIDENCE

| Check Layer | Command / Method | Environment | Result | Evidence / Reason if NOT RUN |
|---|---|---|---|---|
| Focused feature and unit tests | `docker compose run --rm -e APP_ENV=testing -e DB_DATABASE=ceh_test app php artisan test tests/Feature/KioskAndAttendanceTest.php tests/Unit/CryptoServiceTest.php` | Docker, isolated `ceh_test` | **PASS** | 20 tests, 103 assertions. |
| Test database setup | `php artisan migrate --force` with `DB_DATABASE=ceh_test` | Docker, isolated `ceh_test` | **PASS** | Applied migrations to the previously empty test database; did not target `ceh`. |
| Pint | `vendor/bin/pint --test` on changed PHP files | Docker | **PASS** | All 5 changed PHP files pass. |
| Full backend suite | `php artisan test` | Docker | **NOT RUN** | Focused tests only; full suite remains unverified. |
| Frontend build/lint | Project build and lint scripts | Local | **NOT RUN** | Not rerun as part of this remediation. |
| Concurrency / NFR latency | PKG-08 benchmark | — | **NOT RUN** | No dedicated benchmark exists; test-case wall time is not latency evidence. |
| Diff whitespace | `git diff --check` | Local | **PASS** | No whitespace errors. |

## V. DUAL-GATE VERDICT

### Merge-ready gate: **CONDITIONAL**

- [x] Focused PKG-08 regressions pass on the isolated test database.
- [x] Reported runtime, response-schema and error-code defects are fixed.
- [ ] Separate or formally re-scope the PKG-09 files.
- [ ] Reconcile the TOTP tolerance in the authoritative requirements.
- [x] Run Pint and add regression coverage for authorization and gate boundaries.
- [ ] Run the full backend suite.
- [ ] Measure the staff-scan NFR with a dedicated benchmark.

### Launch-ready gate: **CONDITIONAL**

- [x] Scheduled fallback and effective event-end persistence are implemented.
- [ ] Verify scheduler configuration, rollback and data-safety procedure in the target deployment environment.
