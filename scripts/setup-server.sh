#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# setup-server.sh — One-script setup for CP System on Ubuntu
#
# Usage:  curl the repo or scp this script, then:
#         chmod +x setup-server.sh && sudo bash setup-server.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

APP_DIR="/opt/cp-system"
DOMAIN="cp.thaopamt.site"
COMPOSE_FILE="docker/docker-compose.production.yml"
REPO_URL="https://github.com/thaopamt/CP.git"

# ── Helpers ───────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }

header() {
    echo ""
    echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
    echo ""
}

ask() {
    local prompt="$1"
    local var_name="$2"
    local default="${3:-}"
    if [ -n "$default" ]; then
        read -rp "$(echo -e "${YELLOW}?${NC} ${prompt} [${default}]: ")" value
        eval "$var_name=\"${value:-$default}\""
    else
        read -rp "$(echo -e "${YELLOW}?${NC} ${prompt}: ")" value
        eval "$var_name=\"$value\""
    fi
}

ask_secret() {
    local prompt="$1"
    local var_name="$2"
    read -srp "$(echo -e "${YELLOW}?${NC} ${prompt}: ")" value
    echo ""
    eval "$var_name=\"$value\""
}

confirm() {
    read -rp "$(echo -e "${YELLOW}?${NC} $1 (y/n) [y]: ")" yn
    case "${yn:-y}" in
        [Yy]*) return 0 ;;
        *) return 1 ;;
    esac
}

# ── Check root ────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    error "Vui lòng chạy với sudo: sudo bash $0"
fi

# Detect the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"

header "CP System — Server Setup"
echo -e "  Domain:  ${CYAN}${DOMAIN}${NC}"
echo -e "  App dir: ${CYAN}${APP_DIR}${NC}"
echo -e "  User:    ${CYAN}${ACTUAL_USER}${NC}"
echo ""

# ══════════════════════════════════════════════════════════════════════
# STEP 1: Install Docker
# ══════════════════════════════════════════════════════════════════════
header "Step 1/6 — Docker"

if command -v docker &>/dev/null; then
    success "Docker đã được cài: $(docker --version)"
else
    info "Đang cài Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release > /dev/null

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null

    usermod -aG docker "$ACTUAL_USER"
    success "Docker đã cài xong: $(docker --version)"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 2: Install Nginx
# ══════════════════════════════════════════════════════════════════════
header "Step 2/6 — Nginx"

if command -v nginx &>/dev/null; then
    success "Nginx đã được cài: $(nginx -v 2>&1)"
else
    info "Đang cài Nginx..."
    apt-get install -y -qq nginx > /dev/null
    systemctl enable nginx
    success "Nginx đã cài xong"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 3: Clone repo
# ══════════════════════════════════════════════════════════════════════
header "Step 3/6 — Source code"

if [ -d "$APP_DIR/.git" ]; then
    success "Repo đã tồn tại tại ${APP_DIR}"
    info "Pulling latest code..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
    success "Code đã cập nhật"
else
    info "Đang clone repo..."
    git clone "$REPO_URL" "$APP_DIR"
    success "Clone xong tại ${APP_DIR}"
fi

chown -R "$ACTUAL_USER":"$ACTUAL_USER" "$APP_DIR"
cd "$APP_DIR"

# ══════════════════════════════════════════════════════════════════════
# STEP 4: Create .env
# ══════════════════════════════════════════════════════════════════════
header "Step 4/6 — Cấu hình .env"

if [ -f "$APP_DIR/.env" ]; then
    warn "File .env đã tồn tại!"
    if ! confirm "Bạn muốn tạo lại .env mới?"; then
        success "Giữ nguyên .env cũ"
        SKIP_ENV=true
    else
        SKIP_ENV=false
    fi
else
    SKIP_ENV=false
fi

if [ "$SKIP_ENV" = false ]; then
    echo ""
    echo -e "${CYAN}Nhập thông tin cấu hình (nhấn Enter để dùng giá trị mặc định):${NC}"
    echo ""

    # Database
    ask "Database username" DB_USER "cp"
    ask "Database name" DB_NAME "cp"

    # Generate strong defaults
    DEFAULT_DB_PASS=$(openssl rand -base64 24)
    DEFAULT_JWT_SECRET=$(openssl rand -base64 32)

    echo ""
    echo -e "  Password database (auto-generated): ${CYAN}${DEFAULT_DB_PASS}${NC}"
    if confirm "Dùng password tự động này?"; then
        DB_PASSWORD="$DEFAULT_DB_PASS"
    else
        ask_secret "Nhập database password" DB_PASSWORD
    fi

    echo ""
    echo -e "  JWT Secret (auto-generated): ${CYAN}${DEFAULT_JWT_SECRET}${NC}"
    if confirm "Dùng JWT secret tự động này?"; then
        JWT_SECRET="$DEFAULT_JWT_SECRET"
    else
        ask_secret "Nhập JWT secret" JWT_SECRET
    fi

    ask "JWT expires in" JWT_EXPIRES_IN "1d"

    # Write .env
    cat > "$APP_DIR/.env" << EOF
# ── Generated by setup-server.sh at $(date) ──
# Postgres
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}

# CORS
CORS_ORIGIN=https://${DOMAIN}

# Web
VITE_API_URL=/api
EOF

    chown "$ACTUAL_USER":"$ACTUAL_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    success ".env đã tạo xong (chmod 600)"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 5: Setup Nginx + Deploy app
# ══════════════════════════════════════════════════════════════════════
header "Step 5/6 — Nginx config & Deploy"

# Install nginx config
info "Cài đặt Nginx config cho ${DOMAIN}..."
cp "$APP_DIR/docker/nginx/cp-system.conf" /etc/nginx/sites-available/cp-system
ln -sf /etc/nginx/sites-available/cp-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    success "Nginx config OK"
else
    error "Nginx config lỗi! Kiểm tra: nginx -t"
fi

# Deploy with docker compose
info "Building Docker images (lần đầu sẽ mất vài phút)..."
cd "$APP_DIR"
sudo -u "$ACTUAL_USER" docker compose -f "$COMPOSE_FILE" --env-file .env build

info "Starting services..."
sudo -u "$ACTUAL_USER" docker compose -f "$COMPOSE_FILE" --env-file .env up -d

info "Đợi PostgreSQL khởi động..."
for i in {1..30}; do
  if docker exec cp_postgres pg_isready -U ${DB_USER:-cp} 2>/dev/null; then
    success "PostgreSQL đã sẵn sàng"
    break
  fi
  if [ $i -eq 30 ]; then
    warn "PostgreSQL timeout — kiểm tra logs"
  fi
  sleep 2
done
success "Tất cả services đã chạy"

echo ""
sudo -u "$ACTUAL_USER" docker compose -f "$COMPOSE_FILE" --env-file .env ps
echo ""

# ══════════════════════════════════════════════════════════════════════
# STEP 6: Cloudflare Tunnel
# ══════════════════════════════════════════════════════════════════════
header "Step 6/6 — Cloudflare Tunnel"

if command -v cloudflared &>/dev/null; then
    success "cloudflared đã được cài"
else
    info "Đang cài cloudflared..."
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
    dpkg -i /tmp/cloudflared.deb > /dev/null
    rm -f /tmp/cloudflared.deb
    success "cloudflared đã cài: $(cloudflared --version)"
fi

echo ""
echo -e "${BOLD}Bây giờ bạn cần tạo Tunnel trên Cloudflare:${NC}"
echo ""
echo -e "  1. Vào ${CYAN}https://dash.cloudflare.com${NC}"
echo -e "  2. Chọn domain ${CYAN}thaopamt.site${NC}"
echo -e "  3. ${CYAN}Zero Trust${NC} → ${CYAN}Networks${NC} → ${CYAN}Tunnels${NC} → ${CYAN}Create a tunnel${NC}"
echo -e "  4. Chọn ${CYAN}Cloudflared${NC} → Đặt tên: ${CYAN}cp-system${NC}"
echo -e "  5. Copy ${BOLD}TOKEN${NC} từ lệnh cài đặt mà Cloudflare hiển thị"
echo -e "  6. Thêm Public Hostname:"
echo -e "     • Subdomain: ${CYAN}cp${NC}"
echo -e "     • Domain: ${CYAN}thaopamt.site${NC}"
echo -e "     • Type: ${CYAN}HTTP${NC}"
echo -e "     • URL: ${CYAN}localhost:80${NC}"
echo ""

ask "Paste Cloudflare Tunnel TOKEN vào đây (hoặc Enter để bỏ qua)" CF_TOKEN ""

if [ -n "$CF_TOKEN" ]; then
    info "Cài đặt cloudflared service..."
    cloudflared service install "$CF_TOKEN" 2>/dev/null || true
    systemctl enable cloudflared 2>/dev/null || true
    systemctl start cloudflared 2>/dev/null || true
    
    sleep 3
    if systemctl is-active --quiet cloudflared 2>/dev/null; then
        success "Cloudflare Tunnel đang chạy!"
    else
        warn "Tunnel chưa chạy. Kiểm tra: systemctl status cloudflared"
    fi
else
    warn "Bỏ qua Cloudflare Tunnel. Chạy sau:"
    echo -e "  ${CYAN}sudo cloudflared service install YOUR_TOKEN${NC}"
fi

# ══════════════════════════════════════════════════════════════════════
# DONE
# ══════════════════════════════════════════════════════════════════════
header "✅ Setup hoàn tất!"

echo -e "  🌐 Website: ${CYAN}https://${DOMAIN}${NC}"
echo -e "  📂 App dir: ${CYAN}${APP_DIR}${NC}"
echo ""
echo -e "  ${BOLD}Deploy lần sau:${NC}"
echo -e "  ${CYAN}cd ${APP_DIR} && bash scripts/deploy.sh${NC}"
echo ""
echo -e "  ${BOLD}Xem logs:${NC}"
echo -e "  ${CYAN}cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} logs -f${NC}"
echo ""
echo -e "  ${BOLD}Tunnel status:${NC}"
echo -e "  ${CYAN}sudo systemctl status cloudflared${NC}"
echo ""
