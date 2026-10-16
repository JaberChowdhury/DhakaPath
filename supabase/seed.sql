-- ====================================================================
-- DhakaPath Canonical Pilot Network Seed Script
-- File: supabase/seed.sql
-- ====================================================================

-- 1. Ingest Provenance Sources
INSERT INTO public.sources (source_id, source_name, source_url, license, retrieved_at)
VALUES
  ('src_dmtcl_official', 'DMTCL Metro Rail Fare Chart', 'https://dmtcl.gov.bd/', 'Government Transit Publication', '2026-03-01T10:00:00Z'),
  ('src_osm_overpass', 'OpenStreetMap via Overpass API', 'https://overpass-turbo.eu/', 'ODbL 1.0', '2026-03-01T11:30:00Z'),
  ('src_dhaka_bus_heatmap', 'Dhaka Bus Heatmap stop_routes_full.csv', 'https://github.com/muhtashimshahrier/dhaka-bus-access-heatmap', 'MIT License', '2026-03-01T12:00:00Z'),
  ('src_field_leguna_survey', 'DhakaPath Field Survey', 'internal://surveys/2026-03/leguna', 'Proprietary Seed', '2026-03-02T14:00:00Z'),
  ('src_synthetic_disruptions', 'DhakaPath Simulation Fixtures', 'internal://fixtures/synthetic', 'Test Suite', '2026-03-02T18:00:00Z')
ON CONFLICT (source_id) DO NOTHING;

-- 2. Ingest Pilot Hubs
INSERT INTO public.hubs (id, name_en, name_bn, aliases, center_lat, center_lon, description)
VALUES
  ('hub_uttara_north', 'Uttara North', 'উত্তরা উত্তর', ARRAY['Uttara 12', 'Diabari', 'Sector 12', 'দিয়াবাড়ি', 'উত্তরা'], 23.8770, 90.3700, 'Northern terminus of MRT Line 6 at Diabari.'),
  ('hub_mirpur_10', 'Mirpur 10', 'মিরপুর ১০', ARRAY['Mirpur 10 Golchottor', 'Mirpur Roundabout', 'মিরপুর গোলচত্বর', 'Mirpur'], 23.8070, 90.3685, 'Massive multimodal transit hub connecting MRT Line 6, buses, and legunas.'),
  ('hub_agargaon', 'Agargaon', 'আগারগাঁও', ARRAY['Passport Office', 'IDB Bhaban', 'Agargaon Crossing'], 23.7785, 90.3795, 'Government administrative and tech retail zone; MRT station.'),
  ('hub_farmgate', 'Farmgate', 'ফার্মগেট', ARRAY['Ananda Cinema', 'Farmgate Overbridge', 'Green Road', 'ফার্মগেইট'], 23.7570, 90.3890, 'Central bus interchange and elevated MRT station.'),
  ('hub_kawran_bazar', 'Kawran Bazar', 'কাওরান বাজার', ARRAY['Karwan Bazar', 'Panthapath', 'Sonargaon Mor', 'কারওয়ান বাজার'], 23.7515, 90.3935, 'Major wholesale and business district; MRT Line 6 station.'),
  ('hub_shahbagh', 'Shahbagh', 'শাহবাগ', ARRAY['Shahbag', 'BSMMU', 'PG Hospital', 'DU Medical', 'ঢাকা বিশ্ববিদ্যালয়'], 23.7385, 90.3955, 'Academic and medical core with high student transit volume.'),
  ('hub_motijheel', 'Motijheel', 'মতিঝিল', ARRAY['Shapla Chottor', 'Dilkusha', 'Bangladesh Bank', 'শাপলা চত্বর'], 23.7330, 90.4175, 'Historic financial and commercial headquarters of Dhaka.'),
  ('hub_mohakhali', 'Mohakhali', 'মহাখালী', ARRAY['Mohakhali Wireless', 'Amtoli', 'Mohakhali Bus Terminal'], 23.7778, 90.4035, 'Central junction linking northern Dhaka with south/east arteries.'),
  ('hub_gulshan_1', 'Gulshan 1', 'গুলশান ১', ARRAY['Gulshan 1 DCC', 'Gulshan 1 Circle', 'গুলশান'], 23.7780, 90.4170, 'Commercial and retail district with heavy rickshaw and leguna links.'),
  ('hub_gulshan_2', 'Gulshan 2', 'গুলশান ২', ARRAY['Gulshan 2 Circle', 'Embassy Zone'], 23.7940, 90.4140, 'Diplomatic quarter and corporate headquarters zone.'),
  ('hub_badda', 'Badda', 'বাড্ডা', ARRAY['Middle Badda', 'Badda Link Road', 'Rampura Bridge'], 23.7800, 90.4260, 'Eastern artery on Pragati Sarani connecting Kuril to Rampura.'),
  ('hub_banasree', 'Banasree', 'বনশ্রী', ARRAY['Rampura Banasree', 'Block C', 'Ideal School Banasree'], 23.7650, 90.4350, 'High-density residential neighborhood relying on leguna and rickshaw links.'),
  ('hub_malibagh', 'Malibagh', 'মালিবাগ', ARRAY['Malibagh Railgate', 'Malibagh Mor', 'Shantinagar', 'মৌচাক'], 23.7470, 90.4145, 'Major junction linking eastern suburbs to downtown.'),
  ('hub_airport', 'Airport', 'বিমানবন্দর', ARRAY['Airport Railway Station', 'Hazrat Shahjalal Airport'], 23.8510, 90.4075, 'Northern multimodal corridor linking airport and railway station.')
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_bn = EXCLUDED.name_bn,
  aliases = EXCLUDED.aliases,
  center_lat = EXCLUDED.center_lat,
  center_lon = EXCLUDED.center_lon,
  description = EXCLUDED.description;

-- 3. Ingest Services
INSERT INTO public.services (id, name, mode, route_code, operator, description, is_active)
VALUES
  ('srv_mrt_line_6', 'MRT Line 6 (Metro Rail)', 'metro', 'MRT-6', 'DMTCL', 'Grade-separated rapid transit corridor linking Uttara North to Motijheel.', true),
  ('srv_bus_bikolpo', 'Bikolpo Auto Service', 'bus', 'BIKOLPO-1', 'Bikolpo Syndicate', 'Arterial city bus: Mirpur 10 to Motijheel via Farmgate.', true),
  ('srv_bus_prochesta', 'Prochesta Paribahan', 'bus', 'PROCHESTA-2', 'Prochesta Ltd', 'Trunk bus connecting Airport, Mohakhali, Malibagh, and Motijheel.', true),
  ('srv_leguna_banasree_gulshan', 'Banasree-Badda-Gulshan Leguna', 'leguna', 'LEG-BAN-GUL', 'Human Hauler Union', 'Feeder link connecting Banasree with Badda and Gulshan 1.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator;

-- 4. Ingest Fare Rules
INSERT INTO public.fare_rules (id, mode, service_id, fare_regular, fare_min, fare_max, student_eligible, student_discount_pct, student_fare_floor, source_id)
VALUES
  ('fare_mrt_station_matrix', 'metro', 'srv_mrt_line_6', 20.00, 20.00, 100.00, false, 0.00, 20.00, 'src_dmtcl_official'),
  ('fare_bus_bikolpo_rules', 'bus', 'srv_bus_bikolpo', 25.00, 10.00, 40.00, true, 50.00, 10.00, 'src_dhaka_bus_heatmap'),
  ('fare_bus_prochesta_rules', 'bus', 'srv_bus_prochesta', 30.00, 10.00, 50.00, true, 50.00, 10.00, 'src_dhaka_bus_heatmap'),
  ('fare_leguna_banasree_gulshan', 'leguna', 'srv_leguna_banasree_gulshan', 15.00, 15.00, 25.00, false, 0.00, 15.00, 'src_field_leguna_survey'),
  ('fare_rickshaw_feeders', 'rickshaw', NULL, 40.00, 30.00, 60.00, false, 0.00, 30.00, 'src_field_leguna_survey'),
  ('fare_walk_free', 'walk', NULL, 0.00, 0.00, 0.00, false, 0.00, 0.00, 'src_field_leguna_survey')
ON CONFLICT (id) DO UPDATE SET
  fare_regular = EXCLUDED.fare_regular,
  student_eligible = EXCLUDED.student_eligible,
  student_discount_pct = EXCLUDED.student_discount_pct,
  student_fare_floor = EXCLUDED.student_fare_floor;
