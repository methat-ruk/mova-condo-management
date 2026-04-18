# System Architecture

## Overview

Mova Condo is a full-stack web application with a clear separation between a Next.js frontend and a NestJS REST API backend, connected to a PostgreSQL database via Prisma ORM.

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  Next.js 15 (App Router)          :3000                 │
│  ├── Middleware (proxy.ts)  ──── route guard            │
│  ├── Pages / Components                                 │
│  ├── Services (fetch wrapper)                           │
│  └── Zustand (auth + UI state)                          │
└────────────────────┬────────────────────────────────────┘
                     │  REST API (JSON)
                     │  Bearer token (Authorization header)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  NestJS 11                        :4000                 │
│  ├── JwtAuthGuard  (all routes)                         │
│  ├── ValidationPipe (class-validator)                   │
│  └── Modules: auth, buildings, floors, units,           │
│               residents, announcements, visitors,       │
│               maintenance, parcels                      │
└────────────────────┬────────────────────────────────────┘
                     │  Prisma Client
                     ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL                                             │
└─────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

Token is a signed JWT issued on login. It is stored in two places on the client:

| Storage | Purpose |
|---|---|
| `localStorage["token"]` | Sent as `Authorization: Bearer` header on every API call |
| `AUTH_TOKEN` cookie (SameSite=Lax) | Read by Next.js middleware for server-side route guarding |

**Login:**
1. POST `/api/auth/login` → backend validates credentials, returns `{ token, user }`
2. Frontend stores token in `localStorage` and cookie via `authStore.setAuth()`
3. Zustand persists state to `localStorage` via `zustand/persist`

**Route Guard (middleware):**
- `proxy.ts` runs on every non-static request
- Reads `AUTH_TOKEN` cookie
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login`

**API calls:**
- `lib/api.ts` reads token from `localStorage` and attaches as `Authorization: Bearer`
- On 401 response: clears token + cookie, redirects to `/login`

---

## Frontend Architecture

### Layer Structure

```
src/
├── app/                    # Next.js App Router routes
│   ├── (auth)/login        # Public — login page
│   └── (dashboard)/        # Protected — main app
│       ├── layout.tsx       # Sidebar + Topbar shell
│       ├── dashboard/       # Overview page
│       ├── floors/          # Floor list + unit grid per floor
│       ├── residents/       # Resident list + detail page
│       ├── announcements/   # Announcement list + detail
│       ├── visitors/        # Visitor check-in/out
│       ├── maintenance/     # Maintenance tickets
│       └── parcels/         # Parcel logging
│
├── components/
│   ├── layout/              # Sidebar, Topbar, ThemeToggle, AnnouncementBell
│   ├── shared/              # Feature dialogs (forms, confirm, move-out, etc.)
│   └── ui/                  # Atomic: Button, SelectInput, breadcrumb
│
├── services/                # One file per resource — thin wrappers over api.ts
├── types/                   # TypeScript interfaces per domain
├── store/                   # Zustand: authStore, uiStore
├── lib/api.ts               # Fetch wrapper (GET/POST/PATCH/DELETE)
├── utils/                   # Pure helpers: unit sizes, breadcrumb labels
├── hooks/                   # useIsDesktop, useIsMounted
├── i18n/                    # next-intl config
└── messages/                # th.json, en.json
```

### State Management

| Store | Contents |
|---|---|
| `authStore` | Authenticated user, JWT token, setAuth / clearAuth |
| `uiStore` | Sidebar open/close state |

All server data is fetched directly in page components with `useState` + `useEffect`. No global data cache layer — each page owns its own data lifecycle.

### i18n

- Two locales: **Thai (default)** and **English**
- Locale stored in `LOCALE` cookie; read by middleware and passed as `x-locale` header
- `useTranslations()` from `next-intl` used in all components
- All user-facing strings live in `messages/th.json` and `messages/en.json`

### Theme

- Light / dark mode via `.dark` class on `<html>`
- Persisted in `localStorage`
- Tailwind `dark:` prefix for all dark-mode overrides

---

## Backend Architecture

### Module Structure

Every feature follows the same NestJS pattern:

```
feature/
├── feature.module.ts      # Imports PrismaModule, registers controller + service
├── feature.controller.ts  # Route handlers, DTO binding, auth guard
├── feature.service.ts     # Business logic, Prisma queries
└── dto/                   # class-validator DTOs for request bodies
```

### Global Configuration (`main.ts`)

- Global prefix: `/api`
- CORS: `FRONTEND_URL` env var (default `http://localhost:3000`), credentials allowed
- `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Port: `PORT` env var (default `4000`)

### Authentication Guard

`JwtAuthGuard` is applied at the controller class level on all modules. Every endpoint is protected by default. The JWT strategy extracts `{ id, email, role }` from the token and attaches it to `req.user`.

### Modules

| Module | Key Endpoints |
|---|---|
| `auth` | `POST /api/auth/login`, `GET /api/auth/me` |
| `buildings` | `GET/PATCH /api/buildings/:id` |
| `floors` | `GET/POST/DELETE /api/buildings/:id/floors` |
| `units` | `GET/POST/PATCH/DELETE /api/floors/:id/units` |
| `residents` | `GET/POST/PATCH/DELETE /api/residents`, sub-routes for family + emergency contacts |
| `announcements` | `GET/POST/PATCH/DELETE /api/announcements`, `POST /api/announcements/:id/read` |
| `visitors` | `GET/POST /api/visitors`, `PATCH /api/visitors/:id/check-out` |
| `maintenance` | `GET/POST/PATCH/DELETE /api/maintenance` |
| `parcels` | `GET/POST /api/parcels`, `PATCH /api/parcels/:id/claim` |

### Scheduled Tasks

`VisitorsScheduler` runs a cron job daily at **03:00** to auto check-out visitors still marked as `IN`.

---

## Database Schema

### Entity Relationship Overview

```
Building ──< Floor ──< Unit ──< Resident >── User
                              │
                              ├──< Visitor
                              ├──< Parcel
                              └──< MaintenanceTicket ──< MaintenanceTicketLog

Resident ──< FamilyMember
         ──< EmergencyContact
         ──< Visitor (optional link)
         ──< Parcel (optional link)
         ──< MaintenanceTicket (optional link)

Announcement ──< AnnouncementRead >── User
```

### Models

#### Building
Single building record. `totalFloors` is a denormalized count for display.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | |
| address | String | |
| totalFloors | Int | |
| description | String? | |
| isActive | Boolean | default true |

#### Floor
`@@unique([buildingId, floorNumber])` — no duplicate floor numbers per building.

#### Unit
`@@unique([floorId, unitNumber])` — no duplicate unit numbers per floor.
`occupancyStatus` auto-updated when residents move in/out.

#### User
Roles: `ADMIN`, `JURISTIC`, `MAINTENANCE`, `GUARD`, `RESIDENT`

#### Resident
Links a `User` to a `Unit`. Supports soft move-out (status → `INACTIVE`).
`createdBy` (optional) records which staff member added the resident.

#### FamilyMember / EmergencyContact
Cascade-delete when parent `Resident` is deleted.

#### Announcement / AnnouncementRead
`AnnouncementRead` is a join table with composite PK `[userId, announcementId]` for per-user read tracking.

#### Visitor
`isAutoExpired` flag set by the nightly scheduler when auto-checked-out.

#### Parcel
`receivedBy` and `claimedBy` use named relations on `User` to distinguish the two roles.

#### MaintenanceTicket
`reportedBy` and `assignedTo` use named relations on `User`.

#### MaintenanceTicketLog
Append-only audit log for all ticket mutations. Fields:
- `action`: `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `REASSIGNED`, `UNASSIGNED`, `NOTE_UPDATED`
- `oldValue` / `newValue`: previous and new string values
- `user`: actor who triggered the change

### Enums

| Enum | Values |
|---|---|
| `OccupancyStatus` | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` |
| `UserRole` | `ADMIN`, `JURISTIC`, `MAINTENANCE`, `GUARD`, `RESIDENT` |
| `ResidentType` | `OWNER`, `TENANT` |
| `ResidentStatus` | `ACTIVE`, `INACTIVE` |
| `AnnouncementStatus` | `ACTIVE`, `EXPIRED` |
| `ParcelStatus` | `PENDING`, `CLAIMED` |
| `MaintenanceStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED` |
| `MaintenanceCategory` | `ELECTRICAL`, `PLUMBING`, `HVAC`, `STRUCTURAL`, `APPLIANCE`, `OTHER` |

---

## Key Design Decisions

**Single building** — The system is scoped to one building. `Building` is a singleton record with no multi-tenancy.

**JWT in localStorage + cookie** — `localStorage` is the source of truth for API calls (Bearer header). The cookie is a read-only mirror used only by Next.js middleware for server-side route guarding, avoiding a round-trip to the backend on every page load.

**No HTTP-only cookie for API auth** — The backend validates Bearer tokens, not cookies. This keeps the backend stateless and avoids CSRF complexity for an internal staff tool.

**Audit log as append-only table** — `MaintenanceTicketLog` is never updated or deleted (except via cascade when the ticket is deleted). This gives a reliable event history.

**Soft move-out, hard delete** — Residents are marked `INACTIVE` on move-out (preserving history), but can also be permanently deleted by admin when needed.

**Unit size as range** — `getSizeKey()` maps area to S/M/L/XL by range (<30 / 30–44 / 45–64 / 65+) rather than fixed values, so any area gets a badge regardless of whether it matches a preset.
