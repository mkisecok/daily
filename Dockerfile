# Daily: one image for the web app, the news worker and the migration runner.
#
#   app      node build                    (default)
#   worker   node build-worker/index.js
#   migrate  node build-worker/migrate.js
#
# Configuration comes from the environment at runtime (see infra/env.prod.example).

FROM node:24.22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack install -g pnpm@11
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
# placeholders only satisfy env validation while building; nothing connects to them
# and the runtime stage does not keep them
RUN DATABASE_URL=postgres://build:build@127.0.0.1:1/build \
	KEYCLOAK_ISSUER=https://build.invalid/realms/daily \
	KEYCLOAK_CLIENT_ID=build \
	KEYCLOAK_CLIENT_SECRET=build \
	APP_ORIGIN=https://build.invalid \
	sh -c 'pnpm i18n:compile && pnpm build && pnpm build:worker && pnpm build:migrate'
RUN pnpm prune --prod --ignore-scripts

FROM node:24.22-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/build-worker ./build-worker
COPY --from=build --chown=node:node /app/drizzle ./drizzle
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "build"]
