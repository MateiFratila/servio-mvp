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
│       ├── App.jsx
│       ├── store/
│       │   └── index.js      # Redux store
│       └── features/
│           └── auth/
│               └── authSlice.js
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
| `/admin`                | `admin`               | Admin-only actions (edit consultant profiles, etc.)  |

### Routing & Auth Guard

- A top-level auth guard reads the role from auth state and redirects unauthenticated users to `/login`.
- Role-based route guards prevent clients from accessing `/dashboard` and consultants from accessing `/catalogue`, except for admins who can access all routes.

### State Management

- Redux Toolkit is used for global state management.
- Auth state (user object, JWT token, role) lives in an `authSlice`.
- Server state (catalogues, sessions, bookings) is managed via RTK Query, which handles data fetching, caching, and cache invalidation.

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
