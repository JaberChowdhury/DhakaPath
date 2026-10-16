// DhakaPath AI Multi-Key Pool & Adaptive Switching Algorithm
// Connects all Google AI Studio Gemini API keys with circuit breaking, rate-limit cooldown, and auto-failover

export interface KeyPoolItem {
  id: number;
  key: string;
  maskedKey: string;
  status: "healthy" | "cooldown" | "exhausted";
  totalRequests: number;
  totalSuccesses: number;
  consecutiveErrors: number;
  cooldownUntil: number;
  lastUsedAt: number | null;
  lastStatusCode: number | null;
  lastErrorMessage: string | null;
}

// Keys dynamically populated from environment variables
const ENV_POOL_KEYS = (
  process.env.LLM_API_KEYS ||
  process.env.LLM_API_KEY ||
  ""
)
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const RAW_KEYS =
  ENV_POOL_KEYS.length >= 2
    ? ENV_POOL_KEYS
    : ENV_POOL_KEYS.length === 1
      ? [
          ENV_POOL_KEYS[0],
          `${ENV_POOL_KEYS[0]}_fallback_1`,
          `${ENV_POOL_KEYS[0]}_fallback_2`,
        ]
      : ["dummy_key_primary", "dummy_key_fallback_1", "dummy_key_fallback_2"];

function maskKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 11)}...${key.slice(-6)}`;
}

// Global in-memory singleton pool across requests
const pool: KeyPoolItem[] = RAW_KEYS.map((key, index) => ({
  id: index + 1,
  key,
  maskedKey: maskKey(key),
  status: "healthy",
  totalRequests: 0,
  totalSuccesses: 0,
  consecutiveErrors: 0,
  cooldownUntil: 0,
  lastUsedAt: null,
  lastStatusCode: null,
  lastErrorMessage: null,
}));

export const MODEL_NAME = process.env.LLM_MODEL || "gemini-3.5-flash";

/**
 * Returns current snapshot of all keys and their health status for Admin Telemetry
 */
export function getKeyPoolSnapshot(): KeyPoolItem[] {
  const now = Date.now();
  // Refresh cooldown status
  pool.forEach((item) => {
    if (item.status === "cooldown" && now >= item.cooldownUntil) {
      item.status = "healthy";
      item.consecutiveErrors = 0;
      item.lastErrorMessage = null;
    }
  });

  return pool.map((item) => ({ ...item }));
}

/**
 * Selects the optimal healthy key using round-robin and error-weighted load balancing
 */
export function selectNextAvailableKey(): KeyPoolItem | null {
  const now = Date.now();

  // 1. Check if any cooling keys have matured out of cooldown
  pool.forEach((item) => {
    if (item.status === "cooldown" && now >= item.cooldownUntil) {
      item.status = "healthy";
      item.consecutiveErrors = 0;
      item.lastErrorMessage = null;
    }
  });

  // 2. Filter available healthy keys
  const healthyKeys = pool.filter((item) => item.status === "healthy");

  if (healthyKeys.length > 0) {
    // Sort by fewest consecutive errors, then by least total requests
    healthyKeys.sort((a, b) => {
      if (a.consecutiveErrors !== b.consecutiveErrors) {
        return a.consecutiveErrors - b.consecutiveErrors;
      }
      return a.totalRequests - b.totalRequests;
    });
    return healthyKeys[0];
  }

  // 3. Fallback: If all are in cooldown, pick the one with earliest cooldown expiry
  const coolingKeys = [...pool].sort(
    (a, b) => a.cooldownUntil - b.cooldownUntil,
  );
  return coolingKeys[0] || null;
}

/**
 * Records successful API execution for a key
 */
export function recordKeySuccess(id: number): void {
  const item = pool.find((k) => k.id === id);
  if (item) {
    item.totalRequests += 1;
    item.totalSuccesses += 1;
    item.consecutiveErrors = 0;
    item.status = "healthy";
    item.lastUsedAt = Date.now();
    item.lastStatusCode = 200;
    item.lastErrorMessage = null;
  }
}

/**
 * Marks a key as rate-limited or quota-exhausted and applies automatic circuit breaker cooldown
 */
export function recordKeyLimitReached(
  id: number,
  statusCode: number,
  errorMsg: string,
): void {
  const item = pool.find((k) => k.id === id);
  if (!item) return;

  item.totalRequests += 1;
  item.consecutiveErrors += 1;
  item.lastUsedAt = Date.now();
  item.lastStatusCode = statusCode;
  item.lastErrorMessage = errorMsg;

  // Rate-limiting / Temporary spike (429 or 503): 45s cooldown
  // Quota exhausted / Permission denied (403 or 404): 10 min cooldown
  const cooldownDurationMs =
    statusCode === 429 || statusCode === 503
      ? 45 * 1000 // 45 seconds
      : 10 * 60 * 1000; // 10 minutes

  item.cooldownUntil = Date.now() + cooldownDurationMs;
  item.status = "cooldown";

  console.warn(
    `[AI Key Pool] Key #${item.id} (${item.maskedKey}) reached limit (HTTP ${statusCode}). Cooldown applied for ${cooldownDurationMs / 1000}s. Switching to next key.`,
  );
}

/**
 * Executes a Gemini request with automatic fallback switching across the full API pool
 */
export async function executeGeminiWithAutoSwitch(
  userMessage: string,
  currentContext: any,
): Promise<any | null> {
  const maxAttempts = pool.length;
  const attemptedKeyIds = new Set<number>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Select an unattempted key
    const candidate =
      pool.find((k) => !attemptedKeyIds.has(k.id) && k.status === "healthy") ||
      pool.find((k) => !attemptedKeyIds.has(k.id));

    if (!candidate) break;
    attemptedKeyIds.add(candidate.id);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${candidate.key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are the DhakaPath AI transit assistant for Dhaka, Bangladesh.
User query: "${userMessage}". Current context: ${JSON.stringify(currentContext || {})}.

CRITICAL LANGUAGE INSTRUCTION:
You MUST determine the language of the user query and reply in the EXACT SAME LANGUAGE:
1. "banglish": Bengali written phonetically using English/Latin alphabet (e.g. "shahbagh theke badda jabo koto lagbe", "vara koto", "jam ache kina", "rasta kemon", "student pass ache", "bade", "chara", "kivabe jabo").
   -> If the user writes in Banglish, your reply MUST be in natural, friendly Banglish!
2. "bangla": Bengali written in Bengali script (e.g. "ফার্মগেট থেকে মতিঝিল যাব", "ভাড়া কত?", "রাস্তা কেমন?").
   -> If the user writes in Bangla, your reply MUST be in polite, natural Bengali script (বাংলা)!
3. "english": Standard English (e.g. "How to get from Shahbagh to Badda", "What is the bus fare?").
   -> If the user writes in English, your reply MUST be in clear, helpful English!

Extract:
- intentType: "plan_trip" | "update_trip" | "check_road_status" | "explain_fare" | "explain_alert_reliability" | "explain_rideshare_split" | "general_chat"
- originQuery: string or null
- destinationQuery: string or null
- student: boolean (true if student, varsity, college mentioned)
- budgetBdt: number or null
- avoidList: array of hub names to avoid
- language: "banglish" | "bangla" | "english"
- conversationalReply: string (conversational reply in the EXACT matching language)

Return strict JSON.`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          recordKeySuccess(candidate.id);
          return JSON.parse(text);
        }
      }

      // Handle non-200 responses (e.g. 429 Rate Limit, 403 Quota, 503 Overload)
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      recordKeyLimitReached(candidate.id, response.status, errorMsg);

      // Continue loop immediately with next key!
    } catch (networkErr: any) {
      recordKeyLimitReached(
        candidate.id,
        500,
        networkErr.message || "Network exception",
      );
      // Continue loop with next key!
    }
  }

  // All keys failed or unreachable; return null to trigger deterministic fallback
  return null;
}
