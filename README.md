# URL Shortener Monorepo

Full-stack URL shortener with a Backend‑for‑Frontend (BFF) that owns all auth and data access. The browser never stores access/refresh tokens; it only keeps an HttpOnly `sid` cookie issued by the API.

## Features
- Public short URL redirects cached in Redis
- Authenticated dashboard to create and list your URLs
- GitHub OAuth handled server-side with Supabase
- Session storage + refresh in Redis (no tokens in the SPA)
- Shared DTOs/types between frontend and backend

## Tech Stack
- **Frontend:** Vue 3, Vite, TypeScript, Pinia, Vue Router, Tailwind CSS (+ typography/animations plugins)
- **Backend:** Node.js, Express, TypeScript
- **Auth/Infra:** Supabase (Postgres + OAuth via `@supabase/ssr`), Redis (sessions + redirect cache)
- **Tooling:** pnpm workspaces

## Monorepo Layout
```
apps/
  web/        # Vue SPA
  api/        # Express BFF/API
packages/
  shared/     # Shared contracts (DTOs/types)
```

## Architecture Highlights
- **BFF pattern:** All OAuth, session handling, and token refresh live in the API. The SPA only sees `auth/me` responses and the `sid` cookie.
- **Session model:** API exchanges the GitHub code with Supabase, encrypts the refresh token, stores it in Redis with TTL, and sets `sid` (HttpOnly, SameSite Lax).
- **Refresh path:** Auth middleware (`requireAuthSid`) refreshes near expiry, rotates the refresh token, and rejects invalid/expired sessions.
- **Logout:** Clears `sid`, deletes the Redis session, and revokes Supabase session server-side.
- **Redirects:** `GET /:shortCode` resolves via Redis read-through; returns 404 for unknown and 410 for expired.

## API Surface (relevant routes)
- **Auth:** `GET /auth/github/start`, `GET /auth/callback`, `GET /auth/me`, `POST /auth/logout`
- **URLs (auth required):** `POST /urls` (create), `GET /urls` (list current user URLs)
- **Public:** `GET /:shortCode` (redirect)

## Frontend Behavior
- Uses `fetch` with `credentials: 'include'`; no `Authorization` headers.
- Router guard blocks protected routes when not authenticated and preserves `next` on redirect to `/login`.
- Pinia store (`auth`) initializes auth once on app start and shares state with the guard; logout returns to `/`.

## Running Locally
```bash
pnpm install
pnpm --filter api dev      # API (expects Supabase + Redis env vars)
pnpm --filter web dev      # Web (uses VITE_API_URL to talk to the API)
```

### Environment (API)
Set at least:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `BASE_SHORT_URL` (API public URL, for OAuth callback)
- `WEB_APP_URL` (SPA origin, for redirects)
- `CORS_ORIGIN` (defaults to `http://localhost:5173`)
- Redis connection envs as required by your setup

### Environment (Web)
- `VITE_API_URL` pointing to the API origin (e.g., `http://localhost:3000`)

## Notes
- Auth state is derived from `/auth/me`; 401 responses should be treated as “not authenticated”.
- The SPA is intentionally minimal regarding auth logic—security-sensitive flows stay on the server. 
