import { Segment, Stop, TransitMode } from '@/types/network';
import { PlanRequest, PlanResponse, PlannedRoute, RouteLeg } from '@/types/api';
import {
  getApprovedHubs,
  getApprovedStops,
  getApprovedServices,
  getApprovedSegments,
} from '@/lib/db/repository';
import { prepareSessionAlerts, evaluateSegmentDisruptions } from '@/lib/alerts/engine';
import { quoteLegFare, evaluateRouteFareBreakdown } from '@/lib/fares/calculator';

interface SearchState {
  currentStopId: string;
  pathSegments: Segment[];
  effectiveMinutes: number;
  visitedStops: Set<string>;
  activeDisruptionTitles: Set<string>;
}

export function planTrip(request: PlanRequest): PlanResponse {
  const {
    originHubId,
    destinationHubId,
    student = false,
    budgetBdt = null,
    avoidHubIds = [],
    allowedModes = ['metro', 'bus', 'leguna', 'rickshaw', 'walk'],
    maxTransfers = 3,
    scenarioId = null,
  } = request;

  const hubs = getApprovedHubs();
  const stops = getApprovedStops();
  const services = getApprovedServices();
  const segments = getApprovedSegments();
  const alerts = prepareSessionAlerts(scenarioId);

  // Validate Hubs
  const originHub = hubs.find((h) => h.id === originHubId);
  const destHub = hubs.find((h) => h.id === destinationHubId);

  if (!originHub || !destHub) {
    return {
      success: false,
      status: 'OUTSIDE_COVERAGE',
      message: `Selected hub(s) are outside the supported 14-hub pilot corridor.`,
      networkRevision: 'rev_2026_03_pilot',
      calculatedAt: new Date().toISOString(),
      routes: [],
      activeAlertsCount: alerts.length,
    };
  }

  if (originHubId === destinationHubId) {
    return {
      success: false,
      status: 'INVALID_REQUEST',
      message: 'Origin and destination hubs are identical.',
      networkRevision: 'rev_2026_03_pilot',
      calculatedAt: new Date().toISOString(),
      routes: [],
      activeAlertsCount: alerts.length,
    };
  }

  const originStops = stops.filter((s) => s.hub_id === originHubId && s.is_active);
  const destStopIds = new Set(stops.filter((s) => s.hub_id === destinationHubId && s.is_active).map((s) => s.id));

  // Build Adjacency Graph with Disruption Checks
  const stopMap = new Map<string, Stop>(stops.map((s) => [s.id, s]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  interface Edge {
    segment: Segment;
    duration: number;
    disruptions: string[];
  }

  const graph = new Map<string, Edge[]>();

  for (const seg of segments) {
    // Mode filter
    if (!allowedModes.includes(seg.mode)) continue;

    const toStop = stopMap.get(seg.to_stop_id);
    if (!toStop) continue;

    // Avoided hubs filter (exclude if target stop belongs to avoided hub, unless it's destination)
    if (avoidHubIds.includes(toStop.hub_id) && toStop.hub_id !== destinationHubId) {
      continue;
    }

    // Evaluate Disruption Overlay
    const disruption = evaluateSegmentDisruptions(seg, alerts);
    if (disruption.isClosed) {
      // Impassable due to disruption / closure
      continue;
    }

    const edge: Edge = {
      segment: seg,
      duration: disruption.effectiveDurationMin,
      disruptions: disruption.activeAlerts.map((a) => a.title),
    };

    if (!graph.has(seg.from_stop_id)) {
      graph.set(seg.from_stop_id, []);
    }
    graph.get(seg.from_stop_id)!.push(edge);
  }

  // Path Search (DFS with bounded depth and transfer limits)
  const candidatePaths: { segments: Segment[]; duration: number; disruptions: string[] }[] = [];

  for (const startStop of originStops) {
    const queue: SearchState[] = [
      {
        currentStopId: startStop.id,
        pathSegments: [],
        effectiveMinutes: 0,
        visitedStops: new Set([startStop.id]),
        activeDisruptionTitles: new Set(),
      },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check if reached destination
      if (destStopIds.has(current.currentStopId) && current.pathSegments.length > 0) {
        candidatePaths.push({
          segments: [...current.pathSegments],
          duration: current.effectiveMinutes,
          disruptions: Array.from(current.activeDisruptionTitles),
        });
        continue;
      }

      // Max depth limit
      if (current.pathSegments.length >= 8) continue;

      const edges = graph.get(current.currentStopId) || [];
      for (const edge of edges) {
        if (current.visitedStops.has(edge.segment.to_stop_id)) continue;

        const nextVisited = new Set(current.visitedStops);
        nextVisited.add(edge.segment.to_stop_id);

        const nextDisruptions = new Set(current.activeDisruptionTitles);
        edge.disruptions.forEach((d) => nextDisruptions.add(d));

        queue.push({
          currentStopId: edge.segment.to_stop_id,
          pathSegments: [...current.pathSegments, edge.segment],
          effectiveMinutes: current.effectiveMinutes + edge.duration,
          visitedStops: nextVisited,
          activeDisruptionTitles: nextDisruptions,
        });
      }
    }
  }

  if (candidatePaths.length === 0) {
    return {
      success: false,
      status: 'NO_VALID_ROUTE',
      message: `No valid route could be found connecting ${originHub.name_en} to ${destHub.name_en}. All connecting links are impassable or excluded by constraints.`,
      networkRevision: 'rev_2026_03_pilot',
      calculatedAt: new Date().toISOString(),
      routes: [],
      activeAlertsCount: alerts.length,
    };
  }

  // Convert raw segments into structured legs with ride-level aggregation
  const constructedRoutes: PlannedRoute[] = [];

  for (let idx = 0; idx < candidatePaths.length; idx++) {
    const candidate = candidatePaths[idx];
    const legs: RouteLeg[] = [];

    // Group continuous segments of same service into single ride
    let currentLegSegments: Segment[] = [];
    let currentServiceId: string | null = null;
    let currentMode: TransitMode | null = null;

    for (const seg of candidate.segments) {
      if (
        currentLegSegments.length > 0 &&
        seg.service_id !== null &&
        seg.service_id === currentServiceId &&
        seg.mode === currentMode
      ) {
        currentLegSegments.push(seg);
      } else {
        if (currentLegSegments.length > 0) {
          legs.push(buildLeg(legs.length, currentLegSegments, stopMap, serviceMap, alerts, student));
        }
        currentLegSegments = [seg];
        currentServiceId = seg.service_id;
        currentMode = seg.mode;
      }
    }

    if (currentLegSegments.length > 0) {
      legs.push(buildLeg(legs.length, currentLegSegments, stopMap, serviceMap, alerts, student));
    }

    // Transfers = vehicle boardings after the first
    const vehicleLegs = legs.filter((l) => !l.isTransfer && l.mode !== 'walk');
    const transfers = Math.max(0, vehicleLegs.length - 1);

    if (transfers > maxTransfers) continue;

    // Calculate Fares
    const fareBreakdown = evaluateRouteFareBreakdown(
      legs.map((l) => ({ mode: l.mode, serviceId: l.serviceId, distanceMeters: l.distanceMeters })),
      student,
      budgetBdt
    );

    const hasActiveDisruptions = candidate.disruptions.length > 0;
    const warnings: string[] = [];

    if (fareBreakdown.budgetCategorization === 'MAY_EXCEED_BUDGET') {
      warnings.push(`Trip may exceed budget of ${budgetBdt} BDT due to connector fare ranges.`);
    } else if (fareBreakdown.budgetCategorization === 'EXCEEDS_BUDGET') {
      warnings.push(`Trip exceeds your budget of ${budgetBdt} BDT.`);
    }

    if (hasActiveDisruptions) {
      warnings.push(`Active street disruption reported on this corridor.`);
    }

    constructedRoutes.push({
      id: `route_${idx}_${originHubId}_${destinationHubId}`,
      rankingProfile: 'balanced',
      totalDurationMin: candidate.duration,
      transfers,
      fareRegularBdt: fareBreakdown.totalRegularBdt,
      fareStudentBdt: fareBreakdown.totalStudentBdt,
      fareEstimatedRange: fareBreakdown.totalRangeBdt,
      budgetCategorization: fareBreakdown.budgetCategorization,
      hasActiveDisruptions,
      legs,
      warnings,
    });
  }

  if (constructedRoutes.length === 0) {
    return {
      success: false,
      status: 'NO_VALID_ROUTE',
      message: `No routes met the transfer limit of ${maxTransfers} transfers.`,
      networkRevision: 'rev_2026_03_pilot',
      calculatedAt: new Date().toISOString(),
      routes: [],
      activeAlertsCount: alerts.length,
    };
  }

  // Deduplicate and Rank Routes
  // Sort distinct options into Pareto profiles: Fastest, Cheapest, Balanced
  constructedRoutes.sort((a, b) => a.totalDurationMin - b.totalDurationMin);

  // Distinct profiles
  const fastest = { ...constructedRoutes[0], rankingProfile: 'fastest' as const };

  const cheapest = [...constructedRoutes]
    .sort((a, b) => (student ? a.fareStudentBdt - b.fareStudentBdt : a.fareRegularBdt - b.fareRegularBdt))[0];
  const cheapestProfile = { ...cheapest, rankingProfile: 'cheapest' as const };

  const balanced = [...constructedRoutes]
    .sort((a, b) => (a.totalDurationMin + 12 * a.transfers) - (b.totalDurationMin + 12 * b.transfers))[0];
  const balancedProfile = { ...balanced, rankingProfile: 'balanced' as const };

  // Form distinct list without duplicate IDs
  const rankedRoutes: PlannedRoute[] = [];
  const seenLegSignatures = new Set<string>();

  for (const r of [fastest, cheapestProfile, balancedProfile]) {
    const sig = r.legs.map((l) => `${l.fromStopId}->${l.toStopId}`).join('|');
    if (!seenLegSignatures.has(sig)) {
      seenLegSignatures.add(sig);
      rankedRoutes.push(r);
    }
  }

  // Append other distinct routes if room
  for (const r of constructedRoutes) {
    const sig = r.legs.map((l) => `${l.fromStopId}->${l.toStopId}`).join('|');
    if (!seenLegSignatures.has(sig) && rankedRoutes.length < 3) {
      seenLegSignatures.add(sig);
      rankedRoutes.push(r);
    }
  }

  return {
    success: true,
    status: 'OK',
    networkRevision: 'rev_2026_03_pilot',
    calculatedAt: new Date().toISOString(),
    routes: rankedRoutes,
    activeAlertsCount: alerts.length,
  };
}

function buildLeg(
  legIndex: number,
  segments: Segment[],
  stopMap: Map<string, Stop>,
  serviceMap: Map<string, any>,
  alerts: any[],
  isStudent: boolean
): RouteLeg {
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  const fromStop = stopMap.get(firstSeg.from_stop_id);
  const toStop = stopMap.get(lastSeg.to_stop_id);

  let totalDistance = 0;
  let totalDuration = 0;
  const legDisruptions: string[] = [];

  for (const seg of segments) {
    totalDistance += seg.distance_meters;
    const overlay = evaluateSegmentDisruptions(seg, alerts);
    totalDuration += overlay.effectiveDurationMin;
    overlay.activeAlerts.forEach((a) => legDisruptions.push(a.title));
  }

  const service = firstSeg.service_id ? serviceMap.get(firstSeg.service_id) : null;
  const serviceName = service ? service.name : firstSeg.mode === 'walk' ? 'Walking Transfer' : 'Local Feeder';

  const fareQuote = quoteLegFare(firstSeg.mode, firstSeg.service_id, totalDistance, isStudent);

  return {
    legIndex,
    serviceId: firstSeg.service_id,
    serviceName,
    mode: firstSeg.mode,
    fromStopId: firstSeg.from_stop_id,
    fromStopName: fromStop?.name_en || firstSeg.from_stop_id,
    toStopId: lastSeg.to_stop_id,
    toStopName: toStop?.name_en || lastSeg.to_stop_id,
    durationMin: totalDuration,
    distanceMeters: totalDistance,
    fareRegular: fareQuote.regularFare,
    fareStudent: fareQuote.studentFare,
    fareRange: fareQuote.estimatedRange,
    isTransfer: firstSeg.is_transfer,
    boardingLandmark: fromStop?.boarding_landmark,
    directionNotes: fromStop?.direction_notes,
    disruptions: Array.from(new Set(legDisruptions)),
  };
}
