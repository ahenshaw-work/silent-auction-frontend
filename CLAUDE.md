# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Start dev server (Turbopack)
npm run build   # Production build
npm start       # Start production server
npm run lint    # Run ESLint
```

There are no application-level tests.

## Architecture

**Stack:** Next.js 15 (App Router) + React 18 + PatternFly 6 (Red Hat design system) + Keycloak auth + Axios

**Provider nesting** (`app/layout.tsx`):
```
ConfigProvider → AuthProvider → UsersProvider → AuctionsProvider → AppMasthead/AppSidebar → page children
```

Each provider exposes a custom hook: `useConfig()`, `useAuth()`, `useUsers()`, `useAuctions()`.

**Config loading:**
- Dev: env vars injected at build time via `next.config.js` `publicRuntimeConfig`
- Prod: runtime config fetched from `/api/frontend/config` (Next.js API route that reads process.env), allowing container-level env injection without rebuilding

**Auth flow (`app/providers/Auth/`):**
- `AuthProvider` initializes Keycloak with PKCE, validates config, then fetches the current user from `/api/v1/me`
- Token is refreshed on a 60-second interval
- `useAuth()` exposes `{ keycloak, user, isAdmin }` — `isAdmin` is derived from `ADMIN_GROUP_NAME` env var

**API client (`app/components/ApiClient/`):**
- `useApiClient()` returns an Axios instance with `baseURL` set to `BACKEND_URL`
- `configureHeaders(keycloak)` adds a request interceptor that injects `Authorization: Bearer <token>`
- All data-fetching hooks (in `AuctionsProvider`, `UsersProvider`) compose these together

**Path alias:** `@app/*` → `app/*` (configured in `tsconfig.json`)

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | API backend base URL |
| `KEYCLOAK_URL` | Keycloak server URL |
| `KEYCLOAK_REALM` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | OAuth 2.0 client ID |
| `ADMIN_GROUP_NAME` | Keycloak group that grants admin access |
| `BID_INCREMENT` | Minimum bid increment |

Copy `.env` and fill in values for local development.

## PatternFly Notes

All UI uses PatternFly 6 components. Global PatternFly CSS is imported in `app/globals.css`. Dark mode is toggled via a `data-theme` attribute on `<html>` managed in `layout.tsx`.