#!/usr/bin/env bash
# One-time setup of the portfolio on an Ubuntu droplet. Safe to re-run.
# Usage (as root on the droplet):  bash deploy/setup.sh rajatht.me you@example.com
# It ADDS a new nginx site; it never removes or edits your other sites (e.g. split.rajatht.me).
set -euo pipefail

DOMAIN="${1:-rajatht.me}"
EMAIL="${2:-}"
APP=/var/www/portfolio
REPO=https://github.com/RajathT2000/rajatht2000.github.io.git
BRANCH="${BRANCH:-main}"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }

echo "==> Packages"
apt-get update -y
command -v nginx   >/dev/null || apt-get install -y nginx
command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
command -v git     >/dev/null || apt-get install -y git
need_node() { ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; }
if need_node; then
  apt-get install -y nodejs || true
  if need_node; then snap install node --classic --channel=20/stable; export PATH="$PATH:/snap/bin"; fi
fi
NODE_BIN="$(command -v node)"
echo "   node $(node -v) at $NODE_BIN"

echo "==> App user + code in $APP"
id portfolio >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin portfolio
if [ -d "$APP/.git" ]; then
  git -C "$APP" fetch --quiet origin "$BRANCH" && git -C "$APP" checkout --quiet "$BRANCH" && git -C "$APP" pull --ff-only --quiet
else
  git clone --quiet --branch "$BRANCH" "$REPO" "$APP"
fi

echo "==> .env (your OpenAI key lives only here)"
if [ ! -f "$APP/.env" ]; then
  cp "$APP/.env.example" "$APP/.env"
  echo "   Created $APP/.env, edit it and set OPENAI_API_KEY, then: systemctl restart portfolio-api"
fi
chown root:portfolio "$APP/.env"
chmod 640 "$APP/.env"

echo "==> API service"
sed "s#^ExecStart=NODE_BIN #ExecStart=$NODE_BIN #" "$APP/deploy/portfolio-api.service" > /etc/systemd/system/portfolio-api.service
chmod 644 /etc/systemd/system/portfolio-api.service
systemctl daemon-reload
systemctl enable --now portfolio-api
systemctl restart portfolio-api

echo "==> nginx site for $DOMAIN and www.$DOMAIN"
sed "s/server_name DOMAIN;/server_name $DOMAIN www.$DOMAIN;/" "$APP/deploy/nginx-portfolio.conf" > /etc/nginx/sites-available/portfolio
ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
nginx -t
systemctl reload nginx

echo "==> HTTPS (needs DNS for $DOMAIN and www.$DOMAIN pointing at this droplet)"
if [ -n "$EMAIL" ]; then
  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" --redirect || echo "   certbot failed: check DNS, then re-run this script."
else
  echo "   Skipped. Re-run with your email as 2nd argument to get a free certificate."
fi

echo "==> Check"
sleep 1
curl -fsS http://127.0.0.1:3000/api/health && echo
echo "Done. Visit https://$DOMAIN"
