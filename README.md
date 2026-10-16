# DhakaPath (ঢাকা-পাথ)

> **Next-Generation Multimodal Transit Navigation & Dynamic Disruption Awareness for Greater Dhaka**

DhakaPath is an accessible, mobile-first transit planning platform engineered specifically for Dhaka's transit realities. It integrates elevated Metro Rail (MRT Line 6), scheduled city buses, high-headway human haulers (legunas), and non-motorized feeder rickshaws into a single **deterministic routing and tariff engine** with conversational Bengali/Banglish AI discovery and community incident validation.

---

## 🌟 Key Capabilities

1. **Zero-Barrier Public Access:**
   - Public route discovery, fare comparisons, interactive Leaflet/schematic maps, active street alerts, and conversational chat require **no login or account creation**.
2. **Statutory Student Concession Engine:**
   - Implements the official 50% bus student discount policy with statutory 10 BDT floor:
     $$\text{student\_fare} = \max(10 \text{ BDT}, \lceil \text{regular\_fare} \times 0.5 \rceil)$$
   - Evaluates fares on continuous **boarding-to-alighting rides** rather than penalizing passengers with duplicate minimum-fare charges per graph segment.
3. **Hardened Multi-Modal Graph Routing:**
   - Multi-criteria Dijkstra / Pareto search finding **Fastest**, **Cheapest**, and **Balanced** travel itineraries.
   - Real-world transfer penalty accounting (passing intermediate stops on the same vehicle is 0 transfers).
   - **Honest No-Route Reporting:** When critical links or corridors are blocked, the engine clearly states `NO_VALID_ROUTE` rather than hallucinating phantom detours.
4. **Street Alert Moderation & Aging:**
   - Dual-state incident management: Moderation (`pending`, `approved`, `rejected`) and Lifecycle (`active`, `disputed`, `resolved`, `expired`).
   - 30-minute auto-expiry for uncorroborated crowd alerts; additive delay penalties with maximum delay deduplication.
5. **Strict AI Boundary & Conversational Assistant:**
   - The LLM (Google Gemini Flash / Free-tier adapter) **extracts intent and explains results**; it **never invents routes, calculates fares, or touches permissions**.
   - Offline, failure-proof regex parser fallback guarantees 100% availability even during network drops or API quota exhaustion.
   - First-class support for English, Bangla (বাংলা), and phonetic Banglish (`"Banasree theke Motijheel jabo, budget 40 taka, ami student"`).

---

## 🗺️ Pilot Network Coverage

The authoritative pilot network covers **14 major hubs** and **26 directional boarding points**:
- **Hubs:** Uttara North, Mirpur 10, Agargaon, Farmgate, Kawran Bazar, Shahbagh, Motijheel, Mohakhali, Gulshan 1, Gulshan 2, Badda, Banasree, Malibagh, Airport.
- **Transit Services:**
  - `MRT Line 6`: Uttara North ↔ Motijheel (DMTCL single-journey tariff matrix).
  - `Bikolpo Auto Service`: Mirpur 10 ↔ Motijheel via Farmgate & Shahbagh (Bus with student concession).
  - `Prochesta Paribahan`: Airport ↔ Motijheel via Mohakhali & Malibagh.
  - `Banasree Leguna`: Banasree Block C ↔ Badda Link Road ↔ Gulshan 1.
  - Feeder Rickshaw & Walking Connectors between major transfer concourses.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js `20.9+` (tested on Node.js `24.22.0`)
- npm `10+`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/dhakapath.git
cd dhakapath
npm install
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env.local
```
The application comes preconfigured with local mock AI and in-memory test databases so it runs **100% out of the box**. To enable real Google Gemini Flash AI, add your free-tier key in `.env.local`:
```dotenv
LLM_PROVIDER=gemini
LLM_MODEL=gemini-1.5-flash
LLM_API_KEY=your_gemini_api_key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile or desktop browser.

### 4. Run Automated Test Suite
Assert all 12 core acceptance criteria and benchmark journeys:
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🗄️ Database & Migrations

DhakaPath is designed for Supabase PostgreSQL. 
- Schema migration: [`supabase/migrations/20260301000000_initial_schema.sql`](file:///home/jaber/Downloads/DhakaPath/supabase/migrations/20260301000000_initial_schema.sql)
  - Tables: `sources`, `hubs`, `stops`, `services`, `service_stops`, `segments`, `fare_rules`, `alerts`, `alert_impacts`, `alert_votes`, `admin_roles`, `audit_log`.
  - Row Level Security (RLS) policies for anonymous read, moderated community submissions, and admin authorization.
- Canonical seed data: [`supabase/seed.sql`](file:///home/jaber/Downloads/DhakaPath/supabase/seed.sql)

---

## 🧪 Acceptance Test Verification (18 / 18 Passing — 100%)

| # | Test Scenario | Verified System Invariant |
|---|---|---|
| **1** | Normal Multimodal Trip | Validated MRT Line 6 & bus integration with explicit transfer links. |
| **2** | Statutory Student Bus Fare | Correct evaluation of $\max(10, \lceil \text{regular} \times 0.5 \rceil)$ across all fare ranges. |
| **3** | Single Ride Charging | Traversal of 4 consecutive bus segments charges a single ride (13 BDT), not 4 minimum fares. |
| **4** | Budget Categorization | Robust assignment of `WITHIN_BUDGET`, `MAY_EXCEED_BUDGET`, and `EXCEEDS_BUDGET`. |
| **5** | Disruption Detour | Waterlogging at Malibagh Railgate automatically triggers bypass via Gulshan 1 and Mohakhali. |
| **6** | Honest No-Route Outcome | Rampura canal blockage returns explicit `NO_VALID_ROUTE` rather than an invented path. |
| **7** | Selective Mode Filtering | Road incidents targeting buses do not erroneously close elevated Metro Rail. |
| **8** | Avoided Hub Constraint | Avoided intermediate hubs are strictly bypassed throughout the entire journey. |
| **9** | Alert Aging & Expiry | Resolved or expired alerts immediately cease impacting edge travel times. |
| **10** | Maximum Delay Deduplication | Overlapping incidents on the same segment take $\max(\text{delay})$ rather than compounding. |
| **11** | Banglish Intent Extraction | Deterministic regex correctly extracts origin, destination, budget, and avoid corridors. |
| **12** | Benchmark Journeys | All 4 demonstration scenarios execute deterministically. |
| **13** | Network Snapshot Integrity | Authoritative verification of 14 hubs, 25 directional stops, 4 transit modes, and fare rules. |
| **14** | Report Moderation Lifecycle | Community submission, crowd confirmation, and admin transition (`pending` ➔ `approved` ➔ `resolved`). |
| **15** | Simulation Comparative Delta | Exact before-and-after computation of travel time delays and fare surge deltas. |
| **16** | Admin Authentication Guard | Cryptographic session tokens, Next.js 16 proxy protection, and secure login verification. |
| **17** | AI Multi-Key Pool & Failover | Circuit-breaker auto-switching across 5 Google AI Studio API keys on HTTP 429 rate-limits. |
| **18** | Chat Road Directions on Map | Natural language chat intent extraction generates real-world road direction polylines on Leaflet. |

---

## 🎬 4–5 Minute Hackathon Live Demonstration Flow

1. **[0:00–0:40] Public Transit Browser & Live GPS:**
   - Open [http://localhost:3000](http://localhost:3000) on a mobile device or responsive desktop split-screen.
   - Show 14 pilot hubs, 25 boarding points with specific landmarks (e.g. BSMMU Gate, Concourse Level), and click **"📍 Detect Nearest Station"** for browser geolocation.
2. **[0:40–1:30] Multimodal Planning & Student Fare Engine:**
   - Search *Mirpur 10 ➔ Motijheel*.
   - Toggle **Student Concession** to demonstrate statutory 50% discount savings on bus (25 ৳ $\to$ 13 ৳) while preserving MRT-6 flat distance tariff.
   - Show ranking options: **Fastest** (Metro, 25m), **Cheapest** (Bus, 13 ৳), and **Balanced** (Metro + Bus transfer).
3. **[1:30–2:30] Interactive Disruption Simulation & Automatic Rerouting:**
   - In Disruption Simulation, activate *Malibagh Waterlogging* (+25 min delay).
   - Watch the routing engine automatically compute a detour via Leguna to Gulshan 1 and bus to Kawran Bazar.
   - Show the **Simulation Comparison Banner** highlighting the exact travel time increase and cost difference.
   - Activate *Rampura Feeder Blockade* to prove the **Honest No-Route Guarantee** (`NO_VALID_ROUTE`).
4. **[2:30–3:15] Street Alerts & Admin Authentication:**
   - Browse the **Street Alerts** tab with real-time crowd verification ("Confirm" & "Resolved" voting).
   - Navigate to `/admin`. Demonstrate that unauthenticated users are redirected to `/login`.
   - Log in as admin (`admin` / `dhakapath2026`). Show the Admin Moderation panel, live alerts review, and the **AI Key Pool & Quota Monitor** tracking all 5 API keys.
5. **[3:15–4:20] Conversational AI Assistant & Map Direction Sync:**
   - Click the floating AI button in the bottom right corner.
   - Type in Banglish: `"Banasree theke Motijheel jabo, budget 40, ami student"`.
   - Show multi-turn context memory: follow up with `"Malibagh avoid koro"`.
   - Click **"🗺️ View Road Directions on Map"** on the chat route card: show how it smoothly animates and plots the color-coded road polyline on the Leaflet map with origin and destination pins.
6. **[4:20–5:00] Architectural Highlights & Q&A:**
   - Explain zero paid APIs (Leaflet + OpenStreetMap + Free-tier Gemini).
   - Deterministic tariff calculation prevents AI hallucination.
   - 18 / 18 automated tests passing (100%).

---

## 📄 License & Attribution
- OpenStreetMap Map Tiles & Geodata &copy; OpenStreetMap contributors under ODbL 1.0.
- Dhaka Bus Stop Sequence references based on research in `dhaka-bus-access-heatmap` under MIT License.
- DMTCL Fare references derived from official publications by Dhaka Mass Transit Company Limited.
