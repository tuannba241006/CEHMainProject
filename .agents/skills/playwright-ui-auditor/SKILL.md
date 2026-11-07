---
name: playwright-ui-auditor
description: Autonomous E2E UI/UX auditing, flow verification, and defect root-cause analysis using Playwright MCP. Implements the Observe-Decide-Act (ODA) loop, Stagehand-inspired semantic primitives, headless mail service inspection, and bidirectional UI-to-code traceback.
when_to_use: When conducting live browser-based QA/QC against specifications (SRS/User Stories), verifying frontend user journeys, debugging UI failures via Playwright MCP, or validating asynchronous email/notification flows.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, call_mcp_tool
version: 1.0.0
---

# Playwright UI Auditor & E2E Verification Protocol

> **Core Philosophy:** "Never guess element state. Observe semantically, act intentionally, verify deterministically, and localize defects directly to source code."

---

## 1. Architectural Foundations (The ODA Loop)

Every interaction within a web application must execute through a structured **Observe-Decide-Act-Assert (ODAA)** cycle to ensure deterministic verification and eliminate flaky steps:

```
  +-------------------------------------------------------------+
  | 1. OBSERVE                                                  |
  |    - Capture Semantic Tree via browser_snapshot             |
  |    - Check DevTools Console & Network status                |
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 2. DECIDE                                                   |
  |    - Match observation against Target Flow / Spec Step      |
  |    - Select target element by Accessible Name / Role        |
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 3. ACT                                                      |
  |    - Execute atomic MCP tool (click, type, select, key)     |
  |    - Allow event loops & framework hydration to resolve     |
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 4. ASSERT                                                   |
  |    - Verify State Mutation (DOM change, Toast, Navigation)  |
  |    - If mutated -> proceed. If failed -> trigger RCA.       |
  +-------------------------------------------------------------+
```

---

## 2. DOM Perception & Token Optimization

### 2.1. Accessibility Tree Pruning (MANDATORY)
- ❌ **FORBIDDEN:** Dumping raw HTML via `document.documentElement.outerHTML`. Raw DOMs contain tens of thousands of tokens of redundant layout CSS, SVGs, and inline bundles that quickly exhaust context windows.
- ✅ **MANDATORY:** Use `browser_snapshot`. This generates a pruned **Accessibility Tree** (Roles, Accessible Names, Disabled States, Checked States, Values), compressing pages down to ~1-3% of raw HTML size while retaining 100% of functional semantic data.

### 2.2. Deterministic Wait Protocols
- Modern SPAs (React, Vue, Svelte) hydrate asynchronously. Always allow components to settle:
  1. After navigation or route transitions: call `browser_wait_for` (state: `"visible"`, timeout: 5000ms).
  2. For animated dialogs/drawers: verify the target container is fully rendered before firing clicks.
  3. Avoid hardcoded static sleeps; use state-driven indicators (presence of loading spinners disappearing, submit button transitioning from disabled to enabled).

---

## 3. Semantic Interaction Primitives

Adopt intent-driven semantic primitives (inspired by modern agentic browser architectures such as Stagehand and Browser-use):

### 3.1. Intent-Based Acting (`act`)
- Interact with elements using human-readable semantic identifiers:
  - Buttons: Locate by exact text or `aria-label` (e.g., `"Submit Application"`, `"Approve Proposal"`).
  - Inputs: Locate by associated `<label>`, placeholder, or `name` attribute.
  - Form Submission:
    1. Inspect form inputs using `browser_snapshot`.
    2. Populate inputs sequentially using `browser_fill_form` or `browser_type`.
    3. Trigger the submission button.

### 3.2. Structured Data Extraction (`extract`)
- When verifying tables, badge statuses, ticket quotas, or summary cards:
  - Do not merely check if text exists on the page.
  - Parse the structured table row or container to ensure the target entity matches its expected column values (e.g., Entity Name $\leftrightarrow$ Status Badge $\leftrightarrow$ Role).

### 3.3. Specialized UI Component Handling
- **Modal Dialogs:** When a confirmation modal pops up, inspect the modal title and action buttons explicitly before firing the confirmation click.
- **Dynamic Dropdowns / Comboboxes:** Click the trigger element, wait for options listbox to appear in the snapshot, then select the target option.
- **Camera / QR Scanner Fallbacks:** For components requiring physical hardware (webcams, scanners), verify if the screen provides manual code input fields (e.g., ticket code entry) and exercise that path.

---

## 4. Headless Asynchronous Event & Email Verification

When an application flow triggers an asynchronous side effect (e.g., Email verification, OTP delivery, Co-host invite link, password reset):

### 4.1. Avoid Browser Navigation for Email Services
- ❌ **INEFFICIENT:** Opening a secondary browser tab to navigate a webmail GUI (such as Mailpit web UI) wastes multiple round-trip tool calls, DOM parsing tokens, and selector checks.
- ✅ **RECOMMENDED:** Query the local mail service API directly via headless script or curl.

### 4.2. Using the Mailpit Helper Script
The runtime utility script is located at:
`scripts/mailpit_helper.py`

**Usage Examples:**

1. **List recent messages for a recipient:**
   ```bash
   python .agents/skills/playwright-ui-auditor/scripts/mailpit_helper.py --to "user@example.com" --action list
   ```

2. **Extract OTP Code directly from the latest email:**
   ```bash
   python .agents/skills/playwright-ui-auditor/scripts/mailpit_helper.py --to "user@example.com" --action extract --extract-type otp
   ```

3. **Extract Verification Link from the latest email:**
   ```bash
   python .agents/skills/playwright-ui-auditor/scripts/mailpit_helper.py --to "user@example.com" --action extract --extract-type link
   ```

4. **Clear inbox before executing a test suite (State Isolation):**
   ```bash
   python .agents/skills/playwright-ui-auditor/scripts/mailpit_helper.py --action clear
   ```

*Once the link or OTP is extracted, navigate the browser directly to the link or fill the OTP input on the current page.*

---

## 5. Tri-Source Diagnostic Loop & Root Cause Analysis (RCA)

When a flow encounters an unexpected failure (e.g., button unresponsive, red error toast, unhandled crash, form validation failure):

```
+----------------------------------------------------------------------------------+
|                              TRI-SOURCE TELEMETRY                                |
|                                                                                  |
|   1. Visual / DOM State       2. DevTools Console        3. Network Telemetry    |
|   - Error Banner/Toast Text   - browser_console_messages - browser_network_reqs  |
|   - Disabled Attributes       - React crash stack trace  - Status: 4xx / 5xx     |
|   - Validation messages       - Unhandled Promises       - Request/Response Body |
+----------------------------------------------------------------------------------+
                                         |
                                         v
+----------------------------------------------------------------------------------+
|                              CODEBASE LOCALIZATION                               |
|                                                                                  |
|   1. Map active URL path -> Frontend Route table (e.g. routes.tsx / App.tsx)     |
|   2. Locate Screen / View Component file (e.g. src/screens/...)                  |
|   3. Inspect State logic, Form validation rules, and API service handler         |
|   4. If API responded with error -> Trace to Backend Controller / Request        |
+----------------------------------------------------------------------------------+
```

### 5.1. Defect Attribution Matrix

| Observation | Root Cause Domain | Primary Investigation Target |
| :--- | :--- | :--- |
| Console error `Cannot read properties of undefined` | **Frontend Runtime Bug** | Screen Component rendering logic, missing optional chaining (`?.`). |
| Red toast "Validation failed", Network `422` | **Schema / Validation Mismatch** | Form payload structure vs. API Request validation rules. |
| Network `401 Unauthorized` or `403 Forbidden` | **Auth / RBAC Failure** | Session cookie expiration, missing permission token, or route guard logic. |
| Network `409 Conflict` | **Business Invariant Conflict** | Schedule overlap, sold-out quota, duplicate unique constraint. |
| Network `500 Internal Server Error` | **Backend Service Exception** | Backend Controller / Service logic, database exception, unhandled null. |
| Click succeeds but no DOM mutation or network call | **Event Handler Bug** | Button `onClick` unbound, `e.preventDefault()` blocked, or form submit unhandled. |

---

## 6. Specification-Driven Verification (SRS / Requirements Traceability)

Every audit run must tie directly to requirements documentation:

1. **Pre-Flight Ingestion:**
   - Read the target Use Case / User Story from project documentation.
   - Extract:
     - Actor / Role permissions.
     - Preconditions (required seeded data, system state).
     - Step-by-step Normal Course.
     - Documented Alternative & Exception Courses.
2. **Execution & Evidence Capture:**
   - Execute the Normal Course. Record passing assertions.
   - Intentionally trigger at least one Boundary or Exception Course (e.g., submitting invalid input, duplicate booking, expired action).
   - Capture live evidence: Target URLs, DOM snapshots, HTTP status codes.

---

## 7. Defect Severity & Standard Reporting Template

Reports generated from audit sessions must be saved to `docs/reports/` using the following standardized schema:

```markdown
# UI/UX E2E Verification Report: [{MODULE_OR_FEATURE_NAME}]

**Audit Date:** {YYYY-MM-DD}  
**Auditor:** `ui-qa-auditor`  
**Execution Environment:** Base URL: `{BASE_URL}`, Browser: Chromium (Playwright MCP)  
**Status:** [PASS / CONDITIONAL / REJECT]

---

## 1. Specification Traceability Matrix

| Use Case ID | Scenario / Course | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- |
| `UC-XXX-01` | Normal Course | Successfully submits form and displays confirmation | As expected, modal confirmed | **PASS** |
| `UC-XXX-02` | Exception Course (Duplicate) | Rejects with warning toast | Red toast displayed, 409 caught | **PASS** |
| `UC-XXX-03` | Edge Case (Empty Input) | Highlights invalid fields | Button disabled, no error hint | **DEFECT** |

---

## 2. Defect Log & Root Cause Analysis

### [DEF-01] {Short Defect Title}
- **Severity:** `P0 (Blocker)` | `P1 (Specification Deviation)` | `P2 (Hygiene / UI Flaw)`
- **Affected Route:** `http://localhost:5173/...`
- **Component File:** `frontend/src/screens/.../Component.tsx#L45-L60`
- **Reproduction Steps:**
  1. Navigate to `...`
  2. Input `...` into field `...`
  3. Click `...`
- **Observed Behavior:** Form crashes or backend responds with `500 Internal Server Error`.
- **Telemetry Evidence:**
  - Console: `Uncaught TypeError: Cannot read properties of undefined (reading 'status')`
  - Network: `POST /api/v1/...` -> Status `422 Unprocessable Entity`
- **Root Cause Summary:** The frontend component sends field `event_date` in format `DD/MM/YYYY`, but the backend validator strictly expects `YYYY-MM-DD`.

---

## 3. Overall Verdict & Recommendations
- **Merge-Ready Gate:** `[APPROVED / BLOCKED]`
- **Key Next Steps:** {Concise list of identified fixes without prescriptive refactoring}
```
