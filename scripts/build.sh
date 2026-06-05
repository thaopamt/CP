#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# deploy.sh — Manual deployment script for CP System
# SSH into server → cd /opt/cp-system → bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

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
echo "→ Building Docker images (API & Web)..."
docker compose build api web

echo "→ Restarting services (API & Web)..."
# docker compose down --remove-orphans
docker compose up -d api web

# ── Wait for API readiness ───────────────────────────────────────────
echo "→ Waiting for API to be ready..."
for i in {1..30}; do
  if docker exec cp_api wget -q --spider http://localhost:3000/api 2>/dev/null; then
    echo "  ✓ API ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "  ⚠ API is not ready yet. Please check logs."
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

docker compose ps
