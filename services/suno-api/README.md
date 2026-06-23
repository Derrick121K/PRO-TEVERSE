# PRO-TEVERSE Suno service

Bundled [gcui-art/suno-api](https://github.com/gcui-art/suno-api) fork for text-to-music in the DAW. Runs as its **own Node process** (Playwright + 2Captcha + Suno cookie) â€” not inside the main Next.js serverless bundle.

## Setup

1. Copy `.env.example` â†’ `.env` in this folder.
2. Fill `SUNO_COOKIE` and `TWOCAPTCHA_KEY` (see [docs/SUNO_DEPLOY.md](../../docs/SUNO_DEPLOY.md)).
3. From repo root:

```bash
npm run suno:install
npm run suno:dev
```

API: `http://localhost:3001` â€” test `http://localhost:3001/api/get_limit`

## Docker

From repo root:

```bash
# Add services/suno-api/.env first
docker compose up suno-api --build
```

## License

Upstream suno-api is LGPL-3.0-or-later. See [LICENSE](./LICENSE).

