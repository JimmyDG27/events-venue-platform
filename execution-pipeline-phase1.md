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

- [ ] **0.1 — Initialize monorepo & tooling**
  - Next.js project scaffold (App Router)
  - Tailwind CSS configuration
  - ESLint + Prettier setup
  - Git repository initialization
  - CI/CD pipeline skeleton (GitHub Actions)

- [ ] **0.2 — Define database schema**
  - PostgreSQL schema design:
    - `users` (id, name, email, phone, notification_preferences, created_at)
    - `venues` (id, name, description, location, capacity, styles, pricing, photos, created_at)
    - `availability_requests` (id, user_id, venue_id, date_from, date_to, guests, event_type, message, status, created_at)
    - `viewings` (id, user_id, venue_id, scheduled_at, status, created_at)
    - `favorites` (id, user_id, venue_id, created_at)
  - Migrations setup (Prisma or Drizzle ORM)

- [ ] **0.3 — Set up cloud infrastructure**
  - Provision PostgreSQL database (e.g. Supabase / Railway)
  - Cloud storage bucket for venue images (e.g. AWS S3 / Cloudflare R2)
  - Environment variables management (.env structure)
  - Staging environment provisioning
  - Hosting setup (scalable cloud infrastructure)

- [ ] **0.4 — Design system & component library**
  - Color tokens, typography scale
  - Base reusable components: Button, Input, Card, Modal, Badge
  - Responsive grid/layout system (desktop & mobile)
  - i18n framework setup (English + one additional language)

---

## Phase 1 — Backend: Core API
> Depends on: Phase 0

- [ ] **1.1 — REST API structure & middleware**
  - Node.js API setup and routing
  - Request validation middleware (Zod)
  - Error handling middleware (global error handler)
  - Rate limiting setup
  - Logging setup

- [ ] **1.2 — Venues API endpoints**
  - `GET /venues` — list with filters (budget, capacity, style/theme, location, event type) and sorting options
  - `GET /venues/:id` — venue detail (photos, capacity, styles, pricing, location)
  - Image upload endpoint (cloud storage integration)
  - Seed realistic venue data for development and testing

- [ ] **1.3 — Availability Request API endpoints**
  - `POST /requests` — create request (date/date range, guest count, event type, optional message)
  - Guest count vs venue capacity validation logic
  - `GET /requests` — user's own requests, with status filter (Active, Completed, Rejected, Cancelled)
  - `GET /requests/:id` — request detail
  - `PATCH /requests/:id/status` — update status

- [ ] **1.4 — Favorites & Viewings API endpoints**
  - `POST /favorites/:venueId` — save venue to favorites
  - `DELETE /favorites/:venueId` — remove from favorites
  - `GET /favorites` — list user's favorite venues
  - `POST /viewings` — schedule a venue visit (venue_id, date/time)
  - `GET /viewings` — list upcoming and past viewings
  - `PATCH /viewings/:id` — update or cancel a viewing

- [ ] **1.5 — Email notification service**
  - Transactional email provider setup (Resend or SendGrid)
  - Email templates:
    - Request submitted confirmation (to user)
    - Request status update (approved / rejected / cancelled)
    - Viewing scheduled confirmation
    - Viewing reminder
  - Queue-based email sending (avoid blocking API)
  - Marketing email opt-in/opt-out support (notification preferences)

- [ ] **1.6 — Backend unit & integration tests**
  - Unit tests for business logic (capacity validation, status transitions)
  - Integration tests for all API endpoints (happy path + edge cases)
  - Test database setup (separate test DB or in-memory)
  - Test runner: Jest or Vitest

---

## Phase 2 — Authentication
> Depends on: Phase 0, Phase 1.1 | [can run in parallel with Phase 1.2–1.5]

- [ ] **2.1 — Email-based auth (register & login)**
  - User registration endpoint (`POST /auth/register`)
  - User login endpoint (`POST /auth/login`)
  - Password hashing (bcrypt)
  - JWT or session-based auth (secure cookie handling)
  - Email verification flow on registration

- [ ] **2.2 — Auth middleware & route protection**
  - Middleware to protect private API routes
  - Attach authenticated user context to requests
  - Token refresh / session expiry handling
  - Logout endpoint (`POST /auth/logout`)

- [ ] **2.3 — Profile settings API**
  - `GET /users/me` — get current user profile
  - `PATCH /users/me` — update name, email, phone number
  - `PATCH /users/me/notifications` — update notification preferences:
    - Booking/request updates
    - Viewing reminders
    - Marketing emails

- [ ] **2.4 — Auth unit & integration tests**
  - Register / login / logout flow tests
  - Protected route access tests (with and without valid token)
  - Notification preference update tests

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
| Phase 0 — Setup | 🔲 Not started | |
| Phase 1 — Backend API | 🔲 Not started | |
| Phase 2 — Auth | 🔲 Not started | |
| Phase 3 — Public Frontend | 🔲 Not started | |
| Phase 4 — User Dashboard | 🔲 Not started | |
| Phase 5 — QA & Launch | 🔲 Not started | |

> Update statuses as work progresses: 🔲 Not started → 🟡 In Progress → ✅ Done