# LittleSteps Web

React 19 + TypeScript web client for **LittleSteps — Play Planning and Observation Companion for Caregivers of Young Children**, powered by Vite.

Capabilities include caregiver authentication (sign-in, sign-up, and password reset), responsive 5-tab navigation (desktop sidebar and 72 px mobile bottom bar), multi-child profile management, Today's play plan with quick filters (`Under 10 mins`, `No materials needed`, `Indoor`, `Outdoor`), weather play hints, an Explore activity catalog with AI activity adaptation, Open Library picture books with a saved Family Bookshelf, traditional Philippine nursery rhymes, a structured AI Idea Helper with custom material adaptations and Play Blocks, non-diagnostic developmental milestone tracking, a private caregiver journal, a weekly reflection summary, and RA 10173 data export and account deletion.

---

## Canonical project documentation
System architecture, product scope, and privacy policies are maintained centrally in [`littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs):

- [Developer Onboarding Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/getting-started.md): Full-stack local setup instructions.
- [API Reference & Integration Guide](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/api-reference.md): REST contract, Open Library & Open-Meteo proxies, and 3-tier AI fallback engine.
- [Product Scope](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/product-scope.md): Core capabilities and non-diagnostic boundaries.
- [Architecture Decisions](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/architecture-decisions.md): Recorded architecture decisions (ADRs 001–015).
- [Security, Privacy, and AI Guardrails](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/security-privacy-ai.md): Data safeguards and child privacy principles.

---

## Requirements
- **Node.js 22 LTS**
- **npm 10+**

---

## Local setup and verification
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to your local Firebase Functions emulator endpoint (for example, `http://127.0.0.1:5001/demo-littlesteps/asia-southeast1/api`).
3. Run `npm ci` to install dependencies from the lockfile.
4. Run `npm run verify` to execute ESLint, TypeScript typechecking, the full Vitest suite, and the production Vite build.
5. Run `npm run dev` and open [`http://localhost:5173`](http://localhost:5173).

> [!CAUTION]
> Never store Firebase Admin credentials, AI provider keys, or server secrets in `VITE_*` environment variables. Vite embeds `VITE_*` values directly into browser-facing JavaScript bundles.

---

## Integration contract
The API repository owns the OpenAPI specification at [`openapi/openapi.yaml`](https://github.com/Thesis-Titans/littlesteps-api/blob/main/openapi/openapi.yaml). Authenticated requests obtain a Firebase ID token via Firebase Authentication and send it as an `Authorization: Bearer <token>` header.

---

## Project structure

```text
public/
└── favicon.svg                 # Browser tab icon

src/
├── config/                     # External reference URLs and provenance resolvers
│   ├── externalLinks.ts
│   └── __tests__/
├── services/                   # Shared API fetch client, Firebase Auth, offline & weather services
│   ├── api.ts
│   ├── firebase.ts
│   ├── offline.ts
│   ├── weather.ts
│   └── __tests__/
├── components/                 # Reusable design-system primitives and responsive app shell
│   ├── common/                 # Button, Card, Chip, ModalDialog, PasswordField, SessionExpiredAlert, etc.
│   └── layout/                 # ProtectedRoute, AppShell, SideNav, TopBar, BottomTabBar, ScreenHeader
├── features/                   # Domain feature modules (components, hooks, types, api, __tests__/)
│   ├── auth/                   # Sign-in, sign-up, password reset, AuthProvider
│   ├── children/               # Child switcher, profile create/edit/delete
│   ├── today/                  # Daily play plan, quick filters, weather banner, Undo toast
│   ├── explore/                # Explore orchestrator, Storybooks, Family Bookshelf, Philippine rhymes
│   ├── catalog/                # Activity browser, detail modal, AI activity adaptation
│   ├── ai/                     # Idea Helper form, custom material adaptations, Play Blocks & fallback
│   ├── milestones/             # Live catalog milestone prompts and observation logging
│   ├── journal/                # Private caregiver journal (create, edit, delete, date filter)
│   ├── this-week/              # Monday–Sunday factual reflection summary
│   └── account/                # Account menu, settings (weather, RA 10173 export/delete), privacy, about, help
├── styles/                     # Tokenized CSS custom properties and per-feature stylesheets
│   ├── tokens.css              # Design tokens (colors, typography, spacing, radii, touch targets)
│   ├── main.css                # Base layout, auth pages, app shell, child forms
│   ├── components.css          # Shared primitive styles
│   ├── catalog.css             # Activity catalog & adaptation modal
│   ├── storybooks.css          # Open Library, Bookshelf & Philippine rhymes
│   ├── today.css, ai.css, milestones.css, journal.css, this-week.css, account.css
│   └── __tests__/
├── test/                       # Shared test utilities (e.g., jsdom dialog polyfill)
├── App.tsx                     # Route definitions
├── main.tsx                    # Client bootstrap
└── vite-env.d.ts               # Typed VITE_* environment declarations
```

---

## Contributing and security
- [Contributing Guidelines](CONTRIBUTING.md): Branch conventions, testing rules, and verification commands.
- [Security Policy](SECURITY.md): Vulnerability reporting and child data boundaries.
- [Code of Conduct](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CODE_OF_CONDUCT.md): Team collaboration standards.

---

## Rights notice

All Rights Reserved (Academic Evaluation Only). This repository is published publicly for academic evaluation and faculty review at West Visayas State University. No open-source redistribution license is granted.
