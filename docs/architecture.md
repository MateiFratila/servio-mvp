# Servio — Architecture

## Overview

Servio is a marketplace MVP where clients contract fiscal consultants for consultation sessions. The platform exposes role-differentiated dashboards and is backed by a REST API and a relational database.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React (SPA)                         |
| Backend     | Node.js + Express (REST API)        |
| Database    | MySQL                               |
| Hosting     | Azure App Service (Web Application) |
| DB Hosting  | Azure Database for MySQL            |

---

## Project Structure

```
servio/
├── package.json              # Root — npm workspaces, dev/build/start scripts
├── .env.example              # Environment variable template
├── client/                   # React SPA (Vite)
│   ├── index.html
│   ├── vite.config.js        # Dev proxy: /api → localhost:3000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Root routing, auth guard
│       ├── store/
│       │   └── index.js      # Redux store
│       ├── components/       # Shared UI components
│       │   ├── AuthGuard.jsx # Redirects unauthenticated users
│       │   ├── RoleGuard.jsx # Enforces role-based route access
│       │   └── Navbar.jsx    # Top navigation bar
│       └── features/
│           ├── auth/
│           │   └── authSlice.js
│           ├── catalogue/    # Client Dashboard
│           │   ├── CataloguePage.jsx      # /catalogue — grid + filters
│           │   ├── ConsultantCard.jsx     # Individual consultant card
│           │   ├── ConsultantDetail.jsx   # /catalogue/:id — profile + booking
│           │   ├── BookingPanel.jsx       # Slot picker + booking form
│           │   ├── MySessionsPanel.jsx    # Client's booked sessions list
│           │   └── catalogueApi.js        # RTK Query endpoints
│           ├── dashboard/    # Consultant Dashboard
│           │   ├── DashboardPage.jsx      # /dashboard — sidebar layout
│           │   ├── OverviewTab.jsx        # Summary cards + upcoming sessions
│           │   ├── SessionsTab.jsx        # Full sessions table
│           │   ├── AvailabilityTab.jsx    # Weekly availability grid
│           │   ├── ProfileTab.jsx         # Editable consultant profile
│           │   └── dashboardApi.js        # RTK Query endpoints
│           └── tools/        # Admin Tools
│               ├── ToolsPage.jsx          # /tools — tab layout (admin only)
│               ├── PlatformOverviewTab.jsx # KPI cards + activity feed
│               ├── ManageConsultantsTab.jsx# Consultant table + edit modal
│               ├── AllSessionsTab.jsx     # Platform-wide sessions table
│               ├── UserManagementTab.jsx  # User list + role management
│               └── toolsApi.js            # RTK Query endpoints
└── server/                   # Express REST API
    └── src/
        ├── index.js          # Entry point — binds to PORT
        ├── app.js            # Express setup, static serving in production
        └── routes/
            ├── index.js      # Mounts all route modules under /api
            └── health.js     # GET /api/health — deployment verification
```

---

## Deployment

- A single Azure App Service hosts both the React SPA (served as static files by Express, or via a separate Static Web App) and the Express API.
- Azure Database for MySQL Flexible Server is attached to the App Service via a private VNet integration or connection string environment variables.
- Environment-specific configuration (DB credentials, JWT secrets, etc.) is stored in Azure App Service Application Settings — never committed to source control.

---

## User Roles

| Role           | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `client`       | Browses the consultant catalogue and books consultation sessions.           |
| `consultant`   | Manages their own profile, availability, and views their booked sessions.  |
| `admin`        | Full access: views both dashboards and can perform privileged operations (e.g. editing a consultant's name and description). |

Role is stored on the user record and returned as part of the authentication response. The frontend uses it to determine which views to render; the backend enforces it on every protected route.

---

## Frontend (React SPA)

### Views by Role

| Route                   | Visible to            | Purpose                                              |
|-------------------------|-----------------------|------------------------------------------------------|
| `/login`                | All (unauthenticated) | Authentication entry point                           |
| `/catalogue`            | `client`, `admin`     | Browse and filter available fiscal consultants       |
| `/catalogue/:id`        | `client`, `admin`     | Consultant profile detail + booking flow             |
| `/dashboard`            | `consultant`, `admin` | Consultant's own sessions, profile, and availability |
| `/tools`                | `admin`               | Admin-only platform management tools                 |

### Routing & Auth Guard

- A top-level auth guard reads the role from auth state and redirects unauthenticated users to `/login`.
- Role-based route guards prevent clients from accessing `/dashboard` and consultants from accessing `/catalogue`, except for admins who can access all routes.
- `/tools` is exclusively accessible to users with the `admin` role; any other role is redirected to their respective default view.

### State Management

- Redux Toolkit is used for global state management.
- Auth state (user object, JWT token, role) lives in an `authSlice`.
- Server state (catalogues, sessions, bookings) is managed via RTK Query, which handles data fetching, caching, and cache invalidation.

---

### Client Dashboard (`/catalogue`)

The Client Dashboard is the primary surface for users with the `client` role. It allows them to discover and book fiscal consultants.

#### `/catalogue` — Consultant Catalogue

**Layout:** Full-width grid of consultant cards with a sticky filter sidebar.

**Stat Bar (top):**
| Metric | Placeholder value |
|---|---|
| Available consultants | 24 |
| Specialisations | 6 |
| Avg. hourly rate | €85 |

**Filter Sidebar:**
- Specialisation (multi-select checkboxes): _Tax Law_, _VAT Compliance_, _Payroll_, _Audit_, _Corporate Finance_, _Estate Planning_
- Hourly rate range (slider: €0 – €300)
- Availability (toggle: Show available today only)
- Sort by: Relevance · Rate (asc/desc) · Name

**Consultant Card:**
- Avatar (placeholder image)
- Display name: e.g. _"Lorem Ipsum"_
- Specialisation badge: e.g. _"Tax Law"_
- Short bio (2 lines): _"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore."_
- Hourly rate: e.g. _€90 / hr_
- CTA button: **View Profile**

#### `/catalogue/:id` — Consultant Profile & Booking

**Layout:** Two-column — profile detail on the left, booking panel on the right.

**Profile Section (left):**
- Large avatar
- Full display name + specialisation
- Extended bio (placeholder): _"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula, erat at pretium tristique, lorem purus convallis nisi, at sagittis mauris sapien et ex. Maecenas dignissim quam nec ante porttitor, ut sagittis ligula tincidunt. Pellentesque habitant morbi tristique senectus et netus."_
- Hourly rate
- Tags: specialisation areas (e.g. _Tax Law, VAT, Audit_)
- Reviews placeholder: 4.8 ★ (12 reviews) _(out of scope for now)_

**Booking Panel (right):**
- Heading: _"Book a session"_
- Calendar date picker to select a date
- Available time slots for that date (list of pills): e.g. _09:00, 10:30, 14:00, 16:30_
- Session notes textarea: placeholder _"Add any notes or agenda items for the consultant…"_
- CTA button: **Confirm Booking**
- Confirmation inline message on success: _"Your session has been booked. You'll find it under My Sessions."_

**My Sessions Panel (below booking, visible to `client`):**
- Heading: _"My Sessions"_
- Table columns: Consultant · Date & Time · Status · Actions
- Placeholder rows (3):
  - _Lorem Ipsum_ · 20 May 2026, 10:30 · `pending` · (Cancel)
  - _Dolor Sit_ · 25 May 2026, 14:00 · `confirmed` · (Cancel)
  - _Amet Consult_ · 02 Jun 2026, 09:00 · `completed` · —

---

### Consultant Dashboard (`/dashboard`)

The Consultant Dashboard is the primary surface for users with the `consultant` role. It allows them to manage their profile, set availability, and handle booked sessions.

**Layout:** Sidebar navigation + main content area.

**Sidebar links:** Overview · My Sessions · Availability · My Profile

#### Overview Tab

**Welcome banner:** _"Welcome back, Lorem Ipsum."_

**Summary cards (4-up grid):**
| Card | Placeholder value |
|---|---|
| Upcoming sessions | 3 |
| Pending confirmation | 1 |
| Completed this month | 7 |
| Profile views | 42 |

**Upcoming Sessions (mini-list, 3 items):**
- Client: _"Client A"_ · 20 May 2026, 10:30 · `pending` → \[Confirm\] \[Decline\]
- Client: _"Client B"_ · 22 May 2026, 09:00 · `confirmed`
- Client: _"Client C"_ · 28 May 2026, 14:00 · `confirmed`

#### My Sessions Tab

Full table of sessions scoped to the logged-in consultant.

**Columns:** Client · Date & Time · Status · Notes · Actions

**Filters:** Status (All · Pending · Confirmed · Completed · Cancelled) · Date range picker

**Placeholder rows (5):**
| Client | Date & Time | Status | Notes |
|---|---|---|---|
| Lorem Client | 20 May 2026, 10:30 | `pending` | _"Need advice on Q2 VAT filing."_ |
| Ipsum Corp | 22 May 2026, 09:00 | `confirmed` | _"Annual payroll review."_ |
| Dolor Ltd | 25 May 2026, 16:00 | `confirmed` | — |
| Sit Advisory | 10 May 2026, 11:00 | `completed` | _"Estate planning initial consult."_ |
| Amet Holdings | 05 May 2026, 13:30 | `cancelled` | — |

#### Availability Tab

**Weekly availability grid:**
- Rows: Mon – Sun
- Columns: 09:00 · 10:30 · 12:00 · 13:30 · 15:00 · 16:30
- Slots toggle between **Available** (green) and **Blocked** (grey)
- Booked slots shown in blue (read-only, tooltip showing client name)
- CTA button: **Save Availability**

#### My Profile Tab

Inline-editable form fields:
- Display Name: _"Lorem Ipsum"_
- Specialisation: _"Tax Law"_ (dropdown)
- Bio: _"Lorem ipsum dolor sit amet, consectetur adipiscing elit…"_ (textarea)
- Hourly Rate: _€90_
- Avatar: upload control (placeholder avatar shown)
- CTA: **Save Changes**

---

### Tools (`/tools`) — Admin Only

The Tools section is exclusively accessible to users with the `admin` role. It provides platform management capabilities across all users, consultants, and sessions.

**Layout:** Top tab bar + full-width content area.

**Tabs:** Platform Overview · Manage Consultants · All Sessions · User Management

#### Platform Overview Tab

**KPI cards (4-up grid):**
| Metric | Placeholder value |
|---|---|
| Total users | 128 |
| Active consultants | 24 |
| Sessions this month | 61 |
| Platform revenue (est.) | €5,490 |

**Recent Activity feed (last 5 events):**
- _"Lorem Ipsum confirmed a session with Client A — 2 hours ago"_
- _"Dolor Sit updated their profile — 5 hours ago"_
- _"New consultant Amet Consult registered — 1 day ago"_
- _"Client B cancelled session #4821 — 1 day ago"_
- _"Admin performed bulk availability reset — 2 days ago"_

#### Manage Consultants Tab

Searchable, sortable table of all consultant profiles.

**Columns:** Name · Specialisation · Hourly Rate · Status · Actions

**Inline Actions per row:**
- **Edit** — opens a modal with the consultant's profile fields (display name, description, specialisation, rate, active toggle)
- **Deactivate / Activate** — toggles `is_active` on the consultant profile

**Placeholder rows (4):**
| Name | Specialisation | Rate | Status |
|---|---|---|---|
| Lorem Ipsum | Tax Law | €90/hr | Active |
| Dolor Sit | VAT Compliance | €75/hr | Active |
| Amet Consult | Payroll | €80/hr | Inactive |
| Consectetur Adv. | Audit | €110/hr | Active |

**Edit Consultant Modal fields:** Display Name · Description (textarea) · Specialisation (dropdown) · Hourly Rate · Active (toggle)

#### All Sessions Tab

Platform-wide session table (all consultants, all clients).

**Columns:** Session ID · Client · Consultant · Date & Time · Status · Actions

**Filters:** Status · Consultant · Date range

**Admin actions per row:** View Detail · Force-cancel

**Placeholder rows (5):**
| ID | Client | Consultant | Date | Status |
|---|---|---|---|---|
| #4821 | Client B | Lorem Ipsum | 20 May 2026 | `pending` |
| #4820 | Ipsum Corp | Dolor Sit | 22 May 2026 | `confirmed` |
| #4819 | Dolor Ltd | Amet Consult | 25 May 2026 | `confirmed` |
| #4818 | Sit Advisory | Lorem Ipsum | 10 May 2026 | `completed` |
| #4817 | Amet Holdings | Consectetur Adv. | 05 May 2026 | `cancelled` |

#### User Management Tab

Full user list with role management.

**Columns:** ID · Email · Role · Created At · Actions

**Actions per row:** View · Change Role (dropdown) · Deactivate

**Placeholder rows (4):**
| Email | Role | Created At |
|---|---|---|
| lorem@example.com | `client` | 10 Jan 2026 |
| ipsum@example.com | `consultant` | 15 Feb 2026 |
| dolor@example.com | `admin` | 01 Jan 2026 |
| sit@example.com | `client` | 20 Mar 2026 |

---

## Backend (Express / Node.js REST API)

### API Structure

```
/api/auth
  POST   /login               — authenticate, return JWT + role
  POST   /logout              — invalidate session / clear token

/api/users
  GET    /me                  — current user profile
  PATCH  /me                  — update own profile

/api/consultants
  GET    /                    — list consultants (catalogue, paginated + filtered)
  GET    /:id                 — single consultant profile
  PATCH  /:id                 — update consultant profile (admin only)

/api/sessions
  GET    /                    — list sessions (scoped by role: own sessions)
  POST   /                    — book a session (client)
  GET    /:id                 — session detail
  PATCH  /:id                 — update session status (consultant / admin)
  DELETE /:id                 — cancel session (client / admin)
```

### Authentication & Authorization

- JWT-based authentication. Tokens are short-lived (e.g. 1 hour) with refresh token support.
- An `authenticate` middleware verifies the JWT on all protected routes.
- An `authorize(...roles)` middleware enforces role-based access at the route level.
- Passwords are hashed with bcrypt. JWTs are signed with a secret stored in environment variables.

### Request Validation

- Incoming request bodies are validated using a schema validation library (e.g. Zod or Joi) before reaching controller logic.

---

## Database (MySQL)

### Core Tables

```sql
users
  id, email, password_hash, role ENUM('client','consultant','admin'),
  created_at, updated_at

consultant_profiles
  id, user_id FK, display_name, description, specialisation,
  hourly_rate, avatar_url, is_active, created_at, updated_at

availability_slots
  id, consultant_id FK, start_time, end_time, is_booked

sessions
  id, client_id FK, consultant_id FK, slot_id FK,
  status ENUM('pending','confirmed','completed','cancelled'),
  notes, created_at, updated_at
```

- `users` holds credentials and role.
- `consultant_profiles` extends a consultant user with marketplace-facing data.
- `availability_slots` models when a consultant is available.
- `sessions` captures a booked consultation between a client and a consultant.

---

## Security Considerations

- All API routes require HTTPS (enforced via Azure App Service TLS).
- JWT secret and DB credentials are injected via environment variables; never hardcoded.
- SQL queries use parameterised statements (ORM or prepared statements) to prevent injection.
- CORS is configured to allow only the known frontend origin.
- Role checks are performed server-side on every mutating request — the frontend role gate is UI convenience only.

---

## MVP Scope (Out of Scope for Now)

- Payment processing
- In-app messaging / chat
- Email / SMS notifications
- Calendar integrations
- Ratings and reviews
- Multi-language / i18n
