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

## 🛡️ Test Integrity & Anti-Circumvention (Soft Harness)

**ALL testing and bug fixing MUST comply with `@[rules/test-integrity-harness]`.**

- **Permission Layer**: Test specifications are FROZEN and READ-ONLY during bug fixes. Never alter test assertions or simplify test scenarios (e.g. multi-user concurrency must never be reduced to single-user spam).
- **Verification Layer**: Must verify zero diff on test files (`git diff --stat -- tests/`) and produce empirical runtime log evidence before declaring any task complete.

---
