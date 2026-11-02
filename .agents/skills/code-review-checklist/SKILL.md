---
name: code-review-checklist
description: Code review guidelines covering code quality, security, and best practices.
when_to_use: "When reviewing code for quality, security, and best practices. When the user says 'review my code' or 'check this PR'."
allowed-tools: Read, Glob, Grep
version: 1.0.0
---

# Code Review Checklist

## Quick Review Checklist

### Correctness
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error handling in place
- [ ] No obvious bugs

### Security
- [ ] Input validated and sanitized
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] No XSS or CSRF vulnerabilities
- [ ] No hardcoded secrets or sensitive credentials
- [ ] **AI-Specific:** Protection against Prompt Injection (if applicable)
- [ ] **AI-Specific:** Outputs are sanitized before being used in critical sinks

### Performance
- [ ] No N+1 queries
- [ ] No unnecessary loops
- [ ] Appropriate caching
- [ ] Bundle size impact considered

### Code Quality
- [ ] Clear naming
- [ ] DRY - no duplicate code
- [ ] SOLID principles followed
- [ ] Appropriate abstraction level

### Testing
- [ ] Unit tests for new code
- [ ] Edge cases tested
- [ ] Tests readable and maintainable

### Documentation
- [ ] Complex logic commented
- [ ] Public APIs documented
- [ ] README updated if needed

## AI & LLM Review Patterns

### Logic & Hallucinations
- [ ] **Chain of Thought:** Does the logic follow a verifiable path?
- [ ] **Edge Cases:** Did the AI account for empty states, timeouts, and partial failures?
- [ ] **External State:** Is the code making safe assumptions about file systems or networks?

### Prompt Engineering Review
```markdown
// ❌ Vague prompt in code
const response = await ai.generate(userInput);

// ✅ Structured & Safe prompt
const response = await ai.generate({
  system: "You are a specialized parser...",
  input: sanitize(userInput),
  schema: ResponseSchema
});
```

## ⚔️ Adversarial Review Inquiries (Breaking AI-Generated Code)

Reviewers MUST independently challenge implementation assumptions and search for failure scenarios instead of merely verifying happy-path acceptance criteria:

1. **Counter-Examples & Boundary Breakages:**
   - What core assumptions in this implementation could be invalid?
   - Does empty input (`""`), empty array (`[]`), negative values, overflow strings, or timezone discrepancies (UTC vs Asia/Ho_Chi_Minh) cause uncaught exceptions?
2. **Concurrency & Race Collisions:**
   - If two concurrent requests arrive at the exact same millisecond, does the transaction prevent phantom bookings / seat over-allocation without deadlocking the database?
   - Is lock acquisition strictly ordered per the project invariant: `tai_khoan -> phong_hoi_truong -> dat_phong -> su_kien -> dang_ky -> hang_doi_waitlist`?
3. **Silent Failures & Swallowed Exceptions:**
   - Are there empty `try/catch` blocks or default fallbacks that mask database errors and falsely report success to the client?
   - Do `update` / `delete` operations verify affected row counts before proceeding?
4. **Tautological Tests (Mirroring Tests):**
   - Do tests genuinely assert business invariants, or do they merely mock all dependencies and mirror internal implementation details?

## Anti-Patterns to Flag

```typescript
// ❌ Magic numbers
if (status === 3) { ... }

// ✅ Named constants
if (status === Status.ACTIVE) { ... }

// ❌ Deep nesting
if (a) { if (b) { if (c) { ... } } }

// ✅ Early returns
if (!a) return;
if (!b) return;
if (!c) return;
// do work

// ❌ Long functions (100+ lines)
// ✅ Small, focused functions

// ❌ any type
const data: any = ...

// ✅ Proper types
const data: UserData = ...
```

## Review Comments Guide

```
// Blocking issues use 🔴
🔴 BLOCKING: SQL injection vulnerability here

// Important suggestions use 🟡
🟡 SUGGESTION: Consider using useMemo for performance

// Minor nits use 🟢
🟢 NIT: Prefer const over let for immutable variable

// Questions use ❓
❓ QUESTION: What happens if user is null here?
```
