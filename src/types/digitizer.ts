import { TransitMode } from "./network";

export interface OcrExtractedData {
  rawText: string;
  serviceName: string | null;
  mode: TransitMode;
  operator: string | null;
  origin: string | null;
  destination: string | null;
  viaStoppages: string[];
  fareRegular: number | null;
  fareStudent: number | null;
  boardingLandmark: string | null;
  confidence: "high" | "medium" | "low" | "unverified";
}

export interface OcrDatabaseMatch {
  originMatchedHub: {
    id: string;
    name_en: string;
    name_bn: string;
  } | null;
  destinationMatchedHub: {
    id: string;
    name_en: string;
    name_bn: string;
  } | null;
  matchedStopsCount: number;
  matchedExistingService: {
    id: string;
    name: string;
    route_code?: string;
  } | null;
  statutoryFareValidation: {
    estimatedKilometers: number | null;
    statutoryBrtaTariff: number | null; // calculated at 2.45 BDT/km
    isWithinReasonableBounds: boolean;
    auditNote: string;
  };
}

export interface OcrSubmission {
  id: string;
  receiptCode: string; // e.g. OCR-2026-4821
  imageUrl?: string;
  sampleKey?: string;
  imageName?: string;
  rawText: string;
  extractedData: OcrExtractedData;
  userCorrection?: Partial<OcrExtractedData>;
  userNotes?: string;
  dbMatch: OcrDatabaseMatch;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  adminNotes?: string | null;
}
