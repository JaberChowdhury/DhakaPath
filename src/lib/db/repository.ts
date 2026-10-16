import fs from "fs";
import path from "path";
import { Hub, Stop, Service, ServiceStop, Segment } from "@/types/network";
import { FareRule } from "@/types/fares";
import { DisruptionAlert } from "@/types/alerts";

// Fallback in-memory cache loaded from data/approved
let cachedHubs: Hub[] | null = null;
let cachedStops: Stop[] | null = null;
let cachedServices: Service[] | null = null;
let cachedServiceStops: ServiceStop[] | null = null;
let cachedSegments: Segment[] | null = null;
let cachedFareRules: FareRule[] | null = null;
let cachedDemoDisruptions: DisruptionAlert[] | null = null;

function loadDataFile<T>(subDir: "approved" | "demo", filename: string): T {
  const filePath = path.join(process.cwd(), "data", subDir, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  }
  return [] as unknown as T;
}

export function getApprovedHubs(): Hub[] {
  if (!cachedHubs) {
    cachedHubs = loadDataFile<Hub[]>("approved", "hubs.json");
  }
  return cachedHubs;
}

export function getApprovedStops(): Stop[] {
  if (!cachedStops) {
    cachedStops = loadDataFile<Stop[]>("approved", "stops.json");
  }
  return cachedStops;
}

export function getApprovedServices(): Service[] {
  if (!cachedServices) {
    cachedServices = loadDataFile<Service[]>("approved", "services.json");
  }
  return cachedServices;
}

export function getApprovedServiceStops(): ServiceStop[] {
  if (!cachedServiceStops) {
    cachedServiceStops = loadDataFile<ServiceStop[]>(
      "approved",
      "service_stops.json",
    );
  }
  return cachedServiceStops;
}

export function getApprovedSegments(): Segment[] {
  if (!cachedSegments) {
    cachedSegments = loadDataFile<Segment[]>("approved", "segments.json");
  }
  return cachedSegments;
}

export function getApprovedFareRules(): FareRule[] {
  if (!cachedFareRules) {
    cachedFareRules = loadDataFile<FareRule[]>("approved", "fare_rules.json");
  }
  return cachedFareRules;
}

export function getDemoDisruptions(): DisruptionAlert[] {
  if (!cachedDemoDisruptions) {
    cachedDemoDisruptions = loadDataFile<DisruptionAlert[]>(
      "demo",
      "disruptions.json",
    );
  }
  return cachedDemoDisruptions;
}

export function getNetworkSnapshot() {
  return {
    hubs: getApprovedHubs(),
    stops: getApprovedStops(),
    services: getApprovedServices(),
    serviceStops: getApprovedServiceStops(),
    segments: getApprovedSegments(),
    fareRules: getApprovedFareRules(),
    networkRevision: "rev_2026_03_pilot",
  };
}

// In-memory queue for guest submissions during demo/development
const dynamicAlerts: DisruptionAlert[] = [];

export function getActiveAlerts(scenarioId?: string | null): DisruptionAlert[] {
  const demos = getDemoDisruptions();
  const all = [...demos, ...dynamicAlerts];

  if (scenarioId) {
    return all.filter((a) => a.id === scenarioId || a.status === "approved");
  }

  // Filter approved and unexpired
  const now = new Date().toISOString();
  return all.filter(
    (a) =>
      a.status === "approved" &&
      a.lifecycle_stage === "active" &&
      a.expires_at > now,
  );
}

export function getAllAlertsForAdmin(): DisruptionAlert[] {
  const demos = getDemoDisruptions();
  return [...demos, ...dynamicAlerts];
}

export function addPendingReport(
  report: Omit<
    DisruptionAlert,
    "id" | "submitted_at" | "status" | "lifecycle_stage"
  >,
): DisruptionAlert {
  const newAlert: DisruptionAlert = {
    ...report,
    id: `alt_usr_${Date.now()}`,
    submitted_at: new Date().toISOString(),
    status: "pending",
    lifecycle_stage: "active",
    upvotes: 0,
    downvotes: 0,
  };
  dynamicAlerts.push(newAlert);
  return newAlert;
}

export function updateAlertStatus(
  alertId: string,
  status: "pending" | "approved" | "rejected",
  lifecycleStage: "active" | "disputed" | "resolved" | "expired" = "active",
): DisruptionAlert | null {
  const all = getAllAlertsForAdmin();
  const alert = all.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.status = status;
  alert.lifecycle_stage = lifecycleStage;
  return alert;
}

export function updateServiceStatus(
  serviceId: string,
  isActive: boolean,
): Service | null {
  const services = getApprovedServices();
  const service = services.find((s) => s.id === serviceId);
  if (!service) return null;

  service.is_active = isActive;
  return service;
}
