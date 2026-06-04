#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# deploy-remote.sh — Deploy từ máy LOCAL lên server qua SSH
#
# Cách dùng:
#   ./scripts/deploy-remote.sh                # dùng host mặc định (ubuntu)
#   ./scripts/deploy-remote.sh ubuntu-cp      # chỉ định SSH host khác
#
# Script sẽ SSH vào server → cd /opt/cp-system → chạy scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# SSH host: lấy từ tham số đầu tiên, mặc định "ubuntu"
SSH_HOST="${1:-ubuntu}"
APP_DIR="/opt/cp-system"

echo "══════════════════════════════════════════════════"
echo "  CP System — Remote deploy"
echo "  Host : $SSH_HOST"
echo "  Dir  : $APP_DIR"
echo "  Time : $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════════"

# Kiểm tra kết nối SSH trước
echo "→ Kiểm tra kết nối SSH tới '$SSH_HOST'..."
if ! ssh -o ConnectTimeout=10 "$SSH_HOST" "true" 2>/dev/null; then
  echo "✗ Không SSH được vào '$SSH_HOST'. Kiểm tra ~/.ssh/config hoặc thử: ssh $SSH_HOST"
  exit 1
fi
echo "  ✓ Kết nối OK"

# Chạy deploy trên server. -t để hiển thị output realtime.
echo "→ Đang chạy deploy trên server..."
ssh -t "$SSH_HOST" "cd '$APP_DIR' && bash scripts/deploy.sh"

echo ""
echo "✅ Hoàn tất! 🌐 https://cp.thaopamt.site"
