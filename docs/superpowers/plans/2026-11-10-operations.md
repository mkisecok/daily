# Operations plan: hosting, deployment, database, monitoring

Written 2026-11-10 against `main` at `9846bc9`. It turns the go-live list in
`2026-10-15-production-deployment.md` into a complete operations plan: what runs where, how a
change reaches production, how data is kept safe, what is watched, and what to do when something
breaks. It is meant to work without the conversation it came from.

Owner: one person. Every choice below prefers "few moving parts that one person can run" over
scale.

## 1. State today

| Area           | Exists in the repo                                                                         | Missing                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Public preview | GitHub Pages under `/daily`, rebuilt on every push to `main` and on a schedule             | –                                                                                          |
| Production     | –                                                                                          | **No server.** `dai-ly.de` has no DNS address record (checked 2026-11-10)                  |
| Image          | `Dockerfile` (multi-stage, non-root, healthcheck), pushed to `ghcr.io/mkisecok/daily:main` | Version tags, image scan, rollback by tag                                                  |
| Stack          | `infra/compose.prod.yml`: Caddy, app, worker, Keycloak 26.8, Postgres 17                   | Resource limits, Keycloak and worker healthchecks                                          |
| Deploy         | `infra/deploy.sh`: pull, migrate, restart, by hand over SSH                                | Backup before migrate, smoke test, rollback, deploy from CI                                |
| CI             | Builds the image, checks compose and Caddyfile, runs migrations, checks health and headers | **Lint, type check, unit tests and E2E do not run in CI**; only on the developer's machine |
| Backups        | –                                                                                          | Everything                                                                                 |
| Monitoring     | `/healthz` (database reachable)                                                            | Uptime checks, alerts, logs in one place, worker heartbeat                                 |
| Secrets        | `infra/env.prod.example`                                                                   | Where the real values live, rotation                                                       |
| Staging        | –                                                                                          | A place to try a release before production                                                 |

## 2. Hosting

### 2.1 Target

One Hetzner Cloud server in Falkenstein (EU, German provider, processing agreement available).

| Item           | Choice                                                                                    | Why                                                                    |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Server         | CX33 (4 vCPU, 8 GB), Ubuntu 24.04 LTS                                                     | Keycloak alone needs about 1.5 GB; leaves room for Postgres and builds |
| Data           | A separate 20 GB volume for Postgres, mounted at `/var/lib/docker/volumes/…pgdata`, LUKS  | Survives a server rebuild; encryption at rest for client data          |
| Server backups | Hetzner automatic backups on (7 daily snapshots)                                          | Second line behind the database dumps                                  |
| Off-site       | Hetzner Storage Box (100 GB) in another location (Helsinki)                               | Dumps must not live only next to the server                            |
| Firewall       | Hetzner Cloud Firewall: 80, 443 from anywhere; 22 only from the owner's addresses         | In front of the host, plus ufw on it                                   |
| DNS            | Hetzner DNS: `A`/`AAAA` for `@`, `www`, `auth`; `CAA` for Let's Encrypt; later DNSSEC     | As planned in October                                                  |
| Mail           | An EU provider for Keycloak's verification and reset mail; SPF, DKIM, DMARC on the domain | Without it nobody can register                                         |

Expected cost: about 15 to 20 € a month (server, backups, volume, storage box), plus the domain.
Check current prices in the Hetzner console before ordering.

### 2.2 Provisioning as code

A hand-built server cannot be rebuilt in an emergency. Add `infra/server/`:

- `cloud-init.yaml`: users (`deploy`, no root login, SSH keys only), Docker Engine, ufw, fail2ban,
  unattended-upgrades with automatic reboot at 04:00, swap, time sync, the directory `/opt/daily`.
- `bootstrap.sh`: mounts the volume, copies `infra/`, installs the backup timer (section 5) and
  the node exporter if used.
- `README.md`: the exact order for a first install and for a rebuild from backup.

Goal: a new server from nothing to a running, restored Daily in under one hour, following the
README only.

### 2.3 Staging

A second, small server (CX22) is the simplest honest staging: same compose file, its own
`.env`, the hosts `staging.dai-ly.de` and `auth.staging.dai-ly.de`, basic auth in Caddy, test data
only. It can be switched off between releases. Until it exists, the image job in CI (fresh
Postgres, migrations, health, headers) is the only pre-production check.

## 3. Deployment

### 3.1 Pipeline

```
pull request ──► CI: lint · type check · unit tests · preview E2E · server E2E · image build
merge to main ─► image :main and :sha-<short> pushed to GHCR ─► staging deploys automatically
git tag v1.2.3 ─► image :v1.2.3 ─► production deploy, started by hand, approved in GitHub
```

Work items:

1. **`ci.yml`:** lint, `svelte-check`, unit tests and the preview E2E on every pull request. These
   run only locally today. Make the job required on `main` (branch protection), together with
   "no direct pushes".
2. **Server E2E in CI:** start Postgres and Keycloak with the development compose file and run
   `pnpm test:e2e`. It has never run outside a developer machine.
3. **Tags:** `image.yml` also pushes `sha-<short>` and, on a git tag, the version. Production
   never runs `:main`; `DAILY_TAG` in `/opt/daily/.env` names an exact version.
4. **Scan:** Trivy on the image and `pnpm audit` in CI; Dependabot (or Renovate) for npm, GitHub
   Actions and the Docker base images.
5. **`deploy.yml`:** a manually started workflow with a GitHub environment `production` (required
   approval). It connects with a deploy key restricted to one command (`deploy.sh <tag>`), so CI
   never has a shell on the server.

### 3.2 What `deploy.sh` must do

Today: pull, migrate, restart. Add, in this order:

1. Refuse to run without an exact tag.
2. `backup.sh` (section 5): a dump right before any migration.
3. Pull, then migrate.
4. `up -d`, then wait until `/healthz` answers 200 and the home page and the login redirect work.
5. On failure: start the previous tag again and exit non-zero. Write tag, time and result to
   `/opt/daily/deploys.log`.

### 3.3 Migrations and rollback

- Migrations are forward-only and must be compatible with the previous app version (add a column
  first, use it in the next release, drop the old one a release later). Then a rollback is "start
  the old tag".
- A release with a migration that is not backward compatible is marked as such in its notes;
  its rollback is "restore the dump from step 2", and it is rehearsed on staging first.

### 3.4 Downtime

One server means a restart of a few seconds per deploy. Accept it, deploy outside office hours,
and let Caddy answer with a short maintenance page while the app is down.

## 4. Configuration and secrets

- Real values only in `/opt/daily/.env` (mode 600, owner `deploy`) and in the owner's password
  manager. Never in the repository, never in GitHub secrets except the deploy key.
- One list in the password manager: Postgres password, Keycloak client secret, Keycloak admin
  account with OTP, SMTP password, storage box key, backup passphrase, Hetzner API token.
- Rotation once a year and after any suspicion: Postgres password, client secret, SMTP password.
  The procedure for each goes into the runbook (section 8).
- The backup passphrase is the one secret that must also exist on paper in a safe place: without
  it every backup is useless.

## 5. Database management

### 5.1 Backups

| What                                  | How                                                                                      | When           | Kept                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | -------------- | ----------------------------- |
| Databases `daily` and `keycloak`      | `pg_dump --format=custom` each, encrypted with `age`, pushed to the storage box (restic) | Nightly, 02:30 | 7 daily, 4 weekly, 12 monthly |
| The same                              | Run by `deploy.sh`                                                                       | Before deploys | With the above                |
| Whole server                          | Hetzner automatic backup                                                                 | Daily          | 7                             |
| `/opt/daily/.env`, Caddy certificates | In the nightly restic run                                                                | Nightly        | With the above                |

`infra/backup/backup.sh` and a systemd timer do this. The script ends by reporting to the
monitoring (section 6), so a backup that did not run raises an alert.

Later, when losing up to 24 hours of entries is no longer acceptable: continuous archiving with
pgBackRest or WAL-G for point-in-time recovery.

Targets for now: lose at most 24 hours of data (RPO), be back within 4 hours (RTO).

### 5.2 Restore

- `infra/backup/restore.sh <snapshot>` restores into a fresh Postgres container and runs checks:
  row counts per table, newest `updated_at`, migrations table at the expected level.
- **Restore test every quarter**, on staging, from the off-site copy, with the result written to
  `docs/ops/restore-tests.md`. A backup that was never restored is a hope, not a backup.

### 5.3 Routine care

- Postgres settings for 8 GB in a config file instead of defaults (`shared_buffers`,
  `effective_cache_size`, `work_mem`, `max_connections` sized to the app pool);
  `log_min_duration_statement = 500ms`; `pg_stat_statements` on.
- Separate database roles: `daily_app` (no DDL), `daily_migrate` (DDL), `keycloak`. Today one
  superuser serves all three.
- Minor versions: monthly, by pinning the image tag (`postgres:17.x-alpine`). Major versions: a
  planned change with dump and restore, rehearsed on staging.
- Access to data in production only over an SSH tunnel, never an exposed admin tool; every such
  access is noted (who, when, why), because records hold client data.
- Watch: database size, the largest tables, connections in use, dead tuples. Alert at 70 % of the
  volume.

### 5.4 Deletion

Backups keep deleted accounts for up to 12 months. That must match the privacy notice (today it
says 30 days for encrypted backups). Either shorten retention to what the notice says or change
the notice, and document that restored backups re-apply deletions made since.

## 6. Monitoring and alerting

Start small; add the heavier pieces only when a real need shows.

### 6.1 Stage 1, before go-live

| Watch                          | Tool                                                                                   | Alert when                       |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------- |
| `https://dai-ly.de/healthz`    | External uptime check from outside Hetzner (hosted service, or Uptime Kuma elsewhere)  | 2 failures in a row              |
| `https://auth.dai-ly.de` realm | Same                                                                                   | 2 failures in a row              |
| TLS certificates               | Same                                                                                   | Less than 14 days left           |
| Nightly backup                 | Heartbeat ("dead man's switch") pinged by `backup.sh`                                  | No ping for 26 hours             |
| News worker                    | Heartbeat pinged after each successful poll; add a `healthcheck` on the last poll time | No ping for 2 hours              |
| Disk, memory, load             | Hetzner Cloud alerts or node exporter                                                  | Disk over 80 %, memory over 90 % |
| Reboot needed, failed units    | A daily mail from the server                                                           | Any                              |

Alerts go to e-mail and to the phone (a push service). One person is on call, so alerts must be
rare and each must name its runbook entry.

### 6.2 Stage 2, with real users

- Logs in one place: Docker logs and Caddy's access log shipped to Loki (or a hosted EU log
  service). Keep 14 days; Caddy already masks addresses and drops query strings. No request
  bodies, no record contents in logs.
- Metrics: Prometheus and Grafana on the same server, or Grafana Cloud EU: request rate, error
  rate, response time from Caddy; Postgres exporter; container memory.
- Error tracking for the app (self-hosted GlitchTip, or Sentry in the EU) with personal data
  scrubbing on; every unhandled server error gets a ticket.
- A public status page fed by the uptime checks.

### 6.3 What to look at each week

Ten minutes: failed logins and lockouts in Keycloak, slow queries, error count, disk trend,
pending updates, the result of the last backup and deploy.

## 7. Security operations

- Host: SSH keys only, no root login, fail2ban, unattended security updates, a reboot window.
- Containers: non-root (app already is), read-only file system (app already is), resource limits
  for every service, no Docker socket mounted anywhere.
- Keycloak: admin console reachable only from the addresses in `KC_ADMIN_ALLOW`; personal admin
  account with OTP; bootstrap admin removed after first start; brute-force detection, e-mail
  verification and a password policy on; login events kept 90 days.
- Updates: Keycloak and Postgres monthly, base images weekly through the dependency bot, each
  through staging.
- Headers and CSP are already tested in CI; add an external check (Mozilla Observatory, SSL Labs)
  after go-live and after each Caddy change.
- A security contact: `security.txt` on the site and a mailbox that is read.

## 8. Incidents and runbook

`docs/ops/runbook.md`, one page per case, each with symptoms, checks, fix and "who to tell":

1. Site down or `/healthz` red.
2. Login fails (Keycloak down, certificate, clock).
3. Disk full.
4. Bad deploy: roll back.
5. Restore the database from last night.
6. Rebuild the server from nothing.
7. Rotate a secret.
8. Suspected break-in or data leak.

Case 8 is also a legal process: Daily is a controller for its account data and a processor for
what users store. A leak starts the 72-hour clock of Art. 33 DSGVO and the duty to inform the
users whose client data is affected (Art. 33(2)). The runbook names the competent authority and
keeps a template; Daily's own Datenpanne tool documents the case.

After every incident: a short written review (what happened, why, what changes).

## 9. Data protection duties of the operator

- Processing agreements: Hetzner, the mail provider, any hosted monitoring or log service. Prefer
  EU providers; list each in the privacy notice.
- Daily's own record of processing, technical measures and deletion concept, kept in Daily.
- A processing agreement to offer to users who store client data, before the first paying or
  professional user.
- Logs: 7 days of access logs with masked addresses (already so), 14 days of application logs,
  90 days of login events. Write these into the privacy notice.

## 10. Order of work

| Step | Content                                                                                    | Done when                                               |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1    | `ci.yml`: lint, type check, unit tests, preview E2E; branch protection                     | A failing test blocks a merge                           |
| 2    | Server by `cloud-init`, DNS, mail, first deploy by hand, Keycloak production realm         | dai-ly.de answers, a new user can register and log in   |
| 3    | Backups, heartbeat, restore script, first restore test                                     | A dump from the storage box restores on a clean machine |
| 4    | Monitoring stage 1 and the runbook                                                         | Switching the app off raises an alert within 5 minutes  |
| 5    | `deploy.sh` with backup, smoke test and rollback; version tags; `deploy.yml` with approval | A bad release rolls itself back                         |
| 6    | Server E2E in CI, image scan, dependency bot                                               | Every pull request runs the whole suite                 |
| 7    | Staging server; database roles; Postgres settings                                          | Releases pass staging first                             |
| 8    | Monitoring stage 2 (logs, metrics, errors, status page)                                    | With the first real users                               |

Steps 1 to 4 are the minimum before inviting anyone to store real data. Step 2 needs the owner:
ordering the server, DNS and mail, and creating the secrets, cannot be done from the repository.

## 11. Open decisions for the owner

1. Staging as a second server (about 5 € a month) or none until there are users?
2. Hosted monitoring and log services (less work, one more processor) or self-hosted (more work,
   no third party)?
3. Backup retention: 12 months as planned here, or 30 days as the privacy notice says today?
4. Who is the second person who can reach the server and the password manager if the owner
   cannot?
