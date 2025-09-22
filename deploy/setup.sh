#!/bin/bash
set -euo pipefail

REPO_DIR="$HOME/record-collection"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"

echo "[1] Installing backend dependencies..."
python3 -m venv "$BACKEND_DIR/venv"
source "$BACKEND_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

echo "[2] Building frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "[3] Deploying NGINX configuration..."
sudo install -m644 "$REPO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/record-collection
sudo ln -sf /etc/nginx/sites-available/record-collection /etc/nginx/sites-enabled/record-collection
sudo nginx -t
sudo systemctl reload nginx

echo "[4] Setting up systemd service..."
sudo install -m644 "$REPO_DIR/deploy/record-collection.service" /etc/systemd/system/record-collection.service
sudo systemctl daemon-reload
sudo systemctl enable --now record-collection.service

echo "✅ Deployment complete."
