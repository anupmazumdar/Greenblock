#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/pi/Greenblock"
BRANCH="main"

log() {
  echo "[greenblock-autoupdate] $1"
}

run_as_pi() {
  sudo -u pi -H bash -lc "$1"
}

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Repo not found at $REPO_DIR. Skipping."
  exit 0
fi

# Avoid automatic pulls if local uncommitted changes exist on Pi.
if [[ -n "$(run_as_pi "cd '$REPO_DIR' && git status --porcelain")" ]]; then
  log "Local changes detected on Pi. Auto-update skipped to avoid conflicts."
  exit 0
fi

run_as_pi "cd '$REPO_DIR' && git fetch origin '$BRANCH'"

LOCAL_SHA="$(run_as_pi "cd '$REPO_DIR' && git rev-parse HEAD")"
REMOTE_SHA="$(run_as_pi "cd '$REPO_DIR' && git rev-parse origin/$BRANCH")"

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
  log "Already up to date ($LOCAL_SHA)."
  exit 0
fi

log "Updating $LOCAL_SHA -> $REMOTE_SHA"
run_as_pi "cd '$REPO_DIR' && git pull --ff-only origin '$BRANCH'"

CHANGED_FILES="$(run_as_pi "cd '$REPO_DIR' && git diff --name-only '$LOCAL_SHA' HEAD")"

# Restart backend stack if backend/config/systemd changed.
if echo "$CHANGED_FILES" | grep -qE '^greenblock-backend/|^deploy/systemd/|^README.md'; then
  log "Backend-related changes detected; restarting backend services."
  systemctl restart greenblock-backend.service || true
  systemctl restart greenblock-serial-bridge.service || true
fi

# Rebuild frontend dist if frontend files changed.
if echo "$CHANGED_FILES" | grep -qE '^greenblock-frontend/'; then
  if command -v npm >/dev/null 2>&1; then
    log "Frontend changes detected; rebuilding frontend dist."
    run_as_pi "cd '$REPO_DIR/greenblock-frontend' && npm ci && npm run build"
  else
    log "npm not found; frontend rebuild skipped."
  fi
fi

log "Auto-update complete."
