@AGENTS.md

## 1. General Principles

- **No `any`**: Never use the `any` type. Define proper interfaces or types.
- **Functional Components**: Use arrow functions for all components.
- **Client vs Server**: Default to Server Components. Use `'use client'` only for interactivity (useState, useEffect) or browser APIs.
- **Clean Code**: Follow DRY and SOLID principles.

### Type Safety

TypeScript types must always be explicit and well-defined.

Rules:

- Avoid implicit types and `any`
- Prefer **interfaces** or **type aliases**
- Shared types must be placed in `/types`
- API request and response structures must have defined types

---

## 2. Naming Conventions

- **Folders/Files in App Router:** kebab-case (e.g., `user-profile/page.tsx`). Used for route segments and URL mapping.
- **Components (Files & Folders):** PascalCase (e.g., `UserProfile.tsx`, `DashboardLayout.tsx`). Used for React components and UI structure.
- **Services:** camelCase (e.g., `authService.ts`, `userService.ts`). Used for API calls and business logic communication layer.
- **Constants:** camelCase files (e.g., `userRoles.ts`, `routes.ts`). Used for application-wide constant values.
- **Config:** camelCase (e.g., `api.ts`, `env.ts`, `appConfig.ts`). Used for environment setup and system configuration.
- **Hooks:** camelCase + prefix use (e.g., `useAuth.ts`, `useResidents.ts`). Used for reusable React stateful logic.
- **Utils:** camelCase (e.g., `formatDate.ts`, `validateEmail.ts`). Used for pure helper functions.
- **Types / Interfaces:** PascalCase (e.g., `User.ts`, `Resident.ts`). Used for shared TypeScript types and interfaces

---

## 3. Folder Structure Standards

This project uses Next.js App Router and follows a standard folder structure
All application source code must be located inside the src directory

Folders that exist in the current implementation:

- `/app`: All routes and layouts (App Router)
- `/components/ui`: Atomic components (Shadcn)
- `/components/shared`: Reusable business components (e.g., ConfirmDialog)
- `/components/layout`: Sidebar, Topbar, ThemeToggle
- `/components/providers`: Context providers (e.g., ThemeProvider, AuthProvider)
- `/lib`: HTTP client and shared libraries (e.g., api.ts)
- `/types`: Shared TypeScript definitions (`index.ts`, `auth.ts`, `building.ts`, `resident.ts`)
- `/services`: API call layer (e.g., `authService.ts`, `buildingService.ts`, `unitService.ts`)
- `/store`: Global state management via Zustand (e.g., `authStore.ts`, `uiStore.ts`)
- `/hooks`: reusable React hooks
- `/utils`: pure utility functions
- `/config`: application configuration

---

## 4. Agent-Specific Instructions (MANDATORY)

- **Plan First (MANDATORY):**  
  AI MUST summarize the implementation plan and get explicit user confirmation before writing any code

- **Check Environment (REQUIRED):**  
  AI MUST verify that all required environment variables exist in `.env.example` before implementation

- **Verify Build (REQUIRED):**  
  AI MUST ensure both frontend and backend compile and run without errors

  Frontend:
  - npm run lint
  - npm run build
  Backend:
  - npm run lint
  - npm run build

## 4.1 Mandatory Planning Workflow (CRITICAL)

Before writing any code, the AI MUST follow this workflow:

### Step 1: Understand the Task
- Analyze the user's request
- Identify scope, affected modules, and requirements

### Step 2: Create a Plan
- Break down the implementation into clear steps
- Specify:
  - Files to create or update
  - Components / services involved
  - Data flow and logic

### Step 3: Present the Plan
- Show the plan to the user clearly
- DO NOT start coding yet

### Step 4: Get Confirmation
- Wait for explicit user approval or feedback

### Step 5: Execute
- Only after confirmation, proceed with implementation

## 4.2 Code Formatting & Linting (MANDATORY)

After modifying, adding, or removing any code, the AI MUST ensure the codebase is properly formatted and linted.

Rules:

- Always run code formatting after implementation
- Ensure the project passes lint checks with no errors
- Ensure formatting is consistent with the project's Prettier configuration

Required checks:

Frontend:
- `npm run lint`
- `npm run format`

Backend:
- `npm run lint`
- `npm run format`

If formatting issues are detected, they MUST be fixed before completing the task.

Key Principle:

Code must always remain **buildable, lint-clean, and consistently formatted** after every change.

---

## 5. CSS & UI & Responsive Design Rules

- Use Tailwind CSS for all styling
- Use `clsx` for conditional className handling
- Avoid inline styles
- The UI MUST follow mobile-first design
- Build layouts starting from mobile → tablet → desktop
- Use Tailwind responsive breakpoints (sm, md, lg, xl)

**Key Principle**
Design must adapt for usability, not just shrink the layout

---

## 6. Blocked Files (Blacklist)

AI MUST NOT read, scan, summarize, or include the following:

Dependencies

/node_modules/

Build outputs

/.next/
/dist/
/build/

Logs & temp

**/*.log
/logs/
/tmp/
/.cache/

Environment & secrets (CRITICAL)

.env*
.env.*
!.env.example

Lock files

**/package-lock.json

## 7. API Rules (MANDATORY)
- All API endpoints MUST start with /api
- Use RESTful conventions only
- Use kebab-case and plural resource names
- Use appropriate HTTP methods (GET, POST, PATCH, DELETE)
Examples:
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PATCH  /api/clients/:id
DELETE /api/clients/:id

## 8. Git Rules
- AI MUST NOT execute any git commands (`commit`, `push`, `pull`, `branch`)


## 9. Backend uses ES Module (ESM).

Rules:
- Use import/export only
- Do NOT use require, module.exports, or exports
- Always include .js extensions in imports (e.g., './service.js')
- Assume "type": "module" in package.json

Strictly no CommonJS allowed

## 10. Theme Direction

The system supports both **Light** and **Dark** mode via a toggle in the Topbar, with localStorage persistence and system preference fallback.

**Shared rules:**
- Use `dark:` Tailwind prefix for all dark mode classes — toggled via `.dark` class on `<html>`
- Avoid pure white (#fff) or pure black (#000) — use slate scale for visual comfort
- Use semantic color tokens instead of hardcoded colors where possible

## 11. Form Validation & User Feedback Rules

- The system MUST provide clear feedback to users when input errors or system actions occur. Two types of feedback must be used

- Server-side validation must also exist even if client validation is present

### Inline Validation (Form Errors)

Used for **form input validation errors**.

Rules:

* Display validation errors **directly on the input field**
* Highlight the input with a **red border**
* Show a **clear error message below the input**
* Validation must trigger on:

  * form submit
  * input blur
  * invalid user input

Examples:

* Required fields not filled
* Invalid email format
* Password too short
* Invalid numeric values

### Toast Notifications (Global Feedback)

Used for **system actions and API results**.

Rules:

* Display notifications at the **top-right corner**
* Notifications must **auto-dismiss after ~3 seconds**
* Must support the following types:

  * success
  * error
  * warning
  * info

Examples:

* Invoice created successfully
* Failed to update client
* Network error occurred

### Key Principle

* Use **Inline Validation** for user input errors
* Use **Toast Notifications** for system feedback

Never rely only on toast notifications for form validation.

---

## 12. API Error Handling Standards

All API interactions MUST implement consistent error handling.

Rules:

* All async operations MUST use **try-catch**
* All API responses must return **structured JSON responses**
* Error messages must be **user-friendly**
* Internal errors must NOT expose sensitive system details

Frontend must handle:

* network errors
* validation errors
* server errors (5xx)
* unauthorized access (401)

---

## 13. Loading State Rules

The UI MUST always indicate when data is loading.

Rules:

* Use **loading indicators** for async operations
* Prevent duplicate actions while loading
* Disable submit buttons during API calls
* Show skeleton loaders for data-heavy components
* Loading states must be visible within 300ms of user action

Examples:

* Table loading → show skeleton rows
* Form submission → disable submit button + loading spinner
* Page navigation → show loading indicator

Never leave users wondering if an action is processing.

---

## 14. Empty State Rules

The UI MUST clearly indicate when no data exists.

Rules:

* Display a **friendly empty state message**
* Provide guidance on what the user can do next
* Optionally include a **call-to-action button**

Examples:

Clients page with no data:

```
No clients yet
Create your first client to start managing invoices.
[ Create Client ]
```

Invoices page:

```
No invoices found
Invoices will appear here once created.
```

Key Principle:

Empty states must **guide the user toward the next action**, not just display "No data".

## 15. Security Guidelines

- Security must be considered in both frontend and backend implementations. The system MUST follow secure development practices to prevent common vulnerabilities

- Escape and sanitize user-generated content before rendering

### Input Validation

All external input MUST be validated.

Rules:

* Validate all request data using **Zod schemas** or class-validator (NestJS)
* Never trust user input
* Reject invalid or malformed requests
* Sanitize inputs when necessary

Examples:

* Form input validation
* API request body validation
* Query parameter validation

---

### Authentication & Authorization

Sensitive routes MUST require proper authentication and authorization.

Rules:

* Protect all private API endpoints
* Verify authentication before accessing protected resources
* Restrict access based on user roles or permissions where applicable
* Never expose protected data without authorization checks

---

### Sensitive Data Protection

Sensitive information MUST never be exposed.

Rules:

* Never return secrets in API responses
* Never log sensitive information
* Avoid exposing internal error details to users

Sensitive data examples:

* passwords
* tokens
* API keys
* database credentials

---

### Environment Variables

All secrets MUST be stored in environment variables.

Rules:

* Never hardcode secrets in the codebase
* Store sensitive configuration in `.env`
* Commit only `.env.example` to the repository
* `.env` files must be included in `.gitignore`

Examples:

```
DATABASE_URL=
JWT_SECRET=
API_KEY=
```

---

### Rate Limiting & Abuse Protection

Public endpoints should implement protections against abuse.

Rules:

* Apply rate limiting where appropriate
* Prevent brute force attacks on authentication endpoints
* Limit repeated requests to sensitive routes

Examples:

* login endpoint
* password reset endpoint
* public API routes

---

### Dependencies & Updates

Dependencies must be maintained securely.

Rules:

* Regularly update packages
* Monitor for known vulnerabilities
* Avoid unnecessary dependencies

Recommended practice:

Run security audits periodically.

```
npm audit
```

---

### Key Principle

Security must be considered **by default**, not as an afterthought.

Every feature must assume:

* inputs may be malicious
* APIs may be abused
* sensitive data must be protected
