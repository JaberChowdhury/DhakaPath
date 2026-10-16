import { NextResponse } from "next/server";
import {
  extractTransitIntent,
  formatRouteExplanation,
  handleSpecializedQuery,
} from "@/lib/ai/provider";
import { planTrip } from "@/lib/routing/planner";

export async function POST(request: Request) {
  try {
    const { message, currentContext } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "A message string is required." },
        { status: 400 },
      );
    }

    const intent = await extractTransitIntent(message, currentContext);

    // 0. Handle general conversational / ChatGPT smalltalk queries
    if (intent.intentType === "general_chat") {
      return NextResponse.json({
        success: true,
        extractedIntent: intent,
        explanation:
          intent.conversationalReply ||
          "Hello! I am DhakaPath Transit AI. How can I help with your journey today?",
        planResponse: null,
      });
    }

    // 1. Handle specialized knowledge queries (Fares, Disruption alerts, Reliability)
    if (
      intent.intentType === "explain_fare" ||
      intent.intentType === "explain_alert_reliability" ||
      intent.intentType === "check_road_status" ||
      intent.intentType === "explain_rideshare_split"
    ) {
      const explanation = handleSpecializedQuery(intent);
      return NextResponse.json({
        success: true,
        extractedIntent: intent,
        explanation,
        planResponse: null,
      });
    }

    // 2. Handle Trip Planning & Contextual Updates
    let planResponse = null;
    let explanation = "";

    if (intent.originHubId && intent.destinationHubId) {
      planResponse = planTrip({
        originHubId: intent.originHubId,
        destinationHubId: intent.destinationHubId,
        student: intent.student,
        budgetBdt: intent.budgetBdt,
        avoidHubIds: intent.avoidHubIds,
      });

      const topRoute =
        planResponse.routes.length > 0 ? planResponse.routes[0] : null;
      explanation = formatRouteExplanation(
        intent,
        topRoute,
        planResponse.message,
      );
    } else {
      if (intent.conversationalReply) {
        explanation = intent.conversationalReply;
      } else if (intent.language === "banglish") {
        explanation = `Apnar query bujhte perechi. Doyakore kothay theke kothay jaben janan (jemon: "Banasree theke Motijheel jabo", "Shahbagh theke Badda student", "Mirpur 10 to Motijheel").`;
      } else if (intent.language === "bangla") {
        explanation = `আপনার অনুরোধ বুঝতে পেরেছি। দয়া করে কোথা থেকে কোথায় যেতে চান তা জানান (যেমন: "ফার্মগেট থেকে মতিঝিল যাব", "বনশ্রী থেকে বাড্ডা", "উত্তরা থেকে শাহবাগ")।`;
      } else {
        explanation = `I understand your request. Please specify your origin and destination from our supported hubs (e.g. "Banasree theke Motijheel jabo", "Mirpur 10 to Shahbagh", "Farmgate to Airport").`;
      }
    }

    return NextResponse.json({
      success: true,
      extractedIntent: intent,
      planResponse,
      explanation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
