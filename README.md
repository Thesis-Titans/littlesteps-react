# LittleSteps Web

React + TypeScript web client for LittleSteps. This initial foundation provides a project landing screen and a small API health-check integration. The six product features are not implemented yet.

## Requirements
- Node.js 22
- npm

## Local setup
1. Copy .env.example to .env.local.
2. Set VITE_API_BASE_URL to the local Firebase Functions emulator API URL, including the project ID and function region path.
3. Run npm install.
4. Run npm run typecheck and npm run build.
5. Run npm run dev.

Do not put Firebase Admin credentials, AI provider keys, or other server secrets in VITE_* variables. Vite exposes these values to browser code.

## Integration contract
The API repository owns the OpenAPI contract at openapi/openapi.yaml. The client must use Firebase Authentication to obtain an ID token for authenticated requests and send it as a Bearer token. Never trust a client-provided UID for authorization.

## Not implemented
Sign-in UI, child profile, milestones, daily planning, private journal, library, weekly summary, AI suggestions, route protection, feature tests, and production deployment configuration remain future work.