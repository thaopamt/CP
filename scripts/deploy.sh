#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# deploy.sh — Manual deployment script for CP System
# SSH into server → cd /opt/cp-system → bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/cp-system"
COMPOSE_FILE="docker/docker-compose.production.yml"

echo "══════════════════════════════════════════════════"
echo "  CP System — Deploying to cp.thaopamt.site"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════════"

cd "$APP_DIR"

# ── Pull latest code ──────────────────────────────────────────────────
echo "→ Pulling latest code from main..."
git fetch origin main
git reset --hard origin/main

# ── Build & deploy ────────────────────────────────────────────────────
echo "→ Building Docker images..."
docker compose -f "$COMPOSE_FILE" build

echo "→ Restarting services..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker compose -f "$COMPOSE_FILE" up -d

# ── Wait for health checks ───────────────────────────────────────────
echo "→ Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker exec cp_postgres pg_isready -U cp 2>/dev/null; do sleep 2; done'
echo "  ✓ PostgreSQL ready"

# ── Cleanup ───────────────────────────────────────────────────────────
echo "→ Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deploy completed!"
echo "  🌐 https://cp.thaopamt.site"
echo "══════════════════════════════════════════════════"
echo ""

docker compose -f "$COMPOSE_FILE" ps
