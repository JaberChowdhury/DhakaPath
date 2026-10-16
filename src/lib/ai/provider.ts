import { Hub } from "@/types/network";
import { PlannedRoute } from "@/types/api";
import { getApprovedHubs, getActiveAlerts } from "@/lib/db/repository";

export type TransitIntentType =
  | "plan_trip"
  | "update_trip"
  | "check_road_status"
  | "report_disruption"
  | "explain_fare"
  | "explain_alert_reliability"
  | "explain_rideshare_split"
  | "general_chat";

export type TransitLanguage = "banglish" | "bangla" | "english";

export interface ExtractedTransitIntent {
  intentType: TransitIntentType;
  originHubId: string | null;
  destinationHubId: string | null;
  originName: string | null;
  destinationName: string | null;
  student: boolean;
  budgetBdt: number | null;
  avoidHubIds: string[];
  queriedHubId?: string | null;
  language?: TransitLanguage;
  conversationalReply?: string | null;
  rawText: string;
}

/**
 * Detects whether a commuter query is written in Bengali script (Bangla),
 * phonetic Latin script (Banglish), or standard English.
 */
export function detectLanguage(text: string): TransitLanguage {
  if (!text) return "english";
  // 1. Bengali Unicode character block (\u0980 - \u09FF)
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bangla";
  }

  // 2. Banglish phonetic words, prepositions, numbers, or colloquial verbs
  const banglishRegex =
    /\b(theke|jabo|jawa|koto|lagbe|hobe|kemon|khuje|dao|bade|chara|korbo|ami|amar|apnar|tumi|tomar|apni|pani|rasta|obostha|obstha|ache|ase|bolo|shunte|parbo|jani|janan|bhai|bhaiya|vai|vaiya|dorkar|ashbo|ashi|thaki|thakbo|kothay|ki|kire|kemne|kivabe|gari|vara|bada|thik|bhalo|shob|dhaka|dibo|chai|bondho|bujhte|parsi|kortesi|korun|ekhon|akhon)\b/i;
  if (banglishRegex.test(text)) {
    return "banglish";
  }

  return "english";
}

/**
 * Matches a query string to one of the 14 supported canonical transit hubs
 * using English, Bengali, and phonetic Banglish aliases.
 */
export function resolveHubFromQuery(query: string, hubs: Hub[]): Hub | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  for (const hub of hubs) {
    if (
      hub.name_en.toLowerCase().includes(normalized) ||
      normalized.includes(hub.name_en.toLowerCase())
    ) {
      return hub;
    }
    if (hub.name_bn.includes(normalized) || normalized.includes(hub.name_bn)) {
      return hub;
    }
    for (const alias of hub.aliases) {
      if (
        alias.toLowerCase().includes(normalized) ||
        normalized.includes(alias.toLowerCase())
      ) {
        return hub;
      }
    }
  }
  return null;
}

/**
 * Deterministic intent extractor for Bangla, Banglish, and English queries.
 * Supports multi-turn contextual refinement and domain-specific transit intents.
 */
export function extractIntentDeterministic(
  message: string,
  currentContext?: Partial<ExtractedTransitIntent> | null,
): ExtractedTransitIntent {
  const hubs = getApprovedHubs();
  const lower = message.toLowerCase();
  const language = detectLanguage(message);

  // 0. Detect General Greetings & Conversational Queries (ChatGPT-style interaction)
  const isGreetingOrSmallTalk =
    /^(hi|hello|hey|assalam|salam|kemon|ki obstha|kire|tumi ke|apni ke|thanks|thank you|good morning|good evening)\b/i.test(
      lower.trim(),
    ) ||
    lower.includes("kemon") ||
    lower.includes("ki obstha") ||
    lower.includes("ki khobor") ||
    lower.includes("who are you") ||
    lower.includes("how are you") ||
    lower.includes("কেমন") ||
    lower.includes("ধন্যবাদ") ||
    lower.includes("তুমি কে") ||
    lower.includes("আপনি কে") ||
    lower.includes("হ্যালো") ||
    lower.includes("হাই") ||
    lower.includes("সালাম") ||
    lower.includes("কি অবস্থা");

  if (
    isGreetingOrSmallTalk &&
    !lower.includes("theke") &&
    !lower.includes("from") &&
    !lower.includes("jabo") &&
    !lower.includes("থেকে") &&
    !lower.includes("যাব")
  ) {
    let reply = "";
    if (language === "banglish") {
      if (
        lower.includes("kemon") ||
        lower.includes("how are you") ||
        lower.includes("ki obstha") ||
        lower.includes("ki khobor")
      ) {
        reply =
          "Ami bhalo achi! Ami DhakaPath Transit AI Assistant. Dhaka shohore shohoje cholochan korar jonno ami apnake Metro Rail, Bus, Leguna ebong Rickshaw-r shera route, shothik vara, ebong live traffic obostha janate pari. Apni ekhon kothay theke kothay jete chan?";
      } else if (lower.includes("ke") || lower.includes("who")) {
        reply =
          "Ami DhakaPath-er AI Assistant. Ami apnar Dhaka transit guide hishabe kaj kori. Apnar shomoy o taka bachate shera multimodal route, student discount, ebong rasta bondho kina ta realtime-e janate pari. Bolun kothay jaben?";
      } else if (lower.includes("thank") || lower.includes("dhonnobad")) {
        reply =
          "Apnakeo onek dhonnobad! Apnar jatra shuvo o nirapod hok. Kono route ba transit-er proyojon hole oboshoy janaben.";
      } else {
        reply =
          "Assalamu Alaikum! Ami DhakaPath Transit AI Assistant. Apnar jatra shohoj korte ami prostut. Kothay theke kothay jete chan janan (jemon: 'Banasree theke Motijheel jabo', 'Shahbagh theke Badda student').";
      }
    } else if (language === "bangla") {
      if (
        lower.includes("কেমন") ||
        lower.includes("কি অবস্থা") ||
        lower.includes("খবর")
      ) {
        reply =
          "আমি ভালো আছি! আমি ঢাকা-পাথ ট্রানজিট এআই সহকারী। ঢাকা শহরে নির্বিঘ্নে চলাচলের জন্য আমি আপনাকে মেট্রোরেল, বাস, লেগুনা ও রিকশার সেরা যাত্রাপথ, সরকারি ভাড়ার হিসাব এবং লাইভ ট্রাফিক অবস্থা জানাতে পারি। আপনি কোথা থেকে কোথায় যেতে চান তা বলুন!";
      } else if (lower.includes("কে") || lower.includes("পরিচয়")) {
        reply =
          "আমি ঢাকা-পাথ এর এআই ট্রানজিট অ্যাসিস্ট্যান্ট। আমি আপনার যাতায়াত সহজ ও সুলভ করতে সঠিক যাত্রাপথ, শিক্ষার্থী হাফ ভাড়া এবং সড়কের নির্ভরযোগ্য সতর্কবার্তা জানাতে সহায়তা করি। আপনি কোন রুটে যেতে চান?";
      } else if (lower.includes("ধন্যবাদ")) {
        reply =
          "আপনাকেও অনেক ধন্যবাদ! আপনার যাত্রা নিরাপদ ও আনন্দময় হোক। আর কোনো রুট বা তথ্যের প্রয়োজন হলে নির্দ্বিধায় জানান।";
      } else {
        reply =
          "আসসালামু আলাইকুম! আমি ঢাকা-পাথ ট্রানজিট এআই সহকারী। আপনার যাতায়াত সহজ করতে আমি প্রস্তুত। দয়া করে কোথা থেকে কোথায় যেতে চান তা বলুন (যেমন: 'ফার্মগেট থেকে মতিঝিল যাব', 'বনশ্রী থেকে বাড্ডা')।";
      }
    } else {
      if (lower.includes("how are you") || lower.includes("how r u")) {
        reply =
          "I'm doing well, thank you! I am DhakaPath Transit AI. I'm here to help you navigate Dhaka efficiently with real-time transit directions across Metro Rail, buses, legunas, and rickshaws, along with verified fares and road alert updates. Where would you like to travel today?";
      } else if (
        lower.includes("who are you") ||
        lower.includes("what is your name")
      ) {
        reply =
          "I am DhakaPath's AI transit assistant. I help commuters find optimal multimodal routes, verify statutory fares, and avoid traffic bottlenecks in Dhaka. How can I help you today?";
      } else if (lower.includes("thank")) {
        reply =
          "You're very welcome! Have a safe and pleasant journey. Feel free to ask anytime you need travel guidance in Dhaka.";
      } else {
        reply =
          "Hello! Welcome to DhakaPath Transit AI. Where would you like to travel in Dhaka today? (e.g. 'Mirpur 10 to Motijheel', 'Farmgate to Airport').";
      }
    }

    return {
      intentType: "general_chat",
      originHubId: currentContext?.originHubId || null,
      destinationHubId: currentContext?.destinationHubId || null,
      originName: currentContext?.originName || null,
      destinationName: currentContext?.destinationName || null,
      student: currentContext?.student || false,
      budgetBdt: currentContext?.budgetBdt || null,
      avoidHubIds: currentContext?.avoidHubIds || [],
      language,
      conversationalReply: reply,
      rawText: message,
    };
  }

  // 1. Detect Domain Knowledge Intents
  if (
    lower.includes("fare") ||
    lower.includes("vara") ||
    lower.includes("bada") ||
    lower.includes("ভাড়া") ||
    lower.includes("discount") ||
    lower.includes("student pass") ||
    lower.includes("how much")
  ) {
    if (
      !lower.includes("theke") &&
      !lower.includes("from") &&
      !lower.includes("jabo")
    ) {
      return {
        intentType: "explain_fare",
        originHubId: currentContext?.originHubId || null,
        destinationHubId: currentContext?.destinationHubId || null,
        originName: currentContext?.originName || null,
        destinationName: currentContext?.destinationName || null,
        student: currentContext?.student || false,
        budgetBdt: currentContext?.budgetBdt || null,
        avoidHubIds: currentContext?.avoidHubIds || [],
        language,
        rawText: message,
      };
    }
  }

  if (
    lower.includes("reliable") ||
    lower.includes("reliability") ||
    lower.includes("shotti") ||
    lower.includes("sotti") ||
    lower.includes("verify") ||
    lower.includes("fake") ||
    lower.includes("accurate")
  ) {
    return {
      intentType: "explain_alert_reliability",
      originHubId: currentContext?.originHubId || null,
      destinationHubId: currentContext?.destinationHubId || null,
      originName: currentContext?.originName || null,
      destinationName: currentContext?.destinationName || null,
      student: currentContext?.student || false,
      budgetBdt: currentContext?.budgetBdt || null,
      avoidHubIds: currentContext?.avoidHubIds || [],
      language,
      rawText: message,
    };
  }

  // 1b. Detect Ride-share & Fare Split Bot Queries (Bonus Task 4)
  if (
    lower.includes("cng share") ||
    lower.includes("rickshaw share") ||
    lower.includes("ride share") ||
    lower.includes("rideshare") ||
    lower.includes("share bot") ||
    lower.includes("fare split") ||
    lower.includes("ভাগ করে")
  ) {
    return {
      intentType: "explain_rideshare_split",
      originHubId: currentContext?.originHubId || null,
      destinationHubId: currentContext?.destinationHubId || null,
      originName: currentContext?.originName || null,
      destinationName: currentContext?.destinationName || null,
      student: currentContext?.student || false,
      budgetBdt: currentContext?.budgetBdt || null,
      avoidHubIds: currentContext?.avoidHubIds || [],
      language,
      rawText: message,
    };
  }

  if (
    lower.includes("jam") ||
    lower.includes("traffic") ||
    lower.includes("pani") ||
    lower.includes("waterlog") ||
    lower.includes("rasta kemon") ||
    lower.includes("road condition") ||
    lower.includes("obostha") ||
    lower.includes("block")
  ) {
    if (
      !lower.includes("theke") &&
      !lower.includes("jabo") &&
      !lower.includes("from")
    ) {
      // Find which hub is queried
      let queriedHubId: string | null = null;
      for (const h of hubs) {
        if (
          lower.includes(h.name_en.toLowerCase()) ||
          message.includes(h.name_bn)
        ) {
          queriedHubId = h.id;
          break;
        }
      }
      return {
        intentType: "check_road_status",
        originHubId: currentContext?.originHubId || null,
        destinationHubId: currentContext?.destinationHubId || null,
        originName: currentContext?.originName || null,
        destinationName: currentContext?.destinationName || null,
        student: currentContext?.student || false,
        budgetBdt: currentContext?.budgetBdt || null,
        avoidHubIds: currentContext?.avoidHubIds || [],
        queriedHubId,
        language,
        rawText: message,
      };
    }
  }

  // 2. Extract Route Planning & Constraints
  let originHubId: string | null = null;
  let destHubId: string | null = null;
  let originName: string | null = null;
  let destName: string | null = null;
  let student: boolean = currentContext?.student || false;
  let budgetBdt: number | null = currentContext?.budgetBdt || null;
  const avoidHubIds: string[] = [...(currentContext?.avoidHubIds || [])];

  // Detect Student flag
  if (
    lower.includes("student") ||
    lower.includes("ছাত্র") ||
    lower.includes("ছাত্রী") ||
    lower.includes("porashona") ||
    lower.includes("varsity") ||
    lower.includes("university")
  ) {
    student = true;
  }

  // Detect Budget
  const budgetMatch =
    message.match(/(?:budget|বাজেট|taka|টাকা|tk)\s*[:=]?\s*(\d+)/i) ||
    message.match(/(\d+)\s*(?:taka|টাকা|tk|er moddhe|এর মধ্যে)/i);
  if (budgetMatch) {
    budgetBdt = parseInt(budgetMatch[1], 10);
  }

  // Detect Avoid corridors
  for (const hub of hubs) {
    const avoidPattern = new RegExp(
      `(?:avoid|ছাড়া|bad|বাদে)\\s+${hub.name_en}|${hub.name_en}\\s+(?:avoid\\s+koro|bad|chara|bade)`,
      "i",
    );
    if (
      avoidPattern.test(message) ||
      lower.includes(`avoid ${hub.name_en.toLowerCase()}`)
    ) {
      if (!avoidHubIds.includes(hub.id)) {
        avoidHubIds.push(hub.id);
      }
    }
  }

  // Detect Origin & Destination using 'theke' (from) and 'jabo' / 'to'
  const thekeMatch =
    message.match(
      /(?:from\s+)?(.+?)(?:\s+theke|\s+থেকে)\s+(.+?)(?:\s+jabo|\s+যাব|\s+to|\s+jaoya|\s+avoid|\s*$)/i,
    ) ||
    message.match(/from\s+(.+?)\s+to\s+(.+?)(?:\s+avoid|\s*$)/i) ||
    message.match(/(.+?)\s+to\s+(.+?)(?:\s+avoid|\s*$)/i);

  if (thekeMatch) {
    const rawOrigin = thekeMatch[1].trim();
    const rawDest = thekeMatch[2].trim();

    const matchedOrigin = resolveHubFromQuery(rawOrigin, hubs);
    const matchedDest = resolveHubFromQuery(rawDest, hubs);

    if (matchedOrigin && !avoidHubIds.includes(matchedOrigin.id)) {
      originHubId = matchedOrigin.id;
      originName = matchedOrigin.name_en;
    }
    if (matchedDest && !avoidHubIds.includes(matchedDest.id)) {
      destHubId = matchedDest.id;
      destName = matchedDest.name_en;
    }
  }

  // Fallback: Scan message for any mentioned hubs ordered by index
  if (!originHubId || !destHubId) {
    const foundHubs: { hub: Hub; index: number }[] = [];
    for (const hub of hubs) {
      if (avoidHubIds.includes(hub.id)) continue;
      const idx = lower.indexOf(hub.name_en.toLowerCase());
      if (idx !== -1) {
        foundHubs.push({ hub, index: idx });
      }
    }

    foundHubs.sort((a, b) => a.index - b.index);

    if (!originHubId && foundHubs.length > 0) {
      originHubId = foundHubs[0].hub.id;
      originName = foundHubs[0].hub.name_en;
    }
    if (!destHubId && foundHubs.length > 1) {
      destHubId = foundHubs[1].hub.id;
      destName = foundHubs[1].hub.name_en;
    }
  }

  // Multi-turn context fallback: preserve previous endpoints if only constraints changed
  const finalOriginHubId = originHubId || currentContext?.originHubId || null;
  const finalDestHubId = destHubId || currentContext?.destinationHubId || null;
  const finalOriginName = originName || currentContext?.originName || null;
  const finalDestName = destName || currentContext?.destinationName || null;

  const isUpdate = Boolean(
    currentContext?.originHubId &&
    (!originHubId || !destHubId) &&
    (student !== currentContext.student ||
      budgetBdt !== currentContext.budgetBdt ||
      avoidHubIds.length > (currentContext.avoidHubIds?.length || 0)),
  );

  return {
    intentType: isUpdate ? "update_trip" : "plan_trip",
    originHubId: finalOriginHubId,
    destinationHubId: finalDestHubId,
    originName: finalOriginName,
    destinationName: finalDestName,
    student,
    budgetBdt,
    avoidHubIds,
    language,
    rawText: message,
  };
}

import { executeGeminiWithAutoSwitch } from "./keyPool";

/**
 * Server-side AI entrypoint: extracts intent with Gemini LLM multi-key auto-switch or deterministic fallback.
 */
export async function extractTransitIntent(
  message: string,
  currentContext?: Partial<ExtractedTransitIntent> | null,
): Promise<ExtractedTransitIntent> {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const detectedLang = detectLanguage(message);

  if (provider === "gemini") {
    const parsed = await executeGeminiWithAutoSwitch(message, currentContext);
    if (parsed) {
      const hubs = getApprovedHubs();
      const originHub = parsed.originQuery
        ? resolveHubFromQuery(parsed.originQuery, hubs)
        : null;
      const destHub = parsed.destinationQuery
        ? resolveHubFromQuery(parsed.destinationQuery, hubs)
        : null;
      const avoidHubIds: string[] = [...(currentContext?.avoidHubIds || [])];

      if (Array.isArray(parsed.avoidList)) {
        parsed.avoidList.forEach((a: string) => {
          const h = resolveHubFromQuery(a, hubs);
          if (h && !avoidHubIds.includes(h.id)) avoidHubIds.push(h.id);
        });
      }

      const language: TransitLanguage =
        parsed.language === "bangla" ||
        parsed.language === "banglish" ||
        parsed.language === "english"
          ? parsed.language
          : detectedLang;

      return {
        intentType: parsed.intentType || "plan_trip",
        originHubId: originHub?.id || currentContext?.originHubId || null,
        destinationHubId:
          destHub?.id || currentContext?.destinationHubId || null,
        originName: originHub?.name_en || currentContext?.originName || null,
        destinationName:
          destHub?.name_en || currentContext?.destinationName || null,
        student:
          parsed.student !== undefined
            ? Boolean(parsed.student)
            : currentContext?.student || false,
        budgetBdt:
          typeof parsed.budgetBdt === "number"
            ? parsed.budgetBdt
            : currentContext?.budgetBdt || null,
        avoidHubIds,
        language,
        conversationalReply: parsed.conversationalReply || null,
        rawText: message,
      };
    }
  }

  return extractIntentDeterministic(message, currentContext);
}

/**
 * Handles specialized transit queries (road status, fare policies, reliability)
 * mirroring the commuter's detected language (Banglish, Bangla, or English).
 */
export function handleSpecializedQuery(intent: ExtractedTransitIntent): string {
  const lang = intent.language || "english";

  if (intent.intentType === "explain_fare") {
    if (lang === "banglish") {
      return (
        `### 🎫 Dhaka Transit Vara Structure\n\n` +
        `- **City Bus:** Student-der jonno statutory 50% concession proyojjo (Minimum 10 BDT floor):\n` +
        `  $$\\text{student\\_fare} = \\max(10, \\lceil \\text{regular} \\times 0.5 \\rceil)$$\n` +
        `  *Udahoron:* 25 BDT regular bus vara student-der jonno 13 BDT. 15 BDT regular vara floored hoye 10 BDT hobe.\n` +
        `- **Metro Rail (MRT Line 6):** DMTCL official distance-based fare chart (20 BDT theke 100 BDT). Rapid Pass use korle 10% discount paben. DMTCL policy onujayi kono student discount nei.\n` +
        `- **Leguna (Human Hauler):** Fixed flat/staged tariff (15 BDT theke 25 BDT). Cash-e vara dite hoy; student discount proyojjo noy.\n` +
        `- **Feeder Rickshaw:** Estimated range 30 BDT theke 60 BDT (weather ba rater traffic bargaining-e surge hote pare).`
      );
    }
    if (lang === "bangla") {
      return (
        `### 🎫 ঢাকা গণপরিবহন ভাড়ার কাঠামো\n\n` +
        `- **সিটি বাস:** শিক্ষার্থীদের জন্য সরকারি ৫০% হাফ ভাড়া প্রযোজ্য (সর্বনিম্ন ভাড়া ১০ টাকা):\n` +
        `  $$\\text{student\\_fare} = \\max(10, \\lceil \\text{regular} \\times 0.5 \\rceil)$$\n` +
        `  *উদাহরণ:* ২৫ টাকার নিয়মিত বাস ভাড়া শিক্ষার্থীদের জন্য ১৩ টাকা। ১৫ টাকার নিয়মিত ভাড়া সর্বনিম্ন ১০ টাকায় নির্ধারিত হবে।\n` +
        `- **মেট্রোরেল (এমআরটি লাইন ৬):** ডিএমটিসিএল অনুমোদিত দূরত্বভিত্তিক ভাড়া তালিকা (২০ টাকা থেকে ১০০ টাকা)। র‍্যাপিড পাস ব্যবহারকারীরা ১০% ছাড় পাবেন। তবে ডিএমটিসিএল নিয়ম অনুযায়ী কোনো শিক্ষার্থী ছাড় নেই।\n` +
        `- **লেগুনা:** নির্ধারিত ভাড়া (১৫ টাকা থেকে ২৫ টাকা)। শুধুমাত্র নগদ লেনদেন, কোনো হাফ ভাড়া প্রযোজ্য নয়।\n` +
        `- **ফিডার রিকশা:** আনুমানিক ৩০ টাকা থেকে ৬০ টাকা (আবহাওয়া ও রাতের ভিড়ের ওপর নির্ভর করে)।`
      );
    }
    return (
      `### 🎫 Official Dhaka Transit Fare Structure\n\n` +
      `- **City Buses:** Statutory 50% Student Concession applies with a 10 BDT statutory floor:\n` +
      `  $$\\text{student\\_fare} = \\max(10, \\lceil \\text{regular} \\times 0.5 \\rceil)$$\n` +
      `  *Example:* A 25 BDT regular fare costs 13 BDT for students. A 15 BDT fare is floored at 10 BDT.\n` +
      `- **Metro Rail (MRT Line 6):** Official DMTCL distance-based fare chart (20 BDT to 100 BDT). Rapid Pass holders receive a 10% discount. No student concession per DMTCL policy.\n` +
      `- **Legunas (Human Hauler):** Fixed flat/staged tariff (15 BDT to 25 BDT). Cash only; no student discount.\n` +
      `- **Feeder Rickshaws:** Estimated range between 30 BDT and 60 BDT depending on weather and late-night surge bargaining.`
    );
  }

  if (intent.intentType === "explain_alert_reliability") {
    if (lang === "banglish") {
      return (
        `### 🛡️ DhakaPath Alert Verification System\n\n` +
        `1. **Dual State Machine:** Shob crowd report shurute \`pending\` (unverified) hishabe thake, tarpor admin check kore \`approved\` kore.\n` +
        `2. **Automatic 30-Minute Decay:** Unverified crowd alert 30 minute por expire hoye jay. Expired mane *"stale ba purano"*, rasta puro khali erokom noy.\n` +
        `3. **Deduplication:** Ek-i bottleneck-e koyekta alert thakle maximum delay count hoy (+25 min), compound hoye double delay hoy na.\n` +
        `4. **Zero Rerouting on Rumors:** Shudhu admin verified road closure thaklei graph theke link baad deya hoy.`
      );
    }
    if (lang === "bangla") {
      return (
        `### 🛡️ ঢাকা-পাথ কীভাবে সড়ক সতর্কবার্তা যাচাই করে\n\n` +
        `১. **দ্বৈত যাচাই পদ্ধতি:** সকল নাগরিক সতর্কতা প্রথমে \`pending\` (অযাচাইকৃত) হিসেবে জমা হয়, এরপর প্রশাসনিক যাচাইয়ে \`approved\` হয়।\n` +
        `২. **৩০ মিনিটের মেয়াদোত্তীর্ণতা (Decay):** অযাচাইকৃত সতর্কতা ৩০ মিনিট পর স্বয়ংক্রিয়ভাবে বাতিল হয়ে যায়। এর অর্থ তথ্যটি পুরোনো, সড়ক ফাঁকা এমন নয়।\n` +
        `৩. **অনুলিপি একত্রীকরণ:** একই সড়কে একাধিক বিলম্বের সতর্কবার্তা থাকলে সর্বোচ্চ বিলম্বটি নেওয়া হয়, একাধিকবার যোগ করা হয় না।\n` +
        `৪. **গুজবে পথ পরিবর্তন নয়:** শুধুমাত্র প্রশাসকের নিশ্চিত করা সড়ক বন্ধের তথ্যের ওপর ভিত্তি করে বিকল্প পথ দেখানো হয়।`
      );
    }
    return (
      `### 🛡️ How DhakaPath Verifies Disruption Reports\n\n` +
      `1. **Dual State Machine:** Reports enter as \`pending\` (unverified crowd warning) before administrative review marks them \`approved\`.\n` +
      `2. **Automatic 30-Minute Decay:** Uncorroborated crowd alerts expire after 30 minutes from observation time. Expired means *"too stale to rely on"*, not *"the road is clear"*.\n` +
      `3. **Deduplication:** Multiple alerts for the same bottleneck take the maximum delay (e.g. +25 min) rather than compounding artificially.\n` +
      `4. **Zero Rerouting on Rumors:** Only administrative verified closures can take segments off the routing graph.`
    );
  }

  if (intent.intentType === "check_road_status") {
    const alerts = getActiveAlerts();
    const hubs = getApprovedHubs();
    const targetHub = intent.queriedHubId
      ? hubs.find((h) => h.id === intent.queriedHubId)
      : null;

    if (alerts.length === 0) {
      if (lang === "banglish") {
        return `🟢 Shob pilot transit corridor-e ekhon shavabik cholachol cholche. Kono active disruption ba jam alert nei.`;
      }
      if (lang === "bangla") {
        return `🟢 সকল প্রধান ট্রানজিট করিডোরে বর্তমানে যান চলাচল স্বাভাবিক রয়েছে। কোনো সক্রিয় প্রতিবন্ধকতা নেই।`;
      }
      return `🟢 All pilot corridors are currently reporting normal operating conditions. No active disruption alerts are on file.`;
    }

    if (lang === "banglish") {
      let report = `### 🚦 Ekhonkar Street Alert Overview\n\n`;
      alerts.forEach((a) => {
        report += `- **${a.title}** (${a.severity.toUpperCase()}): ${a.description} (Delay: +${a.delay_minutes} min, ${a.upvotes || 0} ti confirmation)\n`;
      });
      if (targetHub) {
        report += `\n*${targetHub.name_en} er ashpash-er elaka filter kora hoyeche.*`;
      }
      return report;
    }

    if (lang === "bangla") {
      let report = `### 🚦 বর্তমান সড়কের সতর্কবার্তা\n\n`;
      alerts.forEach((a) => {
        report += `- **${a.title}** (${a.severity.toUpperCase()}): ${a.description} (বিলম্ব: +${a.delay_minutes} মিনিট, নিশ্চিতকরণ: ${a.upvotes || 0} টি)\n`;
      });
      if (targetHub) {
        report += `\n*${targetHub.name_bn || targetHub.name_en} এলাকার জন্য ফিল্টার করা হয়েছে।*`;
      }
      return report;
    }

    let report = `### 🚦 Current Street Alerts Overview\n\n`;
    alerts.forEach((a) => {
      report += `- **${a.title}** (${a.severity.toUpperCase()}): ${a.description} (Delay: +${a.delay_minutes}m, ${a.upvotes || 0} confirmations)\n`;
    });

    if (targetHub) {
      report += `\n*Filtered specifically for area near ${targetHub.name_en}.*`;
    }

    return report;
  }

  if (intent.intentType === "explain_rideshare_split") {
    if (lang === "banglish") {
      return (
        `### 🛺 Shared Rickshaw & CNG Fare Splitter Bot (Bonus Feature)\n\n` +
        `- **CNG Auto-rickshaw (jemon: Gulshan 1 ➔ Mohakhali Amtoli):**\n` +
        `  Single-hire vara: ~180 BDT. 3–4 jon share korle = **45–60 BDT kore** (Solo ride-er cheye 75% porjonto bache!).\n` +
        `- **Feeder Rickshaw (jemon: Banasree Block C ➔ Rampura Bridge):**\n` +
        `  Single-hire vara: ~50 BDT. 2 jon share korle = **25 BDT kore**.\n\n` +
        `👉 Planner screen-er **"Shared Ride Board"** button tap kore active group-e join korun ba nijer shomoy post korun!`
      );
    }
    if (lang === "bangla") {
      return (
        `### 🛺 শেয়ার্ড রিকশা ও সিএনজি ভাড়া বিভাজন বট (বোনাস সুবিধা)\n\n` +
        `- **সিএনজি অটোরিকশা (যেমন: গুলশান ১ ➔ মহাখালী আমতলী):**\n` +
        `  একক ভাড়া: ~১৮০ টাকা। ৩–৪ জন ভাগ করে নিলে = **জনপ্রতি ৪৫–৬০ টাকা** (একা যাওয়ার চেয়ে ৭৫% পর্যন্ত সাশ্রয়!)।\n` +
        `- **ফিডার রিকশা (যেমন: বনশ্রী ব্লক সি ➔ রামপুরা ব্রিজ):**\n` +
        `  একক ভাড়া: ~৫০ টাকা। ২ জন ভাগ করে নিলে = **জনপ্রতি ২৫ টাকা**।\n\n` +
        `👉 প্ল্যানার স্ক্রিনের **"Shared Ride Board"** বাটনে ট্যাপ করে গ্রুপে যুক্ত হোন অথবা আপনার যাত্রার সময় পোস্ট করুন!`
      );
    }
    return (
      `### 🛺 Shared Rickshaw & CNG Fare Splitter Bot (Bonus Feature)\n\n` +
      `- **CNG Auto-rickshaw (e.g. Gulshan 1 ➔ Mohakhali Amtoli):**\n` +
      `  Typical single-hire tariff: ~180 BDT. Split between 3–4 commuters = **45–60 BDT each** (Save up to 75% vs riding solo!).\n` +
      `- **Feeder Rickshaw (e.g. Banasree Block C ➔ Rampura Bridge):**\n` +
      `  Typical single-hire tariff: ~50 BDT. Split between 2 commuters = **25 BDT each**.\n\n` +
      `👉 Tap the **"Shared Ride Board"** button on the planner screen to join an active group or post your own departure time!`
    );
  }

  return "";
}

/**
 * Formulates a grounded, conversational Banglish, Bengali, or English explanation of the calculated route.
 */
export function formatRouteExplanation(
  intent: ExtractedTransitIntent,
  route: PlannedRoute | null,
  noRouteMessage?: string,
): string {
  const lang = intent.language || "english";

  if (!route) {
    if (lang === "banglish") {
      return (
        noRouteMessage ||
        `Dukkhito, ${intent.originName || "origin"} theke ${intent.destinationName || "destination"} jaoar kono valid route khuje paoa jayni. Shob songjogshil link impassable ba excluded (Honest Routing Guarantee).`
      );
    }
    if (lang === "bangla") {
      return (
        noRouteMessage ||
        `দুঃখিত, ${intent.originName || "যাত্রা শুরুর স্থান"} থেকে ${intent.destinationName || "গন্তব্য"} যাওয়ার কোনো সরাসরি বা বৈধ সংযোগ পথ পাওয়া যায়নি (সৎ রাউটিং নিশ্চয়তা)।`
      );
    }
    return (
      noRouteMessage ||
      `Sorry, no valid route could be found connecting ${intent.originName || "Origin"} to ${intent.destinationName || "Destination"} (Honest Routing Guarantee).`
    );
  }

  const {
    totalDurationMin,
    fareRegularBdt,
    fareStudentBdt,
    transfers,
    legs,
    warnings,
  } = route;

  if (lang === "banglish") {
    const fareToMention = intent.student
      ? `${fareStudentBdt} BDT (Student Discount Shoho)`
      : `${fareRegularBdt} BDT`;

    let explanation = `Apnar jonno **${intent.originName || "Origin"}** theke **${intent.destinationName || "Destination"}** er shera route peyechi:\n\n`;
    explanation += `### 📋 Jatrar Sarshongkhep\n`;
    explanation += `- ⏱ **Mot shomoy:** ~${totalDurationMin} min\n`;
    explanation += `- 💰 **Vara:** ${fareToMention}\n`;
    explanation += `- 🔄 **Transfer:** ${transfers === 0 ? "Direct (kono transfer nei)" : `${transfers} ti`}\n\n`;
    explanation += `### 🗺️ Dhaper Nirdeshona\n`;
    legs.forEach((leg, idx) => {
      const modeEmoji =
        leg.mode === "metro"
          ? "🚇"
          : leg.mode === "bus"
            ? "🚌"
            : leg.mode === "leguna"
              ? "🚐"
              : leg.mode === "rickshaw"
                ? "🛺"
                : "🚶";
      const modeLabel =
        leg.mode === "walk" ? "Paye hete transfer" : leg.serviceName;
      explanation += `${idx + 1}. ${modeEmoji} **${modeLabel}** (${leg.fromStopName} ➔ ${leg.toStopName}) — ${leg.durationMin} min, ${leg.fareRegular} BDT\n`;
      if (leg.boardingLandmark) {
        explanation += `   📍 *Uthar sthan:* ${leg.boardingLandmark}\n`;
      }
    });

    if (warnings.length > 0) {
      explanation += `\n⚠️ **Sotorkota:** ${warnings.join(" ")}`;
    }
    return explanation;
  }

  if (lang === "bangla") {
    const fareToMention = intent.student
      ? `${fareStudentBdt} টাকা (শিক্ষার্থী ছাড় প্রযোজ্য)`
      : `${fareRegularBdt} টাকা`;

    let explanation = `আপনার জন্য **${intent.originName || "যাত্রা শুরুর স্থান"}** থেকে **${intent.destinationName || "গন্তব্য"}** যাওয়ার সেরা যাত্রাপথ পাওয়া গেছে:\n\n`;
    explanation += `### 📋 যাত্রার সারসংক্ষেপ\n`;
    explanation += `- ⏱ **মোট সময়:** ~${totalDurationMin} মিনিট\n`;
    explanation += `- 💰 **ভাড়া:** ${fareToMention}\n`;
    explanation += `- 🔄 **যানবদল:** ${transfers === 0 ? "সরাসরি (০ টি)" : `${transfers} টি`}\n\n`;
    explanation += `### 🗺️ ধাপে ধাপে নির্দেশনা\n`;
    legs.forEach((leg, idx) => {
      const modeEmoji =
        leg.mode === "metro"
          ? "🚇"
          : leg.mode === "bus"
            ? "🚌"
            : leg.mode === "leguna"
              ? "🚐"
              : leg.mode === "rickshaw"
                ? "🛺"
                : "🚶";
      const modeLabel = leg.mode === "walk" ? "হেঁটে যানবদল" : leg.serviceName;
      explanation += `${idx + 1}. ${modeEmoji} **${modeLabel}** (${leg.fromStopName} ➔ ${leg.toStopName}) — ${leg.durationMin} মিনিট, ${leg.fareRegular} টাকা\n`;
      if (leg.boardingLandmark) {
        explanation += `   📍 *ওঠার স্থান:* ${leg.boardingLandmark}\n`;
      }
    });

    if (warnings.length > 0) {
      explanation += `\n⚠️ **সতর্কতা:** ${warnings.join(" ")}`;
    }
    return explanation;
  }

  // English default
  const fareToMention = intent.student
    ? `${fareStudentBdt} BDT (Student Pass Applied)`
    : `${fareRegularBdt} BDT`;

  let explanation = `I found a recommended route from **${intent.originName || "Origin"}** to **${intent.destinationName || "Destination"}**:\n\n`;
  explanation += `### 📋 Journey Summary\n`;
  explanation += `- ⏱ **Total Travel Time:** ~${totalDurationMin} mins\n`;
  explanation += `- 💰 **Fare:** ${fareToMention}\n`;
  explanation += `- 🔄 **Transfers:** ${transfers === 0 ? "Direct (0 transfers)" : `${transfers} transfers`}\n\n`;

  explanation += `### 🗺️ Step-by-Step Instructions\n`;
  legs.forEach((leg, idx) => {
    const modeEmoji =
      leg.mode === "metro"
        ? "🚇"
        : leg.mode === "bus"
          ? "🚌"
          : leg.mode === "leguna"
            ? "🚐"
            : leg.mode === "rickshaw"
              ? "🛺"
              : "🚶";
    explanation += `${idx + 1}. ${modeEmoji} **${leg.serviceName}** (${leg.fromStopName} ➔ ${leg.toStopName}) — ${leg.durationMin} mins, ${leg.fareRegular} BDT\n`;
    if (leg.boardingLandmark) {
      explanation += `   📍 *Boarding Landmark:* ${leg.boardingLandmark}\n`;
    }
  });

  if (warnings.length > 0) {
    explanation += `\n⚠️ **Advisories:** ${warnings.join(" ")}`;
  }

  return explanation;
}
