import { NextResponse } from "next/server";
import {
  updateOcrSubmissionStatus,
  deleteOcrSubmission,
  getOcrSubmissions,
  addOrUpdateService,
} from "@/lib/db/repository";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { Service } from "@/types/network";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, editedData, publishToCms } = body;

    if (
      !status ||
      (status !== "approved" && status !== "rejected" && status !== "pending")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid status ('approved', 'rejected', 'pending') required.",
        },
        { status: 400 },
      );
    }

    const updated = updateOcrSubmissionStatus(
      id,
      status,
      adminNotes,
      session.email,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 },
      );
    }

    // If editedData passed, update the extracted data
    if (editedData) {
      updated.extractedData = { ...updated.extractedData, ...editedData };
    }

    // If approved and publishToCms requested, publish service into approved Transit CMS
    if (status === "approved" && publishToCms !== false) {
      const data = updated.extractedData;
      if (data.serviceName) {
        const newService: Service = {
          id: `srv_${data.mode}_${data.serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          name: data.serviceName,
          mode: data.mode,
          route_code: `${data.mode.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          operator: data.operator || "Verified Transit Syndicate",
          description: `Extracted via Physical Signboard OCR. Origin: ${data.origin || "Unknown"}, Destination: ${data.destination || "Unknown"}. Stoppages: ${data.viaStoppages?.join(", ") || "N/A"}.`,
          is_active: true,
          verification_status: "verified",
        };
        addOrUpdateService(newService);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Submission ${id} marked as ${status}.`,
      submission: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const deleted = deleteOcrSubmission(id);

    return NextResponse.json({
      success: deleted,
      message: `Submission ${id} purged.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
