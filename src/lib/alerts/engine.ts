import { DisruptionAlert } from "@/types/alerts";
import { Segment, TransitMode } from "@/types/network";
import { getActiveAlerts, getDemoDisruptions } from "@/lib/db/repository";

export interface DisruptionOverlay {
  effectiveDurationMin: number;
  isClosed: boolean;
  activeAlerts: DisruptionAlert[];
}

/**
 * Checks if an alert has aged past its TTL or expiration timestamp.
 * Expired means "no longer fresh enough to influence routing", not "road is clear".
 */
export function isAlertActive(
  alert: DisruptionAlert,
  asOfTime: Date = new Date(),
): boolean {
  if (
    alert.lifecycle_stage === "resolved" ||
    alert.lifecycle_stage === "expired"
  ) {
    return false;
  }
  if (alert.reported_by_type === "simulation") {
    return true;
  }
  const expiry = new Date(alert.expires_at);
  return expiry.getTime() > asOfTime.getTime();
}

/**
 * Evaluates active disruptions impacting a specific network segment.
 * Deduplicates overlapping delays by taking maximum delay rather than compounding.
 */
export function evaluateSegmentDisruptions(
  segment: Segment,
  alerts: DisruptionAlert[],
): DisruptionOverlay {
  const impactingAlerts = alerts.filter((alert) => {
    if (!isAlertActive(alert)) return false;

    // Check if mode is affected
    if (!alert.affected_modes.includes(segment.mode)) return false;

    // Check explicit segment matching if defined
    if (alert.affected_segment_ids && alert.affected_segment_ids.length > 0) {
      return alert.affected_segment_ids.includes(segment.id);
    }

    return false;
  });

  if (impactingAlerts.length === 0) {
    return {
      effectiveDurationMin: segment.baseline_duration_min,
      isClosed: false,
      activeAlerts: [],
    };
  }

  // If any alert marks segment closed for this mode
  const isClosed = impactingAlerts.some((a) => a.is_closed);

  // Maximum delay deduplication (avoiding multiplicative compounding)
  const maxDelay = Math.max(
    ...impactingAlerts.map((a) => a.delay_minutes || 0),
    0,
  );

  return {
    effectiveDurationMin: isClosed
      ? Infinity
      : segment.baseline_duration_min + maxDelay,
    isClosed,
    activeAlerts: impactingAlerts,
  };
}

/**
 * Prepares active alerts for a planning session, including optional scenario simulation.
 */
export function prepareSessionAlerts(
  scenarioId?: string | null,
): DisruptionAlert[] {
  const baseAlerts = getActiveAlerts();
  if (!scenarioId) return baseAlerts;

  const demoAlerts = getDemoDisruptions();
  const scenarioAlert = demoAlerts.find((d) => d.id === scenarioId);

  if (scenarioAlert) {
    // Avoid duplicates
    return [
      ...baseAlerts.filter((a) => a.id !== scenarioAlert.id),
      scenarioAlert,
    ];
  }

  return baseAlerts;
}
