export type TransitMode = 'metro' | 'bus' | 'leguna' | 'rickshaw' | 'walk';

export interface Hub {
  id: string;
  name_en: string;
  name_bn: string;
  aliases: string[];
  center_lat: number;
  center_lon: number;
  description?: string;
}

export interface Stop {
  id: string;
  hub_id: string;
  name_en: string;
  name_bn: string;
  aliases: string[];
  lat: number;
  lon: number;
  mode: TransitMode;
  boarding_landmark?: string;
  direction_notes?: string;
  is_active: boolean;
  verification_status: 'unreviewed' | 'verified' | 'rejected';
}

export interface Service {
  id: string;
  name: string;
  mode: TransitMode;
  route_code?: string;
  operator?: string;
  description?: string;
  is_active: boolean;
  verification_status: 'unreviewed' | 'verified' | 'rejected';
}

export interface ServiceStop {
  id: number;
  service_id: string;
  direction_id: string;
  stop_id: string;
  sequence_order: number;
  time_offset_min: number;
}

export interface Segment {
  id: string;
  from_stop_id: string;
  to_stop_id: string;
  service_id: string | null;
  mode: TransitMode;
  baseline_duration_min: number;
  distance_meters: number;
  is_transfer: boolean;
  verification_status?: 'unreviewed' | 'verified' | 'rejected';
}
