#!/bin/sh
# Deploys the current image on the server: pull, migrate, restart.
#
#   cd /opt/daily/infra && DAILY_TAG=sha-abc1234 ./deploy.sh
#
# DAILY_TAG defaults to `main`. Secrets live in /opt/daily/.env.
set -eu
cd "$(dirname "$0")"
compose="docker compose --env-file /opt/daily/.env -f compose.prod.yml"

$compose pull
$compose --profile deploy run --rm migrate
$compose up -d --remove-orphans
$compose ps
