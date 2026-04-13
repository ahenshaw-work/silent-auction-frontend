# Production Readiness Plan

Findings from a full codebase review. Items are grouped by severity and ordered by impact within each tier.

---

## Critical

These are bugs, security issues, or architectural problems that must be resolved before a production deployment.

### C-1 — Framework artefacts: README.md and devfile.yaml still reference Modern.js

`README.md` documents `pnpm dev/build/serve` commands that don't exist, links to `modernjs.dev`, and
references `pnpm extract-messages` / `pnpm compile-messages` (Modern.js i18n CLI commands). `devfile.yaml`
sets `MODERN_ENV=devspaces` and runs the same non-existent scripts. Any developer or CI system following
these will immediately fail.

**Files:** `README.md`, `devfile.yaml`

**Fix:** Rewrite `README.md` for Next.js/npm. Update `devfile.yaml` to use `npm install` / `npm run dev`
and remove `MODERN_ENV`.

---

### C-2 — Interceptor accumulation: token leak and memory leak

`configureHeaders` registers a new Axios interceptor every time it is called but never ejects the previous
one. It is called before every API call in every provider. After a normal session, dozens of stacked
interceptors execute on every request. The `||` guard
(`config.headers.Authorization = config.headers.Authorization || \`Bearer ${token}\``) means the first
(stale) token wins once multiple interceptors have stacked — a refreshed token never takes effect.

**Files:** `app/components/ApiClient/index.tsx`, `app/providers/Auctions/index.tsx`,
`app/providers/Users/index.tsx`, `app/providers/Auth/index.tsx`

**Fix:** Register one interceptor at instance creation time that reads the latest token from a `ref`.
Remove all `configureHeaders` call-sites from individual API calls.

---

### C-3 — `/api/frontend/config` exposes internal infrastructure details unauthenticated

`BACKEND_URL` (an internal cluster address in Kubernetes) and `ADMIN_GROUP_NAME` (the exact string needed
to understand the privilege boundary) are returned to any unauthenticated caller. `BACKEND_URL` in
particular should never reach the browser — it is only needed server-side.

**File:** `app/api/frontend/config/route.ts`

**Fix:** Remove `BACKEND_URL` from the response (proxy API calls server-side, or simply don't expose it).
Evaluate whether `ADMIN_GROUP_NAME` needs to be in the browser response at all.

---

### C-4 — Error boundaries render `error.stack` in production

All four `error.tsx` files pass `error.stack` directly to the PatternFly `ErrorState` body. In production
this exposes internal file paths, function names, and application structure to end users.

**Files:** `app/auctions/error.tsx`, `app/auctions/[id]/error.tsx`, `app/highest-bids/error.tsx`,
`app/users/error.tsx`

**Fix:** Conditionally show the stack only when `process.env.NODE_ENV !== 'production'`. Show a generic
message in production.

---

### C-5 — Root layout is `'use client'` — metadata, SEO, and streaming are broken

`app/layout.tsx` carries `'use client'` to manage dark-theme state. This makes it impossible to export
`metadata` (the API is silently ignored on Client Components), breaks HTML streaming, and forces the entire
component tree into client rendering. The page has no `<title>`, no `<meta charset>`, no viewport tag. The
JSX tree is also duplicated (~90 lines) to swap a className on `<html>`.

**File:** `app/layout.tsx`

**Fix:** Extract the dark-theme toggle and interactive shell into a `ClientShell` Client Component. Restore
the root layout as a Server Component with `export const metadata`. Replace the duplicated JSX with a
single `<html>` element.

---

### C-6 — `usePathname()` called four times inline, including inside conditional branches

`app/containers/sidebar.tsx` calls `usePathname()` as a JSX expression directly inside
`isActive={usePathname()...}` props — four separate hook calls, three of which are inside a ternary. This
violates the Rules of Hooks.

**File:** `app/containers/sidebar.tsx`

**Fix:** Call `usePathname()` once at the top of the component and use the variable throughout.

---

### C-7 — JWT token stored in React state, stale token used for API calls

The access token is in `useState`. API calls use the token from the render-time closure snapshot, which may
be up to 60 seconds behind the refresh interval. A token refresh succeeds asynchronously but any in-flight
request has already captured the stale token value from state.

**File:** `app/providers/Auth/index.tsx`

**Fix:** Store the latest token in a `useRef` and read from it synchronously at request time.

---

## Important

These are correctness bugs, misused APIs, dead code, and type safety gaps that should be addressed before
or shortly after launch.

### I-1 — `publicRuntimeConfig` in `next.config.js` is deprecated and dead

`publicRuntimeConfig` was a Pages Router feature and has no effect in the App Router. The actual config
loading is correctly handled by the `/api/frontend/config` route, so this block is dead code that misleads
future developers.

**File:** `next.config.js`

**Fix:** Remove the `publicRuntimeConfig` block.

---

### I-2 — `moduleResolution: "node"` is wrong for Next.js 15

Next.js 15 requires `"bundler"` (or `"node16"`) for correct ESM `exports` field resolution. Classic `"node"`
resolution may fail to resolve PatternFly subpath exports correctly.

**File:** `tsconfig.json`

**Fix:** Change to `"moduleResolution": "bundler"`.

---

### I-3 — `importHelpers: true` without `tslib` as a dependency

`tslib` is not in `package.json`. This setting either silently falls back to inlining helpers (making the
setting pointless) or throws a module-not-found error.

**File:** `tsconfig.json`

**Fix:** Add `tslib` as a production dependency, or remove the `importHelpers` flag.

---

### I-4 — `@keycloak/keycloak-admin-client` is unused and in production dependencies

This large server-side admin library (~3 MB) is imported nowhere in the source. It bloats the build and
Docker image unnecessarily.

**File:** `package.json`

**Fix:** Remove from `dependencies`.

---

### I-5 — `chance`, `@types/chance`, `@types/jest` listed with no tests

There are no test files anywhere in the project. These are orphan devDependencies from planned-but-never-
written tests.

**File:** `package.json`

**Fix:** Remove until a testing framework is properly set up.

---

### I-6 — `DeferredData<T>` type is a React Router artefact

`app/types/deferred.ts` exports `{ [K in keyof T]: Promise<T[K]> }` — this is the React Router 6 Defer
API pattern. It is unused and has no equivalent in Next.js.

**Files:** `app/types/deferred.ts`, `app/types/index.ts`

**Fix:** Delete `deferred.ts` and remove its re-export from `app/types/index.ts`.

---

### I-7 — All `NavItem` elements share `itemID="1"`

All four nav items in `app/containers/sidebar.tsx` are given `itemID="1"`. PatternFly uses `itemID` for
active-state tracking and ARIA. Duplicate values break both.

**File:** `app/containers/sidebar.tsx`

**Fix:** Assign unique IDs: `"home"`, `"auctions"`, `"highest-bids"`, `"users"`.

---

### I-8 — Auction images use `<img>` instead of Next.js `<Image>`

Raw `<img>` tags bypass automatic WebP conversion, lazy loading, size optimisation, and CLS prevention —
all of which `next/image` provides.

**Files:** `app/auctions/page.tsx`, `app/components/Auction/DescriptionList.tsx`

**Fix:** Replace with `<Image>` from `next/image`.

---

### I-9 — `DescriptionList` has an unreachable `instanceof Promise` branch

`app/components/Auction/DescriptionList.tsx` checks `if (auction instanceof Promise)` and unwraps an Axios
response. The prop type is `auction: Auction` (a plain object), so this branch is dead code from a prior
implementation.

**File:** `app/components/Auction/DescriptionList.tsx`

**Fix:** Remove the dead branch.

---

### I-10 — `redirect()` used inside click handlers and error boundaries

`next/navigation`'s `redirect()` is designed for Server Components and Server Actions — not event
handlers. The card click in `app/auctions/page.tsx` and all error boundary reset buttons call `redirect()`,
which throws `NEXT_REDIRECT` errors that escape the error boundary.

**Files:** `app/auctions/page.tsx`, `app/auctions/error.tsx`, `app/auctions/[id]/error.tsx`,
`app/highest-bids/error.tsx`, `app/users/error.tsx`

**Fix:** Replace with `router.push()` from `useRouter()` in event handlers.

---

### I-11 — `useMemo` in `PlaceBidModal` is missing `startingBid` in its dependency array

`minimumBidAmount` is computed from both `currentHighestBid` and `startingBid`, but only `currentHighestBid`
is listed as a dependency. If `startingBid` changes between auctions, the memo is stale.

**File:** `app/auctions/[id]/place-bid-modal.tsx`

**Fix:** Add `startingBid` to the dependency array.

---

### I-12 — `getUserDetails` calls `.map()` on a single-object response

`app/providers/Users/index.tsx` calls `response.data.map(mapUser)` on the `/api/v1/users/${userId}`
endpoint, which returns a single object, not an array. This will throw
`TypeError: response.data.map is not a function` at runtime.

**File:** `app/providers/Users/index.tsx`

**Fix:** Change to `mapUser(response.data)`.

---

### I-13 — `User.tableNumber` typed as `string` but mapped from a `number`

`UserDTO.table_number` is `number`, but the domain `User` type declares `tableNumber: string`. The mapping
assigns the number directly — the type is wrong and will cause runtime issues in any code doing arithmetic
or strict comparisons on this field.

**File:** `app/types/user.ts`

**Fix:** Change `tableNumber: string` to `tableNumber: number`.

---

### I-14 — Timezone semantics in `toUtcLocalDateTime` need to be verified and documented

The function name and comment say "UTC LocalDateTime" which is contradictory.
`new Date(localString).toISOString()` does convert local time to UTC correctly, but this must be verified
against the backend's actual expectations. The backend's `LocalDateTime` field carries no timezone
information — the assumption that it stores UTC needs to be confirmed and documented.

**File:** `app/auctions/create-auction-modal.tsx`

---

### I-15 — Interceptor unconditional header set (part of C-2)

Even after fixing C-2, the `||` guard in
`config.headers.Authorization = config.headers.Authorization || \`Bearer ${token}\`` means a pre-existing
value is never overwritten. The assignment must be unconditional.

**File:** `app/components/ApiClient/index.tsx`

**Fix:** `config.headers.Authorization = \`Bearer ${token}\``

---

## Nice-to-have

Polish, maintainability, and developer experience improvements.

| # | Issue | File(s) |
|---|-------|---------|
| N-1 | No `metadata` export on any page — browser tabs all have blank titles | All `page.tsx` files |
| N-2 | Typo: "No auctions avaiable" → "available" | `app/auctions/page.tsx` |
| N-3 | `noreferrer="true"` / `noopen="true"` are not valid HTML attributes — should be `rel="noopener noreferrer"` | `app/containers/masthead.tsx` |
| N-4 | `eslint-config-next` is in devDependencies but not used in `eslint.config.mjs` | `eslint.config.mjs` |
| N-5 | `bids-data-list.tsx` uses context hooks but has no `'use client'` directive — works only because its parent has one | `app/auctions/[id]/bids-data-list.tsx` |
| N-6 | Anonymous default exports (`export default () =>`) break React DevTools — components appear as `<Anonymous>` | Several loading/component files |
| N-7 | `app/auctions/[id]/` has no `loading.tsx` — detail page manages loading state manually instead of using the App Router convention | `app/auctions/[id]/` |
| N-8 | `getAuctionDetails` failure sets shared provider error state, affecting the entire auctions list | `app/providers/Auctions/index.tsx` |
| N-9 | `useEffectOnce` from `react-use` is just `useEffect(fn, [])` — an unnecessary dependency for a one-liner | `app/highest-bids/page.tsx` |
| N-10 | Dark theme writes to `localStorage` on every render including the initial no-op write | `app/layout.tsx` |
| N-11 | `ADMIN_GROUP_NAME` defaults to hardcoded `'admin'` in multiple places; `.env` sets it to `'bidder'` — should be one shared constant | Multiple files |
| N-12 | `devfile.yaml` still has `MODERN_ENV`, `pnpm`, and Modern.js scripts (covered by C-1) | `devfile.yaml` |
| N-13 | `public/dev-runtime-config.js` uses `process.env` in a static file — `process` is undefined in the browser, so dev config silently fails unless values are hardcoded manually | `public/dev-runtime-config.js` |
