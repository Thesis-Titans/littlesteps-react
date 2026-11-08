# Security policy — LittleSteps Web

This repository contains the frontend web application for LittleSteps, built with React, TypeScript, and Vite.

For shared system privacy, security, and child data policies, refer to the [canonical Security Policy in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/SECURITY.md).

---

## Supported versions

Only the latest commit on the `main` branch of `littlesteps-react` is actively maintained and evaluated for security:

| Branch | Status |
| :--- | :---: |
| `main` | Supported |
| All other branches and forks | Not supported |

---

## Reporting a vulnerability

> [!IMPORTANT]
> Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Please report vulnerabilities privately through either channel:

1. **GitHub Private Vulnerability Reporting (preferred):**  
   Navigate to the **Security** tab of this repository and select **Report a vulnerability** to open a private advisory draft.
2. **Direct email:**  
   Contact project maintainer **Mark Alvin Cadangin** at [markcadangin@gmail.com](mailto:markcadangin@gmail.com) with the subject prefix `[SECURITY] LittleSteps Web: <Brief Description>`.

---

## Web security boundaries and threat model

### Client-side secret isolation
- Never commit or configure private server credentials, Firebase Admin private keys, or AI provider keys (`GEMINI_API_KEY`) in frontend environment variables (`VITE_*`).
- Vite bakes `VITE_*` variables directly into static client bundles, making them publicly readable by anyone inspecting JavaScript assets.

### Token and session security
- Firebase ID tokens and sensitive authentication sessions must be handled securely through Firebase Auth SDK and injected only into authorized `Authorization: Bearer <token>` request headers.
- Never store Firebase ID tokens or caregiver credentials in unencrypted or long-lived custom browser storage.

### Child and caregiver data minimization (RA 10173)
- In compliance with the Philippine Data Privacy Act of 2012 (RA 10173), child names, birth dates, and qualitative caregiver journal entries must never be transmitted to third-party trackers, public CDNs, or external AI providers.
- Avoid logging personal child information or journal contents to `console.log`.

### Academic scope
- Vulnerabilities are triaged on a best-effort basis by undergraduate students during the academic semester without commercial service-level agreements (SLAs).
