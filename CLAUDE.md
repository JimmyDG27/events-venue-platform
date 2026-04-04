# CLAUDE.md
> This file provides project context to Claude Code. Read it alongside `AGENTS.md` before making any changes.

---

## Project Overview

**Name:** Events Venue Discovery & Booking Platform  
**Type:** Web application — MVP (Phase 1)  
**Goal:** Connect event organizers with venue owners. Users browse, filter, and request availability for venues. Venue owners manage listings and respond to inquiries.  
**Execution Pipeline:** See `execution-pipeline-phase1.md` for the full task breakdown and progress tracking.

---

## Tech Stack

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

## Project Structure

```
/
├── CLAUDE.md                        # This file
├── execution-pipeline-phase1.md     # Task pipeline & progress tracker
├── apps/
│   ├── web/                         # Next.js frontend (App Router)
│   │   ├── app/                     # Pages and layouts
│   │   ├── components/              # Reusable UI components
│   │   ├── lib/                     # Utilities and helpers
│   │   └── public/                  # Static assets
│   └── api/                         # NestJS or FastAPI backend
│       ├── src/
│       │   ├── auth/                # Auth module
│       │   ├── venues/              # Venues module
│       │   ├── requests/            # Availability requests module
│       │   ├── favorites/           # Favorites module
│       │   ├── viewings/            # Viewings module
│       │   ├── users/               # Users/profile module
│       │   └── notifications/       # Email notification module
│       └── prisma/
│           └── schema.prisma        # Database schema
├── packages/
│   └── shared/                      # Shared types and utilities
└── .github/
    └── workflows/                   # CI/CD pipelines
```

---

## Database Schema

### Tables
- **users** — `id, name, email, phone, notification_preferences, created_at`
- **venues** — `id, name, description, location, capacity, styles, pricing, photos, created_at`
- **availability_requests** — `id, user_id, venue_id, date_from, date_to, guests, event_type, message, status, created_at`
- **viewings** — `id, user_id, venue_id, scheduled_at, status, created_at`
- **favorites** — `id, user_id, venue_id, created_at`

### Request Status Values
`Active` | `Completed` | `Rejected` | `Cancelled`

### Viewing Status Values
`Scheduled` | `Completed` | `Cancelled`

---

## API Endpoints (Phase 1)

### Auth
- `POST /auth/register` — register with email + password
- `POST /auth/login` — login, returns JWT
- `POST /auth/logout` — invalidate session

### Users
- `GET /users/me` — current user profile
- `PATCH /users/me` — update name, email, phone
- `PATCH /users/me/notifications` — update notification preferences

### Venues
- `GET /venues` — list with filters (budget, capacity, style, location, event type) + sorting
- `GET /venues/:id` — venue detail

### Availability Requests
- `POST /requests` — create request
- `GET /requests` — user's requests (filterable by status)
- `GET /requests/:id` — request detail
- `PATCH /requests/:id/status` — update status

### Favorites
- `POST /favorites/:venueId` — save to favorites
- `DELETE /favorites/:venueId` — remove from favorites
- `GET /favorites` — list user's favorites

### Viewings
- `POST /viewings` — schedule a viewing
- `GET /viewings` — list upcoming and past viewings
- `PATCH /viewings/:id` — update or cancel a viewing

---

## Key Business Rules

- Guest count cannot exceed venue capacity — validate on request creation
- A user can only see their own requests, favorites, and viewings
- Email notifications are sent on:
  - Availability request submitted
  - Request status updated (approved / rejected / cancelled)
  - Viewing scheduled (confirmation)
  - Viewing reminder (before the visit)
- Notification preferences per user: booking updates, viewing reminders, marketing emails

---

## Frontend Pages (Phase 1)

| Page | Route | Auth required |
|---|---|---|
| Homepage | `/` | No |
| Venues listing | `/venues` | No |
| Venue detail | `/venues/:id` | No (actions require auth) |
| Availability request flow | `/venues/:id/request` | Yes |
| Register | `/auth/register` | No |
| Login | `/auth/login` | No |
| Profile settings | `/dashboard/profile` | Yes |
| Requests dashboard | `/dashboard/requests` | Yes |
| Favorites dashboard | `/dashboard/favorites` | Yes |
| Viewings dashboard | `/dashboard/viewings` | Yes |
| About | `/about` | No |
| Contact | `/contact` | No |

---

## Frontend Design Direction

- **Style:** Refined / editorial — luxury feel that builds trust with event organizers
- **Fonts:** Distinctive display font paired with a refined body font (no Inter, Arial, or generic system fonts)
- **Colors:** CSS variables throughout — dominant neutral base with strong accent color
- **Motion:** Subtle, purposeful — staggered reveals on load, hover states on cards
- **Layout:** Clean grid with generous negative space, occasional asymmetry on hero sections
- **Responsive:** Mobile-first, desktop-enhanced
- **i18n:** English + one additional language (framework set up from Phase 0)

---

## Development Conventions

- All new features must have corresponding tests before marking as done in the pipeline
- Follow RESTful conventions for all API endpoints
- Use Zod for request validation (backend)
- Use React Testing Library for component tests (frontend)
- Keep CLAUDE.md, AGENTS.md and execution-pipeline-phase1.md updated as work progresses
- Mark tasks as `🟡 In Progress` when started, `✅ Done` when complete and tested — full rules in `AGENTS.md`

---

## Current Phase

**Phase 1 MVP — In Progress**  
Track progress in: `execution-pipeline-phase1.md`