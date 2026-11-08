# Contributing to LittleSteps Web

This repository contains the React and TypeScript frontend web client for LittleSteps, powered by Vite.

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
# 1. Install exact dependencies from lockfile
npm ci

# 2. Run ESLint code quality checks
npm run lint

# 3. Run unit and DOM test suites (284 tests)
npm test

# 4. Typecheck TypeScript sources without emitting files
npm run typecheck

# 5. Build production bundle with Vite
npm run build

# 6. Start local development server
npm run dev
```

All lint errors, typecheck warnings, and failing tests must be resolved before requesting review.

---

## Pull request and branching workflow

- **Branch naming:** Create focused topic branches off an up-to-date `main`:
  - `feat/<feature-name>`: New screens, widgets, or services.
  - `fix/<bug-description>`: Bug fixes or layout corrections.
  - `docs/<topic>`: Documentation, contracts, or README updates.
  - `chore/<task>`: Tooling updates, dependency bumps, or script improvements.
- **Pull request requirements:** All changes merge into `main` via pull requests. Direct pushes to `main` are disabled.
- **Required CI checks:** Every pull request must pass the automated GitHub Actions **`Web CI/verify`** workflow (lint, unit tests, typecheck, and Vite production build).
- **Peer review:** Every pull request requires review from at least one teammate. Pull requests modifying data contracts, authentication, security rules, or AI prompts/fallbacks require an additional review from Mark.
- **Individual commits:** Each team member must author and commit from their own Git identity to maintain individual contribution records for academic evaluation.

---

## Testing standards

Tests run with Vitest (`npm test`) in the node environment by default.

- **Markup and pure logic:** Use `renderToStaticMarkup` (or plain function tests) for static rendering checks: text, ARIA roles, attributes, and conditional branches. These tests run fast without browser overhead.
- **Interactive behavior:** When tests require clicks, keyboard navigation, focus restoration, timers, or lifecycle effects, use JSDOM. Name the test file `*.dom.test.tsx`, specify `// @vitest-environment jsdom` on the first line, and use `@testing-library/react` and `@testing-library/user-event`.
- **Timer isolation:** Use fake timers only where a test explicitly models time passage, and restore real timers in `afterEach`.

---

## Frontend-specific rules and safeguards

### Environment variable security
> [!CAUTION]
> Never store secrets in `VITE_*` variables. Vite bakes all `VITE_*` environment variables directly into client-side JavaScript bundles. Any API key, private key, or credential placed in a `VITE_*` variable will be publicly visible to anyone inspecting the browser bundle.

### Child privacy and local storage
- In compliance with the Philippine Data Privacy Act of 2012 (RA 10173), never log child names, dates of birth, or private caregiver notes to browser `console.log`.
- Do not store sensitive child or caregiver data in unencrypted browser `localStorage` or `sessionStorage`.
- Always use synthetic test data when testing locally or capturing screenshots.

### Accessibility and responsive design
- Ensure UI components support keyboard navigation and visible focus rings (2px `--color-focus` ring with 2px offset from `tokens.css`).
- Verify layouts across both mobile (375px) and desktop viewports, maintaining a minimum **48 × 48 px** touch target for interactive controls.
- Provide accessible loading, empty, and error fallback states matching UI/UX spec §7 matrix.

### Feature-modular directory structure
To prevent merge conflicts across team tracks, code must follow the standard layout:
- `src/services/`: Shared external integrations (Firebase initialization, authenticated `apiFetch`, `/me`).
- `src/features/<feature-name>/`: Domain modules (`auth/`, `children/`, `today/`, `explore/`, `milestones/`, `journal/`, `this-week/`, `account/`). Each tab screen renders `ScreenHeader` from `components/layout` and never its own `<main>`.
  - Co-locate components, custom hooks, types, and unit tests inside the feature directory.
  - Expose external capabilities solely via an `index.ts` barrel export.
- `src/components/`: Reusable cross-cutting UI primitives (`common/` buttons, dialogs, chips; `layout/` app shell and navigation).
- `src/styles/`: Central design tokens (`tokens.css`) and global base styling (`main.css`).

### Styling standards (Vanilla CSS, no Tailwind)
- Do not install or use TailwindCSS.
- All UI styling uses **Vanilla CSS** referencing CSS custom properties defined in `src/styles/tokens.css` (`--color-brand-forest`, `--color-surface-canvas`, `--color-surface-card`, `--color-border-input`, `--color-text-primary`).
- Never hardcode hex colors in component styles; always reference design token variables to ensure WCAG 2.1 AA compliance.

---

## Security and rights policy

- **Vulnerability reporting:** Report any security vulnerabilities following [`SECURITY.md`](SECURITY.md).
- **Rights policy:** All Rights Reserved (Academic Evaluation Only). Public repository visibility does not grant an open-source redistribution license.
