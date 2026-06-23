# PRO-TEVERSE services

| Service | Path | Port | Purpose |
|---------|------|------|---------|
| Suno API | [suno-api](./suno-api) | 3001 | Text-to-music via Suno.ai (Playwright) |

The main DAW app (`npm run dev`) stays on port **3000** and calls the Suno service via `SUNO_API_URL`.

