# Mova Condo

A full-stack condominium management system for a single building. Designed for administrators, juristic managers, maintenance staff, security guards, and residents to manage daily operations in one centralized platform.

> **Portfolio Project** — Demonstrates production-grade full-stack development including REST API design, role-based access control, database architecture, and modern UI patterns. All payments are **simulated (fake)** — no real payment gateway is integrated.

---

## Status

| Module | Status |
|---|---|
| Authentication & Users | ✅ Done |
| Floor & Unit Management | ✅ Done |
| Resident Management | ✅ Done |
| Announcements | ✅ Done |
| Visitor Management | ✅ Done |
| Maintenance Requests | ✅ Done |
| Parcel Management | ✅ Done |
| Billing & Payment | 🔲 Planned |
| Analytics Dashboard | 🔲 Planned |
| Administration (User Management) | 🔲 Planned |

---

## Features

### Authentication & User Management ✅
- Login / logout with JWT (HTTP-only cookie)
- Role-based access: Admin, Juristic, Maintenance, Security Guard, Resident
- Profile session in topbar with logout

### Floor & Unit Management ✅
- Single building with editable name and address
- Floor creation and deletion (floors with active units cannot be deleted)
- Unit management per floor: unit number, area, bedrooms, bathrooms, monthly rent
- Size badges (S / M / L / XL) derived from area range — color-coded, visible in both light and dark mode
- Occupancy status: Available, Occupied, Reserved, Maintenance
- Search and filter units by status per floor

### Resident Management ✅
- Resident list with search (name, email) and filter by status / type
- Summary counts: total, owners, tenants
- Add resident: select existing user account → assign floor + unit → set type and move-in date
- Move-in / move-out tracking with auto unit occupancy update
- Duration of stay: `(~1.5 yrs) 17 months 15 days`
- Recorded by: shows name + role of staff who added the resident
- Hard delete with confirmation
- Family members & emergency contacts (full CRUD per resident)

### Announcements ✅
- Post and manage building-wide announcements
- Active / expired status with optional expiry date
- Pin important announcements to top
- Unread badge with per-user read tracking
- Bell notification dropdown in topbar (5 latest active)

### Visitor Management ✅
- Manual visitor check-in by security guard or staff
- Floor → unit cascade select with optional resident link
- Check-out confirmation with timestamp
- Auto check-out daily at 03:00 via scheduler
- Filter: All / Inside / Checked Out with "currently inside" count
- Search by visitor name, phone, or unit number

### Maintenance Requests ✅
- Ticket submission with category, description, and unit link
- Staff assignment (assign / reassign / unassign)
- Status flow: Open → In Progress → Resolved / Cancelled
- Staff note per ticket
- Full audit log history: every status change, assignment, and note update — recorded with actor name, role, and timestamp — displayed newest-first

### Parcel Management ✅
- Log incoming parcels with tracking number, carrier, and unit
- Optional resident link
- Claim confirmation with timestamp and staff record
- Filter: All / Pending / Claimed with "waiting for pickup" count
- Search by tracking number or unit

### Billing & Payment 🔲

> Payments are **simulated** — no real payment gateway.

- Monthly fee generation per unit
- Invoice management
- Simulated payment recording and history

### Analytics Dashboard 🔲
- Occupancy rate overview
- Resident count by type
- Pending maintenance summary
- Revenue snapshot

### Administration 🔲
- User account creation and management
- Role assignment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | NestJS 11, TypeScript (ESM) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | JWT (HTTP-only cookie) |
| UI Components | Base UI (headless) + custom Shadcn-style |
| State | Zustand |
| i18n | next-intl (Thai / English) |
| Validation | class-validator, class-transformer |

---

## Project Structure

```
mova-condo-management/
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/               # Routes and pages
│       │   ├── (auth)/        # Login page
│       │   └── (dashboard)/   # Main app pages
│       │       ├── floors/         # Floor & unit management
│       │       ├── residents/      # Resident management
│       │       ├── announcements/  # Announcements
│       │       ├── visitors/       # Visitor management
│       │       ├── maintenance/    # Maintenance tickets
│       │       └── parcels/        # Parcel management
│       ├── components/
│       │   ├── shared/        # Feature dialogs (forms, confirm, move-out, etc.)
│       │   ├── ui/            # Base UI components
│       │   └── layout/        # Sidebar, header, providers
│       ├── services/          # API call layer
│       ├── store/             # Zustand global state
│       ├── types/             # Shared TypeScript definitions
│       ├── lib/               # HTTP client
│       ├── utils/             # Pure utility functions
│       └── messages/          # i18n strings (th / en)
└── backend/                   # NestJS REST API
    ├── src/
    │   └── api/
    │       ├── auth/          # Auth, users
    │       ├── buildings/     # Building CRUD
    │       ├── floors/        # Floor CRUD
    │       ├── units/         # Unit CRUD
    │       ├── residents/     # Resident, family, emergency contacts
    │       ├── announcements/ # Announcements
    │       ├── visitors/      # Visitor check-in/check-out
    │       ├── maintenance/   # Maintenance tickets + audit log
    │       └── parcels/       # Parcel logging and claims
    └── prisma/
        ├── schema.prisma
        ├── migrations/
        └── seed.ts
```

---

## Prerequisites

- Node.js >= 20
- PostgreSQL

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd mova-condo-management
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
```

Run migrations and seed:

```bash
npx prisma migrate deploy
npm run seed
```

Start the backend:

```bash
npm run start:dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |

---

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@movacondo.co.th | Admin1234 |
| Juristic | manager@movacondo.co.th | Manager1234 |
| Maintenance | maintenance@movacondo.co.th | Maintenance1234 |
| Security Guard | guard@movacondo.co.th | Guard1234 |
| Resident | john.doe@gmail.com | Resident1234 |

Seed creates: 1 building · 10 floors · 120 units · 27 users · 21 residents · 12 announcements · 20 visitor records · 28 parcels · 15 maintenance tickets with full audit log history

---

## Available Scripts

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

### Backend

| Script | Description |
|---|---|
| `npm run start:dev` | Start with watch mode |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run seed` | Seed database with sample data |
| `npm run test` | Run unit tests |
