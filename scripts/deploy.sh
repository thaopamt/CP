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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# ── Pull latest code ──────────────────────────────────────────────────
if [ -d ".git" ]; then
  if ! git diff --quiet 2>/dev/null; then
    echo "⚠️  Phát hiện thay đổi chưa commit. Bỏ qua git pull để bảo vệ code của bạn."
  else
    echo "→ Pulling latest code from main..."
    git fetch origin main 2>/dev/null || true
    git reset --hard origin/main 2>/dev/null || true
  fi
fi

# ── Build & deploy ────────────────────────────────────────────────────
echo "→ Building Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file .env build

echo "→ Restarting services..."
docker compose -f "$COMPOSE_FILE" --env-file .env down --remove-orphans
docker compose -f "$COMPOSE_FILE" --env-file .env up -d

# ── Wait for health checks ───────────────────────────────────────────
echo "→ Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec cp_postgres pg_isready -U cp 2>/dev/null; then
    echo "  ✓ PostgreSQL ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "  ✗ PostgreSQL is not ready yet. Please check logs."
  fi
  sleep 2
done

# ── Cleanup ───────────────────────────────────────────────────────────
echo "→ Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deploy completed!"
echo "  🌐 https://cp.thaopamt.site"
echo "══════════════════════════════════════════════════"
echo ""

docker compose -f "$COMPOSE_FILE" --env-file .env ps
