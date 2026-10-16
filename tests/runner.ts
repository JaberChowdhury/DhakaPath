import assert from "assert";
import { planTrip } from "../src/lib/routing/planner";
import {
  calculateStudentBusFare,
  evaluateRouteFareBreakdown,
} from "../src/lib/fares/calculator";
import {
  isAlertActive,
  evaluateSegmentDisruptions,
} from "../src/lib/alerts/engine";
import { extractIntentDeterministic } from "../src/lib/ai/provider";
import { getApprovedHubs, getApprovedSegments } from "../src/lib/db/repository";
import { benchmarkScenarios } from "./fixtures/benchmark_scenarios";

async function runTestSuite() {
  console.log(
    "================================================================",
  );
  console.log("DhakaPath Automated Verification & Regression Test Suite");
  console.log(
    "================================================================\n",
  );

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] Test ${total}: ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  // 1. Valid Multimodal Journey
  test("Valid Multimodal Journey (Uttara North -> Motijheel)", () => {
    const res = planTrip({
      originHubId: "hub_uttara_north",
      destinationHubId: "hub_motijheel",
      student: false,
    });
    assert.strictEqual(res.success, true);
    assert(res.routes.length > 0, "Should find at least 1 valid route");
    const metroRoute = res.routes.find((r) =>
      r.legs.some((l) => l.mode === "metro"),
    );
    assert(metroRoute, "Should include direct MRT Line 6 path");
  });

  // 2. Student Bus Fare Formula: max(10, ceil(regular * 0.5))
  test("Student Statutory Bus Fare Formula and 10 BDT Floor", () => {
    // 25 BDT regular -> ceil(12.5) = 13 BDT
    assert.strictEqual(calculateStudentBusFare(25), 13);
    // 40 BDT regular -> 20 BDT
    assert.strictEqual(calculateStudentBusFare(40), 20);
    // 15 BDT regular -> ceil(7.5) = 8 -> floored at 10 BDT
    assert.strictEqual(calculateStudentBusFare(15), 10);
    // 10 BDT regular -> ceil(5) = 5 -> floored at 10 BDT
    assert.strictEqual(calculateStudentBusFare(10), 10);
  });

  // 3. Single Ride Charging Across Multiple Graph Segments
  test("Single Ride Charging (No duplicate minimum-fare penalties per segment)", () => {
    const res = planTrip({
      originHubId: "hub_mirpur_10",
      destinationHubId: "hub_shahbagh",
      student: true,
      allowedModes: ["bus", "walk"],
    });
    assert.strictEqual(res.success, true);
    const busRoute = res.routes[0];
    // Bikolpo bus traverses Mirpur -> Agargaon -> Farmgate -> Kawran -> Shahbagh (4 segments)
    // Bus fare should be charged once as a single ride (13 BDT for student), NOT 4 * 10 BDT!
    assert.strictEqual(
      busRoute.fareStudentBdt,
      13,
      `Expected single ride student fare of 13 BDT, got ${busRoute.fareStudentBdt}`,
    );
    assert.strictEqual(
      busRoute.transfers,
      0,
      "Passing intermediate stops on same bus is 0 transfers",
    );
  });

  // 4. Budget Categorization and Warning Ranges
  test("Budget Classification: WITHIN_BUDGET vs MAY_EXCEED_BUDGET vs EXCEEDS_BUDGET", () => {
    const legs = [
      { mode: "rickshaw" as const, serviceId: null, distanceMeters: 2000 }, // Range: [30, 60] BDT
    ];
    // Budget 70 BDT: Max is 60 -> WITHIN_BUDGET
    const eval1 = evaluateRouteFareBreakdown(legs, false, 70);
    assert.strictEqual(eval1.budgetCategorization, "WITHIN_BUDGET");

    // Budget 40 BDT: Min is 30, Max is 60 -> MAY_EXCEED_BUDGET
    const eval2 = evaluateRouteFareBreakdown(legs, false, 40);
    assert.strictEqual(eval2.budgetCategorization, "MAY_EXCEED_BUDGET");

    // Budget 20 BDT: Min is 30 -> EXCEEDS_BUDGET
    const eval3 = evaluateRouteFareBreakdown(legs, false, 20);
    assert.strictEqual(eval3.budgetCategorization, "EXCEEDS_BUDGET");
  });

  // 5. Disruption Detour Calculation
  test("Disruption Detour (Malibagh Waterlogging detour)", () => {
    const normal = planTrip({
      originHubId: "hub_banasree",
      destinationHubId: "hub_kawran_bazar",
      scenarioId: null,
    });
    const disrupted = planTrip({
      originHubId: "hub_banasree",
      destinationHubId: "hub_kawran_bazar",
      scenarioId: "disrupt_malibagh_waterlogging",
    });

    assert.strictEqual(disrupted.success, true);
    // Malibagh segments should be bypassed
    const hasMalibagh = disrupted.routes[0].legs.some(
      (l) =>
        l.fromStopId.includes("malibagh_railgate") ||
        l.toStopId.includes("malibagh_railgate"),
    );
    assert.strictEqual(
      hasMalibagh,
      false,
      "Disrupted segment at Malibagh must not be traversed",
    );
  });

  // 6. Honest No-Route Outcome
  test("Honest No-Route Outcome (Rampura Feeder Blockade)", () => {
    const res = planTrip({
      originHubId: "hub_banasree",
      destinationHubId: "hub_gulshan_1",
      scenarioId: "disrupt_rampura_blockade",
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, "NO_VALID_ROUTE");
    assert(
      res.routes.length === 0,
      "Must not hallucinate phantom routes when blocked",
    );
  });

  // 7. Selective Disruption Mode Filtering
  test("Road disruption on buses does NOT block Metro Rail", () => {
    const res = planTrip({
      originHubId: "hub_mirpur_10",
      destinationHubId: "hub_shahbagh",
      scenarioId: "disrupt_farmgate_vip_movement", // Only affects bus
    });
    assert.strictEqual(res.success, true);
    const metroRoute = res.routes.find((r) =>
      r.legs.some((l) => l.mode === "metro"),
    );
    assert(
      metroRoute,
      "Metro route must remain active despite road VIP movement",
    );
    assert.strictEqual(metroRoute.hasActiveDisruptions, false);
  });

  // 8. Avoid Hub Constraint
  test("Avoided Hub Exclusion throughout Intermediate Journey", () => {
    const res = planTrip({
      originHubId: "hub_mirpur_10",
      destinationHubId: "hub_motijheel",
      avoidHubIds: ["hub_farmgate"], // Avoid Farmgate
    });
    // Any route through Farmgate must be excluded
    if (res.success && res.routes.length > 0) {
      for (const route of res.routes) {
        for (const leg of route.legs) {
          assert(
            !leg.fromStopId.includes("farmgate"),
            "Intermediate fromStop must not be Farmgate",
          );
          assert(
            !leg.toStopId.includes("farmgate"),
            "Intermediate toStop must not be Farmgate",
          );
        }
      }
    }
  });

  // 9. Alert Aging and Expiry Invariant
  test("Alert Aging: Expired or Resolved alerts lose active routing impact", () => {
    const activeAlert = {
      id: "test_active",
      title: "Active jam",
      description: "jam",
      severity: "medium" as const,
      status: "approved" as const,
      lifecycle_stage: "active" as const,
      affected_modes: ["bus" as const],
      delay_minutes: 20,
      is_closed: false,
      reported_by_type: "guest" as const,
      observed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString(), // 1 min in future
    };

    const expiredAlert = {
      ...activeAlert,
      id: "test_expired",
      expires_at: new Date(Date.now() - 60000).toISOString(), // 1 min in past
    };

    const resolvedAlert = {
      ...activeAlert,
      id: "test_resolved",
      lifecycle_stage: "resolved" as const,
    };

    assert.strictEqual(isAlertActive(activeAlert), true);
    assert.strictEqual(isAlertActive(expiredAlert), false);
    assert.strictEqual(isAlertActive(resolvedAlert), false);
  });

  // 10. Deduplication of Multiple Alerts on Same Segment
  test("Maximum delay deduplication on overlapping segment alerts", () => {
    const segment = {
      id: "test_seg",
      from_stop_id: "a",
      to_stop_id: "b",
      service_id: "srv_bus",
      mode: "bus" as const,
      baseline_duration_min: 15,
      distance_meters: 3000,
      is_transfer: false,
    };

    const alerts = [
      {
        id: "a1",
        title: "Jam 1",
        description: "",
        severity: "medium" as const,
        status: "approved" as const,
        lifecycle_stage: "active" as const,
        affected_modes: ["bus" as const],
        affected_segment_ids: ["test_seg"],
        delay_minutes: 10,
        is_closed: false,
        reported_by_type: "guest" as const,
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60000).toISOString(),
      },
      {
        id: "a2",
        title: "Jam 2",
        description: "",
        severity: "high" as const,
        status: "approved" as const,
        lifecycle_stage: "active" as const,
        affected_modes: ["bus" as const],
        affected_segment_ids: ["test_seg"],
        delay_minutes: 25,
        is_closed: false,
        reported_by_type: "guest" as const,
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60000).toISOString(),
      },
    ];

    const overlay = evaluateSegmentDisruptions(segment, alerts);
    // Effective duration should be 15 + max(10, 25) = 40, NOT 15 + 10 + 25 = 50
    assert.strictEqual(overlay.effectiveDurationMin, 40);
  });

  // 11. Bilingual & Banglish Intent Extraction
  test("Natural Language Intent Extraction (Bangla, Banglish, Prepositions)", () => {
    const q1 = extractIntentDeterministic(
      "Banasree theke Motijheel jabo, budget 80 taka, ami student",
    );
    assert.strictEqual(q1.originHubId, "hub_banasree");
    assert.strictEqual(q1.destinationHubId, "hub_motijheel");
    assert.strictEqual(q1.student, true);
    assert.strictEqual(q1.budgetBdt, 80);

    const q2 = extractIntentDeterministic(
      "Mirpur 10 theke Shahbagh under 20 taka",
    );
    assert.strictEqual(q2.originHubId, "hub_mirpur_10");
    assert.strictEqual(q2.destinationHubId, "hub_shahbagh");
    assert.strictEqual(q2.budgetBdt, 20);

    const q3 = extractIntentDeterministic(
      "Farmgate to Gulshan 1 avoid Malibagh",
    );
    assert.strictEqual(q3.originHubId, "hub_farmgate");
    assert.strictEqual(q3.destinationHubId, "hub_gulshan_1");
    assert(q3.avoidHubIds.includes("hub_malibagh"));
  });

  // 12. Benchmark Demonstration Scenarios Execution
  test("All 4 Pre-Plan Benchmark Demonstration Journeys Execute", () => {
    for (const scenario of benchmarkScenarios) {
      const res = planTrip(scenario.request);
      assert.strictEqual(
        res.status,
        scenario.expectedStatus,
        `Scenario "${scenario.name}" expected status ${scenario.expectedStatus}, got ${res.status}`,
      );
    }
  });

  // 13. Network Snapshot Integrity (Phase 2 Coverage)
  test("Network Snapshot Integrity (14 Hubs, 25 Stops, 4 Services, Fare Rules)", () => {
    const { getNetworkSnapshot } = require("../src/lib/db/repository");
    const snapshot = getNetworkSnapshot();
    assert.strictEqual(
      snapshot.hubs.length,
      14,
      `Expected 14 hubs, got ${snapshot.hubs.length}`,
    );
    assert.strictEqual(
      snapshot.stops.length,
      25,
      `Expected 25 stops, got ${snapshot.stops.length}`,
    );
    assert.strictEqual(
      snapshot.services.length,
      4,
      `Expected 4 services, got ${snapshot.services.length}`,
    );
    assert(snapshot.fareRules.length > 0, "Must include statutory fare rules");
    assert.strictEqual(snapshot.networkRevision, "rev_2026_03_pilot");
  });

  // 14. Report Submission and Admin Moderation Lifecycle (Phase 5)
  test("Report Submission and Admin Moderation Lifecycle (Pending -> Approved -> Resolved)", () => {
    const {
      addPendingReport,
      updateAlertStatus,
      getAllAlertsForAdmin,
      getActiveAlerts,
    } = require("../src/lib/db/repository");
    const rep = addPendingReport({
      title: "Waterlogging at Kakrail",
      description: "Stagnant water on bus lane",
      severity: "medium",
      affected_modes: ["bus"],
      affected_segment_ids: [],
      delay_minutes: 15,
      is_closed: false,
      reported_by_type: "guest",
      observed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1800000).toISOString(),
    });

    assert.strictEqual(rep.status, "pending");
    assert.strictEqual(rep.lifecycle_stage, "active");

    // Admin approves the report
    const approved = updateAlertStatus(rep.id, "approved", "active");
    assert.strictEqual(approved?.status, "approved");

    // Verify it is visible in active alerts
    const active = getActiveAlerts();
    assert(
      active.some((a: any) => a.id === rep.id),
      "Approved alert must be present in active alerts",
    );

    // Admin marks as resolved
    const resolved = updateAlertStatus(rep.id, "approved", "resolved");
    assert.strictEqual(resolved?.lifecycle_stage, "resolved");

    // Resolved alert loses active impact
    const activeAfterResolve = getActiveAlerts();
    assert(
      !activeAfterResolve.some((a: any) => a.id === rep.id),
      "Resolved alert must lose active impact",
    );
  });

  // 15. Simulation Comparative Delta Computation (Phase 6)
  test("Simulation Comparative Delta Computation (Baseline vs Disrupted)", () => {
    const baseline = planTrip({
      originHubId: "hub_banasree",
      destinationHubId: "hub_kawran_bazar",
      student: false,
      scenarioId: null,
    });

    const disrupted = planTrip({
      originHubId: "hub_banasree",
      destinationHubId: "hub_kawran_bazar",
      student: false,
      scenarioId: "disrupt_malibagh_waterlogging",
    });

    assert(baseline.success && baseline.routes.length > 0);
    assert(disrupted.success && disrupted.routes.length > 0);

    const bRoute = baseline.routes[0];
    const dRoute = disrupted.routes[0];

    // Detour takes longer than baseline due to bypassing Malibagh via Gulshan & Mohakhali
    const durationDelta = dRoute.totalDurationMin - bRoute.totalDurationMin;
    assert(
      durationDelta > 0,
      `Detour must have positive time delta, got ${durationDelta} min`,
    );
  });

  // 16. Admin Authentication & Signed Session Token Lifecycle
  test("Admin Authentication & Cryptographic Session Token Verification", () => {
    const {
      validateAdminCredentials,
      createSessionToken,
      verifySessionToken,
    } = require("../src/lib/auth/session");

    // Positive credentials validation
    assert.strictEqual(
      validateAdminCredentials("admin@dhakapath.gov.bd", "dhakapath@admin2026"),
      true,
      "Valid official credentials must be accepted",
    );

    // Negative credentials validation
    assert.strictEqual(
      validateAdminCredentials("unknown@domain.com", "wrongpass"),
      false,
      "Invalid credentials must be denied",
    );

    // Session token issuance and verification
    const token = createSessionToken("admin@dhakapath.gov.bd", "super_admin");
    assert(
      typeof token === "string" && token.includes("."),
      "Session token must be signed dot-separated string",
    );

    const session = verifySessionToken(token);
    assert(session !== null, "Valid token must be successfully verified");
    assert.strictEqual(session.email, "admin@dhakapath.gov.bd");
    assert.strictEqual(session.role, "super_admin");

    // Tampered token rejection
    const tampered = token.replace(/a/g, "z");
    assert.strictEqual(
      verifySessionToken(tampered),
      null,
      "Tampered token signature must fail verification",
    );
  });

  // 17. Multi-Key AI Pool & Circuit-Breaker Auto-Switching Algorithm
  test("AI Multi-Key Pool & Adaptive Rate-Limit Failover Switching", () => {
    const {
      getKeyPoolSnapshot,
      selectNextAvailableKey,
      recordKeyLimitReached,
      recordKeySuccess,
    } = require("../src/lib/ai/keyPool");

    const snapshot = getKeyPoolSnapshot();
    assert(
      snapshot.length >= 1,
      "Key pool must contain at least one configured key",
    );

    // 1. Initial healthy selection
    const initialKey = selectNextAvailableKey();
    assert(initialKey !== null, "Should pick a healthy key");
    const initialId = initialKey.id;

    // 2. Simulate HTTP 429 Rate Limit on initial key
    recordKeyLimitReached(initialId, 429, "Resource exhausted");

    // Verify initial key is in cooldown
    const updatedSnapshot = getKeyPoolSnapshot();
    const updatedKey1 = updatedSnapshot.find((k: any) => k.id === initialId);
    assert.strictEqual(
      updatedKey1.status,
      "cooldown",
      "Rate-limited key must enter cooldown",
    );
    assert(
      updatedKey1.cooldownUntil > Date.now(),
      "Cooldown expiry must be in the future",
    );

    // 3. Next selection must auto-switch to a different key!
    const nextKey = selectNextAvailableKey();
    assert(nextKey !== null, "Should have fallback key available");
    assert.notStrictEqual(
      nextKey.id,
      initialId,
      "Must auto-switch to next available healthy key",
    );

    // 4. Mark success on next key
    recordKeySuccess(nextKey.id);
    const postSuccessSnapshot = getKeyPoolSnapshot();
    const activeKey = postSuccessSnapshot.find((k: any) => k.id === nextKey.id);
    assert(
      activeKey.totalSuccesses >= 1,
      "Success counter must be incremented",
    );
  });

  // 18. Custom Prompt Intent Extraction & End-to-End Route Plan Generation with Map Direction Geometry
  test("Custom Prompt Chat Intent Extraction & Map Direction Road Polyline Generation", () => {
    // 1. Natural language Banglish prompt with student and budget constraints
    const prompt1 = "Mirpur 10 theke Motijheel jabo ami student budget 50";
    const intent1 = extractIntentDeterministic(prompt1);
    assert.strictEqual(intent1.originHubId, "hub_mirpur_10");
    assert.strictEqual(intent1.destinationHubId, "hub_motijheel");
    assert.strictEqual(intent1.student, true);
    assert.strictEqual(intent1.budgetBdt, 50);

    // 2. Routing calculation from intent
    const plan1 = planTrip({
      originHubId: intent1.originHubId!,
      destinationHubId: intent1.destinationHubId!,
      student: intent1.student,
      budgetBdt: intent1.budgetBdt,
      avoidHubIds: intent1.avoidHubIds,
    });
    assert.strictEqual(plan1.success, true);
    assert(
      plan1.routes.length > 0,
      "Must produce valid routes from custom prompt intent",
    );

    // 3. Verify Leaflet Map Road Direction Polyline Generation
    const {
      getRoadPolylineForLeg,
    } = require("../src/lib/routing/roadGeometry");
    const {
      getApprovedStops,
      getApprovedHubs,
    } = require("../src/lib/db/repository");
    const allStops = getApprovedStops();
    const allHubs = getApprovedHubs();
    const stopMap = new Map();
    allStops.forEach((s: any) => stopMap.set(s.id, s));
    allHubs.forEach((h: any) =>
      stopMap.set(h.id, { lat: h.center_lat, lon: h.center_lon }),
    );

    const topRoute = plan1.routes[0];
    assert(topRoute.legs.length > 0, "Route must have multimodal legs");

    let totalWaypoints = 0;
    topRoute.legs.forEach((leg) => {
      const from = stopMap.get(leg.fromStopId);
      const to = stopMap.get(leg.toStopId);
      assert(
        from && to,
        `Stops must be resolvable for leg: ${leg.fromStopId} -> ${leg.toStopId}`,
      );
      const roadCoords = getRoadPolylineForLeg(
        [from.lat, from.lon],
        [to.lat, to.lon],
        leg.mode,
        leg.serviceId,
      );
      assert(
        Array.isArray(roadCoords) && roadCoords.length >= 2,
        "Must yield actual road waypoints",
      );
      totalWaypoints += roadCoords.length;
    });
    assert(
      totalWaypoints >= 2,
      "Direction polyline on map must have valid road waypoints",
    );

    // 4. Custom prompt with corridor avoidance ('avoid Malibagh')
    const prompt2 = "Banasree theke Shahbagh jabo avoid Malibagh";
    const intent2 = extractIntentDeterministic(prompt2);
    assert.strictEqual(intent2.originHubId, "hub_banasree");
    assert.strictEqual(intent2.destinationHubId, "hub_shahbagh");
    assert(
      intent2.avoidHubIds.includes("hub_malibagh"),
      "Must extract Malibagh into avoid list",
    );

    const plan2 = planTrip({
      originHubId: intent2.originHubId!,
      destinationHubId: intent2.destinationHubId!,
      student: intent2.student,
      avoidHubIds: intent2.avoidHubIds,
    });
    assert.strictEqual(plan2.success, true);
    // Ensure no route leg passes through Malibagh
    plan2.routes.forEach((r) => {
      r.legs.forEach((l) => {
        assert(
          !l.fromStopId.includes("malibagh") &&
            !l.toStopId.includes("malibagh"),
          "Must avoid Malibagh",
        );
      });
    });
  });

  // 19. Chatbot Multilingual Mirroring (Banglish, Bangla, English Response Synthesis)
  test("Chatbot Multilingual Mirroring (Banglish, Bangla, English)", () => {
    const {
      extractIntentDeterministic,
      formatRouteExplanation,
      handleSpecializedQuery,
      detectLanguage,
    } = require("../src/lib/ai/provider");

    // A. Detect Language Check
    assert.strictEqual(
      detectLanguage("Shahbagh theke Badda jabo koto lagbe?"),
      "banglish",
    );
    assert.strictEqual(
      detectLanguage("ফার্মগেট থেকে মতিঝিল যাব ভাড়া কত?"),
      "bangla",
    );
    assert.strictEqual(
      detectLanguage("How do I go from Mirpur 10 to Motijheel?"),
      "english",
    );

    // B. Banglish Route Explanation Mirroring
    const banglishIntent = extractIntentDeterministic(
      "Shahbagh theke Badda jabo student",
    );
    assert.strictEqual(banglishIntent.language, "banglish");
    const routePlan = planTrip({
      originHubId: banglishIntent.originHubId!,
      destinationHubId: banglishIntent.destinationHubId!,
      student: banglishIntent.student,
    });
    assert(
      routePlan.routes.length > 0,
      "Must calculate route from Shahbagh to Badda",
    );
    const banglishResp = formatRouteExplanation(
      banglishIntent,
      routePlan.routes[0],
    );
    assert(
      banglishResp.includes("Apnar jonno") &&
        banglishResp.includes("Mot shomoy"),
      "Response must be synthesized in Banglish",
    );

    // C. Bangla Route Explanation Mirroring
    const banglaIntent = extractIntentDeterministic("ফার্মগেট থেকে মতিঝিল যাব");
    assert.strictEqual(banglaIntent.language, "bangla");
    const banglaPlan = planTrip({
      originHubId: banglaIntent.originHubId!,
      destinationHubId: banglaIntent.destinationHubId!,
    });
    const banglaResp = formatRouteExplanation(
      banglaIntent,
      banglaPlan.routes[0],
    );
    assert(
      banglaResp.includes("আপনার জন্য") && banglaResp.includes("মোট সময়"),
      "Response must be synthesized in Bangla",
    );

    // D. Specialized Queries in matching languages
    const fareBanglish = handleSpecializedQuery({
      intentType: "explain_fare",
      language: "banglish",
    } as any);
    assert(
      fareBanglish.includes("Dhaka Transit Vara Structure"),
      "Fare response must be in Banglish",
    );

    const fareBangla = handleSpecializedQuery({
      intentType: "explain_fare",
      language: "bangla",
    } as any);
    assert(
      fareBangla.includes("ঢাকা গণপরিবহন ভাড়ার কাঠামো"),
      "Fare response must be in Bangla",
    );

    const fareEnglish = handleSpecializedQuery({
      intentType: "explain_fare",
      language: "english",
    } as any);
    assert(
      fareEnglish.includes("Official Dhaka Transit Fare Structure"),
      "Fare response must be in English",
    );

    // E. ChatGPT-Style General Conversational Queries
    const chatBanglish = extractIntentDeterministic("kemon acho bhai");
    assert.strictEqual(chatBanglish.intentType, "general_chat");
    assert.strictEqual(chatBanglish.language, "banglish");
    assert(
      chatBanglish.conversationalReply?.includes("bhalo achi"),
      "Must reply conversationally in Banglish",
    );

    const chatBangla = extractIntentDeterministic("কেমন আছেন?");
    assert.strictEqual(chatBangla.intentType, "general_chat");
    assert.strictEqual(chatBangla.language, "bangla");
    assert(
      chatBangla.conversationalReply?.includes("ভালো আছি"),
      "Must reply conversationally in Bangla",
    );

    const chatEnglish = extractIntentDeterministic("How are you today?");
    assert.strictEqual(chatEnglish.intentType, "general_chat");
    assert.strictEqual(chatEnglish.language, "english");
    assert(
      chatEnglish.conversationalReply?.includes("well"),
      "Must reply conversationally in English",
    );
  });

  // 20. Admin Operations: CMS Status Toggling, Service Registration, Fare Rule Updates, & Purging
  test("Admin Operations (CMS Service Toggling, Registration, Fare Updates, Purge)", () => {
    const {
      getApprovedServices,
      updateServiceStatus,
      addOrUpdateService,
      getApprovedFareRules,
      updateFareRule,
      createAdminAlert,
      deleteAlert,
      getAllAlertsForAdmin,
    } = require("../src/lib/db/repository");

    // 1. Toggle operational status of a service
    const initialService = getApprovedServices().find(
      (s: any) => s.id === "srv_mrt_line_6",
    );
    assert(initialService, "MRT Line 6 must exist");
    const wasActive = initialService.is_active;

    const toggled = updateServiceStatus("srv_mrt_line_6", !wasActive);
    assert.strictEqual(
      toggled?.is_active,
      !wasActive,
      "Service status must be updated",
    );
    // Restore
    updateServiceStatus("srv_mrt_line_6", wasActive);

    // 2. Register new service (e.g. from Signboard Digitizer)
    const newService = addOrUpdateService({
      id: "srv_test_balaka",
      name: "Balaka Express",
      mode: "bus",
      route_code: "BAL-99",
      operator: "Balaka Transport Syndicate",
      description: "Test arterial service",
      is_active: true,
      verification_status: "verified",
    });
    assert.strictEqual(newService.name, "Balaka Express");
    const foundNew = getApprovedServices().find(
      (s: any) => s.id === "srv_test_balaka",
    );
    assert(
      foundNew,
      "Newly registered service must appear in approved services",
    );

    // 3. Update statutory fare rule
    const rules = getApprovedFareRules();
    const busRule = rules.find((r: any) => r.id === "fare_bus_bikolpo_rules");
    assert(busRule, "Bikolpo fare rule must exist");
    const originalFare = busRule.fare_regular;

    const updatedFare = updateFareRule({
      id: "fare_bus_bikolpo_rules",
      fare_regular: 28,
    });
    assert.strictEqual(
      updatedFare?.fare_regular,
      28,
      "Fare regular must be updated to 28",
    );
    // Restore
    updateFareRule({
      id: "fare_bus_bikolpo_rules",
      fare_regular: originalFare,
    });

    // 4. Create and Purge official admin alert
    const adminAlert = createAdminAlert({
      title: "Test Administrative Roadblock",
      severity: "high",
      affected_modes: ["bus"],
      delay_minutes: 20,
      is_closed: true,
    });
    assert.strictEqual(adminAlert.status, "approved");
    assert.strictEqual(adminAlert.reported_by_type, "admin");

    const allBeforePurge = getAllAlertsForAdmin();
    assert(allBeforePurge.some((a: any) => a.id === adminAlert.id));

    // Delete alert
    const deleted = deleteAlert(adminAlert.id);
    assert.strictEqual(deleted, true);
    const allAfterPurge = getAllAlertsForAdmin();
    assert(
      !allAfterPurge.some((a: any) => a.id === adminAlert.id),
      "Purged alert must not appear in alerts list",
    );
  });

  // 21. Signboard & Physical Notice Optical Digitizer & Community Verification Lifecycle
  test("Signboard Optical Digitizer (OCR Extraction, DB Validation, & Admin Approval)", () => {
    const {
      runHeuristicOcr,
      validateAgainstTransitDatabase,
      matchHub,
    } = require("../src/lib/ai/visionOcr");
    const {
      getOcrSubmissions,
      addOcrSubmission,
      updateOcrSubmissionStatus,
      getApprovedServices,
      addOrUpdateService,
    } = require("../src/lib/db/repository");

    // 1. Hub Matcher testing (Bengali + English + Aliases)
    const mirpurMatch = matchHub("মিরপুর ১০");
    assert(
      mirpurMatch && mirpurMatch.id === "hub_mirpur_10",
      "Must match Mirpur 10 in Bengali",
    );

    const motijheelMatch = matchHub("Motijheel");
    assert(
      motijheelMatch && motijheelMatch.id === "hub_motijheel",
      "Must match Motijheel in English",
    );

    // 2. OCR Optical Extraction from notice sample
    const extracted = runHeuristicOcr(undefined, "sample_bikolpo");
    assert.strictEqual(extracted.serviceName, "Bikolpo Auto Service");
    assert.strictEqual(extracted.origin, "Mirpur 10");
    assert.strictEqual(extracted.destination, "Motijheel");
    assert.strictEqual(extracted.fareRegular, 25);
    assert.strictEqual(extracted.fareStudent, 13);

    // 3. Database Cross-Validation
    const dbMatch = validateAgainstTransitDatabase(extracted);
    assert.strictEqual(dbMatch.originMatchedHub?.id, "hub_mirpur_10");
    assert.strictEqual(dbMatch.destinationMatchedHub?.id, "hub_motijheel");
    assert(
      dbMatch.matchedStopsCount >= 4,
      "Should match arterial intermediate stops",
    );
    assert(
      dbMatch.statutoryFareValidation.isWithinReasonableBounds,
      "25 BDT regular fare must be within reasonable bounds",
    );
    assert(
      dbMatch.statutoryFareValidation.statutoryBrtaTariff !== null,
      "Must calculate statutory tariff based on distance",
    );

    // 4. Commuter Submission Lifecycle (Pending -> Review -> Approved -> Published)
    const submission = addOcrSubmission({
      sampleKey: "sample_bikolpo",
      imageName: "test_signboard_mirpur10.jpg",
      rawText: extracted.rawText,
      extractedData: extracted,
      userNotes: "Verified at Mirpur 10 counter.",
      dbMatch,
    });

    assert.strictEqual(submission.status, "pending");
    assert(
      submission.receiptCode.startsWith("OCR-2026-"),
      "Must assign official receipt code",
    );

    // Verify submission is in queue
    const allSubs = getOcrSubmissions();
    assert(allSubs.some((s: any) => s.id === submission.id));

    // Admin verifies and approves notice into live CMS
    const approved = updateOcrSubmissionStatus(
      submission.id,
      "approved",
      "Field verified by BRTA inspector",
      "admin@dhakapath.gov.bd",
    );
    assert.strictEqual(approved?.status, "approved");
    assert.strictEqual(approved?.reviewedBy, "admin@dhakapath.gov.bd");

    // Publish into CMS
    const publishedService = addOrUpdateService({
      id: "srv_bus_digitized_bikolpo",
      name: "Bikolpo Auto Service (Digitized)",
      mode: "bus",
      route_code: "BIK-OCR",
      operator: "Bikolpo Syndicate",
      description: "Approved from physical notice board.",
      is_active: true,
      verification_status: "verified",
    });
    assert(
      getApprovedServices().some((s: any) => s.id === publishedService.id),
    );
  });

  console.log(
    `\n================================================================`,
  );
  console.log(
    `Test Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`,
  );
  console.log(
    "================================================================",
  );

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite();
