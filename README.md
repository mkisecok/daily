# Daily — Data · AI · Law

A daily workplace for data protection officers, AI officers and auditors working under the
GDPR (DSGVO) and the EU AI Act (KI-VO). German first, English included.

- **Nachrichten** – news from the EDPB, CJEU, BfDI, DSK, state authorities and the legal press,
  tagged by regulation and kind. Title, excerpt and link only; the text stays with the source.
- **Werkzeuge** – tools that turn one legal duty into a documented, citable result. Available:
  DPIA screening (Art. 35 DSGVO, WP 248, DSK must-list) and AI Act risk classification (Art. 5,
  Annex I/III, Art. 6(3), Art. 50, dates after Omnibus Regulation (EU) 2026/1744). Over twenty
  more are planned and listed in the catalogue.
- **Notizen** – a notebook tied to news items and assessments (in progress).

Not legal advice.

## Stack

SvelteKit 3 · Svelte 5 · TypeScript · Paraglide (de/en) · Drizzle + PostgreSQL 17 ·
Keycloak 26 via `openid-client` · node-cron feed worker · Vitest · Playwright.

## Local development

Requires Node 22+, pnpm and Docker.

```sh
pnpm install
cp .env.example .env
docker compose up -d        # Postgres on 5433, Keycloak on 8080 with the "daily" realm
pnpm db:migrate
pnpm worker:once            # fetch the news sources once
pnpm dev                    # http://localhost:5174
```

The imported realm contains a local test user; see `infra/keycloak/realm-daily.json`.
Those credentials only exist on your machine.

## Checks

```sh
pnpm check                  # svelte-check
pnpm lint                   # prettier + eslint
pnpm vitest run --project server
pnpm test:e2e               # needs the compose stack running
```

## Static preview

`pnpm build:static` builds a public preview without server, database or sign-in: every page is
prerendered, news is fetched from the sources at build time and filtered in the browser, and
the tools run in the browser without saving. Settings live in `.env.static`; set
`PUBLIC_BASE_PATH` (for example `/daily`) when the site is served from a sub-path.

```sh
PUBLIC_BASE_PATH=/daily pnpm build:static
PUBLIC_BASE_PATH=/daily pnpm preview:static   # http://localhost:4175/daily/
```

## Documentation

The product plan and design decisions are in
[`docs/superpowers/specs/2026-10-13-daily-design.md`](docs/superpowers/specs/2026-10-13-daily-design.md).
