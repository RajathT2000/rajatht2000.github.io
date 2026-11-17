// Unit checks (no browser) for the droplet deployment files.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test.describe('deploy files', () => {
  test('shell scripts have valid syntax and stop on errors', () => {
    for (const f of ['deploy/setup.sh', 'deploy/update.sh']) {
      execFileSync('bash', ['-n', path.join(root, f)]);
      expect(read(f)).toContain('set -euo pipefail');
    }
  });

  test('setup never removes other sites and never overwrites .env', () => {
    const s = read('deploy/setup.sh');
    expect(s).not.toMatch(/\brm\s+-?[rf]*\s+\/etc\/nginx/);
    expect(s).not.toMatch(/sites-enabled\/default/);
    expect(s).toMatch(/if \[ ! -f "\$APP\/\.env" \]; then/);
    expect(s).toContain('chmod 640 "$APP/.env"');
    expect(s).toContain('nginx -t');
  });

  test('setup defaults to rajatht.me and covers www for nginx + certbot', () => {
    const s = read('deploy/setup.sh');
    expect(s).toMatch(/DOMAIN="\$\{1:-rajatht\.me\}"/);
    expect(s).toContain('server_name $DOMAIN www.$DOMAIN;');
    expect(s).toContain('-d "$DOMAIN" -d "www.$DOMAIN"');
    expect(s).not.toContain('portfolio.rajatht.me');
  });

  test('nginx: API proxied to Node with real IP; only site files are public', () => {
    const n = read('deploy/nginx-portfolio.conf');
    expect(n).toContain('proxy_pass http://127.0.0.1:3000;');
    expect(n).toContain('proxy_set_header X-Real-IP $remote_addr;');
    expect(n).toMatch(/limit_req zone=portfolio_api/);
    expect(n).toMatch(/location \/ \{ return 404; \}/);
    expect(n).toMatch(/\(vendor\|cv\|audio\)/);
    expect(n).toContain('server_name DOMAIN;');
  });

  test('systemd service reads the key from .env and runs as an unprivileged user', () => {
    const u = read('deploy/portfolio-api.service');
    expect(u).toContain('EnvironmentFile=/var/www/portfolio/.env');
    expect(u).toContain('User=portfolio');
    expect(u).toContain('NoNewPrivileges=true');
    expect(u).toMatch(/^ExecStart=NODE_BIN server\/server\.js$/m);
  });

  test('no real secrets in the repo', () => {
    for (const f of ['.env.example', 'deploy/setup.sh', 'deploy/portfolio-api.service', 'deploy/nginx-portfolio.conf', 'server/server.js', 'DEPLOY.md']) {
      expect(read(f), f).not.toMatch(/sk-(proj-)?[A-Za-z0-9_-]{20,}/);
    }
    expect(read('.env.example')).toContain('OPENAI_API_KEY=sk-your-key-here');
    expect(fs.existsSync(path.join(root, '.env')) ? read('.gitignore') : '.env').toMatch(/\.env/);
  });

  // Requirement change 2026-11-17: voice intro removed, so DEPLOY.md no longer has a recording section.
  test('DEPLOY.md explains DNS, setup, the key and updates', () => {
    const d = read('DEPLOY.md');
    for (const s of ['rajatht.me', 'www.rajatht.me', 'setup.sh', 'OPENAI_API_KEY', 'update.sh']) expect(d).toContain(s);
    expect(d).not.toContain('audio/intro.mp3');
  });
});
