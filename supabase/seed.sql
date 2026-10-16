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

-- Ingest Stops
INSERT INTO public.stops (id, hub_id, name_en, name_bn, aliases, lat, lon, mode, boarding_landmark, direction_notes, is_active, verification_status)
VALUES
  ('stop_uttara_north_metro', 'hub_uttara_north', 'Uttara North Metro Station', 'উত্তরা উত্তর মেট্রোরেল স্টেশন', ARRAY['Diabari Metro', 'Uttara North Station'], 23.8772, 90.3702, 'metro', 'Elevated Concourse, Diabari Sector 12', 'Terminus Station; Southbound towards Motijheel', true, 'verified'),
  ('stop_mirpur_10_metro', 'hub_mirpur_10', 'Mirpur 10 Metro Station', 'মিরপুর ১০ মেট্রোরেল স্টেশন', ARRAY['Mirpur 10 Metro Gate 1', 'Mirpur 10 Concourse'], 23.8071, 90.3686, 'metro', 'Concourse Level over Mirpur 10 Roundabout', 'Both directions: Northbound to Uttara, Southbound to Motijheel', true, 'verified'),
  ('stop_mirpur_10_bus_south', 'hub_mirpur_10', 'Mirpur 10 Bus Stand (Southbound)', 'মিরপুর ১০ বাস স্ট্যান্ড (দক্ষিণমুখী)', ARRAY['Mirpur 10 Fire Service Bus Stop'], 23.8062, 90.3688, 'bus', 'Beside Fire Service Station, Mirpur Road Southbound', 'Towards Agargaon / Farmgate / Shahbagh', true, 'verified'),
  ('stop_agargaon_metro', 'hub_agargaon', 'Agargaon Metro Station', 'আগারগাঁও মেট্রোরেল স্টেশন', ARRAY['Agargaon Metro Gate 2'], 23.7788, 90.3798, 'metro', 'Opposite Passport Office', 'Both directions', true, 'verified'),
  ('stop_agargaon_bus_south', 'hub_agargaon', 'Agargaon Bus Stand (Southbound)', 'আগারগাঁও বাস স্ট্যান্ড', ARRAY['IDB Bus Stand'], 23.7779, 90.3802, 'bus', 'Front of IDB Bhaban Computer City', 'Towards Farmgate', true, 'verified'),
  ('stop_farmgate_metro', 'hub_farmgate', 'Farmgate Metro Station', 'ফার্মগেট মেট্রোরেল স্টেশন', ARRAY['Farmgate Metro Gate 1', 'Ananda Metro'], 23.7573, 90.3892, 'metro', 'Direct footbridge link over Kazi Nazrul Islam Ave', 'Both directions', true, 'verified'),
  ('stop_farmgate_bus_south', 'hub_farmgate', 'Farmgate Bus Stoppage (Southbound)', 'ফার্মগেট বাস স্টপেজ (শাহবাগ অভিমুখী)', ARRAY['Ananda Cinema Bus Stop'], 23.7565, 90.3895, 'bus', 'Under the pedestrian footbridge opposite Ananda Cinema', 'Towards Kawran Bazar & Shahbagh', true, 'verified'),
  ('stop_farmgate_bus_north', 'hub_farmgate', 'Farmgate Bus Stoppage (Northbound)', 'ফার্মগেট বাস স্টপেজ (উত্তরা অভিমুখী)', ARRAY['Farmgate Northbound'], 23.7575, 90.3888, 'bus', 'East side of Kazi Nazrul Islam Ave', 'Towards Agargaon / Mirpur / Airport', true, 'verified'),
  ('stop_kawran_bazar_metro', 'hub_kawran_bazar', 'Kawran Bazar Metro Station', 'কাওরান বাজার মেট্রোরেল স্টেশন', ARRAY['Karwan Bazar Metro'], 23.7518, 90.3937, 'metro', 'Elevated Concourse near Sonargaon Hotel', 'Both directions', true, 'verified'),
  ('stop_kawran_bazar_bus', 'hub_kawran_bazar', 'Kawran Bazar Bus Stand', 'কাওরান বাজার বাস স্ট্যান্ড', ARRAY['Panthapath Corner Bus Stop'], 23.751, 90.394, 'bus', 'Front of PetroBangla / Titas Gas Bhaban', 'Towards Shahbagh / Motijheel', true, 'verified'),
  ('stop_shahbagh_metro', 'hub_shahbagh', 'Shahbagh Metro Station', 'শাহবাগ মেট্রোরেল স্টেশন', ARRAY['Shahbagh Concourse Gate 1'], 23.7388, 90.3957, 'metro', 'Near BSMMU / National Museum Overbridge', 'Both directions', true, 'verified'),
  ('stop_shahbagh_bus_stop', 'hub_shahbagh', 'Shahbagh Bus Stoppage (BSMMU Gate)', 'শাহবাগ বাস স্টপেজ', ARRAY['PG Hospital Bus Stand'], 23.738, 90.396, 'bus', 'In front of BSMMU Main Entrance Gate', 'Towards Press Club & Motijheel', true, 'verified'),
  ('stop_motijheel_metro', 'hub_motijheel', 'Motijheel Metro Station', 'মতিঝিল মেট্রোরেল স্টেশন', ARRAY['Motijheel Southern Terminus'], 23.7332, 90.4178, 'metro', 'Beside Bangladesh Bank / Shapla Chottor', 'Terminus Station; Northbound to Uttara', true, 'verified'),
  ('stop_motijheel_bus_shapla', 'hub_motijheel', 'Motijheel Shapla Chottor Bus Stand', 'মতিঝিল শাপলা চত্বর বাস স্ট্যান্ড', ARRAY['Dilkusha Bus Stand'], 23.7325, 90.418, 'bus', 'East of Shapla Chottor roundabout', 'Both directions', true, 'verified'),
  ('stop_mohakhali_bus_terminal', 'hub_mohakhali', 'Mohakhali City Bus Stand (Amtoli)', 'মহাখালী বাস স্ট্যান্ড (আমতলী)', ARRAY['Mohakhali Wireless Bus Stop'], 23.7782, 90.4038, 'bus', 'Amtoli Crossing, bottom of Mohakhali Flyover', 'Towards Malibagh / Kakrail or Airport / Uttara', true, 'verified'),
  ('stop_mohakhali_rickshaw_stand', 'hub_mohakhali', 'Mohakhali Wireless Rickshaw Stand', 'মহাখালী ওয়ারলেস রিকশা স্ট্যান্ড', ARRAY['Wireless Gate'], 23.7772, 90.405, 'rickshaw', 'Near Wireless Gate entry', 'Connecting to Gulshan 1 and Niketan', true, 'verified'),
  ('stop_gulshan_1_circle', 'hub_gulshan_1', 'Gulshan 1 Circle Stop', 'গুলশান ১ গোলচত্বর', ARRAY['Gulshan 1 DCC Bus/Leguna Stand'], 23.7782, 90.4172, 'bus', 'Near DCC Market South Entry', 'Connecting to Badda Link Road and Mohakhali', true, 'verified'),
  ('stop_gulshan_1_leguna_stand', 'hub_gulshan_1', 'Gulshan 1 Leguna Stand', 'গুলশান ১ লেগুনা স্ট্যান্ড', ARRAY['Gulshan Lake Leguna Stand'], 23.7785, 90.418, 'leguna', 'Near Gulshan 1 bridge landing towards Badda', 'Eastbound to Rampura Bridge / Banasree', true, 'verified'),
  ('stop_badda_link_road', 'hub_badda', 'Badda Link Road Stop', 'বাড্ডা লিংক রোড স্টপ', ARRAY['Badda Bridge landing'], 23.7802, 90.4262, 'leguna', 'Junction of Progoti Sarani and Gulshan 1 Link Road', 'Between Gulshan 1 and Banasree', true, 'verified'),
  ('stop_banasree_block_c', 'hub_banasree', 'Banasree Block C Leguna & Rickshaw Stand', 'বনশ্রী সি ব্লক লেগুনা ও রিকশা স্ট্যান্ড', ARRAY['Banasree Ideal School Stand'], 23.7652, 90.4352, 'leguna', 'Opposite Banasree Ideal School Main Gate', 'Connecting north to Gulshan/Badda and south to Malibagh', true, 'verified'),
  ('stop_banasree_rickshaw_feeder', 'hub_banasree', 'Banasree Residential Feeder Stand', 'বনশ্রী আবাসিক রিকশা স্ট্যান্ড', ARRAY['Banasree Main Avenue'], 23.7645, 90.434, 'rickshaw', 'Avenue 1 intersection', 'Internal residential to Rampura Bridge / Malibagh', true, 'verified'),
  ('stop_malibagh_railgate_bus', 'hub_malibagh', 'Malibagh Railgate Bus Stop', 'মালিবাগ রেলগেট বাস স্টপ', ARRAY['Malibagh Level Crossing'], 23.7472, 90.4147, 'bus', 'South of Malibagh Railgate flyover pillar 12', 'Towards Motijheel Southbound; towards Mohakhali Northbound', true, 'verified'),
  ('stop_malibagh_mor', 'hub_malibagh', 'Malibagh Mor Intersection', 'মালিবাগ মোড়', ARRAY['Mouchak Mor'], 23.7455, 90.412, 'bus', 'Under Mouchak Flyover junction', 'Feeder corridor to Kawran Bazar via Maghbazar', true, 'verified'),
  ('stop_airport_railway_bus', 'hub_airport', 'Airport Railway Bus Stoppage', 'বিমানবন্দর রেলওয়ে বাস স্টপেজ', ARRAY['Dhaka Airport Bus Stand'], 23.8512, 90.4078, 'bus', 'East side footbridge near Airport Railway Station', 'Southbound to Mohakhali / Malibagh / Motijheel', true, 'verified'),
  ('stop_gulshan_2_circle', 'hub_gulshan_2', 'Gulshan 2 Circle Stoppage', 'গুলশান ২ গোলচত্বর', ARRAY['Gulshan 2 Bus Stop'], 23.7942, 90.4142, 'bus', 'Near Gulshan 2 Roundabout North Entrance', 'Connects to Gulshan 1 and Banani', true, 'verified')
ON CONFLICT (id) DO NOTHING;

-- Ingest Service Stops
INSERT INTO public.service_stops (service_id, direction_id, stop_id, sequence_order, time_offset_min)
VALUES
  ('srv_mrt_line_6', 'southbound', 'stop_uttara_north_metro', 1, 0),
  ('srv_mrt_line_6', 'southbound', 'stop_mirpur_10_metro', 2, 10),
  ('srv_mrt_line_6', 'southbound', 'stop_agargaon_metro', 3, 17),
  ('srv_mrt_line_6', 'southbound', 'stop_farmgate_metro', 4, 23),
  ('srv_mrt_line_6', 'southbound', 'stop_kawran_bazar_metro', 5, 26),
  ('srv_mrt_line_6', 'southbound', 'stop_shahbagh_metro', 6, 29),
  ('srv_mrt_line_6', 'southbound', 'stop_motijheel_metro', 7, 35),
  ('srv_mrt_line_6', 'northbound', 'stop_motijheel_metro', 1, 0),
  ('srv_mrt_line_6', 'northbound', 'stop_shahbagh_metro', 2, 6),
  ('srv_mrt_line_6', 'northbound', 'stop_kawran_bazar_metro', 3, 9),
  ('srv_mrt_line_6', 'northbound', 'stop_farmgate_metro', 4, 12),
  ('srv_mrt_line_6', 'northbound', 'stop_agargaon_metro', 5, 18),
  ('srv_mrt_line_6', 'northbound', 'stop_mirpur_10_metro', 6, 25),
  ('srv_mrt_line_6', 'northbound', 'stop_uttara_north_metro', 7, 35),
  ('srv_bus_bikolpo', 'southbound', 'stop_mirpur_10_bus_south', 1, 0),
  ('srv_bus_bikolpo', 'southbound', 'stop_agargaon_bus_south', 2, 14),
  ('srv_bus_bikolpo', 'southbound', 'stop_farmgate_bus_south', 3, 28),
  ('srv_bus_bikolpo', 'southbound', 'stop_kawran_bazar_bus', 4, 35),
  ('srv_bus_bikolpo', 'southbound', 'stop_shahbagh_bus_stop', 5, 44),
  ('srv_bus_bikolpo', 'southbound', 'stop_motijheel_bus_shapla', 6, 58),
  ('srv_bus_prochesta', 'southbound', 'stop_airport_railway_bus', 1, 0),
  ('srv_bus_prochesta', 'southbound', 'stop_mohakhali_bus_terminal', 2, 28),
  ('srv_bus_prochesta', 'southbound', 'stop_malibagh_railgate_bus', 3, 50),
  ('srv_bus_prochesta', 'southbound', 'stop_motijheel_bus_shapla', 4, 68),
  ('srv_leguna_banasree_gulshan', 'westbound', 'stop_banasree_block_c', 1, 0),
  ('srv_leguna_banasree_gulshan', 'westbound', 'stop_badda_link_road', 2, 10),
  ('srv_leguna_banasree_gulshan', 'westbound', 'stop_gulshan_1_leguna_stand', 3, 18),
  ('srv_leguna_banasree_gulshan', 'eastbound', 'stop_gulshan_1_leguna_stand', 1, 0),
  ('srv_leguna_banasree_gulshan', 'eastbound', 'stop_badda_link_road', 2, 8),
  ('srv_leguna_banasree_gulshan', 'eastbound', 'stop_banasree_block_c', 3, 18)
ON CONFLICT DO NOTHING;

-- Ingest Segments
INSERT INTO public.segments (id, from_stop_id, to_stop_id, service_id, mode, baseline_duration_min, distance_meters, is_transfer, verification_status)
VALUES
  ('seg_mrt_uttara_mirpur10', 'stop_uttara_north_metro', 'stop_mirpur_10_metro', 'srv_mrt_line_6', 'metro', 10, 7800, false, NULL),
  ('seg_mrt_mirpur10_agargaon', 'stop_mirpur_10_metro', 'stop_agargaon_metro', 'srv_mrt_line_6', 'metro', 7, 3900, false, NULL),
  ('seg_mrt_agargaon_farmgate', 'stop_agargaon_metro', 'stop_farmgate_metro', 'srv_mrt_line_6', 'metro', 6, 2800, false, NULL),
  ('seg_mrt_farmgate_kawran', 'stop_farmgate_metro', 'stop_kawran_bazar_metro', 'srv_mrt_line_6', 'metro', 3, 1200, false, NULL),
  ('seg_mrt_kawran_shahbagh', 'stop_kawran_bazar_metro', 'stop_shahbagh_metro', 'srv_mrt_line_6', 'metro', 3, 1600, false, NULL),
  ('seg_mrt_shahbagh_motijheel', 'stop_shahbagh_metro', 'stop_motijheel_metro', 'srv_mrt_line_6', 'metro', 6, 3100, false, NULL),
  ('seg_bus_bikolpo_mirpur_agargaon', 'stop_mirpur_10_bus_south', 'stop_agargaon_bus_south', 'srv_bus_bikolpo', 'bus', 14, 4100, false, NULL),
  ('seg_bus_bikolpo_agargaon_farmgate', 'stop_agargaon_bus_south', 'stop_farmgate_bus_south', 'srv_bus_bikolpo', 'bus', 14, 3100, false, NULL),
  ('seg_bus_bikolpo_farmgate_kawran', 'stop_farmgate_bus_south', 'stop_kawran_bazar_bus', 'srv_bus_bikolpo', 'bus', 7, 1300, false, NULL),
  ('seg_bus_bikolpo_kawran_shahbagh', 'stop_kawran_bazar_bus', 'stop_shahbagh_bus_stop', 'srv_bus_bikolpo', 'bus', 9, 1800, false, NULL),
  ('seg_bus_bikolpo_shahbagh_motijheel', 'stop_shahbagh_bus_stop', 'stop_motijheel_bus_shapla', 'srv_bus_bikolpo', 'bus', 14, 3300, false, NULL),
  ('seg_bus_prochesta_airport_mohakhali', 'stop_airport_railway_bus', 'stop_mohakhali_bus_terminal', 'srv_bus_prochesta', 'bus', 28, 8900, false, NULL),
  ('seg_bus_prochesta_mohakhali_malibagh', 'stop_mohakhali_bus_terminal', 'stop_malibagh_railgate_bus', 'srv_bus_prochesta', 'bus', 22, 4700, false, NULL),
  ('seg_bus_prochesta_malibagh_motijheel', 'stop_malibagh_railgate_bus', 'stop_motijheel_bus_shapla', 'srv_bus_prochesta', 'bus', 18, 3200, false, NULL),
  ('seg_leg_banasree_badda', 'stop_banasree_block_c', 'stop_badda_link_road', 'srv_leguna_banasree_gulshan', 'leguna', 10, 2200, false, NULL),
  ('seg_leg_badda_gulshan1', 'stop_badda_link_road', 'stop_gulshan_1_leguna_stand', 'srv_leguna_banasree_gulshan', 'leguna', 8, 1400, false, NULL),
  ('seg_leg_gulshan1_badda', 'stop_gulshan_1_leguna_stand', 'stop_badda_link_road', 'srv_leguna_banasree_gulshan', 'leguna', 8, 1400, false, NULL),
  ('seg_leg_badda_banasree', 'stop_badda_link_road', 'stop_banasree_block_c', 'srv_leguna_banasree_gulshan', 'leguna', 10, 2200, false, NULL),
  ('seg_walk_mirpur10_metro_to_bus', 'stop_mirpur_10_metro', 'stop_mirpur_10_bus_south', NULL, 'walk', 3, 180, true, NULL),
  ('seg_walk_farmgate_metro_to_bus', 'stop_farmgate_metro', 'stop_farmgate_bus_south', NULL, 'walk', 3, 150, true, NULL),
  ('seg_walk_farmgate_bus_to_metro', 'stop_farmgate_bus_south', 'stop_farmgate_metro', NULL, 'walk', 3, 150, true, NULL),
  ('seg_walk_kawran_metro_to_bus', 'stop_kawran_bazar_metro', 'stop_kawran_bazar_bus', NULL, 'walk', 2, 110, true, NULL),
  ('seg_walk_shahbagh_metro_to_bus', 'stop_shahbagh_metro', 'stop_shahbagh_bus_stop', NULL, 'walk', 2, 120, true, NULL),
  ('seg_walk_motijheel_metro_to_bus', 'stop_motijheel_metro', 'stop_motijheel_bus_shapla', NULL, 'walk', 3, 170, true, NULL),
  ('seg_walk_gulshan1_leguna_to_circle', 'stop_gulshan_1_leguna_stand', 'stop_gulshan_1_circle', NULL, 'walk', 2, 120, true, NULL),
  ('seg_rickshaw_gulshan1_mohakhali', 'stop_gulshan_1_circle', 'stop_mohakhali_bus_terminal', NULL, 'rickshaw', 14, 1800, false, NULL),
  ('seg_rickshaw_banasree_to_malibagh', 'stop_banasree_block_c', 'stop_malibagh_mor', NULL, 'rickshaw', 22, 3100, false, NULL),
  ('seg_bus_malibagh_mor_to_kawran', 'stop_malibagh_mor', 'stop_kawran_bazar_bus', 'srv_bus_bikolpo', 'bus', 16, 2900, false, NULL),
  ('seg_bus_mohakhali_to_kawran', 'stop_mohakhali_bus_terminal', 'stop_kawran_bazar_bus', 'srv_bus_prochesta', 'bus', 18, 3800, false, NULL)
ON CONFLICT (id) DO NOTHING;
