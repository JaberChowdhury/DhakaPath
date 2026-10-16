import { Hub } from '@/types/network';
import { PlannedRoute } from '@/types/api';
import { getApprovedHubs, getActiveAlerts } from '@/lib/db/repository';

export type TransitIntentType =
  | 'plan_trip'
  | 'update_trip'
  | 'check_road_status'
  | 'report_disruption'
  | 'explain_fare'
  | 'explain_alert_reliability';

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
  rawText: string;
}

/**
 * Matches a query string to one of the 14 supported canonical transit hubs
 * using English, Bengali, and phonetic Banglish aliases.
 */
export function resolveHubFromQuery(query: string, hubs: Hub[]): Hub | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  for (const hub of hubs) {
    if (hub.name_en.toLowerCase().includes(normalized) || normalized.includes(hub.name_en.toLowerCase())) {
      return hub;
    }
    if (hub.name_bn.includes(normalized) || normalized.includes(hub.name_bn)) {
      return hub;
    }
    for (const alias of hub.aliases) {
      if (alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase())) {
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
  currentContext?: Partial<ExtractedTransitIntent> | null
): ExtractedTransitIntent {
  const hubs = getApprovedHubs();
  const lower = message.toLowerCase();

  // 1. Detect Domain Knowledge Intents
  if (
    lower.includes('fare') ||
    lower.includes('vara') ||
    lower.includes('bada') ||
    lower.includes('ভাড়া') ||
    lower.includes('discount') ||
    lower.includes('student pass') ||
    lower.includes('how much')
  ) {
    if (!lower.includes('theke') && !lower.includes('from') && !lower.includes('jabo')) {
      return {
        intentType: 'explain_fare',
        originHubId: currentContext?.originHubId || null,
        destinationHubId: currentContext?.destinationHubId || null,
        originName: currentContext?.originName || null,
        destinationName: currentContext?.destinationName || null,
        student: currentContext?.student || false,
        budgetBdt: currentContext?.budgetBdt || null,
        avoidHubIds: currentContext?.avoidHubIds || [],
        rawText: message,
      };
    }
  }

  if (
    lower.includes('reliable') ||
    lower.includes('reliability') ||
    lower.includes('shotti') ||
    lower.includes('sotti') ||
    lower.includes('verify') ||
    lower.includes('fake') ||
    lower.includes('accurate')
  ) {
    return {
      intentType: 'explain_alert_reliability',
      originHubId: currentContext?.originHubId || null,
      destinationHubId: currentContext?.destinationHubId || null,
      originName: currentContext?.originName || null,
      destinationName: currentContext?.destinationName || null,
      student: currentContext?.student || false,
      budgetBdt: currentContext?.budgetBdt || null,
      avoidHubIds: currentContext?.avoidHubIds || [],
      rawText: message,
    };
  }

  if (
    lower.includes('jam') ||
    lower.includes('traffic') ||
    lower.includes('pani') ||
    lower.includes('waterlog') ||
    lower.includes('rasta kemon') ||
    lower.includes('road condition') ||
    lower.includes('obostha') ||
    lower.includes('block')
  ) {
    if (!lower.includes('theke') && !lower.includes('jabo') && !lower.includes('from')) {
      // Find which hub is queried
      let queriedHubId: string | null = null;
      for (const h of hubs) {
        if (lower.includes(h.name_en.toLowerCase()) || message.includes(h.name_bn)) {
          queriedHubId = h.id;
          break;
        }
      }
      return {
        intentType: 'check_road_status',
        originHubId: currentContext?.originHubId || null,
        destinationHubId: currentContext?.destinationHubId || null,
        originName: currentContext?.originName || null,
        destinationName: currentContext?.destinationName || null,
        student: currentContext?.student || false,
        budgetBdt: currentContext?.budgetBdt || null,
        avoidHubIds: currentContext?.avoidHubIds || [],
        queriedHubId,
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
    lower.includes('student') ||
    lower.includes('ছাত্র') ||
    lower.includes('ছাত্রী') ||
    lower.includes('porashona') ||
    lower.includes('varsity') ||
    lower.includes('university')
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
      'i'
    );
    if (avoidPattern.test(message) || lower.includes(`avoid ${hub.name_en.toLowerCase()}`)) {
      if (!avoidHubIds.includes(hub.id)) {
        avoidHubIds.push(hub.id);
      }
    }
  }

  // Detect Origin & Destination using 'theke' (from) and 'jabo' / 'to'
  const thekeMatch =
    message.match(/(?:from\s+)?(.+?)(?:\s+theke|\s+থেকে)\s+(.+?)(?:\s+jabo|\s+যাব|\s+to|\s+jaoya|\s+avoid|\s*$)/i) ||
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
    (student !== currentContext.student || budgetBdt !== currentContext.budgetBdt || avoidHubIds.length > (currentContext.avoidHubIds?.length || 0))
  );

  return {
    intentType: isUpdate ? 'update_trip' : 'plan_trip',
    originHubId: finalOriginHubId,
    destinationHubId: finalDestHubId,
    originName: finalOriginName,
    destinationName: finalDestName,
    student,
    budgetBdt,
    avoidHubIds,
    rawText: message,
  };
}

/**
 * Server-side AI entrypoint: extracts intent with AI or deterministic fallback.
 */
export async function extractTransitIntent(
  message: string,
  currentContext?: Partial<ExtractedTransitIntent> | null
): Promise<ExtractedTransitIntent> {
  const apiKey = process.env.LLM_API_KEY;
  const provider = process.env.LLM_PROVIDER || 'mock';

  if (apiKey && apiKey !== 'mock_key_for_local_testing' && provider === 'gemini') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a transit entity extractor for Dhaka, Bangladesh.
User query: "${message}". Current context: ${JSON.stringify(currentContext || {})}.
Extract intentType (plan_trip, update_trip, check_road_status, explain_fare, explain_alert_reliability), originQuery, destinationQuery, student (boolean), budgetBdt (number or null), avoidList (array of strings). Return strict JSON.`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          const hubs = getApprovedHubs();
          const originHub = parsed.originQuery ? resolveHubFromQuery(parsed.originQuery, hubs) : null;
          const destHub = parsed.destinationQuery ? resolveHubFromQuery(parsed.destinationQuery, hubs) : null;
          const avoidHubIds: string[] = [...(currentContext?.avoidHubIds || [])];

          if (Array.isArray(parsed.avoidList)) {
            parsed.avoidList.forEach((a: string) => {
              const h = resolveHubFromQuery(a, hubs);
              if (h && !avoidHubIds.includes(h.id)) avoidHubIds.push(h.id);
            });
          }

          return {
            intentType: parsed.intentType || 'plan_trip',
            originHubId: originHub?.id || currentContext?.originHubId || null,
            destinationHubId: destHub?.id || currentContext?.destinationHubId || null,
            originName: originHub?.name_en || currentContext?.originName || null,
            destinationName: destHub?.name_en || currentContext?.destinationName || null,
            student: parsed.student !== undefined ? Boolean(parsed.student) : (currentContext?.student || false),
            budgetBdt: typeof parsed.budgetBdt === 'number' ? parsed.budgetBdt : (currentContext?.budgetBdt || null),
            avoidHubIds,
            rawText: message,
          };
        }
      }
    } catch {
      // Fallback to deterministic
    }
  }

  return extractIntentDeterministic(message, currentContext);
}

/**
 * Handles specialized transit queries (road status, fare policies, reliability).
 */
export function handleSpecializedQuery(intent: ExtractedTransitIntent): string {
  if (intent.intentType === 'explain_fare') {
    return `### 🎫 Official Dhaka Transit Fare Structure\n\n` +
      `- **City Buses:** Statutory 50% Student Concession applies with a 10 BDT statutory floor:\n` +
      `  $$\\text{student\\_fare} = \\max(10, \\lceil \\text{regular} \\times 0.5 \\rceil)$$\n` +
      `  *Example:* A 25 BDT regular fare costs 13 BDT for students. A 15 BDT fare is floored at 10 BDT.\n` +
      `- **Metro Rail (MRT Line 6):** Official DMTCL distance-based fare chart (20 BDT to 100 BDT). Rapid Pass holders receive a 10% discount. No student concession per DMTCL policy.\n` +
      `- **Legunas (Human Hauler):** Fixed flat/staged tariff (15 BDT to 25 BDT). Cash only; no student discount.\n` +
      `- **Feeder Rickshaws:** Estimated range between 30 BDT and 60 BDT depending on weather and late-night surge bargaining.`;
  }

  if (intent.intentType === 'explain_alert_reliability') {
    return `### 🛡️ How DhakaPath Verifies Disruption Reports\n\n` +
      `1. **Dual State Machine:** Reports enter as \`pending\` (unverified crowd warning) before administrative review marks them \`approved\`.\n` +
      `2. **Automatic 30-Minute Decay:** Uncorroborated crowd alerts expire after 30 minutes from observation time. Expired means *"too stale to rely on"*, not *"the road is clear"*.\n` +
      `3. **Deduplication:** Multiple alerts for the same bottleneck take the maximum delay (e.g. +25 min) rather than compounding artificially.\n` +
      `4. **Zero Rerouting on Rumors:** Only administrative verified closures can take segments off the routing graph.`;
  }

  if (intent.intentType === 'check_road_status') {
    const alerts = getActiveAlerts();
    const hubs = getApprovedHubs();
    const targetHub = intent.queriedHubId ? hubs.find((h) => h.id === intent.queriedHubId) : null;

    if (alerts.length === 0) {
      return `🟢 All pilot corridors are currently reporting normal operating conditions. No active disruption alerts are on file.`;
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

  return '';
}

/**
 * Formulates a grounded, conversational Bengali & English explanation of the calculated route.
 */
export function formatRouteExplanation(
  intent: ExtractedTransitIntent,
  route: PlannedRoute | null,
  noRouteMessage?: string
): string {
  if (!route) {
    return noRouteMessage || 'দুঃখিত, আপনার প্রদত্ত গন্তব্যে কোনো সরাসরি পথ খুঁজে পাওয়া যায়নি।';
  }

  const { totalDurationMin, fareRegularBdt, fareStudentBdt, transfers, legs, warnings } = route;
  const fareToMention = intent.student ? `${fareStudentBdt} BDT (Student Pass Applied)` : `${fareRegularBdt} BDT`;

  let explanation = `I found a recommended route from **${intent.originName || 'Origin'}** to **${intent.destinationName || 'Destination'}**.\n\n`;
  explanation += `⏱ **Total Travel Time:** ~${totalDurationMin} mins | 💰 **Fare:** ${fareToMention} | 🔄 **Transfers:** ${transfers}\n\n`;

  explanation += `**Step-by-Step Instructions:**\n`;
  legs.forEach((leg, idx) => {
    const modeEmoji = leg.mode === 'metro' ? '🚇' : leg.mode === 'bus' ? '🚌' : leg.mode === 'leguna' ? '🚐' : leg.mode === 'rickshaw' ? '🛺' : '🚶';
    explanation += `${idx + 1}. ${modeEmoji} **${leg.serviceName}** (${leg.fromStopName} ➔ ${leg.toStopName}) — ${leg.durationMin} mins, ${leg.fareRegular} BDT\n`;
    if (leg.boardingLandmark) {
      explanation += `   📍 *Boarding Landmark:* ${leg.boardingLandmark}\n`;
    }
  });

  if (warnings.length > 0) {
    explanation += `\n⚠️ **Advisories:** ${warnings.join(' ')}`;
  }

  return explanation;
}
