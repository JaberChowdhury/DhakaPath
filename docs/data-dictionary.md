# DhakaPath: Data Dictionary & Relational Entity Definitions

## 1. Network Core Entities

### `hubs`
Interchange areas representing a cluster of closely located transit stops and transfer points.
- `id` (VARCHAR(64), Primary Key): Stable canonical identifier (e.g. `hub_mirpur_10`, `hub_farmgate`).
- `name_en` (VARCHAR(128), NOT NULL): Standard English name.
- `name_bn` (VARCHAR(128), NOT NULL): Official Bengali script name (e.g. `মিরপুর ১০`).
- `aliases` (TEXT[], NOT NULL DEFAULT '{}'): Search keywords, colloquial spellings, Banglish variants.
- `center_lat` (DECIMAL(10, 7), NOT NULL): Approximate geographic centroid latitude.
- `center_lon` (DECIMAL(10, 7), NOT NULL): Approximate geographic centroid longitude.
- `description` (TEXT): Overview of transit connections and major landmarks.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()).

### `stops`
Physical boarding, alighting, and platform access locations.
- `id` (VARCHAR(64), Primary Key): Stable identifier (e.g. `stop_farmgate_metro_concourse`, `stop_farmgate_eastbound_bus`).
- `hub_id` (VARCHAR(64), Foreign Key $\to$ `hubs.id`): Parent hub.
- `name_en` (VARCHAR(128), NOT NULL): Descriptive stop name in English.
- `name_bn` (VARCHAR(128), NOT NULL): Stop name in Bengali.
- `aliases` (TEXT[], NOT NULL DEFAULT '{}'): Colloquial variants.
- `lat` (DECIMAL(10, 7), NOT NULL): Precise boarding coordinate latitude.
- `lon` (DECIMAL(10, 7), NOT NULL): Precise boarding coordinate longitude.
- `mode` (VARCHAR(32), NOT NULL): Allowed values: `'metro' | 'bus' | 'leguna' | 'rickshaw' | 'walk'`.
- `boarding_landmark` (TEXT): Physical landmark to assist passengers (e.g. "Opposite Ananda Cinema under footbridge").
- `direction_notes` (TEXT): Direction of travel or corridor heading.
- `is_active` (BOOLEAN, DEFAULT TRUE).
- `verification_status` (VARCHAR(20), DEFAULT 'verified'): `'unreviewed' | 'verified' | 'rejected'`.

### `services`
Named transit lines and operating services.
- `id` (VARCHAR(64), Primary Key): e.g. `srv_mrt_line_6`, `srv_bus_bikolpo`.
- `name` (VARCHAR(128), NOT NULL): Operating brand name (e.g. "MRT Line 6", "Bikolpo Auto Service").
- `mode` (VARCHAR(32), NOT NULL): `'metro' | 'bus' | 'leguna' | 'rickshaw' | 'walk'`.
- `route_code` (VARCHAR(64)): Identifier or route number.
- `operator` (VARCHAR(128)): Transit operating authority (e.g. "DMTCL", "Private Consortium").
- `is_active` (BOOLEAN, DEFAULT TRUE).
- `verification_status` (VARCHAR(20), DEFAULT 'verified').

### `service_stops`
Ordered sequence of stops served by a transit service.
- `id` (UUID / BIGSERIAL, Primary Key).
- `service_id` (VARCHAR(64), Foreign Key $\to$ `services.id`).
- `direction_id` (VARCHAR(16), NOT NULL): e.g. `'northbound' | 'southbound' | 'eastbound' | 'westbound' | 'loop'`.
- `stop_id` (VARCHAR(64), Foreign Key $\to$ `stops.id`).
- `sequence_order` (INTEGER, NOT NULL): 1-indexed order along the route.
- `time_offset_min` (INTEGER, DEFAULT 0): Scheduled / typical cumulative minutes from origin stop.

### `segments`
Directed edges between two stops representing traversable links.
- `id` (VARCHAR(96), Primary Key): e.g. `seg_mrt_uttara_mirpur10`, `seg_walk_farmgate_mrt_to_bus`.
- `from_stop_id` (VARCHAR(64), Foreign Key $\to$ `stops.id`).
- `to_stop_id` (VARCHAR(64), Foreign Key $\to$ `stops.id`).
- `service_id` (VARCHAR(64), NULLABLE, Foreign Key $\to$ `services.id`): NULL for generic walk/rickshaw links.
- `mode` (VARCHAR(32), NOT NULL): `'metro' | 'bus' | 'leguna' | 'rickshaw' | 'walk'`.
- `baseline_duration_min` (INTEGER, NOT NULL): Scheduled or typical non-disrupted traversal time in minutes.
- `distance_meters` (INTEGER, NOT NULL): Distance along segment path.
- `fare_regular` (DECIMAL(8, 2)): Baseline regular fare if priced per segment, or NULL if priced by ride.
- `is_transfer` (BOOLEAN, DEFAULT FALSE): TRUE if this is an inter-stop walking or feeder transfer within a hub.
- `verification_status` (VARCHAR(20), DEFAULT 'verified').

---

## 2. Fare & Tariff Model

### `fare_rules`
Policy definitions governing ride fare computation.
- `id` (VARCHAR(64), Primary Key).
- `mode` (VARCHAR(32), NOT NULL): `'metro' | 'bus' | 'leguna' | 'rickshaw' | 'walk'`.
- `service_id` (VARCHAR(64), NULLABLE, Foreign Key $\to$ `services.id`).
- `from_hub_id` (VARCHAR(64), Foreign Key $\to$ `hubs.id`, NULLABLE): For matrix-based fares (Metro).
- `to_hub_id` (VARCHAR(64), Foreign Key $\to$ `hubs.id`, NULLABLE): For matrix-based fares (Metro).
- `fare_regular` (DECIMAL(8, 2), NOT NULL): Base tariff in Bangladeshi Taka (BDT).
- `fare_min` (DECIMAL(8, 2), NULLABLE): Minimum fare floor (e.g. 10 BDT for bus, 20 BDT for metro).
- `fare_max` (DECIMAL(8, 2), NULLABLE): Maximum surge or upper bound for estimated modes (rickshaws).
- `student_eligible` (BOOLEAN, DEFAULT FALSE): TRUE for bus and eligible concessions.
- `student_discount_pct` (DECIMAL(5, 2), DEFAULT 50.00): Percentage discount (50%).
- `student_fare_floor` (DECIMAL(8, 2), DEFAULT 10.00): Statutory minimum student fare floor (10 BDT).
- `source_id` (VARCHAR(64), Foreign Key $\to$ `sources.source_id`).
- `effective_date` (DATE, NOT NULL DEFAULT CURRENT_DATE).

---

## 3. Disruption & Community Incident Entities

### `alerts`
Community reports and verified administrative incidents.
- `id` (VARCHAR(64), Primary Key): UUID or canonical prefix (e.g. `alt_2026_03_malibagh_water`).
- `title` (VARCHAR(256), NOT NULL): Short summary in English.
- `title_bn` (VARCHAR(256)): Bengali summary.
- `description` (TEXT): Detailed observation notes.
- `severity` (VARCHAR(16), NOT NULL): `'low' | 'medium' | 'high' | 'critical'`.
- `status` (VARCHAR(16), NOT NULL DEFAULT 'pending'): Moderation status: `'pending' | 'approved' | 'rejected'`.
- `lifecycle_stage` (VARCHAR(16), NOT NULL DEFAULT 'active'): Operational status: `'active' | 'disputed' | 'resolved' | 'expired'`.
- `affected_modes` (TEXT[], NOT NULL): e.g. `['bus', 'rickshaw']`.
- `reported_by_type` (VARCHAR(16), NOT NULL): `'guest' | 'user' | 'admin' | 'simulation'`.
- `observed_at` (TIMESTAMPTZ, NOT NULL DEFAULT NOW()).
- `submitted_at` (TIMESTAMPTZ, NOT NULL DEFAULT NOW()).
- `verified_at` (TIMESTAMPTZ, NULLABLE).
- `verified_by` (UUID / VARCHAR(64), NULLABLE).
- `expires_at` (TIMESTAMPTZ, NOT NULL): Auto-expiry threshold.
- `upvotes` (INTEGER, DEFAULT 0).
- `downvotes` (INTEGER, DEFAULT 0).

### `alert_impacts`
Bridge table linking an alert to specific topological segments in the network.
- `id` (UUID / BIGSERIAL, Primary Key).
- `alert_id` (VARCHAR(64), Foreign Key $\to$ `alerts.id` ON DELETE CASCADE).
- `segment_id` (VARCHAR(96), Foreign Key $\to$ `segments.id`).
- `delay_minutes` (INTEGER, DEFAULT 0): Positive time penalty added to segment baseline traversal.
- `is_closed` (BOOLEAN, DEFAULT FALSE): If TRUE, segment is completely impassable for affected modes.

### `alert_votes`
Community feedback to prevent duplicate counting.
- `id` (UUID / BIGSERIAL, Primary Key).
- `alert_id` (VARCHAR(64), Foreign Key $\to$ `alerts.id` ON DELETE CASCADE).
- `voter_fingerprint` (VARCHAR(128), NOT NULL): Hash of client session/IP to restrict 1 vote per actor.
- `vote_type` (VARCHAR(16), NOT NULL): `'confirm' | 'dispute' | 'resolved'`.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()).

---

## 4. Governance, Provenance & Roles

### `sources`
Catalog of all data provenance origins.
- `source_id` (VARCHAR(64), Primary Key).
- `source_name` (VARCHAR(128), NOT NULL).
- `source_url` (TEXT).
- `license` (VARCHAR(64)).
- `retrieved_at` (TIMESTAMPTZ, NOT NULL).

### `admin_roles`
Authoritative role assignment verified on server.
- `user_id` (UUID, Primary Key): Maps to Supabase `auth.users.id`.
- `role` (VARCHAR(32), NOT NULL DEFAULT 'admin'): `'admin' | 'moderator' | 'superadmin'`.
- `granted_at` (TIMESTAMPTZ, DEFAULT NOW()).
- `granted_by` (UUID).
