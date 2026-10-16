import { NextResponse } from "next/server";
import {
  getApprovedFareRules,
  getApprovedServices,
  updateFareRule,
} from "@/lib/db/repository";
import { getAdminSessionFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const fareRules = getApprovedFareRules();
    const services = getApprovedServices();

    const enriched = fareRules.map((rule) => {
      const s = rule.service_id
        ? services.find((serv) => serv.id === rule.service_id)
        : null;
      return {
        ...rule,
        serviceName: s ? s.name : `${rule.mode.toUpperCase()} (Standard)`,
      };
    });

    return NextResponse.json({
      success: true,
      fareRules: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      id,
      fare_regular,
      fare_min,
      fare_max,
      student_eligible,
      student_discount_pct,
      student_fare_floor,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Rule id is required." },
        { status: 400 },
      );
    }

    const updated = updateFareRule({
      id,
      ...(fare_regular !== undefined && { fare_regular: Number(fare_regular) }),
      ...(fare_min !== undefined && { fare_min: Number(fare_min) }),
      ...(fare_max !== undefined && { fare_max: Number(fare_max) }),
      ...(student_eligible !== undefined && {
        student_eligible: Boolean(student_eligible),
      }),
      ...(student_discount_pct !== undefined && {
        student_discount_pct: Number(student_discount_pct),
      }),
      ...(student_fare_floor !== undefined && {
        student_fare_floor: Number(student_fare_floor),
      }),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Fare rule ${id} not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Fare policy rule updated successfully.`,
      fareRule: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
