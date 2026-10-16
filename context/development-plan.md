# DhakaPath — Phase-by-Phase Development Plan

**Start from your completed preprocessing. Keep the existing dataset, database schema, installed packages, and free-tier AI provider unless something is demonstrably broken.**

The development objective is one connected application:

> **A commuter searches without logging in, receives a data-grounded route and fare breakdown, sees the route change when conditions change, submits or verifies reports, and accesses the same features through contextual chat. Admins maintain the network and moderate reports.**

That corresponds to the problem statement’s combined requirements—not separate map, chatbot, and admin demonstrations. INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

The implementation choices below are **our proposed engineering plan**. The official requirements are identified with citations.

---

## 1. Development boundaries and execution order

### Keep these decisions fixed

| Area | Development decision |
|---|---|
| Frontend | Next.js, TypeScript, Mantine; mobile-responsive throughout.(use https://mantine.dev/llms-full.txt for mantine context) |
| Backend | Next.js Route Handlers and shared server-side application modules. |
| Storage | Your already-prepared database, accessed through one data-access layer. |
| Mapping | Leaflet + OpenStreetMap, or the permitted interactive schematic. |
| AI | Your existing free-tier API, called from the server. |
| Public access | No mandatory account for browsing, planning, fare comparison, alerts, or chat. |
| Optional accounts | Working sign-in/sign-out; guest use remains available. |
| Administration | Mandatory login **and** verified admin authorization. |
| Business logic | One shared route planner, fare calculator, and alert-validation system. |

The brief prohibits paid mapping services, permits Leaflet/OpenStreetMap or a schematic covering 12–15 major hubs, and requires free-tier or local language models. Bonus media features should use browser-native or free open-source tools. INIF 2026 - Hackathon Problem S…

### Development roadmap

| Phase | Main result | Primary owner | Depends on |
|---|---|---|---|
| **1. Connect the foundation** | Application reads processed data; contracts are fixed. | Integration/backend | Existing preprocessing |
| **2. Network CMS and access control** | Browse and maintain the network securely. | Admin/backend | Phase 1 |
| **3. Routing and fare engine** | Valid, ranked multimodal journeys with correct calculations. | Routing/backend | Phase 1 |
| **4. Mobile journey interface** | Guests search, compare, and inspect routes visually. | Frontend | Phase 3 contract |
| **5. Reports and validation** | Reports are submitted, checked, moderated, and aged. | Admin/backend | Phases 1–2 |
| **6. Simulation and rerouting** | Disruptions produce genuine route and fare changes. | Routing/frontend | Phases 3 and 5 |
| **7. Natural-language search and chat** | English/Banglish interaction uses the same application logic. | AI/integration | Phases 3 and 5; integrate Phase 6 |
| **8. End-to-end testing** | Requirements work together, including failure cases. | Everyone | Phases 1–7 |
| **9. Release and demonstration** | Reproducible prototype, repository, explanations, and demo. | Integration/presenter | Phase 8 |

**These are dependency phases, not instructions for everyone to wait.** Frontend, admin/reporting, and AI work can begin in parallel once the shared contracts exist.

The official duration is **5 hours 40 minutes total**, not another 5 hours 40 minutes from now. Use your actual remaining time and reserve approximately the final **20% for integration, fixes, and demo preparation**. That percentage is my recommendation, not an organizer rule. INIF 2026 - Hackathon Problem S…

---

# Phase 1 — Connect the foundation and freeze contracts

**Goal:** Make the prepared data usable by every feature without creating competing versions of it.

### Implementation work

**Connect the existing database.** Create a data-access layer that exposes operations such as:

```text
getNetworkSnapshot()
searchStops()
getActiveAlerts()
getFareRules()
```

Adapt your existing schema inside this layer rather than making every component understand the preprocessing format.

**Create shared domain modules.**

```text
src/
  app/
    api/
    admin/
    login/
  components/
    trip/
    map/
    alerts/
    chat/
    admin/
  lib/
    transit/
    routing/
    fares/
    alerts/
    ai/
    auth/
    validation/
  types/

tests/
  fixtures/
docs/
```

Next.js supports request handlers in `app/.../route.ts`, so these endpoints can live inside the same application. A separate Express service is not necessary for this plan. [Next.js](https://nextjs.org/docs/app/getting-started/route-handlers)

**Freeze the request and response types.** The planner input should include origin, destination, student status, budget, avoided hubs, allowed modes, transfer limit, and an optional simulation identifier.

Each result should include:

```text
itinerary ID
ordered legs and their stop/service IDs
regular and student fare breakdowns
estimated fare minimum/maximum
estimated duration and transfers
relevant alerts and warnings
network revision, alert revision, and calculation time
```

Keep missing values explicitly unknown. An unavailable fare must not become zero.

**Connect the existing AI credentials through a server-only adapter.** Test connectivity now, but do not build AI-generated routing calculations.

### Acceptance gate

**Pass when:** the running application reads your processed stops and services, one server-side AI request succeeds, and every teammate uses the same IDs and contracts.

Commit this working integration point before expanding features.

---

# Phase 2 — Transit CMS, browsing, and permissions

**Official coverage:** Part 1 requires local bus, MRT-6, leguna, and connector-rickshaw information; incident reports; boarding notes; base fare charts; and public browsing with transport, fare, eligibility, and travel-time metadata. INIF 2026 - Hackathon Problem S…

### A. Build the two required sections

Use the brief’s names:

**Transit Network:** hubs, stops, services, connections, boarding landmarks, baseline fares, student eligibility, and estimated duration.

**Street Alerts:** active incidents, affected locations, observation time, verification state, and freshness.

The complete report workflow comes in Phase 5, but its navigation and data interfaces should exist now.

### B. Implement the admin operations

Admins must be able to create or edit network records, change service availability, update boarding notes and fares, and review changes before publication.

Prefer **deactivation** over deleting referenced stops or services. Preserve an audit record of who changed what.

An approved network update must persist to the shared database and change the network revision. Do not leave admin changes trapped in frontend state.

### C. Implement your access model

**Guests:** browse and use the application; submit controlled reports or correction suggestions.

**Optional accounts:** sign in and out without making core features account-only. Account-linked preferences can provide a small benefit.

**Admins:** maintain the trusted network and moderate reports. Public registration must never grant admin status.

Protect both the page and the write endpoint. A hidden button is not authorization.

For a Supabase backend, implement database grants and Row Level Security as well as server-side checks. Supabase distinguishes unauthenticated access from anonymous Auth users; an anonymous Auth session must not accidentally receive trusted-user or admin privileges. [Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

### D. Add public network browsing

A commuter should be able to inspect an active service and see its mode, endpoints, fare information, student eligibility, boarding notes, and estimated time.

Show hub status derived from current information. **“No recent reports” should not automatically become “road clear.”**

### Acceptance gate

**Pass when:** a guest can inspect the network, an admin can publish a change, another browser sees it, and a guest or ordinary account cannot perform the same privileged write.

---

# Phase 3 — Build the shared routing and fare engine

**Official coverage:** valid multi-leg combinations ranked by cost, duration, and transfers, plus multimodal regular/student fare comparisons and estimated connector ranges. INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

**This is the central dependency. Build it before allowing chat to recommend journeys.**

### A. Implement one planner

Use a shared server-side function:

```text
planTrip(request, networkSnapshot, activeAlerts, scenario)
```

Both the form and chat must call it.

For the pilot network, the proposed search process is:

**Validate locations and constraints → construct directional ride/transfer options → apply relevant disruptions → find candidate itineraries → calculate fares → filter and rank → validate the final results.**

Use explicit transfer links between boarding points. Do not assume every nearby point is interchangeable.

For a small network, a bounded candidate search is a practical first implementation. Record its transfer/leg limits and distinguish **search-limit exhaustion** from a proven absence of any valid route.

### B. Represent rides correctly

A ride option should retain its service, boarding and alighting stops, direction, fare rule, and every intermediate segment it traverses.

This solves two important problems:

**Fare charging:** passing through several graph segments on the same continuously charged ride should not create several minimum-fare charges.

**Disruption checking:** a ride must be rejected when an affected intermediate segment is blocked—even when its start and end stops remain available.

Do not invent a new bus detour simply because nearby roads exist. Use only services and alternatives represented in the supported network.

### C. Implement fare rules separately

The brief specifies the 50% bus student discount, a 10 BDT minimum bus fare floor, and modes without student-pass applicability. INIF 2026 - Hackathon Problem S…

Keep the earlier proposed rule configurable:

```text
Eligible student bus fare = max(10 BDT, regular bus fare × 0.5)
```

The brief does not specify every rounding or application-order detail. Record your chosen interpretation in `docs/business-rules.md`; do not describe it as independently verified current transport law.

Calculate fares for complete charged rides, then aggregate the journey. Compare regular and student totals for the **same itinerary**.

For non-metered connectors, preserve a range rather than displaying unjustified precision. Keep baseline and surge-adjusted amounts separately available.

### D. Apply constraints honestly

For an estimated fare range, mark a journey “within the estimated budget” only when its upper bound fits. A range crossing the budget needs a warning.

Unknown fare components mean the budget cannot be confirmed. Avoided hubs must be excluded throughout the journey, not just at endpoints.

Rank actual valid alternatives by total cost, estimated duration, and transfers. Do not fabricate three choices when only one exists.

### E. Add output grounding

Before returning a result, verify stop and service existence, leg continuity, direction, traversed segments, fare rules, and constraint compliance.

Expose this through `POST /api/plan`.

### Acceptance gate

**Pass when:** fixture tests cover a valid multimodal journey, student pricing, a fare-range budget case, an avoided hub, and a no-route case—with no UI involved.

---

# Phase 4 — Build the mobile journey experience

**Goal:** A guest can complete a journey search visually before chat is integrated.

### Build the main components

Use a `TripForm`, `RouteCard`, `JourneyDetails`, `MapView`, and `HubStatusPanel`.

The search form should offer origin, destination, student status, budget, avoided locations, and sorting. Use your prepared stop aliases for selection.

Show route cards with transport changes, boarding/alighting points, regular/student totals, estimated duration, transfers, and relevant alerts. Include both available information and uncertainty labels.

**The frontend displays backend calculations; it does not independently recompute fares.**

### Responsive behavior

On mobile, keep the search and route cards primary, with a clear map toggle. On desktop, use a results-and-map split view.

Chat and admin screens must be responsive too. Use readable cards instead of forcing wide admin tables onto a phone.

Mantine supports CSS/media-query-based responsiveness. Its documentation warns against using media-query hooks as the primary SSR layout mechanism because they can produce hydration mismatches. [Mantine](https://mantine.dev/styles/responsive/)

### Map behavior

Show supported stops, selected route legs, affected segments, and alerts. A schematic connection must be labelled as such rather than presented as verified road geometry.

Manual location selection must work when location permission is denied.

Implement loading, ambiguous-location, outside-coverage, no-route, stale-data, and network-error states. Prevent an older search response from overwriting a newer one.

### Acceptance gate

**Pass when:** a guest on a phone can search, compare alternatives, inspect a journey, and see that same journey on the map.

This is your **first complete end-to-end milestone**.

---

# Phase 5 — Live reports, corroboration, moderation, and decay

**Official coverage:** incident management, crowd confirmation/resolution, automatic aging, and filtering of unrealistic fares or contradictory reports before they affect routing. INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

### A. Build report submission

Support waterlogging, road construction, severe gridlock, and intersection blockades.

Collect location, incident type, observation time, details, affected segments/modes where known, and optional supporting evidence. Separate **when the incident was observed** from **when it was submitted**.

Guest reporting should use a controlled session without demanding account registration.

### B. Implement separate moderation and lifecycle states

Proposed state model:

```text
Moderation: pending / approved / rejected
Lifecycle: active / disputed / resolved / expired
```

A new report is not automatically a verified closure.

Allow users to confirm or mark an alert as resolved. Record that feedback immediately, then apply the validation policy before changing routing impact.

Show confirmation count, observation time, last verification, and moderation status. Do not turn these into an unsupported numerical “accuracy probability.”

### C. Apply rule-based checks

Flag invalid locations, impossible timestamps, negative or non-numeric fares, invalid fare ranges, large deviations from configured fare references, duplicate submissions, and conflicting observations about the same place/time.

A fare correction suggestion must go through review rather than directly replacing the trusted fare chart.

For the first version, use a conservative rule: **only approved route-impacting incidents can remove connections from routing**. Crowd feedback informs review.

### D. Implement actual automatic aging

Evaluate expiry on the server whenever alerts or routes are requested. Refresh open screens as time passes, even when no new database event occurs.

Use your agreed configurable time-to-live policy; the brief does not prescribe an exact number of minutes.

An expired report loses current routing influence, but it does not prove the road is now clear.

### E. Connect approved alerts to planning

Map incidents to specific segments and applicable modes. Group duplicate reports of one event so delay penalties are not repeatedly multiplied.

Approved changes should update public alerts and trigger recalculation of affected displayed journeys.

### Acceptance gate

**Pass when:** a guest submits a report, admin review changes its status, another browser receives the update, affected routing changes appropriately, and expiration removes its current impact.

---

# Phase 6 — Interactive simulation and automatic rerouting

**Official coverage:** users trigger disruptions, the system identifies broken segments, and a functional detour is recalculated with updated time and cost. INIF 2026 - Hackathon Problem S…

### Build simulation controls

Provide controls for a blocked intersection/segment, office rush hour, and rain/waterlogging in a selected zone.

Each scenario should define affected segments, affected modes, closures or duration adjustments, applicable connector surge rules, and a reset action.

Treat chosen multipliers as **simulation assumptions**, not measurements of actual Dhaka traffic.

### Keep simulation separate from live information

Use:

```text
Published network
+ validated current alerts
+ current session's simulation overlay
= planning inputs
```

A user’s simulation must not become a shared live incident or modify the baseline network.

### Make the consequences visible

Show the original journey, broken or affected legs, the reason the route changed, the new itinerary, and before/after time and fare comparisons.

A road disruption must not indiscriminately close every transport mode near its map pin.

When no supported alternative exists, return that outcome. Do not draw an invented connection to keep the demonstration moving.

### Acceptance gate

**Pass when:** blocking a used segment changes the actual itinerary, estimates update, reset restores the non-simulated result, and another user’s session remains unaffected.

---

# Phase 7 — Natural-language search and contextual chat

**Official coverage:** English/Banglish intent extraction beyond keywords, route and road-condition queries, fare comparison, conversational reporting, alternatives, contextual follow-ups, and grounded recommendations. INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

### A. Define explicit supported intents

Use a validated intent structure such as:

```text
plan_trip
update_trip
check_road_status
report_disruption
explain_fare
explain_alert_reliability
```

Extract origin, destination, budget, student status, avoided places, and references to the current itinerary.

Resolve place names against your supported aliases. Ask for clarification when a name is ambiguous; never silently choose an unrelated location.

### B. Reuse application services

The flow should be:

**Message → intent extraction → server validation → shared application function → grounded result and explanation.**

Chat route results should reuse the same `RouteCard` component as visual search.

Road-condition questions should read actual alerts. Fare explanations should read the applied rule. Reliability explanations should use observation time, verification state, and corroboration—not invented confidence.

### C. Maintain structured conversation context

A conversation such as:

> “Find a route from my selected origin to my selected destination.”  
> “Ami student.”  
> “Budget 80 er moddhe dao.”  
> “Malibagh avoid koro.”

should update the previous trip instead of starting from an empty request each time. Use covered locations from your dataset when testing.

Keep the current constraints, selected itinerary, and relevant alert references. Recalculate when the underlying data has changed.

### D. Submit reports safely

A natural-language report should create a preview. The user confirms submission; it then enters the same validation/moderation workflow as the report form.

The model must not approve reports, edit trusted fares, or grant permissions.

### E. Handle the free-tier API honestly

Keep model calls bounded, validate structured output, and implement timeout/quota-error handling. Your unspecified provider may not support every SDK or structured-output feature, so use the adapter verified during preparation.

Keep the API key server-side. `NEXT_PUBLIC_` environment variables are exposed to browser code, so that prefix must not be used for AI secrets. [Next.js](https://nextjs.org/docs/app/guides/environment-variables)

When AI is unavailable, manual planning remains usable. However, manual fallback alone does **not** complete the natural-language requirement: test the real provider successfully before sign-off.

### Acceptance gate

**Pass when:** English and Banglish work, follow-up constraints persist, chat can check conditions and explain reliability, report submission reaches moderation, and unsupported model output is rejected.

---

# Phase 8 — Integration, security, and mobile testing

**Goal:** Prove that the features work together—not merely that their pages open.

Run tests throughout development; this phase is the final completion check.

| Test group | Required evidence |
|---|---|
| **CMS and metadata** | All required transport categories are represented; public metadata and admin updates work. |
| **Routing** | Direction, continuity, intermediate avoided hubs, explicit transfers, valid alternatives, and no-route outcomes are correct. |
| **Fares** | Discount/floor policy, single-ride charging, mode exemptions, connector ranges, surge comparisons, and budget warnings pass. |
| **Disruptions** | Affected segments/modes are correctly identified; detours and estimates change; simulations remain isolated. |
| **Reports** | Submission, confirmation, resolved feedback, moderation, contradiction checks, duplicate handling, and expiry work. |
| **AI grounding** | Unknown stops/services, invented fares, malformed output, and unauthorized actions are blocked. |
| **Access control** | Guest browsing works; optional login works; ordinary users cannot edit trusted data or assign admin roles. |
| **Mobile and failure states** | Search, map, chat, reports, login, and admin remain usable on small screens and under API/network errors. |

### Specific regression cases

Use **synthetic fixtures**, clearly separate from live records, to test a 40 BDT eligible bus fare producing 20 BDT under your policy, and a 16 BDT fare producing the configured 10 BDT floor.

Test that an admin fare update changes both form and chat results, and that an expired alert stops affecting a journey even without a new incoming report.

Test at approximately **360, 390, 768, and 1280 pixels**, plus an actual phone. Check keyboard obstruction, horizontal overflow, labels, focus, and loading feedback.

Store sensitive role decisions and write validation on the server/database. Ensure direct database calls cannot bypass the controlled report workflow.

### Acceptance gate

**Pass when:** the production build succeeds, the critical cases pass, no privileged keys appear in browser assets, and the demo journey works from a fresh guest browser.

After this gate, freeze feature additions.

---

# Phase 9 — Release, repository, and demonstration

The official deliverables are a working deployed or locally demonstrated prototype, a GitHub repository containing session-developed source and setup instructions, an explanation of architecture/routing/AI, and a live demonstration. INIF 2026 - Hackathon Problem S…

### Prepare the handover

Your `README.md` should explain installation, environment-variable names, database migrations/seeding, starting the application, running tests, and creating an authorized admin account without publishing credentials.

Add concise documentation for architecture, routing/fare rules, alert validation/expiry, AI boundaries, data provenance, coverage gaps, and simulation assumptions.

Commit the lockfile and a known-good seed or permitted export. Keep real secrets and private reporter information out of the repository.

A local deployment is an accepted presentation option, but **local hosting is not automatically offline operation**. Document whether the database, map, and AI still require internet.

### Five-minute demonstration sequence

| Time | Demonstration |
|---|---|
| **0:00–0:40** | Open on mobile as a guest; show Transit Network, hub metadata, and Street Alerts. |
| **0:40–1:35** | Submit a natural-language journey query; compare valid alternatives and regular/student fares. |
| **1:35–2:25** | Trigger a disruption; show the broken segment, detour, and updated time/cost. |
| **2:25–3:25** | Submit a report through chat, review it in admin, and show the public update and corroboration controls. |
| **3:25–4:20** | Ask a contextual fare/reliability follow-up; demonstrate expiry or a rejected invalid input using a labelled test case. |
| **4:20–5:00** | Explain shared planner architecture, data grounding, free-stack choices, and known limitations. |

Rehearse the flow so it stays within **4–5 minutes**, followed by the official **2-minute Q&A**. INIF 2026 - Hackathon Problem S…

### Acceptance gate

**Pass when:** the tagged release runs, setup instructions are reproducible, the presenter completes the demonstration within time, and every claimed feature can actually be shown.

---

# Optional Phase — Bonus features, only after core completion

Do not trade a missing core requirement for a bonus feature. The supplied brief labels the following items as bonuses; it does not provide a numerical scoring breakdown.

### Landmark-by-landmark journey instructions

Use the stored boarding notes to give specific instructions for each boarding and transfer step. **Storing boarding notes is core Part 1; generating detailed per-leg instructions is the Part 2 bonus.** INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

### Signboard and notice digitization

Implement **photo upload → automatic structured extraction → review → approved import** for a bus signboard, printed fare chart, or handwritten route note. Use an available free image-capable model or free OCR component; uncertain extraction should not bypass validation. INIF 2026 - Hackathon Problem S…

### Audio or offline visual briefing

Generate a concise audio briefing **or** a downloadable visual summary containing the selected route and relevant alerts. Include the calculation timestamp so an old card is not mistaken for current road information. The brief permits either format. INIF 2026 - Hackathon Problem S…

### Same-hub ride-share coordination

Add a board where commuters coordinate shared rickshaw/CNG journeys. Include party size, proposed destination, expiry, and a bot that calculates per-person fare or fare ranges. INIF 2026 - Hackathon Problem S…

---

## Final completion rule

**A feature is complete only when its UI, backend behavior, validation, persistence where applicable, and acceptance test all work.**

A displayed report form without saved reports is incomplete. A simulation toggle without recalculation is incomplete. A chatbot that invents routes is incomplete. A mobile homepage with unusable admin or chat screens does not meet your responsive-app goal.

**Start now with Phase 1 and assign the parallel owners. Your first major milestone is Phase 4: a guest on a phone searches your processed network and receives a valid, correctly priced journey. Then complete the alert, simulation, and chat flows against that same planner before release.**