# Security Policy — LittleSteps Web

This repository contains the frontend web application for LittleSteps. For the comprehensive cross-repository security, privacy, and child data policies, refer to the [canonical Security Policy in `littlesteps-docs`](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/SECURITY.md).

---

## 1. Supported Versions

Only the latest commit on the `main` branch of `littlesteps-react` is actively maintained and evaluated for security:

| Branch | Status |
| :--- | :---: |
| `main` | :white_check_mark: Supported |
| All other branches / forks | :x: Not supported |

---

## 2. Reporting a Vulnerability

> [!IMPORTANT]
> **Do NOT report potential security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Please report vulnerabilities privately through either channel:

1. **GitHub Private Vulnerability Reporting (Preferred):**  
   Navigate to the **Security** tab of this repository and click **Report a vulnerability** to open a private advisory draft.
2. **Direct Contact:**  
   Email project lead and maintainer **Mark Alvin Cadangin** at [markcadangin@gmail.com](mailto:markcadangin@gmail.com) with the subject prefix `[SECURITY] LittleSteps Web: <Brief Description>`.

---

## 3. High-Priority Web Security Boundaries

- **Client-Side Secret Exposure:** Never put private server credentials, Firebase Admin keys, or AI provider keys into frontend environment variables (`VITE_*`).
- **Cross-Site Scripting (XSS) & Token Security:** Firebase ID tokens and sensitive session data must be handled securely without exposing tokens to unauthorized scripts.
- **Child & Caregiver Data Leakage:** Ensure private journal notes, developmental milestones, and child names are not leaked to third-party analytics, public CDNs, or unencrypted local caches.
- **Academic Context:** Vulnerabilities are triaged on a best-effort basis by undergraduate students during academic terms without commercial SLAs.
