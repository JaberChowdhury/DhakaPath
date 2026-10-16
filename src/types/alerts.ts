import { TransitMode } from './network';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type LifecycleStage = 'active' | 'disputed' | 'resolved' | 'expired';
export type ReporterType = 'guest' | 'user' | 'admin' | 'simulation';

export interface DisruptionAlert {
  id: string;
  title: string;
  title_bn?: string;
  description: string;
  severity: AlertSeverity;
  status: ModerationStatus;
  lifecycle_stage: LifecycleStage;
  affected_modes: TransitMode[];
  affected_segment_ids?: string[];
  delay_minutes: number;
  is_closed: boolean;
  reported_by_type: ReporterType;
  reporter_id?: string;
  observed_at: string;
  submitted_at?: string;
  verified_at?: string | null;
  verified_by?: string | null;
  expires_at: string;
  upvotes?: number;
  downvotes?: number;
}

export interface AlertImpact {
  id: number;
  alert_id: string;
  segment_id: string;
  delay_minutes: number;
  is_closed: boolean;
}

export interface AlertVote {
  id?: number;
  alert_id: string;
  voter_fingerprint: string;
  vote_type: 'confirm' | 'dispute' | 'resolved';
  created_at: string;
}
