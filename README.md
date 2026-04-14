# Silent Auction — Frontend

A Next.js web application for running a silent auction. Users can browse active auctions, place bids, and view the current highest bids. Administrators and auctioneers can create new auctions. Authentication is handled by Keycloak.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack in development)
- **UI:** React 18 + [PatternFly 6](https://www.patternfly.org/) (Red Hat design system)
- **Auth:** Keycloak (PKCE flow via `keycloak-js`)
- **HTTP:** Axios
- **Language:** TypeScript 5
- **Container base:** RHEL 9 / Node.js 22

## Prerequisites

- Node.js 22+
- npm (lockfile is `package-lock.json` — do not use `pnpm` or `yarn`)
- A running instance of the [silent-auction-backend](../silent-auction-backend)
- A Keycloak server with a configured realm and client

## Setup

Install dependencies:

```bash
npm install
```

## Environment Variables

Runtime configuration is served by the Next.js API route at `/api/frontend/config`, which reads from `process.env` at request time. This allows environment variables to be injected at the container level without rebuilding the image.

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Base URL of the silent-auction backend API (server-side only — never exposed to the browser) |
| `KEYCLOAK_URL` | Yes | Keycloak server URL (e.g. `https://keycloak.example.com`) |
| `KEYCLOAK_REALM` | Yes | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | Yes | OAuth 2.0 client ID registered in Keycloak |
| `ADMIN_GROUP_NAME` | Yes | Keycloak group whose members are treated as admins (e.g. `admin`) |
| `BID_INCREMENT` | Yes | Minimum increment above the current highest bid (e.g. `5`) |

For local development, values are picked up from `.env`. In production / Kubernetes, inject them as container environment variables — the Next.js standalone server reads them at startup.

> **Note:** `BACKEND_URL` is used server-side only. It should not be exposed to the browser.

## Running Locally

Start the development server (Turbopack):

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Other Commands

```bash
npm run build   # Production build (outputs to .next/standalone)
npm start       # Start the production server locally
npm run lint    # Run ESLint
```

## Building & Running with Docker

```bash
docker build -t silent-auction-frontend .
docker run -p 3000:3000 \
  -e BACKEND_URL=http://localhost:8080 \
  -e KEYCLOAK_URL=http://localhost:9090 \
  -e KEYCLOAK_REALM=silent-auction \
  -e KEYCLOAK_CLIENT_ID=silent-auction-frontend \
  -e ADMIN_GROUP_NAME=admin \
  -e BID_INCREMENT=5 \
  silent-auction-frontend
```

The Dockerfile uses a multi-stage build targeting `registry.redhat.io/rhel9/nodejs-22-minimal`.

## Project Structure

```
app/
├── api/
│   └── frontend/config/    # Next.js API route — serves runtime config to the browser
├── auctions/               # Auction list and individual auction detail pages
│   └── [id]/               # Auction detail: bid history, place-bid modal
├── highest-bids/           # Leaderboard view of highest bids across all auctions
├── users/                  # User management (admin only)
├── components/
│   ├── ApiClient/          # Axios instance factory + auth header interceptor
│   └── Auction/            # Reusable auction card and description list components
├── containers/
│   ├── masthead.tsx        # Top navigation bar (dark mode toggle, user menu)
│   └── sidebar.tsx         # Left navigation sidebar
├── providers/
│   ├── Auth/               # Keycloak initialisation, token refresh, useAuth() hook
│   ├── Config/             # Fetches /api/frontend/config, exposes useConfig() hook
│   ├── Auctions/           # Auction CRUD + bid submission, exposes useAuctions() hook
│   └── Users/              # User fetching, exposes useUsers() hook
├── types/                  # Shared TypeScript types (Auction, User, Bid, etc.)
├── globals.css             # Global styles (PatternFly base CSS)
└── layout.tsx              # Root layout: provider nesting, dark mode, PatternFly Page shell
```

### Provider Nesting

```
ConfigProvider
  └── AuthProvider
        └── UsersProvider
              └── AuctionsProvider
                    └── Page (masthead + sidebar + children)
```

Each provider exposes a custom hook: `useConfig()`, `useAuth()`, `useUsers()`, `useAuctions()`.

### Path Alias

`@app/*` resolves to `app/*` (configured in `tsconfig.json`). Use this for all internal imports.

## Authentication

The app uses Keycloak with the PKCE flow. On load, `AuthProvider` initialises the Keycloak client, redirects unauthenticated users to login, then fetches the current user profile from `GET /api/v1/me`. The token is refreshed every 60 seconds.

`useAuth()` exposes `{ keycloak, user, isAdmin }`. `isAdmin` is `true` when the current user belongs to the group named by `ADMIN_GROUP_NAME`.

## Known Issues

See [`docs/production-readiness-plan.md`](docs/production-readiness-plan.md) for a full list of open issues. Critical items that affect correctness today:

- **Stale auth token on API calls** — token is stored in React state; a `useRef` should be used so API calls always read the latest value (C-7)
- **Interceptor accumulation** — a new Axios interceptor is registered before every API call and never ejected (C-2)
- **Root layout is a Client Component** — prevents `metadata` export and breaks HTML streaming (C-5)
- **`usePathname()` called inside conditional branches** — violates React Rules of Hooks (C-6)
- **`getUserDetails` calls `.map()` on a single object** — will throw at runtime (I-12)
