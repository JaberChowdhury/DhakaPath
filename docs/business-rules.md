# DhakaPath: Core Business, Fare & Disruption Rules Specification

## 1. Fare Calculation Engine Rules

### A. Bus Fare Calculation & Statutory Student Concession
1. **Ride-Level Pricing Invariant:**
   - Fares are assessed per continuous **boarding-to-alighting ride** on a single vehicle, **not per traversed graph segment**.
   - Traversal of multiple road segments on the same bus service constitutes a single ride.
2. **Statutory Student Discount:**
   - Eligible transport mode: `bus` (on approved public bus routes).
   - Discount percentage: 50%.
   - Minimum statutory floor: 10 BDT.
   - Formula:
     $$\text{student\_fare} = \max(10, \lceil \text{regular\_fare} \times 0.5 \rceil)$$
   - *Example:* A 25 BDT regular fare yields $\max(10, 12.5) \to 13 \text{ BDT}$.
   - *Example:* A 15 BDT regular fare yields $\max(10, 7.5) \to 10 \text{ BDT}$ (floor triggered).

### B. Mode-Specific Fare Policies
- **Metro Rail (MRT Line 6):**
  - DMTCL official station-to-station distance matrix.
  - Regular single journey ticket: 20 BDT minimum, up to 100 BDT within pilot extent.
  - Student discount: Not applicable (per DMTCL commercial policy).
  - MRT Pass / Rapid Pass profile: 10% discount on single journey tariff.
- **Leguna (Human Hauler):**
  - Staged flat-rate fare: 15 BDT (local link) to 25 BDT (full corridor). Cash only. No student discount.
- **Feeder Rickshaws (Non-Motorized & Battery):**
  - Quoted as an estimated range `[fare_min, fare_max]` (e.g. `[30, 45]` BDT).
  - Surge multipliers: Heavy Rain (+40%), Late Night (+25%).
- **Pedestrian Walk Links:**
  - 0 BDT.

---

## 2. Budget Adherence & Multi-Criteria Ranking

### A. Budget Classification
When a commuter specifies an upper financial threshold (`budgetBdt`):
- Compute total route lower and upper fare bounds:
  $$\text{Total}_{\min} = \sum_{\text{legs}} \text{leg}_{\min}, \quad \text{Total}_{\max} = \sum_{\text{legs}} \text{leg}_{\max}$$
- Categorization logic:
  - **`WITHIN_BUDGET`**: If $\text{Total}_{\max} \le \text{budgetBdt}$.
  - **`MAY_EXCEED_BUDGET`**: If $\text{Total}_{\min} \le \text{budgetBdt} < \text{Total}_{\max}$. (Rider warned that rickshaw bargaining or surge could breach limit).
  - **`EXCEEDS_BUDGET`**: If $\text{Total}_{\min} > \text{budgetBdt}$.
  - **`UNPRICED_COMPONENT`**: If any route leg lacks verifiable fare data, the app refuses to assert budget compliance.

### B. Transfer Definition
- A **transfer** is defined strictly as an inter-vehicle interchange.
- Boarding Vehicle 1 = Initial Boarding (0 transfers).
- Alighting Vehicle 1 and Boarding Vehicle 2 = 1 Transfer.
- Passing through intermediate stations on the same vehicle is NOT a transfer.

### C. Multi-Criteria Ranking Profiles
The engine computes Pareto-optimal solutions across three key dimensions:
1. **Best Overall (Balanced):** Optimal composite score minimizing duration while penalizing transfers ($\text{Score} = \text{duration\_min} + 12 \times \text{transfers}$).
2. **Cheapest / Student Budget:** Strictly sorted by lowest applicable fare ($\text{Total}_{\min}$ or student total).
3. **Fastest / Metro-Priority:** Strictly sorted by minimum total elapsed travel time, prioritizing grade-separated transit.

---

## 3. Disruption, Incident Moderation & Aging

### A. Lifecycle State Machine
```
[Submission: Guest / User]
            │
            ▼
    Status: pending ────────► [Admin Rejection] ──► Status: rejected
            │
            ▼ [Admin Verification / High Corroboration]
    Status: approved
            │
            ├─► Lifecycle: active (Affects routing weights / closures)
            ├─► Lifecycle: disputed (Downvoted by commuters; flagged for review)
            ├─► Lifecycle: resolved (Issue cleared by admin or crowd confirmation)
            └─► Lifecycle: expired (TTL elapsed without re-confirmation)
```

### B. Aging & Expiry Thresholds
- **Unverified Crowd Reports:** Time-to-Live (TTL) of **30 minutes** from `observed_at`. If unconfirmed by additional commuters or admins, state shifts automatically to `expired`.
- **Verified Administrative Alerts:** Remain active until explicit `expires_at` timestamp or manual administrative resolution.
- **Definition of Expired:** An expired alert signifies *"information is no longer fresh enough to reliably influence routing"*, NOT *"the road condition has returned to normal"*.

### C. Routing Impact Computation
- **Pending Alerts:** Rendered in UI search cards and map overlays as *"Unverified Community Warning"*. Graph edge traversal times are not modified.
- **Approved Active Delays:** Additive penalty applied:
  $$\text{Effective Duration} = \text{Baseline Duration} + \text{delay\_minutes}$$
- **Approved Segment Closure:** The segment is removed from the routing graph for affected vehicle modes (`is_closed = true`).
- **Deduplication:** Multiple concurrent alerts on the same segment are merged by taking $\max(\text{delay\_minutes})$, preventing artificial delay compounding.
