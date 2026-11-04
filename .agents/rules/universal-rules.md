---
name: universal-rules
version: 1.1.0
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

## 🧱 Foundation-First & Anti-Bypass Principle (Respect & Reuse Existing Infrastructure)

**MANDATORY: Developers & AI Agents MUST discover, respect, and reuse existing architecture, services, clients, and dev tooling before authoring new implementations.**

### 1. Discovery Before Implementation
- Before creating or modifying any component, screen, controller, or handler, it is **MANDATORY** to survey:
  - **Service & Abstraction Layers**: Pre-existing domain services (`backend/app/Services/`), client service modules (`frontend/src/api/services/`), and shared utility classes.
  - **Communication Contracts**: OpenAPI / API contract specifications (`docs/openapi_v3.2.3.yml`) and shared contract types (`frontend/src/data/contract.ts`).
  - **Dev & Mock Tooling**: Project mock servers, database seeders, test harnesses, and fixtures.

### 2. Anti-Abandonment Guardrails
- ❌ **FORBIDDEN (Ad-hoc Network Bypasses):** Writing standalone, un-abstracted `fetch`/`axios` calls or inventing ad-hoc endpoint URLs inside view components when established service clients exist.
- ❌ **FORBIDDEN (Isolated In-Memory State as Network Substitute):** Bypassing designated API clients or mock servers by hardcoding volatile in-memory state arrays inside components, which breaks data hydration lifecycles and creates state loss on page reload.
- ❌ **FORBIDDEN (Duplication over Extension):** Creating duplicate utility classes, services, or helper routines when an existing module should be extended.

### 3. Service-First & Lifecycle Mandate
- Components presenting business domain entities MUST consume data through the established service/hook layer, enforcing explicit lifecycles with all three states: `{ data, loading, error }`.
- View components MUST remain decoupled from data-source mechanics or environment-switching flags.

---
