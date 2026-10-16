# DhakaPath: Pilot Transit Network Coverage Specification

## 1. Pilot Philosophy: Verified Density Over Citywide Sprawl
Rather than attempting an unverified, error-prone import of all of Dhaka's hundreds of informal bus lines, DhakaPath defines an authoritative, verified multimodal pilot network covering **14 major transit hubs** and **26 directional boarding points**. 

This network models real-world connectivity between residential areas (Uttara, Mirpur, Banasree), employment/commercial districts (Mohakhali, Gulshan, Kawran Bazar, Farmgate), university corridors (Shahbagh), and the financial downtown (Motijheel).

---

## 2. Hub Registry (14 Major Hubs)

| Hub ID | Name (English) | Name (Bangla) | Aliases / Search Keywords | Center Lat, Lon | Description |
|---|---|---|---|---|---|
| `hub_uttara_north` | Uttara North | উত্তরা উত্তর | Diabari, Sector 12, Uttara 12, দিয়াবাড়ি | 23.8770, 90.3700 | Northern MRT Line 6 terminus, feeder connections to Tongi/Gazipur. |
| `hub_mirpur_10` | Mirpur 10 | মিরপুর ১০ | Mirpur Golchottor, Mirpur 10 roundabout | 23.8070, 90.3685 | Massive multimodal interchange: Metro Line 6, dozens of bus routes, leguna hub. |
| `hub_agargaon` | Agargaon | আগারগাঁও | Agargaon crossing, Passport Office, IDB | 23.7785, 90.3795 | Commercial/administrative hub, MRT Line 6 interchange with connecting feeders. |
| `hub_farmgate` | Farmgate | ফার্মগেট | Farmgate bridge, Ananda Cinema, Green Road | 23.7570, 90.3890 | Highest-volume central bus and pedestrian interchange; MRT Line 6 station. |
| `hub_kawran_bazar` | Kawran Bazar | কাওরান বাজার | Karwan Bazar, Panthapath mor, Sonargaon | 23.7515, 90.3935 | Wholesale and business center; MRT Line 6 station; key bus transit artery. |
| `hub_shahbagh` | Shahbagh | শাহবাগ | Shahbag, BSMMU, Dhaka University corner, PG | 23.7385, 90.3955 | Educational and hospital core (DU, BUET, BSMMU); MRT Line 6 station; major bus transfer. |
| `hub_motijheel` | Motijheel | মতিঝিল | Shapla Chottor, Dilkusha, Bangladesh Bank | 23.7330, 90.4175 | Historic financial district; southern terminus of operational MRT Line 6. |
| `hub_mohakhali` | Mohakhali | মহাখালী | Mohakhali Bus Terminal, Wireless, Amtoli | 23.7778, 90.4035 | Inter-district and city bus nexus, flyover junction, hospital and office district. |
| `hub_gulshan_1` | Gulshan 1 | গুলশান ১ | Gulshan 1 circle, DCC Market | 23.7780, 90.4170 | Commercial retail district, high rickshaw/leguna connectivity to Badda and Banasree. |
| `hub_gulshan_2` | Gulshan 2 | গুলশান ২ | Gulshan 2 circle, Embassy area | 23.7940, 90.4140 | Diplomatic and high-density corporate hub, Gulshan Chaka bus connection. |
| `hub_badda` | Badda | বাড্ডা | Middle Badda, Link Road, Rampura Bridge | 23.7800, 90.4260 | Eastern arterial link connecting Kuril/Progoti Sarani with Rampura corridor. |
| `hub_banasree` | Banasree | বনশ্রী | Rampura Banasree, Block C, Ideal School | 23.7650, 90.4350 | Dense eastern residential sector, heavily reliant on leguna, rickshaw, and bus feeders. |
| `hub_malibagh` | Malibagh | মালিবাগ | Malibagh Railgate, Malibagh Mor, Shantinagar | 23.7470, 90.4145 | Central junction linking eastern suburbs to central Dhaka; known congestion bottleneck. |
| `hub_airport` | Airport | বিমানবন্দর | Hazrat Shahjalal Airport, Airport Railway | 23.8510, 90.4075 | Major transit gateway on Dhaka-Mymensingh highway, northern railway link. |

---

## 3. Supported Multi-Modal Transit Services

### A. Mass Rapid Transit (MRT Line 6)
- **Service ID:** `srv_mrt_line_6`
- **Mode:** `metro`
- **Route:** Uttara North ↔ Mirpur 10 ↔ Agargaon ↔ Farmgate ↔ Kawran Bazar ↔ Shahbagh ↔ Motijheel
- **Schedule/Frequency:** Peak headway: 5–8 min, off-peak: 10–12 min.
- **Fare Structure:** DMTCL official distance-based fare chart (Min: 20 BDT, Max: 100 BDT within pilot corridor). Rapid Pass / MRT Pass eligible (10% discount profile supported in options).

### B. Bus Services (2 Dedicated Pilot Lines)
1. **Bikolpo Auto Service (`srv_bus_bikolpo`)**
   - **Mode:** `bus`
   - **Route Portions Supported:** Mirpur 10 ↔ Agargaon ↔ Farmgate ↔ Shahbagh ↔ Motijheel
   - **Characteristics:** Standard local city bus, student discount eligible (50% with 10 BDT floor), cash-based.
2. **Prochesta Paribahan (`srv_bus_prochesta`)**
   - **Mode:** `bus`
   - **Route Portions Supported:** Uttara / Airport ↔ Mohakhali ↔ Malibagh ↔ Motijheel
   - **Characteristics:** Eastern-central arterial route, frequent boarding, heavy congestion vulnerability.

### C. Informal Transit / Human Hauler (Leguna)
- **Service ID:** `srv_leguna_banasree_gulshan`
- **Mode:** `leguna`
- **Route:** Banasree (Block C) ↔ Rampura Bridge / Badda ↔ Gulshan 1
- **Characteristics:** 11–14 passenger modified pickups, fixed point-to-point fares (15–25 BDT), rapid headway (2–4 min), cash only, student discount not standard.

### D. Feeder Connectors (Rickshaw & Walking)
- **Pedestrian connectors (`walk`):** Explicit transfer links (e.g. Farmgate Metro Station Exit A to Farmgate Eastbound Bus Stoppage; 150m, 2–3 min, 0 BDT).
- **Rickshaw connectors (`rickshaw`):** Feeder corridors (e.g. Banasree interior to Rampura Bridge, Gulshan 1 to Mohakhali Wireless; baseline fare 30–60 BDT with surge multipliers for rain/night).

---

## 4. Benchmark Demonstration Journeys

DhakaPath's pilot dataset is guaranteed to evaluate the following four benchmark scenarios deterministically:

### 1. Normal Multimodal Journey (Uttara North → Motijheel)
- **Constraint:** Fastest commuter travel during morning peak.
- **Supported Solution:**
  - Option A (Direct Metro): Walk to Uttara North Metro Station → MRT Line 6 to Motijheel (32 mins, 100 BDT).
  - Option B (Bus Alternative): Walk to Airport Road → Prochesta Bus to Motijheel via Mohakhali (75 mins, 45 BDT).

### 2. Budget / Student Constrained Journey (Mirpur 10 → Shahbagh)
- **User Profile:** `student: true`, `budgetBdt: 20`.
- **Supported Solution:**
  - Regular Bus Fare: 25 BDT.
  - Student Bus Rule applied: $\max(10, 25 \times 0.5) = 13 \text{ BDT}$ (Rounds to 13 BDT, fits 20 BDT budget).
  - MRT Line 6 (Regular): 40 BDT (Exceeds 20 BDT budget; flagged as over-budget).
  - Output clearly highlights: **Bikolpo Bus with student pass applied for 13 BDT**.

### 3. Disruption Detour Journey (Banasree → Kawran Bazar via Malibagh)
- **Baseline Route:** Leguna / Rickshaw to Malibagh → Bus through Malibagh Mor to Kawran Bazar.
- **Incident Injected:** Waterlogging at Malibagh Railgate (`severity: high`, segment blocked for bus/rickshaw).
- **Detour Computed:** Engine avoids Malibagh segment, routes via Banasree → Leguna to Gulshan 1 → Rickshaw/Walk to Mohakhali → Bus to Kawran Bazar.
- **Explanation:** Informs commuter of +18 min detour due to active waterlogging at Malibagh Railgate.

### 4. Impossible Journey / Honest No-Route Evaluation
- **Scenario:** Origin: Banasree, Destination: Gulshan 1.
- **Incident Injected:** Rampura Bridge link completely impassable due to political rally or severe flooding; alternative link road closed.
- **Engine Behavior:** The planner returns `status: "NO_VALID_ROUTE"` with an explicit diagnostic message explaining that all connecting feeder segments are impassable, rather than hallucinating a phantom bridge or impossible detour.

---

## 5. Synthetic Disruption Fixtures (6 Controlled Cases)
1. `disrupt_malibagh_waterlogging`: Waterlogging near Malibagh Railgate (Affects `bus`, `rickshaw`, `leguna`).
2. `disrupt_farmgate_vip_movement`: Intermittent VIP traffic hold at Farmgate Intersection (+25 min road delay).
3. `disrupt_mrt_shewrapara_delay`: Temporary signaling hold on MRT Line 6 between Agargaon and Mirpur 10 (+15 min metro delay).
4. `disrupt_mohakhali_roadwork`: Flyover approach lane reduction at Mohakhali (+20 min bus delay).
5. `disrupt_rampura_blockade`: Complete feeder blockage at Rampura canal connection (Zero vehicle throughput).
6. `disrupt_shahbagh_protest`: Shahbagh intersection blockade (Forces bus rerouting around DU campus or metro-only passage).
