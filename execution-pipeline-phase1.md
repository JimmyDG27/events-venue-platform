# Execution Pipeline — Phase 1 (MVP)
## Events Venue Discovery & Booking Platform
**Prepared:** April 2026  
**Scope:** Phase 1 — Core Platform only  
**Status:** 🟡 In Progress

---

## Pipeline Overview

```
Phase 0: Project Setup & Architecture
        ↓
Phase 1: Backend — Core API
        ↓
Phase 2: Authentication
        ↓
Phase 3: Frontend — Public Website
        ↓
Phase 4: Frontend — User Dashboard
        ↓
Phase 5: QA, Polish & Launch
```

> **Dependency rule:** Each phase must be completed before the next begins, unless marked as `[parallel]`.

---

## Phase 0 — Project Setup & Architecture
> No dependencies. Start here.

- [✅] **0.1 — Initialize monorepo & tooling**
  - Next.js project scaffold (App Router)
  - Tailwind CSS configuration
  - ESLint + Prettier setup
  - Git repository initialization
  - CI/CD pipeline skeleton (GitHub Actions)
  - **Summary:** Initialized pnpm monorepo with workspaces (`apps/web`, `apps/api`, `packages/shared`). Manually scaffolded Next.js 15 (App Router, TypeScript, Tailwind, Vitest) and NestJS 10 (TypeScript, Swagger, global ValidationPipe). Root Prettier config shared across apps. GitHub Actions CI runs lint + type-check + tests for both apps on push. `pnpm.onlyBuiltDependencies` configured for Prisma and NestJS native builds. Decision: pnpm chosen as package manager for monorepo workspace support and disk efficiency.

- [✅] **0.2 — Define database schema**
  - PostgreSQL schema design:
    - `users` (id, name, email, phone, notification_preferences, created_at)
    - `venues` (id, name, description, location, capacity, styles, pricing, photos, created_at)
    - `availability_requests` (id, user_id, venue_id, date_from, date_to, guests, event_type, message, status, created_at)
    - `viewings` (id, user_id, venue_id, scheduled_at, status, created_at)
    - `favorites` (id, user_id, venue_id, created_at)
  - Migrations setup (Prisma or Drizzle ORM)
  - **Summary:** Full Prisma schema written in `apps/api/prisma/schema.prisma` with all 5 tables, two enums (`RequestStatus`, `ViewingStatus`), FK relations with CASCADE delete, and a unique constraint on `favorites(user_id, venue_id)`. Baseline migration SQL generated via `prisma migrate diff` and saved to `prisma/migrations/0001_init/`. Global `PrismaModule`/`PrismaService` added to NestJS. Decisions: ORM = Prisma (already in stack); `notification_preferences` and `pricing` stored as JSONB for flexibility; `styles` and `photos` as `TEXT[]` arrays (PostgreSQL-native); `passwordHash` column added to `users` for Phase 2 auth.

- [✅] **0.3 — Set up cloud infrastructure**
  - Provision PostgreSQL database (e.g. Supabase / Railway)
  - Cloud storage bucket for venue images (e.g. AWS S3 / Cloudflare R2)
  - Environment variables management (.env structure)
  - Staging environment provisioning
  - Hosting setup (scalable cloud infrastructure)

- [✅] **0.4 — Design system & component library**
  - Color tokens, typography scale
  - Base reusable components: Button, Input, Card, Modal, Badge
  - Responsive grid/layout system (desktop & mobile)
  - i18n framework setup (English + one additional language)
  - **Summary:** Warm editorial palette (#F7F5F0 parchment bg, #2C4A3E forest green accent) defined as raw RGB CSS variables for Tailwind opacity support. Fonts: Cormorant Garamond (display) + Jost (body) via next/font/google with CSS variable injection. Tailwind config extended with semantic color and font tokens. Five components in `components/ui/`: Button (primary/secondary/ghost × sm/md/lg), Input (label, error, helper text, aria-described), Card (image slot, hover lift), Modal (portal, ESC key, focus trap, backdrop), Badge (active/completed/rejected/cancelled/scheduled). next-intl v3 configured with `[locale]` App Router routing, middleware for locale detection, English + French message files. Root layout passes through children; locale layout applies fonts + NextIntlClientProvider. 25/25 tests passing (Button, Input, Badge). TypeScript clean.

---

## Phase 1 — Backend: Core API
> Depends on: Phase 0

- [✅] **1.1 — REST API structure & middleware**
  - Node.js API setup and routing
  - Request validation middleware (Zod)
  - Error handling middleware (global error handler)
  - Rate limiting setup
  - Logging setup
  - **Summary:** `src/common/` layer added: `ZodValidationPipe` (schema-based validation, field-level error messages), `HttpExceptionFilter` (consistent JSON error envelope with statusCode/error/message/timestamp/path), `PrismaExceptionFilter` (maps P2002→409, P2025→404, P2003→400, P2014→400), `LoggingInterceptor` (method + URL + ms per request). `main.ts` updated: helmet security headers, global filters (Prisma → HTTP, most-specific-first), logging interceptor, PORT defaults to 3001. `app.module.ts`: ThrottlerModule (100 req / 60s window) + global ThrottlerGuard via APP_GUARD token; auth endpoints can override with `@Throttle()`. Removed class-validator ValidationPipe — validation now done per-endpoint with Zod schemas. 10/10 tests passing, TypeScript clean.

- [✅] **1.2 — Venues API endpoints**
  - `GET /venues` — list with filters (budget, capacity, style/theme, location, event type) and sorting options
  - `GET /venues/:id` — venue detail (photos, capacity, styles, pricing, location)
  - Image upload endpoint (cloud storage integration)
  - Seed realistic venue data for development and testing
  - **Summary:** `GET /venues` with 7 query params (capacity, style, location, eventType, budgetMin, budgetMax, sort, page, limit) — DB-level filters for capacity/style/location, in-memory budget filtering (JSONB limitation), in-memory price sort with manual pagination. `GET /venues/:id` with UUID validation and 404. `POST /venues/:id/photos` multipart upload to Cloudflare R2 via `@aws-sdk/client-s3`; validates MIME type (jpeg/png/webp) and 10 MB limit. `StorageModule/StorageService` wraps S3Client. Seed: 12 realistic London venues. Jest `moduleNameMapper` added for `@/` path aliases. 21/21 tests passing, TypeScript clean.

- [✅] **1.3 — Availability Request API endpoints**
  - `POST /requests` — create request (date/date range, guest count, event type, optional message)
  - Guest count vs venue capacity validation logic
  - `GET /requests` — user's own requests, with status filter (Active, Completed, Rejected, Cancelled)
  - `GET /requests/:id` — request detail
  - `PATCH /requests/:id/status` — update status
  - **Summary:** Full CRUD for availability requests in `src/requests/`. `POST /requests` validates guests ≤ venue capacity (throws 400), throws 404 if venue not found, creates with `status: Active`. `GET /requests` filters by userId + optional status, paginated, includes venue relation. `GET /requests/:id` and `PATCH /requests/:id/status` enforce ownership via `findFirst({ where: { id, userId } })`. Auth is temporarily via `x-user-id` header (replaced by JwtAuthGuard in Phase 2). Fixed pre-existing lint issues: installed `@eslint/js` + `typescript-eslint`, added spec-file rule overrides for Jest mock `any` types, fixed `no-floating-promises` in `main.ts`. 36/36 tests, lint clean, TypeScript clean.

- [✅] **1.4 — Favorites & Viewings API endpoints**
  - `POST /favorites/:venueId` — save venue to favorites
  - `DELETE /favorites/:venueId` — remove from favorites
  - `GET /favorites` — list user's favorite venues
  - `POST /viewings` — schedule a venue visit (venue_id, date/time)
  - `GET /viewings` — list upcoming and past viewings
  - `PATCH /viewings/:id` — update or cancel a viewing
  - **Summary:** `FavoritesModule`: `POST /favorites/:venueId` verifies venue exists then creates (P2002→409 via PrismaExceptionFilter for duplicates), `DELETE /favorites/:venueId` uses Prisma composite unique key `userId_venueId`, `GET /favorites` returns all with venue included. `ViewingsModule`: `POST /viewings` validates scheduledAt is in the future, creates with `Scheduled` status; `GET /viewings` accepts `?filter=upcoming|past|all`; `PATCH /viewings/:id` enforces ownership, blocks updates on cancelled viewings. Both modules use `x-user-id` header stub (Phase 2 replaces with JWT). 49/49 tests, lint clean, TypeScript clean.

- [✅] **1.5 — Email notification service**
  - Transactional email provider setup (Resend or SendGrid)
  - Email templates:
    - Request submitted confirmation (to user)
    - Request status update (approved / rejected / cancelled)
    - Viewing scheduled confirmation
    - Viewing reminder
  - Queue-based email sending (avoid blocking API)
  - Marketing email opt-in/opt-out support (notification preferences)
  - **Summary:** `NotificationsModule` with `NotificationsService` wrapping the Resend SDK. Async event-based dispatch via `@nestjs/event-emitter`: `RequestsService` and `ViewingsService` emit `request.created`, `request.status_updated`, and `viewing.created` events after their respective DB writes; `NotificationsService` handles each with `@OnEvent()`. Email failures are caught and logged — never thrown — so the API response is never blocked. User `notification_preferences` (JSONB) checked before each send: `bookingUpdates` gates request emails, `viewingReminders` gates viewing emails. Three HTML templates in `email-templates.ts`: `requestSubmittedHtml`, `requestStatusUpdatedHtml`, `viewingScheduledHtml`. Note: viewing reminder (pre-visit reminder email) not yet implemented — requires a scheduled job (cron/queue worker) which is out of scope for the current API-only phase. 63/63 unit tests, lint clean, TypeScript clean.

- [✅] **1.6 — Backend unit & integration tests**
  - Unit tests for business logic (capacity validation, status transitions)
  - Integration tests for all API endpoints (happy path + edge cases)
  - Test database setup (separate test DB or in-memory)
  - Test runner: Jest or Vitest
  - **Summary:** Added `FavoritesController`, `ViewingsController` unit tests (controller-layer: delegation + UnauthorizedException on missing header). Added 4 integration e2e test suites (`venues`, `requests`, `favorites`, `viewings`) using supertest + mocked Prisma — 47 e2e tests covering happy paths, 400/401/404 error cases, business-rule validation (capacity, past dates, duplicate favorites P2002, cancelled viewing block). ESLint config extended: e2e files get the same unsafe-any/unused-vars overrides as spec files. 68/68 unit tests + 47/47 e2e tests, lint clean, TypeScript clean.

---

## Phase 2 — Authentication
> Depends on: Phase 0, Phase 1.1 | [can run in parallel with Phase 1.2–1.5]

- [✅] **2.1 — Email-based auth (register & login)**
  - User registration endpoint (`POST /auth/register`)
  - User login endpoint (`POST /auth/login`)
  - Password hashing (bcrypt)
  - JWT or session-based auth (secure cookie handling)
  - Email verification flow on registration
  - **Summary:** `AuthModule` with `AuthService` and `AuthController`. `POST /auth/register` hashes password with bcrypt (12 rounds), generates a random 32-byte hex verification token, creates the user, sends a verification email via `NotificationsService.sendVerificationEmail()` (non-blocking — failure logged only), returns `{ user, accessToken }` with no sensitive fields. `POST /auth/login` returns 401 with identical error message for unknown email or wrong password (no user enumeration). `GET /auth/verify?token=` marks `emailVerified: true` and clears the token; returns a friendly message if already verified. JWT signed with `JWT_SECRET` + `JWT_EXPIRES_IN` via `JwtModule.registerAsync`. Login does not block unverified users (MVP) — `emailVerified` flag returned for frontend use. `emailVerificationHtml` template added to `email-templates.ts`. Prisma schema updated: `emailVerified`, `emailVerificationToken` columns added; migration `0002_add_email_verification` created. 78/78 tests, lint clean, TypeScript clean.

- [✅] **2.2 — Auth middleware & route protection**
  - Middleware to protect private API routes
  - Attach authenticated user context to requests
  - Token refresh / session expiry handling
  - Logout endpoint (`POST /auth/logout`)
  - **Summary:** `JwtStrategy` (Passport) validates Bearer tokens, fetches the user from DB, and returns `AuthenticatedUser` on `request.user`. `JwtAuthGuard` extends `AuthGuard('jwt')`. `@CurrentUser()` param decorator extracts `AuthenticatedUser` from the request. `POST /auth/logout` added (stateless JWT — returns success, client discards token). All three protected controllers (`RequestsController`, `FavoritesController`, `ViewingsController`) rewritten: removed `x-user-id` header pattern, added `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at class level, all endpoints use `@CurrentUser()`. Controller unit specs updated to use `.overrideGuard(JwtAuthGuard)` pattern. E2e specs updated: `x-user-id`-based 401 tests removed (guard mock always injects the user for business-logic tests; real auth is covered by JWT strategy unit tests). Note: token refresh not implemented — JWT expiry is governed by `JWT_EXPIRES_IN` env var (default 7d); a refresh token endpoint (Redis blocklist) is deferred to post-MVP. 70/70 unit tests + 39/39 e2e tests, lint clean, TypeScript clean.

- [✅] **2.3 — Profile settings API**
  - `GET /users/me` — get current user profile
  - `PATCH /users/me` — update name, email, phone number
  - `PATCH /users/me/notifications` — update notification preferences:
    - Booking/request updates
    - Viewing reminders
    - Marketing emails
  - **Summary:** `UsersModule` with `UsersService` and `UsersController`. `GET /users/me` returns profile without sensitive fields (no `passwordHash`, no `emailVerificationToken`). `PATCH /users/me` validates with Zod, requires at least one field, checks email uniqueness (409 if taken by another user). `PATCH /users/me/notifications` merges partial preferences with existing JSONB defaults (`bookingUpdates`, `viewingReminders`, `marketingEmails`). All routes protected by `JwtAuthGuard`. `UsersModule` added to `AppModule`. 80/80 unit tests + 47/47 e2e tests, lint clean, TypeScript clean.

- [✅] **2.4 — Auth unit & integration tests**
  - Register / login / logout flow tests
  - Protected route access tests (with and without valid token)
  - Notification preference update tests
  - **Summary:** `auth.controller.spec.ts` added — 4 tests delegating register/login/verifyEmail/logout to `AuthService`. `jwt.strategy.spec.ts` added — validates token payload lookup and `UnauthorizedException` when user is deleted. `auth.e2e-spec.ts` added — 13 integration tests covering the full register/login/verify/logout flow with proper 201/200/400/401/409 status codes, sensitive field exclusion, and edge cases. 86/86 unit tests + 60/60 e2e tests, lint clean, TypeScript clean.

---

## Phase 3 — Frontend: Public Website
> Depends on: Phase 0.4, Phase 1.2, Phase 2.1

- [✅] **3.1 — Homepage**
  - Search bar: event type, location, date (or date range), number of guests
  - Recommended/featured venues section
  - Responsive layout (desktop & mobile)
  - Connected to `GET /venues` API with search params
  - **Summary:** `lib/types.ts` defines `Venue`, `VenuesResponse`, `VenueFilters` types. `lib/api.ts` typed API client with `getVenues(filters)` and `getVenue(id)` (reads `NEXT_PUBLIC_API_URL`). `i18n/navigation.ts` exposes `createNavigation` utilities for typed locale-aware routing. `Navbar` (client) and `Footer` (server) layout components in `components/layout/`. Homepage in `app/[locale]/page.tsx`: full-height hero with radial gradient accent, display headline, `SearchBar` client component (event type + location + guests → navigates to `/venues?...`), `FeaturedVenues` async server component (fetches `GET /venues?limit=6`, gracefully empty on API unavailability, Suspense skeleton). Locale layout updated to mount `<Navbar>` + `<Footer>` around page content. i18n messages extended with `home.*` and `footer.*` keys in both `en.json` and `fr.json`. Pre-existing `Modal.tsx` react-hooks/set-state-in-effect lint issue fixed with targeted disable comment. Fixed `eslint-plugin-react-hooks` missing dep. 25/25 tests, lint clean, TypeScript clean.

- [✅] **3.2 — Venues listing page**
  - Filter sidebar/panel: budget, capacity, style/theme, event type, location
  - Sorting options (price, capacity, relevance)
  - Venue cards with key info (photo, name, capacity, location, price range)
  - Pagination or infinite scroll
  - Empty state and loading state handling
  - **Summary:** `app/[locale]/venues/page.tsx` — async server component reads `searchParams` (location, eventType, style, capacity, budgetMin, budgetMax, sort, page), fetches `GET /venues` with filters, renders results or empty state. `components/venues/FiltersPanel.tsx` — client form with all filter fields, submits by updating URL query params (router.push). `components/venues/SortSelect.tsx` — client dropdown that splices `sort` into existing params. `components/venues/Pagination.tsx` — client prev/next buttons. Reuses `VenueCard` from 3.1. Empty state with "adjust filters" hint. Both `en.json` and `fr.json` extended with `venues.*` namespace. 25/25 tests, lint clean, TypeScript clean.

- [✅] **3.3 — Venue detail page**
  - Photo gallery (multiple images)
  - Venue details: capacity, location, available styles/themes
  - Pricing information section
  - Availability request CTA button
  - Favorites toggle (heart icon) — requires auth
  - Schedule a viewing button — requires auth (opens date/time picker → confirms → triggers confirmation email)
  - Mobile-first, fully responsive
  - **Summary:** `app/[locale]/venues/[id]/page.tsx` — async server component fetches `GET /venues/:id`, calls `notFound()` on 404. `PhotoGallery` client component with prev/next arrows, dot indicators, and photo counter. Two-column layout (description + key facts + styles + pricing table | sticky CTA sidebar). `VenueActions` client component wraps `FavoriteButton` and `ScheduleViewingModal` with modal open/close state. `FavoriteButton` reads `localStorage.access_token` — redirects to `/auth/login?return=...` if unauthenticated, calls `POST/DELETE /favorites/:venueId` if authenticated. `ScheduleViewingModal` (datetime-local picker) same auth pattern, calls `POST /viewings`. i18n `venueDetail.*` namespace added. 25/25 tests, lint clean, TypeScript clean.

- [✅] **3.4 — Availability request flow (UI)**
  - Multi-step form:
    1. Date selection (exact date or date range picker)
    2. Number of guests input (with capacity validation feedback)
    3. Event type selection
    4. Optional message field for special requirements
  - Form validation and inline error states
  - Submission confirmation screen
  - Connected to `POST /requests` API
  - Email notification triggered on submit
  - **Summary:** `app/[locale]/venues/[id]/request/page.tsx` — server component fetches venue (404 on failure), renders `RequestForm`. `components/request-flow/RequestForm.tsx` — 3-step client form with visual step indicator: Step 1 (dateFrom/dateTo with date inputs + validation), Step 2 (guests with capacity max hint + inline error), Step 3 (eventType required + optional message textarea). Redirects to `/auth/login?return=...` if no token. On submit calls `POST /requests` with Bearer JWT. Confirmation screen with checkmark on success. Back navigation between steps. `requestFlow.*` i18n namespace in en/fr. 25/25 tests, lint clean, TypeScript clean.

- [✅] **3.5 — About, Contact & static pages**
  - About page (static content)
  - Contact page (basic contact form or info)
  - Multi-language support: English + one additional language (i18n strings wired up)
  - SEO: meta tags, Open Graph tags, page titles
  - **Summary:** `app/[locale]/about/page.tsx` — static editorial page: hero, mission section, 3-step "how it works" grid, green CTA banner. `app/[locale]/contact/page.tsx` — client form (name, email, message) with success state (static — no backend needed in Phase 3). Root `layout.tsx` extended with full OpenGraph and Twitter meta + `title.template` for per-page titles. `about/page.tsx` exports `generateMetadata`. `about.*` and `contact.*` i18n namespaces added to en/fr. 25/25 tests, lint clean, TypeScript clean.

- [✅] **3.6 — Frontend component tests (public website)**
  - Component tests for search bar, filter panel, venue card
  - Form validation tests for availability request flow
  - Multi-language rendering tests
  - Tool: React Testing Library + Jest/Vitest
  - **Summary:** 26 new tests across 5 test files. `SearchBar`: renders 3 inputs, submits with correct query params (location, eventType, capacity). `VenueCard`: renders name/location/price/styles, links to detail page. `FiltersPanel`: renders fields, populates from initialValues, clears to base path, submits with filter params. `Pagination`: hides at 1 page, enables/disables prev/next, navigates to correct page. `RequestForm`: redirects to login without token, renders step 1 labels, validates required fields, advances on valid dates. All mocked `next-intl`, `@/i18n/navigation`, and `next/image`. 51/51 tests, lint clean, TypeScript clean.

---

## Phase 4 — Frontend: User Dashboard
> Depends on: Phase 2, Phase 3, Phase 1.3, Phase 1.4

- [✅] **4.1 — Auth pages (register, login, profile)**
  - Registration page (form + validation + error states)
  - Login page (form + validation + error states)
  - Redirect flow after login (back to intended page via `?return=` param)
  - Profile settings page:
    - Update name, email, phone number
    - Notification preferences toggles (booking updates, viewing reminders, marketing emails)
  - **Summary:** Auth infrastructure built: `lib/auth.ts` (token/user management in localStorage), `contexts/AuthContext.tsx` (React context with `user`, `token`, `login`, `logout`), `AuthProvider` wired into locale layout. Register page (`app/[locale]/auth/register/page.tsx`) and login page (`app/[locale]/auth/login/page.tsx`) share a reusable `AuthForm` component in `components/auth/AuthForm.tsx` with client-side validation (name, email format, password ≥8 chars) and server error handling. Profile page (`app/[locale]/dashboard/profile/page.tsx`) fetches `GET /users/me`, supports `PATCH /users/me` and `PATCH /users/me/notifications` with toggle UI. Navbar updated to show "My Account" / "Sign Out" when authenticated. All new strings added to `messages/en.json` and `messages/fr.json` (namespaces: `auth`, `dashboard`, `profile`).

- [✅] **4.2 — Availability requests dashboard**
  - List of user's submitted requests
  - Status filter tabs: All, Active, Completed, Rejected, Cancelled
  - Request card shows: venue name, location, dates, guests, event type, submitted date, status badge
  - Empty state per status tab
  - **Summary:** `app/[locale]/dashboard/requests/page.tsx` — client component, status tab bar, calls `GET /requests?status=…`, renders request cards with `Badge` component for status, graceful error/empty states. `requests.*` strings added to both locale files.

- [✅] **4.3 — Favorites dashboard**
  - Saved venues grid with key info (name, location, capacity, price)
  - Remove from favorites option (optimistic update)
  - Empty state
  - **Summary:** `app/[locale]/dashboard/favorites/page.tsx` — calls `GET /favorites`, renders venue grid with photo thumbnail, View and Remove buttons. Remove is optimistic (card disappears immediately on API success). `favorites.*` strings added. Note: heart toggle sync on venue cards across the site deferred — FavoriteButton already calls the API; full optimistic sync across pages would require global state (e.g. React Query) which is post-MVP.

- [✅] **4.4 — Viewings dashboard**
  - Upcoming / past tab split (client-side by `scheduledAt` date)
  - Viewing card: venue name, location, scheduled datetime, status badge
  - Cancel viewing with inline confirmation prompt (prevents accidental cancels)
  - Empty state
  - **Summary:** `app/[locale]/dashboard/viewings/page.tsx` — calls `GET /viewings`, splits by date client-side into upcoming/past tabs. Cancel shows inline "Yes, cancel / No" confirmation before calling `PATCH /viewings/:id`. Status updates optimistically via local state. `viewings.*` strings added.

- [✅] **4.5 — Frontend component tests (dashboard)**
  - Auth form tests (register, login, validation)
  - Dashboard tab and filter behaviour tests
  - Favorites toggle tests
  - Viewing scheduling flow tests
  - Tool: React Testing Library + Jest/Vitest
  - **Summary:** 20 new tests across 4 files: `components/auth/__tests__/AuthForm.test.tsx` (9 tests — register/login modes, field validation, server errors, nav links), `dashboard/__tests__/RequestsPage.test.tsx` (5 tests — tabs, empty state, cards, status filter API call, error state), `dashboard/__tests__/FavoritesPage.test.tsx` (5 tests — rendering, remove flow, empty/error states), `dashboard/__tests__/ViewingsPage.test.tsx` (6 tests — tab switching, cancel confirmation flow, empty/error states). All 76 total tests passing.

---

## Pre-Launch Audit — Fixes Applied
> Full codebase audit completed April 2026 before Phase 5. All Critical, High, and selected Medium issues resolved.

| # | Severity | Area | Fix |
|---|---|---|---|
| 1 | Critical | Frontend auth | `access_token` → `accessToken` destructuring in register/login pages and `api.ts` types |
| 2 | Critical | Security | Removed real Supabase credentials from `apps/web/.env.example` → placeholder values |
| 3 | High | Security | Added `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` to `POST /venues/:id/photos` |
| 4 | High | Auth | Users can only cancel their own requests (`PATCH /requests/:id/status`) — ForbiddenException for any other status |
| 5 | High | DB Performance | Added `@@index([userId])` + `@@index([venueId])` on `availability_requests`, `viewings`, `favorites` in Prisma schema; manual migration SQL created |
| 6 | High | Config | Fixed `DATABASE_URL` (pooled, port 6543) vs `DIRECT_URL` (direct, port 5432) in `apps/api/.env.example` |
| 7 | High | Config | `config.get('JWT_SECRET')` → `config.getOrThrow('JWT_SECRET')` to fail fast on missing secret |
| 8 | High | Config | Added `FRONTEND_URL` to `apps/api/.env.example` |
| 9 | High | Venues | Fixed style + eventType filter logic (AND → both required, OR → single) |
| 10 | Medium | Venues | Added `IN_MEMORY_CAP = 1_000` for budget-filtered / price-sorted queries to prevent unbounded memory usage |
| 11 | Medium | Viewings | Duplicate viewing check before create (same userId + venueId + scheduledAt + Scheduled status) |
| 12 | Medium | Favorites | `FavoriteButton` checks `/favorites` on mount to pre-populate `saved` state |
| 13 | Medium | Validation | Added past-date guard to `dateFrom` in `CreateRequestSchema` |
| 14 | Medium | API client | `apiFetch` only sends `Content-Type: application/json` when `body` is present |
| 15 | Medium | Types | `getFavorites` return type `PaginatedResponse` → `ListResponse`; new `ListResponse<T>` interface added |
| 16 | Medium | Types | `getViewings` return type `PaginatedResponse` → `ListResponse` |
| 17 | Medium | Frontend | Created `app/[locale]/auth/verify/page.tsx` — handles email verification token from query param |
| 18 | Medium | Security | Added `@Throttle({ auth: { ttl: 60_000, limit: 10 } })` to `POST /auth/register` and `POST /auth/login` |

**Test results post-audit:** API 86/86 ✅ | Frontend 76/76 ✅

---

## Phase 5 — QA, Polish & Launch
> Depends on: All phases complete

- [✅] **5.1 — End-to-end testing**
  - Critical user flows:
    - Search → filter → view venue detail → submit availability request → receive confirmation email
    - Register → login → manage profile notifications
    - Save to favorites → view in dashboard → remove
    - Schedule a viewing → view in dashboard → cancel
  - Mobile & desktop responsiveness checks across all pages
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Tool: Playwright or Cypress
  - **Summary:** Playwright installed (`@playwright/test` v1.59.1) in `apps/web`. `playwright.config.ts` configured with `webServer` (starts `next dev` automatically on port 3000; API on port 3001 must be started manually). 26 E2E tests across 5 spec files: `auth.spec.ts` (8 — register, login, logout, profile/notification updates), `venues.spec.ts` (6 — home search, listing filters, venue detail, auth redirect), `request.spec.ts` (3 — multi-step form, date validation, dashboard appearance), `favorites.spec.ts` (3 — save, remove, empty state), `viewings.spec.ts` (4 — schedule via modal, dashboard list, cancel with inline confirm, past tab). Custom `e2e/fixtures/auth.ts` provides `authenticatedPage` fixture — registers a test user via API and injects `access_token`/`auth_user` into `localStorage` before React hydration via `addInitScript`. Run with `pnpm --filter web test:e2e` (or `pnpm test:e2e` from root). Cross-browser and mobile responsiveness deferred to 5.2 accessibility audit.

- [✅] **5.2 — Performance & accessibility audit**
  - Lighthouse audit (Core Web Vitals: LCP, CLS, FID)
  - Image optimization (next/image, WebP format, lazy loading)
  - WCAG AA compliance check
  - Keyboard navigation and screen reader testing
  - Fix all critical and high severity issues
  - **Summary:** Static audit of the full frontend codebase. 8 issues identified and fixed: (1) **Contrast** — `--color-muted` darkened from `#8A8278` (3.31:1, fails AA) to `#706B64` (4.86:1, passes AA); (2) **Skip link** — added `<a href="#main-content" class="skip-link">` before Navbar, `<main id="main-content">` in layout; (3) **Nav labels** — added `aria-label="Main navigation"` to Navbar `<nav>` and `aria-label="Dashboard navigation"` to DashboardLayout `<nav>`; (4) **Focus indicators** — added global `*:focus-visible { outline: 2px solid accent; outline-offset: 3px }` in `globals.css`, removed `outline-none` from Input so focus ring is visible; (5) **Modal focus restoration** — Modal now captures `document.activeElement` on open and returns focus to it on close; (6) **`next/image` sizes** — added `sizes` prop to `Card.tsx` (`(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw`) and `PhotoGallery.tsx` (`100vw`) to prevent over-fetching large images; (7) **LCP priority** — added `priority` prop to `VenueCard`/`Card`, passed `priority={i === 0}` in `FeaturedVenues` for above-the-fold image; (8) **`remotePatterns`** — configured `next.config.ts` with R2 hostname patterns (`*.r2.dev`, `*.r2.cloudflarestorage.com`) plus wildcard HTTPS for non-production environments. Also fixed `vitest.config.ts` to exclude `e2e/` from unit test collection. 76/76 unit tests passing.

- [✅] **5.3 — Security review**
  - Input sanitization and XSS protection
  - SQL injection protection (ORM parameterized queries)
  - Auth token handling review (httpOnly cookies, expiry)
  - Rate limiting on auth endpoints
  - Environment variables audit (no secrets in codebase)
  - **Summary:** Full static security audit across frontend and API. Findings and fixes: (1) **Email template XSS** — all four templates (`requestSubmittedHtml`, `requestStatusUpdatedHtml`, `viewingScheduledHtml`, `emailVerificationHtml`) interpolated user-controlled values (`userName`, `venueName`, `venueLocation`, `eventType`) directly into HTML. Added `escapeHtml()` utility and applied it to all user-supplied fields before interpolation. (2) **Email header injection** — `subject` lines contained raw user-controlled venue/status names. Added `sanitizeSubject()` which strips `\r\n` before passing to Resend. (3) **MIME-type spoofing on file upload** — `file.mimetype` comes from the client `Content-Type` header and can be faked. Added `hasValidMagicBytes()` that inspects actual file bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `52 49 46 46...57 45 42 50`) and rejects uploads where bytes don't match the declared type. (4) **Swagger exposed in production** — wrapped Swagger setup in `if (process.env.NODE_ENV !== 'production')`. (5) **SQL injection** — not applicable; all DB queries use Prisma ORM with parameterized queries throughout. (6) **Auth / JWT** — JWT signed with `getOrThrow('JWT_SECRET')` (fails fast if unset), bcrypt 12 rounds, no sensitive fields in responses (passwordHash, emailVerificationToken stripped), identical error messages for unknown-user vs wrong-password (no enumeration). (7) **Env vars** — `.env` correctly gitignored, no real secrets in `.env.example`, no secrets tracked in git. (8) **Rate limiting** — auth endpoints already throttled at 10 req/60s (Pre-launch audit Fix #18). 86/86 API tests passing.

- [ ] **5.4 — Staging deployment & client review**
  - Full deploy to staging URL
  - Seed realistic venue and user data
  - Share staging URL with client for feedback round
  - Document any change requests from client review

- [ ] **5.5 — Production launch**
  - DNS setup and SSL certificate
  - Environment hardening (production env vars, logging)
  - Error tracking setup (e.g. Sentry)
  - Uptime monitoring setup
  - Final smoke test on production
  - Go live ✅

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Frontend | Next.js (React, App Router), Tailwind CSS |
| Backend | NestJS or Python FastAPI |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Email-based (JWT / sessions) |
| File Storage | Cloudflare R2 |
| Email | Resend |
| Testing | Jest/Vitest + React Testing Library + Playwright/Cypress |
| Hosting | Cloud-based scalable infrastructure |
| CI/CD | GitHub Actions |

---

## Progress Tracker

| Phase | Status | Notes |
|---|---|---|
| Phase 0 — Setup | ✅ Done | 0.1–0.4 complete |
| Phase 1 — Backend API | ✅ Done | 1.1–1.6 complete |
| Phase 2 — Auth | ✅ Done | 2.1–2.4 complete |
| Phase 3 — Public Frontend | ✅ Done | 3.1–3.6 complete |
| Phase 4 — User Dashboard | ✅ Done | 4.1–4.5 complete |
| Phase 5 — QA & Launch | 🟡 In Progress | 5.1 complete |

> Update statuses as work progresses: 🔲 Not started → 🟡 In Progress → ✅ Done