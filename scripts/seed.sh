#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# seed.sh — Seeding script for CP System
# Works locally on Mac/PC and inside production server using Docker!
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colors ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠️${NC} $1"; }

cd "$PROJECT_ROOT"

# Load environment variables if .env exists
if [ -f ".env" ]; then
  # Read .env line by line, ignore comments and empty lines
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
      export "$line"
    fi
  done < .env
fi

# Determine if we are running in Docker mode or Local mode
DOCKER_MODE=false
if ! command -v pnpm &>/dev/null || ! command -v node &>/dev/null; then
  DOCKER_MODE=true
fi

# Allow overriding mode via argument (e.g. ./scripts/seed.sh --docker)
if [ "${1:-}" = "--docker" ]; then
  DOCKER_MODE=true
elif [ "${1:-}" = "--local" ]; then
  DOCKER_MODE=false
fi

# ── Docker Seeding Mode ──────────────────────────────────────────────
if [ "$DOCKER_MODE" = true ]; then
  info "Đang chạy seed data bằng DOCKER container..."

  # Find the network name
  NETWORK_NAME=$(docker network ls --format "{{.Name}}" | grep -E "docker_default|cp-system_default" | head -n 1 || echo "docker_default")

  info "Kết nối tới database network: ${NETWORK_NAME}"

  # Set database host to container name inside docker network
  export DB_HOST="postgres"

  docker run --rm \
    --network "$NETWORK_NAME" \
    -v "$PROJECT_ROOT":/app \
    -w /app \
    -e DB_HOST="cp_postgres" \
    -e DB_PORT="${DB_PORT:-5432}" \
    -e DB_USER="${DB_USER:-cp}" \
    -e DB_PASSWORD="${DB_PASSWORD:-cp}" \
    -e DB_NAME="${DB_NAME:-cp}" \
    -e JWT_SECRET="${JWT_SECRET:-dev-only-change-me}" \
    -e NODE_ENV="production" \
    node:20-alpine \
    sh -c "
      echo '→ Đang cài đặt dependencies...' &&
      corepack enable &&
      corepack prepare pnpm@9.12.0 --activate &&
      pnpm install --frozen-lockfile --prod=false &&
      echo '→ Đang chạy Database Schema Sync...' &&
      pnpm nx run api:typeorm-sync &&
      echo '→ Bắt đầu seeding Users & Classes...' &&
      pnpm nx run api:seed &&
      echo '→ Bắt đầu seeding Quests...' &&
      pnpm nx run api:seed:quests
    "

# ── Local Seeding Mode ───────────────────────────────────────────────
else
  info "Đang chạy seed data bằng Node.js LOCAL..."
  
  export DB_HOST="${DB_HOST:-localhost}"
  
  info "Đang chạy Database Schema Sync..."
  pnpm nx run api:typeorm-sync
  
  info "Bắt đầu seeding Users & Classes..."
  pnpm nx run api:seed
  
  info "Bắt đầu seeding Quests..."
  pnpm nx run api:seed:quests
fi

success "Hoàn tất seeding dữ liệu thành công!"
