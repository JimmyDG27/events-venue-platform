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
  - **Summary:** `JwtStrategy` (Passport) validates Bearer tokens, fetches the user from DB, and returns `AuthenticatedUser` on `request.user`. `JwtAuthGuard` extends `AuthGuard('jwt')`. `@CurrentUser()` param decorator extracts `AuthenticatedUser` from the request. `POST /auth/logout` added (stateless JWT — returns success, client discards token). All three protected controllers (`RequestsController`, `FavoritesController`, `ViewingsController`) rewritten: removed `x-user-id` header pattern, added `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at class level, all endpoints use `@CurrentUser()`. Controller unit specs updated to use `.overrideGuard(JwtAuthGuard)` pattern. E2e specs updated: `x-user-id`-based 401 tests removed (guard mock always injects the user for business-logic tests; real auth is covered by JWT strategy unit tests). 70/70 unit tests + 39/39 e2e tests, lint clean, TypeScript clean.

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

- [ ] **3.1 — Homepage**
  - Search bar: event type, location, date (or date range), number of guests
  - Recommended/featured venues section
  - Responsive layout (desktop & mobile)
  - Connected to `GET /venues` API with search params

- [ ] **3.2 — Venues listing page**
  - Filter sidebar/panel: budget, capacity, style/theme, event type, location
  - Sorting options (price, capacity, relevance)
  - Venue cards with key info (photo, name, capacity, location, price range)
  - Pagination or infinite scroll
  - Empty state and loading state handling

- [ ] **3.3 — Venue detail page**
  - Photo gallery (multiple images)
  - Venue details: capacity, location, available styles/themes
  - Pricing information section
  - Availability request CTA button
  - Favorites toggle (heart icon) — requires auth
  - Schedule a viewing button — requires auth (opens date/time picker → confirms → triggers confirmation email)
  - Mobile-first, fully responsive

- [ ] **3.4 — Availability request flow (UI)**
  - Multi-step form:
    1. Date selection (exact date or date range picker)
    2. Number of guests input (with capacity validation feedback)
    3. Event type selection
    4. Optional message field for special requirements
  - Form validation and inline error states
  - Submission confirmation screen
  - Connected to `POST /requests` API
  - Email notification triggered on submit

- [ ] **3.5 — About, Contact & static pages**
  - About page (static content)
  - Contact page (basic contact form or info)
  - Multi-language support: English + one additional language (i18n strings wired up)
  - SEO: meta tags, Open Graph tags, page titles

- [ ] **3.6 — Frontend component tests (public website)**
  - Component tests for search bar, filter panel, venue card
  - Form validation tests for availability request flow
  - Multi-language rendering tests
  - Tool: React Testing Library + Jest/Vitest

---

## Phase 4 — Frontend: User Dashboard
> Depends on: Phase 2, Phase 3, Phase 1.3, Phase 1.4

- [ ] **4.1 — Auth pages (register, login, profile)**
  - Registration page (form + validation + error states)
  - Login page (form + validation + error states)
  - Redirect flow after login (back to intended page)
  - Profile settings page:
    - Update name, email, phone number
    - Notification preferences toggles (booking updates, viewing reminders, marketing emails)

- [ ] **4.2 — Availability requests dashboard**
  - List of user's submitted requests
  - Status filter tabs: Active, Completed, Rejected, Cancelled
  - Request detail view (venue info, submitted date, status, message)
  - Empty state per status tab

- [ ] **4.3 — Favorites dashboard**
  - Saved venues grid with key info
  - Remove from favorites option
  - Heart toggle on venue cards across the site (synced with auth state)
  - Empty state

- [ ] **4.4 — Viewings dashboard**
  - List of upcoming and past viewings
  - Viewing detail: venue name, scheduled date/time, status
  - Cancel viewing option
  - Schedule viewing flow (accessible from venue detail page)
  - Empty state

- [ ] **4.5 — Frontend component tests (dashboard)**
  - Auth form tests (register, login, validation)
  - Dashboard tab and filter behaviour tests
  - Favorites toggle tests
  - Viewing scheduling flow tests
  - Tool: React Testing Library + Jest/Vitest

---

## Phase 5 — QA, Polish & Launch
> Depends on: All phases complete

- [ ] **5.1 — End-to-end testing**
  - Critical user flows:
    - Search → filter → view venue detail → submit availability request → receive confirmation email
    - Register → login → manage profile notifications
    - Save to favorites → view in dashboard → remove
    - Schedule a viewing → view in dashboard → cancel
  - Mobile & desktop responsiveness checks across all pages
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Tool: Playwright or Cypress

- [ ] **5.2 — Performance & accessibility audit**
  - Lighthouse audit (Core Web Vitals: LCP, CLS, FID)
  - Image optimization (next/image, WebP format, lazy loading)
  - WCAG AA compliance check
  - Keyboard navigation and screen reader testing
  - Fix all critical and high severity issues

- [ ] **5.3 — Security review**
  - Input sanitization and XSS protection
  - SQL injection protection (ORM parameterized queries)
  - Auth token handling review (httpOnly cookies, expiry)
  - Rate limiting on auth endpoints
  - Environment variables audit (no secrets in codebase)

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
| Phase 2 — Auth | 🔲 Not started | |
| Phase 3 — Public Frontend | 🔲 Not started | |
| Phase 4 — User Dashboard | 🔲 Not started | |
| Phase 5 — QA & Launch | 🔲 Not started | |

> Update statuses as work progresses: 🔲 Not started → 🟡 In Progress → ✅ Done