# PRO-TEVERSE Suno (Text to Music)

Full songs in the DAW use a **bundled Suno API service** at [`services/suno-api`](../services/suno-api) â€” a fork of [gcui-art/suno-api](https://github.com/gcui-art/suno-api) (Playwright + 2Captcha + your Suno account cookie).

The main app (`npm run dev`, port **3000**) only needs `SUNO_API_URL`. Secrets live in **`services/suno-api/.env`**, not in PRO-TEVERSE.

---

## Quick start (local)

### 1. Configure the Suno service

```bash
cd services/suno-api
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `services/suno-api/.env`:

| Variable | How to get it |
|----------|----------------|
| `SUNO_COOKIE` | Log in at [suno.com/create](https://suno.com/create) â†’ **F12** â†’ **Network** â†’ refresh â†’ request with `?__clerk_api_version` â†’ **Headers** â†’ full **Cookie** |
| `TWOCAPTCHA_KEY` | [2Captcha](https://2captcha.com/enterpage#recognition) API key |
| `BROWSER` | `chromium` |
| `BROWSER_HEADLESS` | `true` |
| `BROWSER_GHOST_CURSOR` | `false` |
| `BROWSER_LOCALE` | `en` |

### 2. Install and run

From repo root:

```bash
npm run suno:install
npm run suno:dev
```

Service listens on **http://localhost:3001**. Test: [http://localhost:3001/api/get_limit](http://localhost:3001/api/get_limit)

### 3. Point PRO-TEVERSE at it

`.env.local` (already the default in `.env.example`):

```bash
SUNO_API_URL=http://localhost:3001
```

Restart the DAW (`npm run dev`). In the studio, use **Text to Music** â€” tracks appear as **audio clips** on the timeline.

Settings â†’ **General** shows Suno quota when the service is up.

---

## Docker

Create `services/suno-api/.env` first, then from repo root:

```bash
npm run docker:suno
# or: docker compose up suno-api --build
```

Host port **3001** â†’ container **3000**.

---

## Two terminals (typical dev)

| Terminal | Command | URL |
|----------|---------|-----|
| 1 | `npm run suno:dev` | http://localhost:3001 |
| 2 | `npm run dev` | http://localhost:3000 |

---

## Troubleshooting

**`Please provide a cookieâ€¦`** â€” `SUNO_COOKIE` missing or expired in `services/suno-api/.env`. Refresh from suno.com and restart `npm run suno:dev`.

**Quota card / Text to Music fails** â€” Confirm `http://localhost:3001/api/get_limit` returns JSON, not HTML. Check `SUNO_API_URL` in `.env.local` and restart the DAW.

**Generation slow** â€” Suno + captcha often takes 1â€“3 minutes; the AI panel shows a loading hint.

---

## Optional: external deployment

You can host `services/suno-api` on a VPS with Docker ([Railway](https://railway.app), [Render](https://render.com), etc.) and set:

```bash
SUNO_API_URL=https://your-suno-host.example.com
```

**Vercel Hobby is not recommended** â€” too many API routes and large Playwright bundles (12-function limit, 250 MB per function). See legacy notes in git history or `services/suno-api/vercel.json` if you use Vercel Pro.

If an old Vercel deploy uses **Deployment Protection**, either disable it or set `SUNO_VERCEL_BYPASS` in PRO-TEVERSE `.env.local` (see `lib/suno-client.ts`).

Never put `SUNO_COOKIE` or `TWOCAPTCHA_KEY` in PRO-TEVERSE â€” only on the Suno service.

