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

## 🧪 Acceptance Test Verification (12 / 12 Passing)

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

---

## 🎬 5-Minute Live Demonstration Flow

1. **[0:00–0:40] Public Mobile Experience:** Open [http://localhost:3000](http://localhost:3000) on a mobile device or responsive viewport. Inspect pilot hubs, boarding landmarks, and the Leaflet/Schematic map toggle.
2. **[0:40–1:35] Journey Planning & Student Fare:** Search *Mirpur 10 ➔ Shahbagh*. Toggle **Student Concession** to show the 50% discount savings (25 ৳ $\to$ 13 ৳). Set a 20 ৳ budget to show `Within Budget` verification.
3. **[1:35–2:25] Disruption Simulation & Rerouting:** In the Disruption Simulation dropdown, inject *Malibagh Waterlogging*. Re-plan *Banasree ➔ Kawran Bazar* to show the automatic detour via Leguna to Gulshan 1 and bus to Kawran Bazar (+18m delay notice).
4. **[2:25–3:25] Incident Reporting & Admin Moderation:** Click **Report Incident** in Street Alerts. Submit a new road issue. Open `/admin` to demonstrate administrative review, approval, and live status propagation.
5. **[3:25–4:20] Conversational AI Assistant:** Click **AI Assistant** and enter: `"Banasree theke Motijheel jabo, budget 40 taka, ami student"`. Watch intent extraction resolve hub IDs and render the grounded route card inside chat.
6. **[4:20–5:00] Architectural Q&A:** Explain shared routing engine architecture, deterministic tariff calculations, and RLS security boundaries.

---

## 📄 License & Attribution
- OpenStreetMap Map Tiles & Geodata &copy; OpenStreetMap contributors under ODbL 1.0.
- Dhaka Bus Stop Sequence references based on research in `dhaka-bus-access-heatmap` under MIT License.
- DMTCL Fare references derived from official publications by Dhaka Mass Transit Company Limited.
