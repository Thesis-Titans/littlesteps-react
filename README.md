# LittleSteps Web

React + TypeScript web client for LittleSteps, powered by Vite. The initial scaffold provides a project landing screen and a small API health-check integration; product features and authenticated views are not implemented yet.

---

## Canonical Project Documentation
LittleSteps uses a three-tier documentation structure. System architecture, product scope, and privacy policies are maintained centrally in [`littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs):

- [Developer Onboarding Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/getting-started.md): Full-stack local setup instructions.
- [API Reference & Integration Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/api-reference.md): Technical contract, Open Library REST proxy, 3-tier AI fallback engine, and error schemas.
- [Product Scope](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/product-scope.md): The six core features and boundaries.
- [Architecture Decisions](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/architecture-decisions.md): Architecture and technical direction (ADRs 001–010).
- [Security, Privacy, and AI Guardrails](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/security-privacy-ai.md): Data safeguards and child privacy principles.
- [Documentation Standards](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/documentation-standards.md): Documentation hierarchy and repository consistency.

---

## Requirements
- **Node.js 22 LTS**
- **npm 10+**

---

## Local Setup & Verification
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the local Firebase Functions emulator API URL (e.g., `http://127.0.0.1:5001/demo-littlesteps/asia-southeast1/api`).
3. Run `npm ci` to install dependencies from the lockfile.
4. Run `npm run lint` to verify code quality with ESLint.
5. Run `npm test` to run the unit test suite.
6. Run `npm run typecheck` and `npm run build` to verify TypeScript types and the Vite production build.
7. Run `npm run dev` to launch the local Vite development server.

> [!CAUTION]
> Do not put Firebase Admin credentials, AI provider keys, or server secrets in `VITE_*` environment variables. Vite bakes these values directly into the browser-facing bundle.

---

## Integration Contract
The API repository owns the OpenAPI specification at [`openapi/openapi.yaml`](https://github.com/Thesis-Titans/littlesteps-api/blob/main/openapi/openapi.yaml). The client must use Firebase Authentication to obtain an ID token for authenticated requests and send it as a `Bearer` token. Never trust a client-provided UID for authorization.

---

## Architecture & Project Organization
To support parallel feature development across course tracks while preventing file collisions and maintaining clean boundaries, `littlesteps-react` follows a feature-modular and layered architecture:

```
src/
├── services/               # Shared backend / infrastructure integration
│   ├── firebase.ts         # Client Firebase Auth initialization & emulator hooks
│   ├── api.ts              # Authenticated fetch client (Bearer token injection, /me)
│   └── api.test.ts         # Service contract tests
├── features/               # Domain feature modules (co-locating components, hooks, types, tests)
│   ├── auth/               # Caregiver authentication & session state (Issue #5)
│   │   ├── components/     # Feature-scoped UI (e.g., SignInForm)
│   │   ├── context.ts      # AuthContext instance (decoupled for Fast Refresh)
│   │   ├── AuthProvider.tsx# Context provider component
│   │   ├── useAuth.ts      # Custom hook
│   │   ├── types.ts        # Domain types
│   │   ├── auth.test.ts    # Unit tests
│   │   └── index.ts        # Public feature interface
│   ├── children/           # Active child context, reset per signed-in user (Issue #6 builds the profile flow)
│   ├── today/              # Today tab: activity planning (Issue #8)
│   ├── explore/            # Explore tab: age-aware learning catalog (Issue #7)
│   ├── milestones/         # Milestones tab: observation prompts (Issue #17)
│   ├── journal/            # Journal tab: private observation journal (Issue #9)
│   ├── this-week/          # This week tab: weekly reflection (Issue #10)
│   ├── account/            # Account, settings, privacy and help (Issue #16)
│   └── ai-helper/          # AI suggestion experience & safe fallback states (Issue #11, not created yet)
├── components/             # Reusable design system UI components
│   ├── common/             # Buttons, fields, chips, alerts, states (see components/README.md)
│   └── layout/             # App shell: ProtectedRoute, AppShell, SideNav, TopBar, BottomTabBar, ScreenHeader (Issue #18)
├── styles/                 # Design tokens and styling system
│   ├── tokens.css          # CSS custom properties matching UI/UX spec §6
│   └── main.css            # Base typography, layout, and component classes
├── App.tsx                 # Route table (tabs under ProtectedRoute + AppShell)
├── main.tsx                # Client bootstrap (router, auth provider, /dev/components showcase)
└── vite-env.d.ts           # Environment type declarations
```

### Architectural Principles
1. **Co-location over Layer Spread:** Keep feature-specific components, hooks, tests, and types inside their respective `features/<feature-name>/` directory.
2. **Explicit Public Interface:** Each feature folder maintains an `index.ts` barrel that exports only what other parts of the app need.
3. **Decoupled Infrastructure:** Client network and Firebase logic belong in `services/`, never directly in UI components.
4. **Token-First Styling:** All colors, spacing, and focus rings reference CSS custom properties defined in `styles/tokens.css`, maintaining compliance with the canonical UI/UX specification.

---

## Community & Contributing
- [Contributing Guidelines](CONTRIBUTING.md): Branch conventions, local verification commands, and PR review rules.
- [Security Policy](SECURITY.md): Vulnerability reporting and responsible disclosure.
- [Code of Conduct](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CODE_OF_CONDUCT.md): Shared expectations for respectful academic collaboration.

---

## Rights Notice — Wording Pending Review
**All Rights Reserved (Academic Evaluation Only)** is the project's intended rights policy. The repositories are public for academic course evaluation, faculty review, and demonstration; this notice does not technically restrict who can view or interact with public repositories. The wording and intended restrictions have not been represented as legally reviewed. Before relying on the notice as a formal legal instrument, seek review from the course instructor or an appropriate legal resource. No open-source license is intentionally granted by this project; do not interpret this notice as a reviewed license instrument.