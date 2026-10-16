import { TransitMode } from "@/types/network";
import {
  FareRule,
  LegFareQuote,
  RouteFareBreakdown,
  BudgetStatus,
} from "@/types/fares";
import { getApprovedFareRules } from "@/lib/db/repository";

/**
 * Calculates student fare based on statutory 50% discount with a 10 BDT floor.
 * student_fare = max(10 BDT, ceil(regular_fare * 0.5))
 */
export function calculateStudentBusFare(regularFare: number): number {
  if (regularFare <= 0) return 0;
  return Math.max(10, Math.ceil(regularFare * 0.5));
}

/**
 * Computes fare quote for a continuous ride leg.
 * Note: A ride over multiple segments on the same vehicle is charged once.
 */
export function quoteLegFare(
  mode: TransitMode,
  serviceId: string | null,
  distanceMeters: number,
  isStudent: boolean = false,
): LegFareQuote {
  if (mode === "walk") {
    return {
      regularFare: 0,
      studentFare: 0,
      estimatedRange: [0, 0],
      isStudentEligible: false,
      discountApplied: false,
      notes: "Pedestrian transfer",
    };
  }

  const fareRules = getApprovedFareRules();
  const rule = fareRules.find((r) => {
    if (r.service_id && serviceId) {
      return r.service_id === serviceId;
    }
    return r.mode === mode;
  });

  if (mode === "bus") {
    // Distance-proportional or base tariff
    let baseFare = rule?.fare_regular || 25;
    if (distanceMeters > 15000) {
      baseFare = rule?.fare_max || 40;
    }

    const studentFare = isStudent
      ? calculateStudentBusFare(baseFare)
      : baseFare;
    return {
      regularFare: baseFare,
      studentFare,
      estimatedRange: [studentFare, baseFare],
      isStudentEligible: true,
      discountApplied: isStudent,
      notes: isStudent
        ? "50% Student Pass discount applied (10 BDT floor)"
        : "Regular city bus fare",
    };
  }

  if (mode === "metro") {
    // Official DMTCL Distance Tariff
    let metroFare = 20;
    if (distanceMeters > 15000) metroFare = 100;
    else if (distanceMeters > 10000) metroFare = 60;
    else if (distanceMeters > 5000) metroFare = 40;
    else metroFare = 20;

    return {
      regularFare: metroFare,
      studentFare: metroFare, // No student concession on Metro Rail
      estimatedRange: [metroFare, metroFare],
      isStudentEligible: false,
      discountApplied: false,
      notes:
        "DMTCL single-journey ticket (No student concession per MRT policy)",
    };
  }

  if (mode === "leguna") {
    const flatFare = rule?.fare_regular || 15;
    const maxFare = rule?.fare_max || 25;
    return {
      regularFare: flatFare,
      studentFare: flatFare,
      estimatedRange: [flatFare, maxFare],
      isStudentEligible: false,
      discountApplied: false,
      notes: "Staged cash fare (15 - 25 BDT)",
    };
  }

  if (mode === "rickshaw") {
    const minFare = rule?.fare_min || 30;
    const maxFare = rule?.fare_max || 60;
    return {
      regularFare: rule?.fare_regular || 40,
      studentFare: rule?.fare_regular || 40,
      estimatedRange: [minFare, maxFare],
      isStudentEligible: false,
      discountApplied: false,
      notes:
        "Estimated feeder fare range; subject to weather and congestion bargaining",
    };
  }

  return {
    regularFare: 20,
    studentFare: 20,
    estimatedRange: [20, 20],
    isStudentEligible: false,
    discountApplied: false,
  };
}

/**
 * Aggregates route legs and categorizes against commuter budget.
 */
export function evaluateRouteFareBreakdown(
  legs: {
    mode: TransitMode;
    serviceId: string | null;
    distanceMeters: number;
  }[],
  isStudent: boolean = false,
  budgetBdt?: number | null,
): RouteFareBreakdown {
  let totalRegular = 0;
  let totalStudent = 0;
  let rangeMin = 0;
  let rangeMax = 0;

  for (const leg of legs) {
    const quote = quoteLegFare(
      leg.mode,
      leg.serviceId,
      leg.distanceMeters,
      isStudent,
    );
    totalRegular += quote.regularFare;
    totalStudent += quote.studentFare;
    rangeMin += quote.estimatedRange[0];
    rangeMax += quote.estimatedRange[1];
  }

  let budgetCategorization: BudgetStatus = "WITHIN_BUDGET";

  if (budgetBdt !== undefined && budgetBdt !== null && budgetBdt > 0) {
    if (rangeMax <= budgetBdt) {
      budgetCategorization = "WITHIN_BUDGET";
    } else if (rangeMin <= budgetBdt && rangeMax > budgetBdt) {
      budgetCategorization = "MAY_EXCEED_BUDGET";
    } else {
      budgetCategorization = "EXCEEDS_BUDGET";
    }
  }

  return {
    totalRegularBdt: totalRegular,
    totalStudentBdt: totalStudent,
    totalRangeBdt: [rangeMin, rangeMax],
    budgetCategorization,
    studentSavingsBdt: totalRegular - totalStudent,
  };
}
