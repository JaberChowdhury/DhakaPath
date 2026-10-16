import { NextResponse } from "next/server";
import {
  runGeminiVisionOcr,
  runHeuristicOcr,
  validateAgainstTransitDatabase,
  PRESET_BENCHMARK_SAMPLES,
} from "@/lib/ai/visionOcr";
import { OcrExtractedData } from "@/types/digitizer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, sampleKey, textSnippet } = body;

    let extractedData: OcrExtractedData | null = null;
    let extractionMethod:
      "gemini_vision" | "benchmark_sample" | "heuristic_ocr" = "heuristic_ocr";

    // 1. If user selected a preset benchmark notice sample
    if (sampleKey && PRESET_BENCHMARK_SAMPLES[sampleKey]) {
      extractedData = PRESET_BENCHMARK_SAMPLES[sampleKey].extractedData;
      extractionMethod = "benchmark_sample";
    }
    // 2. If user uploaded an image photo, attempt real Vision AI extraction
    else if (imageBase64) {
      extractedData = await runGeminiVisionOcr(
        imageBase64,
        mimeType || "image/jpeg",
      );
      if (extractedData) {
        extractionMethod = "gemini_vision";
      } else {
        // Fallback heuristic if Vision model is on cooldown or quota limited
        extractedData = runHeuristicOcr(
          textSnippet || "Physical transit signboard photo",
        );
        extractionMethod = "heuristic_ocr";
      }
    }
    // 3. Fallback heuristic on text snippet
    else {
      extractedData = runHeuristicOcr(
        textSnippet || "Physical transit notice board",
      );
      extractionMethod = "heuristic_ocr";
    }

    // 4. Validate extracted metadata against official Transit Database (hubs, stops, BRTA schedule)
    const dbMatch = validateAgainstTransitDatabase(extractedData);

    return NextResponse.json({
      success: true,
      extractedData,
      dbMatch,
      extractionMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
