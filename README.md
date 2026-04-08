# Mova Condo

A full-stack condominium management system for a single condominium building. Designed for administrators, property managers, staff, and residents to manage daily operations in one centralized platform.

> **Portfolio Project** — Demonstrates production-grade full-stack development including REST API design, RBAC, database architecture, background jobs, and real-time systems. All payments are **simulated (fake)** — no real payment gateway is integrated.

---

## Modules

| Module | Description |
|---|---|
| Authentication & Users | Login, profile management, session handling |
| Role & Permission (RBAC) | Admin, Property Manager, Staff, Resident |
| Floor & Unit Management | Floors, units, occupancy status tracking |
| Resident Management | Profiles, move-in/out, family members, emergency contacts |
| Maintenance Requests | Ticket submission, technician assignment, status tracking |
| Facility Booking | Reserve shared facilities (gym, meeting room, pool) |
| Billing & Payment | Invoice generation, fee tracking, simulated payment |
| Visitor Management | Guest registration, QR pass, entry/exit logs |
| Parcel Management | Parcel logging, arrival notifications, pickup confirmation |
| Notifications | Real-time alerts for key system events |
| Analytics Dashboard | Occupancy, revenue, maintenance overview |
| System Administration | User/role management, audit logs, system settings |

---

## Features

### Authentication & User Management
- Login / logout
- Profile management
- Session handling

### Role & Permission System (RBAC)
Roles: **Admin**, **Property Manager**, **Staff**, **Resident**
- Role-based access control per route and resource

### Floor & Unit Management
- Single building (Mova Condo) with editable name and address
- Floor creation and deletion (floors with units cannot be deleted)
- Unit management per floor: unit number, area (sqm), bedrooms, bathrooms, monthly rent
- Occupancy status: Available, Occupied, Reserved, Maintenance

### Resident Management
- Resident profile and contact management
- Resident types: Owner, Tenant
- Assign residents to units
- Move-in / move-out tracking
- Family members & emergency contacts
- Resident history

### Maintenance Request System
- Maintenance ticket submission by residents
- Technician assignment and priority management
- Repair status tracking
- Maintenance history & resident feedback

### Facility Booking
- Browse available shared facilities
- Book time slots with conflict prevention
- Booking approval workflow
- Booking history

### Billing & Payment System

> Payments are **simulated** — no real payment gateway. This is a portfolio project demonstrating billing logic and UI only.

- Fee and charge type management
- Monthly fee auto-generation
- Invoice creation and management
- Simulated payment recording
- Payment history and status tracking
- Payment reminders

### Visitor Management
- Visitor registration and visit approval
- QR code / visitor pass generation
- Entry and exit logging
- Visitor history

### Parcel Management
- Parcel arrival logging
- Resident notification on arrival
- Pickup confirmation
- Parcel history

### Real-time Notifications
- New maintenance request alerts
- Simulated payment received
- Visitor arrival
- Maintenance status updates

### Analytics Dashboard
- Total residents & occupancy rate
- Monthly revenue summary
- Pending maintenance overview
- Unit availability at a glance

### System Administration
- User and role management
- System settings
- Audit logs

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
| PDF | @react-pdf/renderer (planned) |
| Realtime | Planned |
| Background Jobs | Planned |

---

## Project Structure

```
condo-management-platform/
├── frontend/          # Next.js App Router (src/)
│   └── src/
│       ├── app/           # Routes and layouts
│       ├── components/    # UI, shared, layout, providers
│       ├── services/      # API call layer
│       ├── store/         # Zustand global state
│       ├── hooks/         # Reusable React hooks
│       ├── types/         # Shared TypeScript definitions
│       ├── lib/           # HTTP client and shared libs
│       ├── utils/         # Pure utility functions
│       └── config/        # App configuration
└── backend/           # NestJS REST API
    ├── src/
    └── prisma/        # Schema and migrations
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
cd condo-management-platform
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run start:dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Copy the environment file:

```bash
cp .env.example .env.local
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`  
Backend runs at `http://localhost:3001`

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
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
