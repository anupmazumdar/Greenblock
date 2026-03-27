#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/pi/Greenblock"
SERVICE_DIR="$ROOT_DIR/deploy/systemd"

sudo chmod +x "$SERVICE_DIR/install-systemd.sh" || true
sudo chmod +x "$SERVICE_DIR/auto-update.sh" || true

sudo cp "$SERVICE_DIR/greenblock-backend.service" /etc/systemd/system/
sudo cp "$SERVICE_DIR/greenblock-serial-bridge.service" /etc/systemd/system/
sudo cp "$SERVICE_DIR/greenblock-autoupdate.service" /etc/systemd/system/
sudo cp "$SERVICE_DIR/greenblock-autoupdate.timer" /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable greenblock-backend.service
sudo systemctl enable greenblock-serial-bridge.service
sudo systemctl enable greenblock-autoupdate.timer

sudo systemctl restart greenblock-backend.service
sudo systemctl restart greenblock-serial-bridge.service
sudo systemctl restart greenblock-autoupdate.timer

echo "Services installed and started."
echo "Check status:"
echo "  sudo systemctl status greenblock-backend"
echo "  sudo systemctl status greenblock-serial-bridge"
echo "  sudo systemctl status greenblock-autoupdate.timer"
echo
echo "Watch updater logs:"
echo "  journalctl -u greenblock-autoupdate.service -n 100 --no-pager"
