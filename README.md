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

## Status & Unimplemented Features
Sign-in UI, child profile, developmental milestones, daily planning, private journal, learning library, weekly summary, AI suggestions, route protection, feature tests, and production deployment configuration remain future work.

---

## Community & Contributing
- [Contributing Guidelines](CONTRIBUTING.md): Branch conventions, local verification commands, and PR review rules.
- [Security Policy](SECURITY.md): Vulnerability reporting and responsible disclosure.
- [Code of Conduct](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/CODE_OF_CONDUCT.md): Shared expectations for respectful academic collaboration.

---

## Rights Notice — Wording Pending Review
**All Rights Reserved (Academic Evaluation Only)** is the project's intended rights policy. The repositories are public for academic course evaluation, faculty review, and demonstration; this notice does not technically restrict who can view or interact with public repositories. The wording and intended restrictions have not been represented as legally reviewed. Before relying on the notice as a formal legal instrument, seek review from the course instructor or an appropriate legal resource. No open-source license is intentionally granted by this project; do not interpret this notice as a reviewed license instrument.