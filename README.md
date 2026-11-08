# LittleSteps Web

React + TypeScript web client for LittleSteps, powered by Vite. Features include caregiver authentication (sign-in and sign-up with in-field password toggle), responsive 5-tab app shell (desktop sidebar and 72px mobile tab bar), child profile management, account and privacy views, learning catalog exploration, and a constrained AI play idea helper with deterministic catalog fallback.

---

## Canonical project documentation
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

## Local setup and verification
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the local Firebase Functions emulator API URL (e.g., `http://127.0.0.1:5001/demo-littlesteps/asia-southeast1/api`).
3. Run `npm ci` to install dependencies from the lockfile.
4. Run `npm run lint` to verify code quality with ESLint.
5. Run `npm test` to run the unit and DOM test suite (284 passing tests across 26 test suites).
6. Run `npm run typecheck` and `npm run build` to verify TypeScript types and the Vite production build.
7. Run `npm run dev` to launch the local Vite development server. Open [`http://localhost:5173`](http://localhost:5173) in your browser. (The local API server permits both `http://localhost:5173` and `http://127.0.0.1:5173` by default).

> [!CAUTION]
> Do not put Firebase Admin credentials, AI provider keys, or server secrets in `VITE_*` environment variables. Vite bakes these values directly into the browser-facing bundle.

---

## Integration contract
The API repository owns the OpenAPI specification at [`openapi/openapi.yaml`](https://github.com/Thesis-Titans/littlesteps-api/blob/main/openapi/openapi.yaml). The client must use Firebase Authentication to obtain an ID token for authenticated requests and send it as a `Bearer` token. Never trust a client-provided UID for authorization.

---

## Architecture and project organization
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
│   ├── children/           # Active child context, profile creation & editing (Issue #6)
│   ├── today/              # Today tab: routine activity planning (Issue #8)
│   ├── explore/            # Explore tab: learning catalog & AI helper integration (Issue #7)
│   ├── milestones/         # Milestones tab: observation prompts (Issue #17)
│   ├── journal/            # Journal tab: private observation journal (Issue #9)
│   ├── this-week/          # This week tab: weekly reflection (Issue #10)
│   ├── account/            # Account, settings, privacy disclosure and help (Issue #16)
│   ├── catalog/            # Learning catalog browser, domain chips & search (Issue #7)
│   └── ai/                 # AI suggestion experience (IdeaHelper), prompt constraints & fallback (Issue #11)
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

## Contributing and security
- [Contributing Guidelines](CONTRIBUTING.md): Branch conventions, local verification commands, and PR review rules.
- [Security Policy](SECURITY.md): Vulnerability reporting procedures and child data boundaries.
- [Code of Conduct](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CODE_OF_CONDUCT.md): Shared expectations for respectful academic collaboration.

---

## Rights notice

All Rights Reserved (Academic Evaluation Only). This repository is published publicly for academic evaluation and faculty review at West Visayas State University. No open-source redistribution license is granted.