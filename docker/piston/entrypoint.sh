#!/bin/sh
# Entrypoint wrapper for Piston container.
# 1. Patch isolate cgroup flags (fixes cgroup v2 on Docker Desktop macOS/Windows)
# 2. Start the Piston API server in the background
# 3. Run the package-init script (installs runtimes if missing)
# 4. Wait on the API server process so the container stays alive

# ── Fix cgroup v2 compatibility ──────────────────────────────────────
CGROUP_TYPE=$(stat -f -c %T /sys/fs/cgroup/ 2>/dev/null || echo "unknown")
if [ "$CGROUP_TYPE" = "cgroup2fs" ]; then
  echo "[entrypoint] Detected cgroup v2 — patching isolate flags..."
  node /piston/patch-cgroup.js
  echo "[entrypoint] Patching complete."
fi

# Start Piston API
node /piston_api/src/index.js &
PISTON_PID=$!

# Install required packages (idempotent – skips already-installed ones)
node /piston/init-packages.js

# Keep container alive by waiting on the main process
wait $PISTON_PID
