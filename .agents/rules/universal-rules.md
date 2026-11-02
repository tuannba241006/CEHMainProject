---
name: universal-rules
version: 1.0.0
priority: P0
trigger: always_on
---

# Universal Rules (TIER 0) - AG Kit

> Always-active rules that apply to every request, regardless of domain.

---

## 🌐 Language Handling

When user's prompt is NOT in English:

1. **Internally translate** for better comprehension
2. **Respond in user's language** - match their communication
3. **Code comments/variables** remain in English

---

## 🧹 Clean Code (Global Mandatory)

**ALL code MUST follow `@[skills/clean-code]` rules. No exceptions.**

- **Code**: Concise, direct, no over-engineering. Self-documenting.
- **Consistency**: MUST follow naming, file structure, and API Envelope conventions in `project-conventions.md`.
- **Testing**: Mandatory. Pyramid (Unit > Int > E2E) + AAA Pattern.
- **Performance**: Measure first. Adhere to current Core Web Vitals standards.
- **Infra/Safety**: 5-Phase Deployment. Verify secrets security.

---

## 🏛️ System SSOT & Schema Freeze (CampusEventHub Mandatory)

**The 4 Immutable Sources of Truth (SSOT) govern ALL implementation:**
1. `docs/srs_v3_1_3.md` — Software Requirements Specification (Use cases, business rules, flows).
2. `docs/database_v3.1.2_mysql.sql` — Authoritative 24-table 3NF schema, column names, constraints, and indexes.
3. `docs/openapi_v3.2.3.yml` — Authoritative REST endpoints, request bodies, envelopes, and status codes.
4. `docs/plans/Phase_2_Work_Packages.md` — Work package breakdown, Task ACs, and Package DoDs.

### ⛔ Schema & Architecture Immutability (Anti-Drift Guardrail):
- **FORBIDDEN:** Creating arbitrary new Eloquent models, new database tables, or altering columns in migrations that are not explicitly documented in `database_v3.1.2_mysql.sql`.
- **FORBIDDEN:** Inventing English table/column names when the database schema specifies snake_case Vietnamese (e.g. `su_kien`, `phong_hoi_truong`, `dang_ky`, `trang_thai`).
- **ESCALATION REQUIRED:** If a requirement appears to lack a column or entity, the agent **MUST STOP AND ASK THE USER**. Never solve requirements by silently mutating the database schema.

---

## 🛡️ Test Integrity & Anti-Circumvention (Soft Harness)

**ALL testing and bug fixing MUST comply with `@[rules/test-integrity-harness]`.**

- **Permission Layer**: Test specifications are FROZEN and READ-ONLY during bug fixes. Never alter test assertions or simplify test scenarios (e.g. multi-user concurrency must never be reduced to single-user spam).
- **Verification Layer**: Must verify zero diff on test files (`git diff --stat -- tests/`) and produce empirical runtime log evidence before declaring any task complete.
- **Authoring Layer**: When writing new tests, every test MUST trace back to Use Cases in `docs/srs_v3_1_3.md` and error codes in `docs/openapi_v3.2.3.yml`. Tautological / fake mock tests are strictly forbidden.

---
