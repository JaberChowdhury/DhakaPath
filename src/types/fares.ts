import { TransitMode } from "./network";

export interface FareRule {
  id: string;
  mode: TransitMode;
  service_id: string | null;
  from_hub_id?: string | null;
  to_hub_id?: string | null;
  fare_regular: number;
  fare_min: number;
  fare_max: number;
  student_eligible: boolean;
  student_discount_pct: number;
  student_fare_floor: number;
  source_id: string;
  effective_date: string;
}

export type BudgetStatus =
  | "WITHIN_BUDGET"
  | "MAY_EXCEED_BUDGET"
  | "EXCEEDS_BUDGET"
  | "UNPRICED_COMPONENT";

export interface LegFareQuote {
  regularFare: number;
  studentFare: number;
  estimatedRange: [number, number];
  isStudentEligible: boolean;
  discountApplied: boolean;
  notes?: string;
}

export interface RouteFareBreakdown {
  totalRegularBdt: number;
  totalStudentBdt: number;
  totalRangeBdt: [number, number];
  budgetCategorization: BudgetStatus;
  studentSavingsBdt: number;
}
