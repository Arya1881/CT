-- ============================================================
-- CampusTransit — PostgreSQL schema (Supabase compatible)
-- ------------------------------------------------------------
-- The backend ships with an in-memory repository that mirrors
-- this schema exactly, so the app runs with zero infrastructure.
-- Apply this file when provisioning a real Postgres instance.
-- ============================================================

create extension if not exists "uuid-ossp";

-- Users: single auth table, role-based access control
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  first_name    text not null,
  last_name     text not null,
  role          text not null check (role in ('student','parent','driver','admin','management')),
  phone         text,
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Students
create table students (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references users(id) on delete cascade,
  roll_number            text unique not null,
  department             text not null,
  year                   integer not null,
  bus_id                 uuid references buses(id),
  stop_id                uuid references stops(id),
  parent_id              uuid references parents(id),
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at             timestamptz not null default now()
);

-- Parents
create table parents (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  children_count integer not null default 0
);

-- Drivers
create table drivers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  license_no    text unique not null,
  phone         text,
  bus_id        uuid references buses(id),
  status        text not null default 'available' check (status in ('available','on_duty','off_duty')),
  hire_date     date not null default current_date,
  created_at    timestamptz not null default now()
);

-- Buses
create table buses (
  id                uuid primary key default gen_random_uuid(),
  plate_number      text unique not null,
  model             text not null,
  capacity          integer not null,
  status            text not null default 'idle' check (status in ('idle','running','maintenance','delayed')),
  route_id          uuid references routes(id),
  driver_id         uuid references drivers(id),
  fuel_level        integer not null default 100,
  last_maintenance  date not null default current_date,
  current_lat       double precision,
  current_lng       double precision,
  created_at        timestamptz not null default now()
);

-- Routes (waypoints: ordered JSON array of {lat,lng})
create table routes (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  origin                text not null,
  destination           text not null,
  distance_km           numeric(6,2) not null,
  estimated_duration_min integer not null,
  color                 text not null,
  waypoints             jsonb not null default '[]',
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

-- Stops
create table stops (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references routes(id) on delete cascade,
  name           text not null,
  lat            double precision not null,
  lng            double precision not null,
  order_index    integer not null,
  arrival_offset_min integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Student <-> Bus assignment
create table student_bus (
  student_id uuid not null references students(id) on delete cascade,
  bus_id     uuid not null references buses(id) on delete cascade,
  route_id   uuid references routes(id),
  created_at timestamptz not null default now(),
  primary key (student_id, bus_id)
);

-- Latest known GPS position per bus (one row per bus)
create table live_locations (
  id         uuid primary key default gen_random_uuid(),
  bus_id     uuid not null unique references buses(id) on delete cascade,
  route_id   uuid references routes(id),
  trip_id    uuid references trips(id),
  lat        double precision not null,
  lng        double precision not null,
  speed_kmh  numeric(5,1) not null default 0,
  heading    integer not null default 0,
  timestamp  timestamptz not null default now()
);

-- GPS stream / trail history (append only)
create table bus_positions (
  id         uuid primary key default gen_random_uuid(),
  bus_id     uuid not null references buses(id) on delete cascade,
  route_id   uuid references routes(id),
  trip_id    uuid references trips(id),
  lat        double precision not null,
  lng        double precision not null,
  speed_kmh  numeric(5,1) not null default 0,
  heading    integer not null default 0,
  timestamp  timestamptz not null default now()
);

-- App settings (key/value)
create table app_settings (
  key   text primary key,
  value text not null
);

-- Trips
create table trips (
  id              uuid primary key default gen_random_uuid(),
  bus_id          uuid not null references buses(id),
  route_id        uuid not null references routes(id),
  driver_id       uuid references drivers(id),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  status          text not null default 'scheduled' check (status in ('scheduled','active','completed','cancelled','delayed')),
  passenger_count integer not null default 0,
  delay_minutes   integer not null default 0,
  distance_km     numeric(6,2) not null default 0,
  start_lat       double precision,
  start_lng       double precision,
  end_lat         double precision,
  end_lng         double precision,
  created_at      timestamptz not null default now()
);

-- Notifications (user_id NULL => broadcast to everyone)
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null check (type in ('trip_started','trip_completed','bus_delayed','bus_near_stop','emergency','system')),
  bus_id     uuid references buses(id),
  trip_id    uuid references trips(id),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Emergency alerts
create table emergency_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('panic','accident','medical','safety','breakdown','other')),
  lat         double precision,
  lng         double precision,
  bus_id      uuid references buses(id),
  trip_id     uuid references trips(id),
  description text,
  status      text not null default 'open' check (status in ('open','investigating','resolved')),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Audit log
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_live_locations_bus  on live_locations(bus_id);
create index if not exists idx_bus_positions       on bus_positions(bus_id, timestamp desc);
create index if not exists idx_trips_status        on trips(status);
create index if not exists idx_trips_dates         on trips(started_at);
create index if not exists idx_notifications_user  on notifications(user_id, read);
create index if not exists idx_stops_route         on stops(route_id, order_index);
create index if not exists idx_students_bus        on students(bus_id);
create index if not exists idx_alerts_status       on emergency_alerts(status);
