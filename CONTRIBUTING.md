# Contributing to LittleSteps Web

This repository contains the React 19 and TypeScript web client for LittleSteps, powered by Vite.

For general project governance, three-tier architecture, code of conduct, and shared standards, refer to the [canonical Contributing Guidelines in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CONTRIBUTING.md).

---

## Prerequisites and environment

- **Node.js:** 22 LTS
- **npm:** 10+
- **Git:** 2.34+

Follow the full reproducible setup guide in the [Developer Onboarding Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/getting-started.md).

---

## Local verification commands

Run the full local verification suite before committing or opening a pull request:

```bash
# Install exact dependencies from lockfile
npm ci

# Run all checks (lint, typecheck, tests, and production build)
npm run verify

# Or run individual steps
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

All lint errors, typecheck errors, and failing tests must be resolved before requesting review.

---

## Pull request and branching workflow

- **Branch naming:** Create focused branches off an up-to-date `main`:
  - `feat/<feature-name>`: New screens, components, or API integrations.
  - `fix/<bug-description>`: Bug fixes or layout corrections.
  - `refactor/<scope>`: Structural modularization and DRY cleanup.
  - `docs/<topic>`: Documentation or README updates.
  - `chore/<task>`: Tooling updates or configuration changes.
- **Pull request requirements:** All changes merge into `main` via pull requests. Direct pushes to `main` are disabled.
- **Required CI checks:** Every pull request must pass the **`Web CI/verify`** workflow (lint, typecheck, production build, and tests).
- **Individual commits:** Each team member commits under their own Git identity for academic contribution tracking.

---

## Testing standards

Tests run with Vitest (`npm test`) and are organized in co-located `__tests__/` folders inside each feature, component, config, service, or style directory.

- **Unit and static markup tests (`*.test.ts` / `*.test.tsx`):** Run in Node without browser overhead for pure logic, API clients, and static SSR rendering checks.
- **Interactive DOM tests (`*.dom.test.tsx`):** Start with `// @vitest-environment jsdom`, use `@testing-library/react` and `@testing-library/user-event`, and reuse `installDialogPolyfill()` from `src/test/dialogPolyfill.ts` when testing native `<dialog>` modals.
- **Timer isolation:** Use fake timers only where time passage is explicitly tested, and restore real timers in `afterEach`.

---

## Frontend rules and safeguards

### Environment variable security
> [!CAUTION]
> Never store secrets in `VITE_*` variables. Vite embeds all `VITE_*` values directly into browser-facing bundles.

### Child privacy and local storage
- In compliance with the Philippine Data Privacy Act of 2012 (RA 10173), never log child names, dates of birth, or private caregiver notes to browser console output.
- Do not store sensitive child or journal records in unencrypted `localStorage` or `sessionStorage`.
- Always use synthetic data when testing locally or capturing screenshots.

### Accessibility and responsive design
- Maintain keyboard navigation and visible 2 px focus rings (`--color-focus` with 2 px offset) for interactive controls.
- Verify layouts across mobile (`375px`) and desktop (`1280px`) viewports with a minimum **48 × 48 px** touch target for primary controls.
- Provide explicit populated, empty, loading, error, and offline states on every data-driven screen.

### Feature-modular structure
- `src/config/`: Centralized external URLs and provenance helpers.
- `src/services/`: Authenticated API client, Firebase Auth, offline helpers, and weather hook.
- `src/components/common/` & `src/components/layout/`: Reusable design-system primitives and app shell.
- `src/features/<feature>/`: Co-located screen, sub-components, hooks, API helpers, types, and `__tests__/`.
- `src/styles/`: Tokenized stylesheets (`tokens.css` + feature sheets); avoid hardcoded hex colors or inline styles.
