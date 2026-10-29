---
name: qa-package
description: End-to-end automated QA/QC audit for a Phase 2 Work Package. Traces requirements from SRS, verifies bottom-up against Task & Package DoDs, runs live tests and benchmarks, and saves report to docs/reports/.
version: 1.0.0
requires_agents: package-qa-auditor
requires_skills: package-qa-qc, testing-patterns, verify-changes
artifact_outputs: package-qa-report
---

# /qa-package — Comprehensive Work Package QA/QC Audit

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **Activate `@package-qa-auditor`** with skill `@[skills/package-qa-qc]`.
2. **Follow Bidirectional Traceability**: Forward Trace from WBS $\rightarrow$ Tasks $\rightarrow$ SRS, then Bottom-Up Verify SRS $\rightarrow$ Task DoD $\rightarrow$ Package DoD.
3. **Execute Live Verification**: Run the tests and benchmarks in Docker. Never assume test results without terminal log output.
4. **Author Report**: Save the finalized audit report to `docs/reports/{PKG-ID}_QA_QC_REPORT.md`.

---

## Workflow Execution Steps

```
CONTEXT:
- Target Package: $ARGUMENTS (e.g. PKG-01, PKG-02, ..., PKG-15)
- If empty: Inspect current git branch name to detect PKG-ID (e.g., feat/PKG-01 -> PKG-01).

WORKFLOW:
1. PACKAGE INGESTION:
   - Identify PKG-ID from argument or current git branch.
   - Read docs/plans/Phase_2_Work_Packages.md to extract task list and Package DoD.
   - Read docs/plans/03_phase_2_domain_features_and_business_logic.md for Task ACs and Use Case mappings.
   - Read docs/srs_v3_1_3.md for detailed Use Case specification and invariants.
   - Read docs/openapi_v3.2.3.yml and docs/database_v3.1.2_mysql.sql for contracts.

2. GIT DIFF & SCOPE AUDIT:
   - Run git diff origin/main...HEAD to identify all touched files.
   - Compare modified files against the task's declared scope.

3. EMPIRICAL EXECUTION:
   - Run feature tests in docker: docker compose exec -T app php artisan test tests/Feature/...
   - Run benchmark script if required by package NFRs.

4. 3-TIER BOTTOM-UP VERIFICATION:
   - Tier 1: SRS Use Case flow (Normal course, exceptions, invariants).
   - Tier 2: Task DoD & FormRequest validations, authorizations, composite unique constraints.
   - Tier 3: Package DoD, API envelope, OpenAPI route & schema conformance, downstream DAG readiness.

5. REPORT GENERATION:
   - Compile comprehensive report according to the package-qa-qc template.
   - Save to docs/reports/{PKG-ID}_QA_QC_REPORT.md.
   - Provide executive summary and verdict (PASS / REJECT) with actionable checkboxes to user.
```

