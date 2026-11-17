# Deploying the portfolio to your droplet (rajatht.me)

The live site is **https://rajatht.me** (and **https://www.rajatht.me**), on the same droplet as Split.
The droplet runs two things:

- **nginx** serves the website files straight from the git checkout in `/var/www/portfolio`.
- **A small Node server** (`server/server.js`) answers the "Ask me" chat with OpenAI. Your API key stays on the droplet in `/var/www/portfolio/.env` and never reaches the browser or GitHub.

If the AI is off, out of credit or rate-limited, the chat falls back to the built-in answers, so it never breaks.
GitHub Pages (rajatht2000.github.io) keeps working too, with the built-in answers.

## 1. DNS (once)

At your DNS provider for `rajatht.me` (Namecheap / registrar-servers), point the apex at your droplet (`170.64.205.143`). Keep `www` as a CNAME to the apex:

| Type | Name | Value |
|---|---|---|
| A | `@` | `170.64.205.143` |
| CNAME | `www` | `rajatht.me.` |

Replace the old A record for `@` if it still points elsewhere. Leave the `www` CNAME as-is if it already targets `rajatht.me`.
Leave `split` as it is (already on this droplet). `portfolio` is unused now; you can delete that A record later.
Check with `dig +short rajatht.me` and `dig +short www.rajatht.me`: both should resolve to `170.64.205.143`.

## 2. Setup on the droplet (once)

```bash
ssh root@170.64.205.143
git clone https://github.com/RajathT2000/rajatht2000.github.io.git /var/www/portfolio
bash /var/www/portfolio/deploy/setup.sh rajatht.me rajatht@icloud.com
```

`setup.sh` installs nginx, certbot, git and Node 18+ if missing, then adds a **new** nginx site for `rajatht.me` and `www.rajatht.me`.
It doesn't touch your other sites, such as `split.rajatht.me`.
It also gets a free HTTPS certificate and starts the `portfolio-api` service.

## 3. Add your OpenAI key (once)

```bash
nano /var/www/portfolio/.env        # set OPENAI_API_KEY=sk-...
systemctl restart portfolio-api
curl -s http://127.0.0.1:3000/api/health   # → {"ok":true,"ai":true}
```

The other settings in `.env`:
- `OPENAI_MODELS`: comma-separated chat models tried in order (default `gpt-5.4,gpt-5.2,gpt-5.1`). Or set a single `OPENAI_MODEL`.
- `RATE_LIMIT`: questions per visitor per 10 minutes.
- `DAILY_CAP`: the most AI answers per day, which caps your cost.

Also set a monthly spending limit in your OpenAI dashboard.

## 4. Updating: the Cursor workflow

1. Edit in Cursor, on your Mac, in the `portfolio` folder.
2. Run `npm test`. The full suite must pass.
3. Run `git push`. This updates GitHub and GitHub Pages.
4. On the droplet, run `sudo bash /var/www/portfolio/deploy/update.sh`. It pulls and restarts.

You can also open the droplet itself in Cursor with **Remote-SSH**: connect to `root@170.64.205.143` and open `/var/www/portfolio`. Then run `deploy/update.sh` from Cursor's terminal.

Logs: `journalctl -u portfolio-api -f`. nginx config: `/etc/nginx/sites-available/portfolio`.
