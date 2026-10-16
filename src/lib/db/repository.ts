import fs from "fs";
import path from "path";
import { Hub, Stop, Service, ServiceStop, Segment } from "@/types/network";
import { FareRule } from "@/types/fares";
import { DisruptionAlert } from "@/types/alerts";
import { OcrSubmission } from "@/types/digitizer";

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

// -------------------------------------------------------------
// Resilient Persistence Store for Alerts & Moderation
// -------------------------------------------------------------
const RUNTIME_ALERTS_FILE = path.join(
  process.cwd(),
  "data",
  "runtime_alerts.json",
);

interface DemoStatusOverride {
  status?: "pending" | "approved" | "rejected";
  lifecycle_stage?: "active" | "disputed" | "resolved" | "expired";
  upvotes?: number;
  downvotes?: number;
}

interface RuntimeAlertsData {
  dynamicAlerts: DisruptionAlert[];
  demoStatusOverrides: Record<string, DemoStatusOverride>;
  deletedAlertIds: string[];
}

interface GlobalAlertsStore {
  dynamicAlerts: DisruptionAlert[];
  demoStatusOverrides: Record<string, DemoStatusOverride>;
  deletedAlertIds: Set<string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __dhakapath_alerts_store__: GlobalAlertsStore | undefined;
}

function getAlertsStore(): GlobalAlertsStore {
  if (!globalThis.__dhakapath_alerts_store__) {
    let initialDynamic: DisruptionAlert[] = [];
    let initialOverrides: Record<string, DemoStatusOverride> = {};
    let initialDeleted: string[] = [];

    if (fs.existsSync(RUNTIME_ALERTS_FILE)) {
      try {
        const raw = fs.readFileSync(RUNTIME_ALERTS_FILE, "utf-8");
        const parsed: RuntimeAlertsData = JSON.parse(raw);
        initialDynamic = parsed.dynamicAlerts || [];
        initialOverrides = parsed.demoStatusOverrides || {};
        initialDeleted = parsed.deletedAlertIds || [];
      } catch (err) {
        console.error("Error reading runtime_alerts.json:", err);
      }
    } else {
      // Seed with initial pending commuter alert for realistic moderation testing
      initialDynamic = [
        {
          id: "alt_usr_1792147369810",
          title: "not fair price",
          title_bn: "অতিরিক্ত ভাড়া দাবি",
          description:
            "Mohakhali to Farmgate bus conductors demanding 30 BDT instead of statutory 15 BDT.",
          severity: "medium",
          status: "pending",
          lifecycle_stage: "active",
          affected_modes: ["bus"],
          affected_segment_ids: ["seg_bus_bikolpo_agargaon_farmgate"],
          delay_minutes: 10,
          is_closed: false,
          reported_by_type: "guest",
          observed_at: new Date(Date.now() - 3600000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          upvotes: 2,
          downvotes: 0,
        },
      ];
    }

    globalThis.__dhakapath_alerts_store__ = {
      dynamicAlerts: initialDynamic,
      demoStatusOverrides: initialOverrides,
      deletedAlertIds: new Set(initialDeleted),
    };
  }
  return globalThis.__dhakapath_alerts_store__;
}

function saveRuntimeAlertsStore() {
  const store = getAlertsStore();
  try {
    const data: RuntimeAlertsData = {
      dynamicAlerts: store.dynamicAlerts,
      demoStatusOverrides: store.demoStatusOverrides,
      deletedAlertIds: Array.from(store.deletedAlertIds),
    };
    fs.writeFileSync(
      RUNTIME_ALERTS_FILE,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("Error persisting runtime_alerts.json:", err);
  }
}

export function getAllAlertsForAdmin(): DisruptionAlert[] {
  const store = getAlertsStore();
  const demos = getDemoDisruptions().map((d) => {
    const override = store.demoStatusOverrides[d.id];
    if (override) {
      return { ...d, ...override };
    }
    return { ...d };
  });

  return [...demos, ...store.dynamicAlerts].filter(
    (a) => !store.deletedAlertIds.has(a.id),
  );
}

export function getActiveAlerts(scenarioId?: string | null): DisruptionAlert[] {
  const store = getAlertsStore();
  const all = getAllAlertsForAdmin();

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

export function addPendingReport(
  report: Omit<
    DisruptionAlert,
    "id" | "submitted_at" | "status" | "lifecycle_stage"
  >,
): DisruptionAlert {
  const store = getAlertsStore();
  const newAlert: DisruptionAlert = {
    ...report,
    id: `alt_usr_${Date.now()}`,
    submitted_at: new Date().toISOString(),
    status: "pending",
    lifecycle_stage: "active",
    upvotes: 0,
    downvotes: 0,
  };
  store.dynamicAlerts.unshift(newAlert);
  saveRuntimeAlertsStore();
  return newAlert;
}

export function createAdminAlert(
  data: Partial<DisruptionAlert>,
): DisruptionAlert {
  const store = getAlertsStore();
  const newAlert: DisruptionAlert = {
    id: `alt_adm_${Date.now()}`,
    title: data.title || "Admin Incident Advisory",
    title_bn: data.title_bn,
    description: data.description || "Official administrative advisory.",
    severity: data.severity || "medium",
    status: "approved",
    lifecycle_stage: "active",
    affected_modes: data.affected_modes || ["bus"],
    affected_segment_ids: data.affected_segment_ids || [],
    delay_minutes: Number(data.delay_minutes) || 15,
    is_closed: Boolean(data.is_closed),
    reported_by_type: "admin",
    observed_at: new Date().toISOString(),
    expires_at:
      data.expires_at ||
      new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    upvotes: 1,
    downvotes: 0,
  };
  store.dynamicAlerts.unshift(newAlert);
  saveRuntimeAlertsStore();
  return newAlert;
}

export function updateAlertStatus(
  alertId: string,
  status: "pending" | "approved" | "rejected",
  lifecycleStage: "active" | "disputed" | "resolved" | "expired" = "active",
): DisruptionAlert | null {
  const store = getAlertsStore();

  // 1. Dynamic alerts check
  const dynAlert = store.dynamicAlerts.find((a) => a.id === alertId);
  if (dynAlert) {
    dynAlert.status = status;
    dynAlert.lifecycle_stage = lifecycleStage;
    saveRuntimeAlertsStore();
    return { ...dynAlert };
  }

  // 2. Demo alerts check
  const demos = getDemoDisruptions();
  const demoAlert = demos.find((a) => a.id === alertId);
  if (demoAlert) {
    if (!store.demoStatusOverrides[alertId]) {
      store.demoStatusOverrides[alertId] = {};
    }
    store.demoStatusOverrides[alertId].status = status;
    store.demoStatusOverrides[alertId].lifecycle_stage = lifecycleStage;
    saveRuntimeAlertsStore();
    return {
      ...demoAlert,
      ...store.demoStatusOverrides[alertId],
    };
  }

  return null;
}

export function deleteAlert(alertId: string): boolean {
  const store = getAlertsStore();
  store.deletedAlertIds.add(alertId);
  const idx = store.dynamicAlerts.findIndex((a) => a.id === alertId);
  if (idx >= 0) {
    store.dynamicAlerts.splice(idx, 1);
  }
  saveRuntimeAlertsStore();
  return true;
}

export function recordAlertFeedback(
  alertId: string,
  voteType: "confirm" | "dispute" | "resolved",
): DisruptionAlert | null {
  const store = getAlertsStore();

  // 1. Dynamic alert check
  const dynAlert = store.dynamicAlerts.find((a) => a.id === alertId);
  if (dynAlert) {
    if (voteType === "confirm") dynAlert.upvotes = (dynAlert.upvotes || 0) + 1;
    else if (voteType === "dispute")
      dynAlert.downvotes = (dynAlert.downvotes || 0) + 1;
    else if (voteType === "resolved") dynAlert.lifecycle_stage = "resolved";
    saveRuntimeAlertsStore();
    return { ...dynAlert };
  }

  // 2. Demo alert check
  const demos = getDemoDisruptions();
  const demoAlert = demos.find((a) => a.id === alertId);
  if (demoAlert) {
    if (!store.demoStatusOverrides[alertId]) {
      store.demoStatusOverrides[alertId] = {};
    }
    const current = {
      ...demoAlert,
      ...store.demoStatusOverrides[alertId],
    };
    if (voteType === "confirm") current.upvotes = (current.upvotes || 0) + 1;
    else if (voteType === "dispute")
      current.downvotes = (current.downvotes || 0) + 1;
    else if (voteType === "resolved") current.lifecycle_stage = "resolved";

    store.demoStatusOverrides[alertId] = {
      ...store.demoStatusOverrides[alertId],
      upvotes: current.upvotes,
      downvotes: current.downvotes,
      lifecycle_stage: current.lifecycle_stage,
    };
    saveRuntimeAlertsStore();
    return current;
  }

  return null;
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

export function addOrUpdateService(service: Service): Service {
  const services = getApprovedServices();
  const existingIdx = services.findIndex((s) => s.id === service.id);
  if (existingIdx >= 0) {
    services[existingIdx] = { ...services[existingIdx], ...service };
    return services[existingIdx];
  } else {
    services.push(service);
    return service;
  }
}

export function updateFareRule(
  rule: Partial<FareRule> & { id: string },
): FareRule | null {
  const rules = getApprovedFareRules();
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx < 0) return null;

  rules[idx] = { ...rules[idx], ...rule };
  return rules[idx];
}

// -------------------------------------------------------------
// OCR Physical Signboard Submissions Store (Human-in-the-loop)
// -------------------------------------------------------------
const ocrSubmissions: OcrSubmission[] = [
  {
    id: "ocr_sub_demo_1",
    receiptCode: "OCR-2026-1042",
    sampleKey: "sample_bikolpo",
    imageName: "mirpur10_bikolpo_signboard.jpg",
    rawText: `বিকল্প অটো সার্ভিস (রুট নং ১)\nমিরপুর ১০ - কাজীপাড়া - শেওড়াপাড়া - আগারগাঁও - ফার্মগেট - কাওরান বাজার - শাহবাগ - মতিঝিল\nভাড়া: নিয়মিত ২৫ টাকা | হাফ পাস: ১৩ টাকা (ছাত্রদের জন্য বাধ্যতামূলক)\nকাউন্টার: পূর্ব গোলচত্বর পুলিশ বক্স সংলগ্ন`,
    extractedData: {
      rawText: `বিকল্প অটো সার্ভিস (রুট নং ১)\nমিরপুর ১০ - কাজীপাড়া - শেওড়াপাড়া - আগারগাঁও - ফার্মগেট - কাওরান বাজার - শাহবাগ - মতিঝিল\nভাড়া: নিয়মিত ২৫ টাকা | হাফ পাস: ১৩ টাকা`,
      serviceName: "Bikolpo Auto Service",
      mode: "bus",
      operator: "Bikolpo Paribahan Syndicate Ltd.",
      origin: "Mirpur 10",
      destination: "Motijheel",
      viaStoppages: [
        "Kazipara",
        "Shewrapara",
        "Agargaon",
        "Farmgate",
        "Kawran Bazar",
        "Shahbagh",
      ],
      fareRegular: 25,
      fareStudent: 13,
      boardingLandmark: "Police Box Counter, East Side of Mirpur 10 Circle",
      confidence: "high",
    },
    dbMatch: {
      originMatchedHub: {
        id: "hub_mirpur_10",
        name_en: "Mirpur 10",
        name_bn: "মিরপুর ১০",
      },
      destinationMatchedHub: {
        id: "hub_motijheel",
        name_en: "Motijheel",
        name_bn: "মতিঝিল",
      },
      matchedStopsCount: 6,
      matchedExistingService: {
        id: "srv_bus_bikolpo",
        name: "Bikolpo Auto Service",
        route_code: "BIKOLPO-1",
      },
      statutoryFareValidation: {
        estimatedKilometers: 10.5,
        statutoryBrtaTariff: 26,
        isWithinReasonableBounds: true,
        auditNote:
          "Signboard fare (25 BDT) aligns with BRTA statutory schedule (~26 BDT for ~10.5 km). Note: Official CSV contains network geometry; fares are physical notice observations.",
      },
    },
    status: "approved",
    submittedAt: "2026-03-01T09:15:00Z",
    reviewedAt: "2026-03-01T10:00:00Z",
    reviewedBy: "admin@dhakapath.gov.bd",
    adminNotes:
      "Verified against Mirpur 10 field inspection. Service confirmed active.",
  },
  {
    id: "ocr_sub_demo_2",
    receiptCode: "OCR-2026-3891",
    sampleKey: "sample_leguna",
    imageName: "rampura_leguna_notice.jpg",
    rawText: `রামপুরা - বনশ্রী - বাড্ডা - গুলশান ১ লেগুনা কল্যাণ সমিতি\nরুট: রামপুরা ব্রিজ -> বনশ্রী ব্লক সি -> বাড্ডা লিংক রোড -> পুলিশ প্লাজা -> গুলশান ১\nভাড়া: ২০ টাকা (ফিক্সড)\nস্থান: রামপুরা ফুটওভার ব্রিজের নিচে`,
    extractedData: {
      rawText: `রামপুরা - বনশ্রী - বাড্ডা - গুলশান ১ লেগুনা কল্যাণ সমিতি\nরুট: রামপুরা ব্রিজ -> বনশ্রী ব্লক সি -> বাড্ডা লিংক রোড -> পুলিশ প্লাজা -> গুলশান ১\nভাড়া: ২০ টাকা (ফিক্সড)`,
      serviceName: "Banasree-Badda-Gulshan Leguna",
      mode: "leguna",
      operator: "Local Human Hauler Operators Union",
      origin: "Rampura Bridge",
      destination: "Gulshan 1",
      viaStoppages: ["Banasree Block C", "Badda Link Road", "Police Plaza"],
      fareRegular: 20,
      fareStudent: null,
      boardingLandmark: "Under Rampura Foot-over Bridge",
      confidence: "medium",
    },
    dbMatch: {
      originMatchedHub: {
        id: "hub_rampura",
        name_en: "Rampura",
        name_bn: "রামপুরা",
      },
      destinationMatchedHub: {
        id: "hub_gulshan_1",
        name_en: "Gulshan 1",
        name_bn: "গুলশান ১",
      },
      matchedStopsCount: 3,
      matchedExistingService: {
        id: "srv_leguna_banasree_gulshan",
        name: "Banasree-Badda-Gulshan Leguna",
        route_code: "LEG-BAN-GUL",
      },
      statutoryFareValidation: {
        estimatedKilometers: 5.2,
        statutoryBrtaTariff: 15,
        isWithinReasonableBounds: true,
        auditNote:
          "Leguna flat rate (20 BDT) verified from street notice board.",
      },
    },
    status: "pending",
    submittedAt: "2026-03-02T08:20:00Z",
    userNotes:
      "Handwritten board under Rampura overpass. Leguna guys don't take student half pass.",
  },
  {
    id: "ocr_sub_demo_3",
    receiptCode: "OCR-2026-5519",
    sampleKey: "sample_balaka",
    imageName: "balaka_bus_placard.jpg",
    rawText: `বলাকা স্পেশাল পরিবহন\nসায়েদাবাদ ➔ মালিবাগ ➔ মৌচাক ➔ মগবাজার ➔ মহাখালী ➔ বিমানবন্দর ➔ গাজীপুর\nভাড়া: সায়েদাবাদ থেকে গাজীপুর ৪৫ টাকা | হাফ পাস ২৩ টাকা\nকাউন্টার: সায়েদাবাদ জনপদ মোড়`,
    extractedData: {
      rawText: `বলাকা স্পেশাল পরিবহন\nসায়েদাবাদ ➔ মালিবাগ ➔ মৌচাক ➔ মগবাজার ➔ মহাখালী ➔ বিমানবন্দর ➔ গাজীপুর\nভাড়া: ৪৫ টাকা | হাফ পাস ২৩ টাকা`,
      serviceName: "Balaka Special Paribahan",
      mode: "bus",
      operator: "Balaka Bus Owners Association",
      origin: "Sayedabad",
      destination: "Gazipur",
      viaStoppages: [
        "Malibagh",
        "Mouchak",
        "Moghbazar",
        "Mohakhali",
        "Airport",
      ],
      fareRegular: 45,
      fareStudent: 23,
      boardingLandmark: "Janapad Intersection Counter, Sayedabad",
      confidence: "high",
    },
    dbMatch: {
      originMatchedHub: null, // Sayedabad is outside pilot zone
      destinationMatchedHub: null, // Gazipur is outer terminus
      matchedStopsCount: 4,
      matchedExistingService: null, // New unmapped service
      statutoryFareValidation: {
        estimatedKilometers: 22.0,
        statutoryBrtaTariff: 54,
        isWithinReasonableBounds: true,
        auditNote:
          "Corridor extends outside pilot zone. 4 intermediate pilot hubs matched (Malibagh, Mohakhali, Airport). New service discovery candidate.",
      },
    },
    status: "pending",
    submittedAt: "2026-03-02T11:45:00Z",
    userNotes:
      "New route spotted from Sayedabad going towards Gazipur via Mohakhali.",
  },
];

export function getOcrSubmissions(): OcrSubmission[] {
  return [...ocrSubmissions];
}

export function addOcrSubmission(
  submission: Omit<
    OcrSubmission,
    "id" | "receiptCode" | "status" | "submittedAt"
  >,
): OcrSubmission {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newSubmission: OcrSubmission = {
    ...submission,
    id: `ocr_sub_${Date.now()}`,
    receiptCode: `OCR-2026-${randomSuffix}`,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  ocrSubmissions.unshift(newSubmission);
  return newSubmission;
}

export function updateOcrSubmissionStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string,
  reviewedBy?: string,
): OcrSubmission | null {
  const sub = ocrSubmissions.find((s) => s.id === id);
  if (!sub) return null;

  sub.status = status;
  sub.reviewedAt = new Date().toISOString();
  if (adminNotes !== undefined) sub.adminNotes = adminNotes;
  if (reviewedBy !== undefined) sub.reviewedBy = reviewedBy;

  return sub;
}

export function deleteOcrSubmission(id: string): boolean {
  const idx = ocrSubmissions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    ocrSubmissions.splice(idx, 1);
    return true;
  }
  return false;
}
