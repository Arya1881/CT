# CampusTransit — Smart College Transportation Management Platform

CampusTransit is a full-stack demo platform for managing a college campus bus
transport system: live GPS tracking with a simulated fleet, ETA & delay alerts
over realtime websockets, role-based dashboards for students, parents, drivers
and administrators, emergency alerts, and rich operations analytics.

**Runs with zero infrastructure** — the backend ships with a deterministic,
in-memory demo store seeded with a realistic campus (10 routes, 10 buses, 10
drivers, 100 students, ~30 days of trip history). A PostgreSQL/Supabase adapter
is included and can be enabled via `DATABASE_URL`.

---

## Features

- **Realtime GPS simulation** — autonomous buses move along their routes and
  broadcast positions over Socket.IO (`live-location`). Drivers can start/stop
  trips and toggle GPS sharing from their dashboard.
- **ETAs & delays** — students and parents see live arrival ETAs at their stop;
  delays are reported by drivers and broadcast as alerts.
- **Role-based dashboards**
  - *Student* — track your bus, see ETA, driver & emergency contact, trip history.
  - *Parent* — follow each child's bus live with per-child ETA.
  - *Driver* — trip control, GPS toggle, delay reporting, personal trip log.
  - *Admin / Management* — ops dashboard, live fleet map, buses, routes & stops,
    drivers, students, trips, emergency alerts, settings, and an audit log.
- **Emergency alerts** — any user can raise an alert (panic / accident / medical /
  safety / breakdown); admins investigate and resolve.
- **Analytics** — trip volume & punctuality series, bus utilization, driver
  performance, route reports, student usage, CSV export.
- **Notifications** — realtime toasts plus an inbox per user.
- **Offline schematic map** — a dependency-free SVG map renders routes, stops and
  live buses without any API key (drop a Google Maps key in `VITE_GOOGLE_MAPS_API_KEY`
  if you prefer a real map).

---

## Tech stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 6, Tailwind CSS 3, TanStack Query, Socket.IO client, Recharts, React Router 7 |
| Backend   | Node.js, Express, TypeScript, Socket.IO, JWT (jsonwebtoken), bcryptjs, Zod, Helmet |
| Data      | In-memory demo store (default) · `pg` adapter for PostgreSQL/Supabase |
| Infra     | Docker, docker-compose                                      |

---

## Quick start (development)

Prerequisites: Node 20+ and npm.

```bash
npm install            # installs all workspace deps (backend + frontend)
npm run dev            # starts backend (:4000) and frontend (:5173) concurrently
```

Or run the two servers in separate terminals:

```bash
npm run dev:backend    # API + realtime on http://localhost:4000
npm run dev:frontend   # UI on http://localhost:5173 (proxied via VITE_API_URL)
```

Frontend uses `http://localhost:4000/api` for the API and `http://localhost:4000`
for websockets by default (see `frontend/.env.example`).

### Demo accounts

| Role       | Email                         | Password       |
| ---------- | ----------------------------- | -------------- |
| Student    | `student1@campustransit.app`  | `Student@123`  |
| Parent     | `parent1@campustransit.app`   | `Parent@123`   |
| Driver     | `driver1@campustransit.app`   | `Driver@123`   |
| Admin      | `admin@campustransit.app`     | `Admin@123`    |
| Management | `management@campustransit.app`| `Management@123` |

---

## Running with Docker

```bash
docker compose up --build
# open http://localhost:4000
```

The single API container builds the frontend and serves both the API and the
SPA from port 4000. Out of the box it runs on the in-memory demo store; to use
Postgres, uncomment the `db` service and set `DATABASE_URL` in
`docker-compose.yml`.

---

## PostgreSQL / Supabase (optional)

```bash
cp backend/.env.example backend/.env   # set DATABASE_URL=postgresql://...
npm run db:schema                       # apply database/schema.sql
npm run db:seed                         # seed Postgres with demo data
npm run dev:backend
```

Without `DATABASE_URL`, the backend transparently uses the in-memory demo store.

---

## API overview

Base URL: `http://localhost:4000/api` — all routes (except `auth/login`) require
`Authorization: Bearer <token>`.

| Resource        | Endpoints (excerpt)                                            |
| --------------- | -------------------------------------------------------------- |
| Auth            | `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me/profile`   |
| Buses           | `GET /buses`, `GET /buses/:id`, `GET /buses/:id/live`          |
| Routes & stops  | `GET /routes`, `GET /routes/:id`, `GET /stops`                 |
| Tracking        | `GET /tracking/live`, `GET /tracking/bus/:id`, `/eta`, `/trail`|
| Students        | `GET /students`, `GET /students/me`, `GET /students/me/trips`  |
| Parents         | `GET /parents`, `GET /parents/me`                              |
| Drivers         | `GET /drivers/me`, `/me/start-trip`, `/me/stop-trip`, `/me/delay`, `/me/gps` |
| Trips           | `GET /trips`, `GET /trips/:id`                                 |
| Emergency       | `POST /emergency`, `GET /emergency`, `PATCH /emergency/:id/status` |
| Notifications   | `GET /notifications`, `POST /notifications/broadcast`          |
| Analytics       | `GET /analytics/overview`, `/trips`, `/driver-performance`, `/export` |
| Settings / Audit| `GET /settings`, `GET /audit` (admin)                          |

Realtime (Socket.IO): `live-location`, `trip:started`, `trip:completed`,
`trip:delayed`, `bus:near-stop`, `notification`, `emergency:alert`.

---

## Project structure

```
├── backend/                # Express + Socket.IO API
│   ├── src/
│   │   ├── config/         # typed env config
│   │   ├── models/         # domain types
│   │   ├── database/       # seed generator (in-memory) + Postgres apply/seed
│   │   ├── repositories/   # contract + memory + postgres + factory
│   │   ├── services/       # auth, tracking, simulation, notifications, analytics…
│   │   ├── controllers/    # REST routers
│   │   ├── middleware/     # auth, validation, errors
│   │   ├── realtime/       # Socket.IO hub + events
│   │   ├── utils/          # pagination, id helpers, errors
│   │   ├── app.ts          # express app (+ serves built frontend)
│   │   └── server.ts       # boot
│   └── database/schema.sql # full Postgres schema
├── frontend/               # React SPA
│   └── src/
│       ├── lib/            # api client, auth context, socket, format helpers
│       ├── hooks/          # react-query hooks + realtime hooks
│       ├── components/     # ui primitives, layout, maps, shared
│       └── pages/          # auth, student, parent, driver, admin
├── database/schema.sql     # (see backend/database/schema.sql)
├── Dockerfile
└── docker-compose.yml
```

---

## Scripts

```bash
npm run typecheck       # typecheck backend + frontend
npm run build           # build backend + frontend
npm run start:backend   # serve built app (API + SPA) on :4000
```

## Notes

- The in-memory seed is deterministic (seeded PRNG), so every boot produces the
  same demo data — ideal for demos and tests.
- The GPS simulation is autonomous (3 buses run automatically); drivers can also
  trigger their own trips, which the simulator then animates.
