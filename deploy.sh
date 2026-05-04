#!/bin/bash
set -e

cd ~/search

echo "=== Pulling latest code ==="
git pull

echo "=== Restarting containers ==="
docker compose up -d --build

echo "=== Waiting for services ==="
sleep 15

echo "=== Checking services ==="
curl -s http://localhost:8000/health
echo ""

echo "=== Done! ==="
