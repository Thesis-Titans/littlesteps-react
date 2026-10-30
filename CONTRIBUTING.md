# Contributing to LittleSteps Web

This repository contains the React + TypeScript frontend web client for LittleSteps, powered by Vite.

For general project governance, three-tier architecture, code of conduct, and shared standards, refer to the [canonical Contributing Guidelines in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CONTRIBUTING.md).

---

## 1. Prerequisites

- **Node.js 22 LTS**
- **npm 10+**

Follow the full reproducible setup guide in the [Developer Onboarding Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/getting-started.md).

---

## 2. Local Verification Commands

Run the full local verification suite before committing or opening a pull request:

```bash
# 1. Install exact dependencies from lockfile
npm ci

# 2. Run ESLint
npm run lint

# 3. Run unit test suite
npm test

# 4. Typecheck TypeScript sources
npm run typecheck

# 5. Build production bundle with Vite
npm run build

# 6. Start local development server
npm run dev
```

---

## 3. Pull Request & CI Expectations

- **Branching:** Work on focused topic branches (`feat/`, `fix/`, `docs/`, `chore/`). Never push directly to `main`.
- **Required CI Check:** The GitHub Actions workflow enforces **`Web CI/verify`**, which executes linting, unit tests, typechecking, and the Vite production build.
- **Review Governance:** In the active feature execution phase, every pull request requires review and approval from at least one teammate. Pull requests modifying data contracts, authentication, security rules, or AI prompts/fallbacks require an additional review from Mark.

---

## 3a. Testing

Tests run with Vitest (`npm test`) in the node environment by default.

- **Markup and pure logic:** use `renderToStaticMarkup` (or plain function tests) for what a screen renders for a given state: text, roles, attributes, which branch shows. It is fast and needs no browser. It cannot click, focus or run effects.
- **Behaviour:** when the test needs a click, keyboard key, focus move, timer or effect (menus, dismiss buttons, focus on first error, event listeners), use the DOM environment. Name the file `*.dom.test.tsx`, put `// @vitest-environment jsdom` on its first line, import `cleanup` from `@testing-library/react` and call it in `afterEach`. Prefer `@testing-library/user-event` for real input and plain assertions over extra matcher libraries.
- Use fake timers only where a test needs time to pass, and restore real timers afterwards. Do not wait on real timers longer than a second.

## 4. Frontend-Specific Rules & Safeguards

### 4.1 Strict Environment Variable Safety
> [!CAUTION]
> **Never store secrets in `VITE_*` variables.** Vite bakes all `VITE_*` environment variables directly into client-side JavaScript bundles. Any API key, private key, or credential placed in a `VITE_*` variable will be publicly visible to anyone inspecting the browser bundle.

### 4.2 Child Privacy & Browser Storage
- Never log child names, dates of birth, or private caregiver notes to browser `console.log`.
- Do not store sensitive child or caregiver data in unencrypted browser `localStorage` or `sessionStorage`.
- Always use synthetic test data when testing locally or capturing screenshots.

### 4.3 Accessibility & Responsive Design
- Ensure UI components support keyboard navigation and visible focus rings (2px `--color-focus` ring with 2px offset, from `tokens.css`).
- Verify layouts across both mobile (375px) and desktop viewports, with minimum 48 × 48px touch targets for interactive controls.
- Always provide accessible loading, empty, and error fallback states matching the UI/UX spec §7 matrix.

### 4.4 Feature-Modular Directory Structure
To avoid merge conflicts across team tracks, code must follow the standard layout documented in [README.md](README.md):
- `src/services/`: Shared external integrations (Firebase initialization, authenticated `apiFetch`, `/me`).
- `src/features/<feature-name>/`: Domain modules (e.g., `auth/`, `children/`, `today/`, `journal/`). Each tab screen renders `ScreenHeader` from `components/layout` and never its own `<main>`.
  - Co-locate components, custom hooks, types, and unit tests inside the feature directory.
  - Expose external capabilities solely via an `index.ts` barrel export.
- `src/components/`: Reusable cross-cutting UI primitives (`common/` buttons, modals, chips; `layout/` app shell and navigation).
- `src/styles/`: Central design tokens (`tokens.css`) and global base styling (`main.css`).

### 4.5 Styling Standards (Vanilla CSS, No Tailwind)
- **Do not install or use TailwindCSS.**
- All UI styling uses **Vanilla CSS** referencing CSS custom properties defined in `src/styles/tokens.css` (`--color-brand-forest`, `--color-surface-canvas`, `--color-surface-card`, `--color-border-input`, `--color-text-primary`).
- Never hard-code hex colors in component styles; always reference design token variables to ensure WCAG 2.2 AA compliance.

---

## 5. Security & Rights

- **Vulnerability Reporting:** Never report vulnerabilities in public issues. Follow [`SECURITY.md`](SECURITY.md) or the canonical [Security Policy in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/SECURITY.md).
- **Rights Policy:** The project's intended rights policy is **All Rights Reserved (Academic Evaluation Only)**. Public visibility does not grant an open-source redistribution license.
