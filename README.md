# Mova Condo

A full-stack condominium management system for a single condominium building. Designed for administrators, juristic managers, staff, security guards, and residents to manage daily operations in one centralized platform.

> **Portfolio Project** — Demonstrates production-grade full-stack development including REST API design, RBAC, database architecture, and modern UI patterns. All payments are **simulated (fake)** — no real payment gateway is integrated.

---

## Status

| Module | Status |
|---|---|
| Authentication & Users | ✅ Done |
| Floor & Unit Management | ✅ Done |
| Resident Management | ✅ Done |
| Announcements | ✅ Done |
| Visitor Management | ✅ Done |
| Maintenance Requests | 🔲 Planned |
| Billing & Payment | 🔲 Planned |
| Parcel Management | 🔲 Planned |
| Analytics Dashboard | 🔲 Planned |

---

## Features

### Authentication & User Management ✅
- Login / logout with JWT (cookie-based)
- Role-based access: Admin, Juristic, Maintenance, Security Guard, Resident
- Profile session handling

### Floor & Unit Management ✅
- Single building (Mova Condo) with editable name and address
- Floor creation and deletion (floors with active units cannot be deleted)
- Unit management per floor: unit number, size preset (S/M/L/XL), monthly rent
- Occupancy status: Available, Occupied
- Search and filter units by status per floor
- Size badges (S / M / L / XL) based on area

### Resident Management ✅
- Resident list with real-time client-side search (name, email, unit number)
- Filter by status (Active / Moved Out) and type (Owner / Tenant)
- Summary counts: total residents, owners, tenants
- Color-coded badges: Owner (blue), Tenant (amber), Active (green)
- Add resident with user autocomplete search and floor → unit cascade select
- Move-in / move-out tracking with auto unit occupancy update
- Family members & emergency contacts (CRUD per resident)
- Soft delete: residents are marked INACTIVE on move-out (never deleted)

### Announcements ✅
- Post and manage building-wide announcements
- Active / expired status with optional expiry date
- Pin important announcements to top
- Unread badge with per-user read tracking
- Bell notification dropdown in topbar (5 latest active)

### Maintenance Requests 🔲
- Ticket submission by residents or staff
- Staff assignment and priority management
- Status tracking: Pending → In Progress → Done
- Maintenance history

### Billing & Payment 🔲

> Payments are **simulated** — no real payment gateway.

- Monthly fee generation per unit
- Invoice management
- Simulated payment recording and history
- Payment status: Pending, Paid, Overdue

### Visitor Management ✅
- Manual visitor check-in by security guard or staff
- Floor → unit cascade select with optional resident link
- Check-out confirmation with timestamp
- Client-side filter: All / Inside / Checked Out
- Search by visitor name, phone, or unit number
- "Currently inside" count in header
- Responsive table with check-in/check-out timestamps

### Parcel Management 🔲
- Log incoming parcels per resident
- Pickup confirmation
- Parcel history

### Analytics Dashboard 🔲
- Occupancy rate overview
- Resident count by type
- Pending maintenance summary
- Revenue snapshot

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | NestJS 11, TypeScript (ESM) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | JWT (cookie-based) |
| i18n | next-intl (Thai / English) |
| UI Components | Base UI, Shadcn/ui |
| State Management | Zustand |
| Validation | class-validator, class-transformer |

---

## Project Structure

```
mova-condo-management/
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/               # Routes and layouts
│       │   ├── (auth)/        # Login page
│       │   └── (dashboard)/   # Main app pages
│       │       ├── floors/         # Floor & unit management
│       │       ├── residents/      # Resident management
│       │       ├── announcements/  # Announcements
│       │       └── visitors/       # Visitor management
│       ├── components/
│       │   ├── shared/        # Feature dialogs (forms, confirm, move-out)
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
│       └── visitors/      # Visitor check-in/check-out
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
npx prisma migrate dev
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
| Admin | admin@condo.com | Admin1234 |
| Juristic | manager@condo.com | Manager1234 |
| Maintenance | maintenance@condo.com | Maintenance1234 |
| Security Guard | guard@condo.com | Guard1234 |
| Resident | john.doe@condo.com | Resident1234 |

Seed creates: 1 building · 10 floors · 60 units · 21 users · 18 resident records · 9 family members · 9 emergency contacts · 12 announcements · 15 visitor records

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
