# Production deployment and administration

Written 2026-10-15. This plan covers what has to change before Daily runs for real on dai-ly.de,
and how it is administered today and later. Steps 14–17 of the design spec
(`docs/superpowers/specs/2026-10-13-daily-design.md`) describe the target. This file lists the gaps
found in the code on 15 Oct 2026.

## 1. What exists and what does not

| Area             | Today                                                                                                                  | Missing for production                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| App build        | `adapter-node` (`pnpm build`), worker bundle (`pnpm build:worker`)                                                     | `Dockerfile` (multi-stage, non-root), image pushed to GHCR from CI                                                                              |
| Stack            | `compose.yaml` for development only (Postgres 5433, Keycloak `start-dev`)                                              | `infra/compose.prod.yml`: Caddy, app, worker, Keycloak `start --optimized`, Postgres. Only Caddy publishes ports                                |
| TLS / proxy      | none                                                                                                                   | `infra/Caddyfile`: `dai-ly.de` → app, `www` → redirect, `auth.dai-ly.de` → Keycloak, security headers                                           |
| Secrets          | dev values in `compose.yaml`, `.env.example`, realm JSON                                                               | New random values in `/opt/daily/.env` (mode 600). Never reuse `daily-dev-password`, `admin-dev-password` or `daily-web-dev-secret`             |
| Keycloak realm   | redirect URIs on localhost, a seeded test user, open registration, no e-mail verification, no SMTP, no password policy | Production realm, see §2                                                                                                                        |
| Security headers | none (no CSP)                                                                                                          | CSP via SvelteKit `kit.csp`, plus HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `frame-ancestors 'none'` in Caddy |
| Migrations       | `pnpm db:migrate` by hand                                                                                              | Run on deploy before the app starts (`infra/deploy.sh`)                                                                                         |
| Backups          | none                                                                                                                   | Nightly `pg_dump` of `daily` and `keycloak`, encrypted, to a Hetzner Storage Box; restore tested once a quarter                                 |
| Monitoring       | none                                                                                                                   | Uptime check on `/` and `auth.dai-ly.de`, disk/RAM alerts, the worker's last successful poll                                                    |
| Admin UI         | none in the app; Keycloak admin console locally                                                                        | See §4                                                                                                                                          |

## 2. Changes before go-live

### Server and network

1. Hetzner CX33 (Falkenstein), Ubuntu 24.04, SSH key only.
   - Firewall: 22, 80 and 443.
   - Install ufw, fail2ban and unattended-upgrades.
   - A `deploy` user, and Docker Engine.
2. DNS at Hetzner: `A`/`AAAA` for `@`, `www` and `auth`, and `CAA 0 issue "letsencrypt.org"`.
   - Enable DNSSEC once stable.
   - Register the domain at INWX with accurate holder data (DENIC checks it).

### App configuration

Environment variables:

- `APP_ORIGIN=https://dai-ly.de`.
- `ORIGIN=https://dai-ly.de` for adapter-node. Behind Caddy, SvelteKit otherwise rejects form
  posts as cross-site.
- `DATABASE_URL` to the internal Postgres, with its own password.
- `KEYCLOAK_ISSUER=https://auth.dai-ly.de/realms/daily`.
- `KEYCLOAK_CLIENT_ID`.
- A new `KEYCLOAK_CLIENT_SECRET`.

Other changes:

- Cookies: they already use `secure: !dev`. Check in production that the session cookie is
  `Secure; HttpOnly; SameSite=Lax`.
- `PUBLIC_PREVIEW` must not be set. The GitHub Pages preview stays a separate static build with
  browser storage and keeps its "Vorschau" notice.
- CSP:
  - Fonts are self-hosted and there are no external scripts, so `default-src 'self'` with hashes
    for SvelteKit's inline bootstrap (`kit.csp.mode: 'hash'`) is enough.
  - The Guardrail-Test calls user-given endpoints from the browser and needs
    `connect-src 'self' https:`. Alternatively, move those calls to the server.
- Body size: set `BODY_SIZE_LIMIT` (e.g. `1M`). Records are small, and Repo-Check reads files in
  the browser only.

### Keycloak (production realm)

- `start --optimized` with these settings:
  - `KC_HOSTNAME=https://auth.dai-ly.de`
  - `KC_PROXY_HEADERS=xforwarded`
  - `KC_HTTP_ENABLED=true` (only inside the Docker network)
  - Database `keycloak` with its own user
- Client `daily-web`:
  - Redirect URI `https://dai-ly.de/auth/callback`
  - Web origin `https://dai-ly.de`
  - Post-logout redirect `https://dai-ly.de/*`
  - A new secret
- Realm:
  - `sslRequired: external`
  - Password policy: length ≥ 12, not username, not e-mail, history 3
  - Brute-force protection on (already on)
  - E-mail verification on
  - SMTP via a German provider (`MX`/`SPF`/`DKIM`/`DMARC` for dai-ly.de)
- Delete the seeded test user (`test@dai-ly.de`) from the imported realm, or import a production
  realm file without users.
- Decide on sign-up: open registration with e-mail verification, or invitation only (an admin
  creates users). For a paid or closed beta, choose invitation only:
  `registrationAllowed: false`.
- The bootstrap admin (`KC_BOOTSTRAP_ADMIN_*`) is temporary:
  - Create a personal admin user in the `master` realm with OTP.
  - Delete the bootstrap admin.
- Restrict the admin console. Either:
  - serve `/admin` only from a VPN or office IP in Caddy, or
  - use Keycloak's separate admin hostname (`KC_HOSTNAME_ADMIN`).

### Legal and data protection (Daily is itself a controller)

- Impressum (§ 5 DDG) with the real provider data; Datenschutzerklärung covering:
  - hosting (Hetzner), Keycloak cookies, the session cookie, the theme/locale cookies
  - the news crawler, server logs and their retention
  - no analytics
- Processing agreement with Hetzner (Art. 28 DSGVO).
- Daily's own VVT and TOM. The tools Daily ships can document them.
- Users store client data (Mandanten, Datenpannen). Required:
  - Encryption at rest: Hetzner volume encryption or LUKS.
  - Encrypted backups.
  - A deletion concept for accounts and organisations. Organisation deletion is not built yet.
  - A note that Daily is a tool, not legal advice.
- Get the legal content of the tools reviewed by a lawyer before marketing them as `stable`.

### Operations

- `infra/deploy.sh`: `docker compose pull` → `run --rm app node migrate` → `up -d`.
- CI already runs check, lint, unit tests and the preview E2E. Add:
  - the server E2E against a compose stack
  - image build and push on tags
- Log rotation (Docker `json-file` with `max-size`).
- Pin Keycloak and Postgres versions; update them monthly.
- The news worker runs as its own container, with a healthcheck on the last poll time.

## 3. Admin tasks today (without an admin UI)

| Task                                             | How                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create, disable or delete users; reset passwords | Keycloak admin console. Local: `http://localhost:8080/admin/` with the dev credentials from `compose.yaml`. Production: `https://auth.dai-ly.de/admin/` with the personal admin account           |
| See who logged in; unlock after brute force      | Keycloak → realm `daily` → Sessions / Events (enable login events) / Users → Brute force                                                                                                          |
| Look at data                                     | Adminer at `http://localhost:8081` (local compose stack, bound to localhost) or `pnpm db:studio` (Drizzle Studio) against the local database. In production only via an SSH tunnel, never exposed |
| News sources                                     | Edit `src/lib/server/feed/sources.ts`; the worker syncs them into the table on start                                                                                                              |
| Law texts                                        | `pnpm normen:import`, review, commit. See `2026-10-15-law-maintenance.md`                                                                                                                         |
| Organisations                                    | Users create client organisations under `/mandanten`. Renaming and deleting has no admin path yet                                                                                                 |

## 4. Feature plan: admin area in the app

Principle: admins run the platform; they do not read client content. DSB and auditor records are
confidential: a Datenpanne or a Betroffenenanfrage can carry special categories of data. The admin
area shows metadata and counts, never record contents.

1. **Role.** Add a realm role `daily-admin` in Keycloak and map it into the ID token.
   - `login.ts` stores the roles on the user row.
   - `hooks.server.ts` exposes `locals.user.roles`.
   - Assign the role only in Keycloak (with OTP required for its holders).
2. **Guard.** Add a `(admin)` route group with `+layout.server.ts`. It returns 404 unless the user
   has `daily-admin`, so the area is not discoverable. Every admin action is written to an
   `admin_events` table (who, what, when).
3. **Pages:**
   - **Überblick:**
     - users, organisations, records per tool (counts only)
     - tool runs per week
     - storage size
   - **Nutzer:** list from the `users` table with last login, organisations and status. Links to
     the Keycloak console for account actions, so Daily never handles passwords.
   - **Organisationen:**
     - rename, transfer ownership, delete (soft delete, purged after 30 days)
     - export of all records as a zip for the owner
   - **Nachrichtenquellen:** state per source (last poll, last error, items in 14 days); pause or
     resume; trigger a poll.
   - **Rechtsstand:** the version line of each law, the `retrieved` date and the result of
     `normen:check` (see the law-maintenance plan, §6).
   - **System:** app version (git SHA), migration level, worker heartbeat.
4. **Tests:** the guard (403/404 for normal users), and admin pages that never render record data
   (E2E asserts that no record title appears).

Slices:

1. Role and guard with the Überblick page.
2. Nutzer and Organisationen, including organisation deletion and export.
3. Nachrichtenquellen and Rechtsstand.
4. Audit log of admin actions.
