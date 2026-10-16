import { TransitMode } from "./network";
import { BudgetStatus } from "./fares";
import { DisruptionAlert } from "./alerts";

export interface PlanRequest {
  originHubId: string;
  destinationHubId: string;
  student?: boolean;
  budgetBdt?: number | null;
  avoidHubIds?: string[];
  allowedModes?: TransitMode[];
  maxTransfers?: number;
  scenarioId?: string | null;
}

export interface RouteLeg {
  legIndex: number;
  serviceId: string | null;
  serviceName: string;
  mode: TransitMode;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  durationMin: number;
  distanceMeters: number;
  fareRegular: number;
  fareStudent: number;
  fareRange: [number, number];
  isTransfer: boolean;
  boardingLandmark?: string;
  directionNotes?: string;
  disruptions: string[];
}

export interface PlannedRoute {
  id: string;
  rankingProfile: "cheapest" | "fastest" | "balanced";
  totalDurationMin: number;
  transfers: number;
  fareRegularBdt: number;
  fareStudentBdt: number;
  fareEstimatedRange: [number, number];
  budgetCategorization: BudgetStatus;
  hasActiveDisruptions: boolean;
  legs: RouteLeg[];
  warnings: string[];
}

export interface PlanResponse {
  success: boolean;
  status?: "OK" | "NO_VALID_ROUTE" | "OUTSIDE_COVERAGE" | "INVALID_REQUEST";
  message?: string;
  networkRevision: string;
  calculatedAt: string;
  routes: PlannedRoute[];
  activeAlertsCount: number;
}
