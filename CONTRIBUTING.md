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

## 4. Frontend-Specific Rules & Safeguards

### 4.1 Strict Environment Variable Safety
> [!CAUTION]
> **Never store secrets in `VITE_*` variables.** Vite bakes all `VITE_*` environment variables directly into client-side JavaScript bundles. Any API key, private key, or credential placed in a `VITE_*` variable will be publicly visible to anyone inspecting the browser bundle.

### 4.2 Child Privacy & Browser Storage
- Never log child names, dates of birth, or private caregiver notes to browser `console.log`.
- Do not store sensitive child or caregiver data in unencrypted browser `localStorage` or `sessionStorage`.
- Always use synthetic test data when testing locally or capturing screenshots.

### 4.3 Accessibility & Responsive Design
- Ensure UI components support keyboard navigation and visible focus rings.
- Verify layouts across both mobile (e.g. 375px) and desktop viewports.
- Always provide accessible loading, empty, and error fallback states.

---

## 5. Security & Rights

- **Vulnerability Reporting:** Never report vulnerabilities in public issues. Follow [`SECURITY.md`](SECURITY.md) or the canonical [Security Policy in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/SECURITY.md).
- **Rights Policy:** The project's intended rights policy is **All Rights Reserved (Academic Evaluation Only)**. Public visibility does not grant an open-source redistribution license.
