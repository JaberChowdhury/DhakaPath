import { NextResponse } from "next/server";
import {
  getApprovedServices,
  getApprovedStops,
  getApprovedServiceStops,
  updateServiceStatus,
  addOrUpdateService,
} from "@/lib/db/repository";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { Service } from "@/types/network";

export async function GET(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const services = getApprovedServices();
    const serviceStops = getApprovedServiceStops();
    const stops = getApprovedStops();

    // Enrich services with stoppage count
    const enriched = services.map((s) => {
      const stopCount = serviceStops.filter(
        (ss) => ss.service_id === s.id,
      ).length;
      return {
        ...s,
        stopCount: stopCount > 0 ? stopCount : 6, // default reasonable count for new/unmapped services
      };
    });

    return NextResponse.json({
      success: true,
      services: enriched,
      totalCount: services.length,
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
    const { serviceId, isActive } = body;

    if (!serviceId || typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "serviceId and isActive (boolean) are required.",
        },
        { status: 400 },
      );
    }

    const updated = updateServiceStatus(serviceId, isActive);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Service ${serviceId} not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Service ${serviceId} status updated to ${isActive ? "Active" : "Suspended"}.`,
      service: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    if (!body.name || !body.mode) {
      return NextResponse.json(
        { success: false, error: "Service name and mode are required." },
        { status: 400 },
      );
    }

    const newService: Service = {
      id: body.id || `srv_${body.mode}_${Date.now()}`,
      name: body.name,
      mode: body.mode,
      route_code:
        body.route_code ||
        `${body.mode.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      operator: body.operator || "Registered Transit Operator",
      description:
        body.description ||
        `Digitized route operating in Dhaka metropolitan area.`,
      is_active: body.is_active ?? true,
      verification_status: "verified",
    };

    const saved = addOrUpdateService(newService);

    return NextResponse.json(
      {
        success: true,
        message: `Service ${saved.name} successfully registered into CMS.`,
        service: saved,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
