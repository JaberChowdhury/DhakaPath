import { NextResponse } from "next/server";
import { getOcrSubmissions, addOcrSubmission } from "@/lib/db/repository";
import { validateAgainstTransitDatabase } from "@/lib/ai/visionOcr";
import { OcrExtractedData } from "@/types/digitizer";

export async function GET() {
  try {
    const submissions = getOcrSubmissions();
    return NextResponse.json({
      success: true,
      submissions,
      totalCount: submissions.length,
      pendingCount: submissions.filter((s) => s.status === "pending").length,
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
    const body = await request.json();
    const {
      imageUrl,
      sampleKey,
      imageName,
      rawText,
      extractedData,
      userCorrection,
      userNotes,
    } = body;

    if (!extractedData) {
      return NextResponse.json(
        { success: false, error: "Extracted data is required for submission." },
        { status: 400 },
      );
    }

    // Merge user corrections onto extracted data
    const finalData: OcrExtractedData = {
      ...extractedData,
      ...(userCorrection || {}),
    };

    // Re-verify against database with commuter corrections applied
    const dbMatch = validateAgainstTransitDatabase(finalData);

    const submission = addOcrSubmission({
      imageUrl,
      sampleKey,
      imageName: imageName || "commuter_signboard_upload.jpg",
      rawText: rawText || finalData.rawText || "",
      extractedData: finalData,
      userCorrection,
      userNotes: userNotes || "",
      dbMatch,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Notice submitted for administrative verification and publication.",
        submission,
        receiptCode: submission.receiptCode,
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
