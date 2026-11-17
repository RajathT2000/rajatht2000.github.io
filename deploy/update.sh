#!/usr/bin/env bash
# Pull the latest code and restart the API. Run on the droplet:  sudo bash /var/www/portfolio/deploy/update.sh
set -euo pipefail
APP=/var/www/portfolio
BRANCH="${BRANCH:-main}"
git -C "$APP" fetch --quiet origin "$BRANCH"
git -C "$APP" checkout --quiet "$BRANCH"
git -C "$APP" pull --ff-only --quiet
systemctl restart portfolio-api
sleep 1
curl -fsS http://127.0.0.1:3000/api/health && echo
echo "Updated to $(git -C "$APP" log -1 --format='%h %s')"
