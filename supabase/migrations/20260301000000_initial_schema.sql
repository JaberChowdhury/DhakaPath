-- ====================================================================
-- DhakaPath Canonical Schema Migration
-- Version: 20260301000000_initial_schema.sql
-- ====================================================================

-- 1. Sources Catalog
CREATE TABLE IF NOT EXISTS public.sources (
  source_id VARCHAR(64) PRIMARY KEY,
  source_name VARCHAR(128) NOT NULL,
  source_url TEXT,
  license VARCHAR(64),
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Hubs Registry
CREATE TABLE IF NOT EXISTS public.hubs (
  id VARCHAR(64) PRIMARY KEY,
  name_en VARCHAR(128) NOT NULL,
  name_bn VARCHAR(128) NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  center_lat DECIMAL(10, 7) NOT NULL,
  center_lon DECIMAL(10, 7) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Boarding Stops
CREATE TABLE IF NOT EXISTS public.stops (
  id VARCHAR(64) PRIMARY KEY,
  hub_id VARCHAR(64) NOT NULL REFERENCES public.hubs(id) ON DELETE RESTRICT,
  name_en VARCHAR(128) NOT NULL,
  name_bn VARCHAR(128) NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  lat DECIMAL(10, 7) NOT NULL,
  lon DECIMAL(10, 7) NOT NULL,
  mode VARCHAR(32) NOT NULL,
  boarding_landmark TEXT,
  direction_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Transit Services
CREATE TABLE IF NOT EXISTS public.services (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  mode VARCHAR(32) NOT NULL,
  route_code VARCHAR(64),
  operator VARCHAR(128),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Service Stops Sequence
CREATE TABLE IF NOT EXISTS public.service_stops (
  id BIGSERIAL PRIMARY KEY,
  service_id VARCHAR(64) NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  direction_id VARCHAR(16) NOT NULL,
  stop_id VARCHAR(64) NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  sequence_order INTEGER NOT NULL,
  time_offset_min INTEGER NOT NULL DEFAULT 0,
  UNIQUE(service_id, direction_id, sequence_order)
);

-- 6. Directed Segments (Edges)
CREATE TABLE IF NOT EXISTS public.segments (
  id VARCHAR(96) PRIMARY KEY,
  from_stop_id VARCHAR(64) NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  to_stop_id VARCHAR(64) NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  service_id VARCHAR(64) REFERENCES public.services(id) ON DELETE SET NULL,
  mode VARCHAR(32) NOT NULL,
  baseline_duration_min INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  is_transfer BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Fare Policy Rules
CREATE TABLE IF NOT EXISTS public.fare_rules (
  id VARCHAR(64) PRIMARY KEY,
  mode VARCHAR(32) NOT NULL,
  service_id VARCHAR(64) REFERENCES public.services(id) ON DELETE CASCADE,
  from_hub_id VARCHAR(64) REFERENCES public.hubs(id) ON DELETE SET NULL,
  to_hub_id VARCHAR(64) REFERENCES public.hubs(id) ON DELETE SET NULL,
  fare_regular DECIMAL(8, 2) NOT NULL,
  fare_min DECIMAL(8, 2) NOT NULL DEFAULT 10.00,
  fare_max DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
  student_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  student_discount_pct DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
  student_fare_floor DECIMAL(8, 2) NOT NULL DEFAULT 10.00,
  source_id VARCHAR(64) REFERENCES public.sources(source_id) ON DELETE SET NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 8. Disruption Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  title_bn VARCHAR(256),
  description TEXT,
  severity VARCHAR(16) NOT NULL DEFAULT 'medium',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  lifecycle_stage VARCHAR(16) NOT NULL DEFAULT 'active',
  affected_modes TEXT[] NOT NULL DEFAULT '{}',
  reported_by_type VARCHAR(16) NOT NULL DEFAULT 'guest',
  reporter_id UUID,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Alert Topological Segment Impacts
CREATE TABLE IF NOT EXISTS public.alert_impacts (
  id BIGSERIAL PRIMARY KEY,
  alert_id VARCHAR(64) NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  segment_id VARCHAR(96) NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10. Alert Community Feedback Votes
CREATE TABLE IF NOT EXISTS public.alert_votes (
  id BIGSERIAL PRIMARY KEY,
  alert_id VARCHAR(64) NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  voter_fingerprint VARCHAR(128) NOT NULL,
  vote_type VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alert_id, voter_fingerprint)
);

-- 11. Admin Role Assignments
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID
);

-- 12. Administrative Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  action VARCHAR(64) NOT NULL,
  target_table VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Indexes for Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_stops_hub_id ON public.stops(hub_id);
CREATE INDEX IF NOT EXISTS idx_segments_from_stop ON public.segments(from_stop_id);
CREATE INDEX IF NOT EXISTS idx_segments_to_stop ON public.segments(to_stop_id);
CREATE INDEX IF NOT EXISTS idx_service_stops_service ON public.service_stops(service_id, direction_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(status, lifecycle_stage, expires_at);
CREATE INDEX IF NOT EXISTS idx_alert_impacts_segment ON public.alert_impacts(segment_id);

-- ====================================================================
-- Row Level Security (RLS) Configuration
-- ====================================================================
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Static Transit Entities
CREATE POLICY "Public Read Sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Public Read Hubs" ON public.hubs FOR SELECT USING (true);
CREATE POLICY "Public Read Stops" ON public.stops FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public Read Service Stops" ON public.service_stops FOR SELECT USING (true);
CREATE POLICY "Public Read Segments" ON public.segments FOR SELECT USING (true);
CREATE POLICY "Public Read Fare Rules" ON public.fare_rules FOR SELECT USING (true);

-- Public Read for Active/Approved Alerts
CREATE POLICY "Public Read Approved Alerts" ON public.alerts
  FOR SELECT USING (status = 'approved' OR auth.uid() = reporter_id);

-- Controlled Insert for Commuter Incident Submissions
CREATE POLICY "Controlled Insert Alerts" ON public.alerts
  FOR INSERT WITH CHECK (
    status = 'pending' OR EXISTS (
      SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Feedback Voting Policies
CREATE POLICY "Public Read Alert Votes" ON public.alert_votes FOR SELECT USING (true);
CREATE POLICY "Public Insert Alert Vote" ON public.alert_votes FOR INSERT WITH CHECK (true);

-- Admin Mutation Policies
CREATE POLICY "Admin Full Access Alerts" ON public.alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin Modify Network" ON public.segments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
