#!/bin/bash
set -e

echo "[1] Installing backend dependencies..."
cd ~/record-collection/backend
pip3 install flask

echo "[2] Installing frontend..."
cd ../frontend
npm install
npm run build

echo "[3] Copying NGINX config..."
sudo cp ../deploy/nginx.conf /etc/nginx/sites-enabled/record-collection

echo "[4] Reloading NGINX..."
sudo nginx -t && sudo systemctl restart nginx

echo "[5] Enabling systemd service..."
sudo cp ../deploy/record-collection.service /etc/systemd/system/
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable record-collection
sudo systemctl start record-collection

echo "✅ Deployment complete."
