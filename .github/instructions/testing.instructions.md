---
description: "Use when writing, reviewing, or fixing tests. Covers deterministic behavior tests, browser checks, mocks, and regression coverage."
applyTo: "tests/**, test/**, **/*.test.ts, **/*.spec.ts"
---

# Testing Instructions

## General Rules

- Prefer fast, deterministic tests.
- Use AAA comments: `// Arrange`, `// Act`, `// Assert`.
- Name tests `should {result} when {condition}`.
- Test behavior and regressions before implementation details.
- Prefer one clear reason to fail per test.
- Avoid random data, sleeps, timing assumptions, and shared mutable state.

## PickComponents App Testing

- Use real domain functions and services for behavior-heavy tests when setup is small.
- Mock external I/O and browser APIs with plain objects.
- Keep component tests aligned with PickComponents lifecycle behavior.
- For selector listeners, remember that `@Listen(selector, event)` is delegated from the rendered root; assert user-visible behavior, not `currentTarget` internals.
- For `pick-for` and `pick-select`, include regression coverage when changing conditional rendering or dynamic lists.

## Browser Behavior

- For user flows, prefer Playwright-style browser checks.
- Useful MVP flows:
  - add runner;
  - mass start;
  - staggered start;
  - mark finish;
  - edit recorded time;
  - undo last timing action;
  - export CSV;
  - persist and reload local session.
- Keep browser checks scoped and readable. Do not depend on arbitrary long waits.

## Commands

```bash
npm run typecheck
npm run build
```

When a test harness is added, wire it through `package.json` and document the command here and in `README.md`.
