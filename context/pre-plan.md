# DhakaPath: Complete Pre-development Plan

**Before building the main features, prepare five things: a usable transit dataset, agreed calculation rules, database permissions, shared API contracts, and a working Next.js–Mantine project setup.**

Your chosen direction is clear: **a fully mobile-responsive web app, public access without mandatory login, optional commuter accounts, mandatory admin login, and your existing free-tier AI API.**

The hackathon still requires the full combination of transit information, natural-language search, fare calculation, disruption handling, report validation, and conversational interaction—not just a map or chatbot. INIF 2026 - Hackathon Problem S…

The quantities and architecture below are **proposed implementation choices**, not additional organizer requirements. The data-collection targets are also **not claims that those records have already been collected or verified**.

---

## 1. Freeze the project decisions first

Put these decisions into `docs/project-scope.md` so everyone works toward the same application.

| Area | Decision |
|---|---|
| Frontend | Next.js App Router, TypeScript, Mantine, CSS Modules. |
| Responsive design | Mobile-first; commuter, chat, login, and admin screens must all work on phones. |
| Backend | Next.js Route Handlers in the same project. No separate backend framework initially. |
| Database and authentication | **Proposed:** Supabase PostgreSQL and Supabase Auth. |
| Map | Leaflet with OpenStreetMap; schematic network view as a fallback. |
| AI | Your existing free-tier provider, called only through the server. |
| Public access | Route search, fare comparison, map, alerts, and chat without a mandatory account. |
| Contributions | Guests can submit moderated reports through a controlled submission flow. |
| Admin access | Login plus server-verified admin authorization. |
| Initial scope | A small, connected transit network—not all of Dhaka. |

Supabase currently offers PostgreSQL, anonymous sign-ins, and database-change subscriptions on its Free plan, subject to usage limits. Treat it as a proposed backend choice rather than a hackathon requirement. [Supabase](https://supabase.com/pricing)

**Keep outside the initial scope:** live bus GPS tracking, payments, ride booking, a complete citywide road-routing engine, and the bonus features. None should delay the five core parts.

**Output:** one agreed scope document and one person responsible for approving scope changes.

---

## 2. Define the data coverage before collecting anything

### Choose a pilot network

The brief permits an interactive schematic covering **12–15 major hubs**. You can use the same limited coverage with a geographical map rather than trying to map every service in Dhaka. INIF 2026 - Hackathon Problem S…

Choose hubs based on **available evidence and actual connectivity**, not simply familiar names.

### Suggested collection targets

| Data category | Initial target | Acceptance condition |
|---|---|---|
| Major hubs | 12–15 | Each has a stable identifier and a clearly defined area. |
| Actual boarding/transfer points | Approximately 20–30 | Locations and directions have been reviewed. |
| Bus services | 2–3 services | Verified stop order and direction for the portions you support. |
| Metro | One connected subset | Relevant stations, access points, and fares checked. |
| Leguna | 1–2 verified services or route portions | Pickup points, direction, and fare information recorded. |
| Rickshaw and walking connections | Enough to connect the selected modes | Explicit origin, destination, time estimate, and fare where applicable. |
| Test disruptions | Approximately 6 synthetic cases | Clearly isolated from real reports. |

These are working targets. **A smaller verified network is preferable to a larger invented network.**

### Select demonstration journeys early

Before collecting hundreds of records, identify three journeys your dataset must support:

**A normal multimodal journey**, **a student/budget-constrained journey**, and **a journey with a genuine alternative when one connection is blocked**.

Also prepare a case where blocking a critical connection leaves **no valid route**. The application must be able to say that honestly instead of inventing a detour.

**Output:** `docs/coverage.md`, containing selected hubs, supported services, demo journeys, and known coverage gaps.

---

## 3. Create a source register and collection workflow

### A. Use different sources for different kinds of data

| Information | Starting source | Collection action |
|---|---|---|
| Map background | OpenStreetMap tiles | Display the map; do not treat the tiles as your transit database. |
| Stops and stations | OSM through Overpass | Export the selected area’s relevant mapped objects for review. |
| Bus service and stop order | Existing route datasets plus independent checks | Extract only services within your chosen coverage. |
| Metro fare information | Official DMTCL information | Record fares relevant to your supported journeys. |
| Rickshaw/leguna pickup points and estimates | Documented local verification where reliable published data is unavailable | Record who checked the information, when, and how. |
| Current road incidents | User reports and admin-reviewed information | Record observations and verification separately. |
| Demonstration incidents | Your own synthetic fixtures | Mark them as simulation data, never live observations. |

Overpass supports selecting OSM objects by tags and geographic bounds. Use it to obtain **candidate mapped locations**, then inspect those candidates before publication. [OpenStreetMap](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example)

The previously identified `dhaka-bus-access-heatmap` repository contains `stop_routes_full.csv`, including service names, stop order, names, and coordinates. Its methodology uses scraped route information, geocoding, and fuzzy matching, so its coordinates and service information need review. **Use the stop-level file, not clustered centroids, as your starting point.** [GitHub](https://raw.githubusercontent.com/muhtashimshahrier/dhaka-bus-access-heatmap/main/data/stop_routes_full.csv)

DMTCL maintains an official page listing its fare chart and fare-collection guidance. Use that as the reference for the metro fare entries you collect; the source page alone does not establish that you have checked every relevant fare. [Dhaka Mass Transit Company Limited](https://dmtcl.gov.bd/site/page/d8573d11-7f71-4834-b72e-96e060fb3a0b/%E0%A6%AD%E0%A6%BE%E0%A7%9C%E0%A6%BE%E0%A6%B0-%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%95%E0%A6%BE--%E0%A6%AD%E0%A6%BE%E0%A7%9C%E0%A6%BE-%E0%A6%86%E0%A6%A6%E0%A6%BE%E0%A7%9F-%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A7%8D%E0%A6%A6%E0%A7%87%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A6%BE?utm_source=chatgpt.com)

### B. Record provenance immediately

Create `data/source-register.csv` with these fields:

```text
source_id
source_name
source_url
retrieved_at
source_data_date
reuse_terms_or_license
collected_by
verification_notes
```

For each operational record, retain:

```text
source_id
data_kind
verification_status
last_verified_at
verified_by
```

Use separate classifications:

- **Data kind:** sourced, estimated, or demo.
- **Verification status:** unreviewed, verified, or rejected.

A source can be legitimate while a particular record remains unverified. Also, **verifying a stop’s coordinates does not verify its fare**. Where needed, store different source references for location, service, fare, and duration.

### C. Keep raw, reviewed, and published data separate

Recommended collection structure:

```text
data/
  raw/
  staging/
  approved/
  demo/
  source-register.csv
  data-quality-report.md
```

The publication flow should be:

**Collect → normalize → validate → review → approve → import into the operational database.**

Do not import every downloaded row directly into live routing.

Keep only redistributable data in the public repository. Private verification details and any personal information from reports should stay out of public seed files.

**Output:** a source register, preserved raw inputs, and a clearly separated approved dataset.

---

## 4. Agree on the data dictionary before teammates enter records

This is where you prevent incompatible spreadsheets, duplicate places, and incorrect routes.

### Distinguish the main concepts

**Hub:** a general interchange area.

**Stop or pickup point:** the specific place where somebody boards, exits, or transfers.

**Service:** a particular bus, metro, or leguna service.

**Segment:** a directional connection used for route construction and disruption handling.

**Ride:** travel on one service from boarding to alighting; this is not necessarily the same as one segment.

A single hub may contain several stops on different sides of the road. **Do not make them interchangeable without explicit transfer links.**

### Minimum fields to prepare

| Dataset | Important fields |
|---|---|
| Hubs | ID, English/Bangla name, aliases, approximate center. |
| Stops | ID, hub ID, name, aliases, latitude, longitude, mode, boarding landmark, direction/access notes. |
| Services | ID, name, mode, direction, operational/verification status. |
| Service-stop sequence | Service ID, direction ID, stop ID, sequence number. |
| Segments and transfers | ID, from-stop, to-stop, service/mode, baseline duration, geometry or schematic indication. |
| Fare records | Service/mode, boarding/alighting scope, charging method, regular fare or range, student eligibility, source, effective date. |

### Data-cleaning rules to freeze

**Stable IDs:** use an internal identifier rather than a stop’s name as its identity. Preserve source IDs separately.

**Directionality:** an A→B connection must not automatically create B→A. Verify the return route or leave it unsupported.

**Aliases:** prepare English, Bangla, and common Banglish spellings for the places you support. Ambiguous names should produce a choice, not a silent guess.

**Coordinates:** use named `latitude` and `longitude` fields internally and one tested conversion function for map formats. Review points that fall outside your coverage or appear inconsistent with their service.

**Geometry:** a line joining two stops can be displayed as a schematic connection. Do not present it as the exact road followed unless the geometry is verified.

**Missing values:** unknown fares or durations must remain unknown or explicitly estimated—not zero.

**Output:** `docs/data-dictionary.md` and one agreed record format for each dataset.

---

## 5. Design storage, imports, and updates

### Proposed database groups

You do not need a separate admin screen for every table. The following are the main logical groups to agree on:

| Group | Suggested tables |
|---|---|
| Places and network | `hubs`, `stops`, `services`, `service_stops`, `segments` |
| Fare information | `fare_rules`, `fare_quotes` |
| Road conditions | `alerts`, `alert_votes`, `alert_impacts` |
| Data management | `sources`, `import_batches`, `audit_log` |
| Permissions | `admin_roles` |

A segment can represent a transit connection or a walking/connector transfer, provided its type is explicit.

### Import behavior

Prepare a repeatable seed/import process with these properties:

**Repeatable:** importing the same approved dataset twice does not duplicate records.

**Reviewable:** a changed source produces a change preview before publication.

**Traceable:** record the import batch and network revision.

**Protects corrections:** an external import must not silently overwrite an administrator’s verified correction.

**Recoverable:** keep a known-good seed snapshot and an export of the current approved data.

Supabase’s current Free-plan comparison does not include automatic database backups, so do not assume a managed restore point will be available. Keep your own permitted exports and seed files. [Supabase](https://supabase.com/pricing)

### Separate baseline data from changing conditions

Do not overwrite a segment’s normal duration every time a report arrives.

Instead:

> **Baseline network + currently applicable alerts + optional simulation overlay = route calculation inputs.**

A simulation must be scoped to its session/scenario. It must not change the shared public network or become a real incident.

### Agree on update mechanisms

For the first version, use **admin-triggered import/review for network changes** and **database updates for report activity**. Live interface updates can use Supabase subscriptions, with polling as a fallback; database-change subscriptions are included in its current Free plan. [Supabase](https://supabase.com/pricing)

Return a `network_revision` and `as_of` timestamp with route results. Do not reuse a cached route after relevant network or alert changes without recalculating.

**Output:** database schema, import rules, migration files, and a seed/restore procedure.

---

## 6. Freeze fare, routing, and alert rules before coding them

### A. Fare rules

The brief specifies the **50% student bus discount, 10 BDT minimum bus fare floor, mode-specific eligibility, and estimated connector fare ranges including surge conditions**. Treat these as the hackathon’s rule profile—not an independently verified statement of current transport law. INIF 2026 - Hackathon Problem S…

For an eligible bus ride, implement the brief’s rule as:

```text
student_fare = max(10 BDT, regular_fare × 0.5)
```

**Important design decision:** charge for the boarding-to-alighting ride, not every small road segment.

For example, a bus passing through four graph segments should not trigger four separate minimum-fare charges merely because of how the graph was stored.

For the small pilot, a practical approach is to generate **valid boarding→alighting ride options** containing the fare and the segment IDs they traverse. Routing can combine those rides with explicit transfer links.

### B. Budget and ranking rules

Agree on these behaviors:

**Fare ranges:** sum lower and upper estimates separately.

**Hard budget:** label a route “within the estimated budget” only when its upper estimate fits. A route whose range crosses the budget should say “may exceed budget.”

**Missing fare:** do not claim that the route satisfies a budget when a component is unpriced.

**Transfers:** define them consistently—for example, vehicle boardings after the first. Passing through a stop on the same vehicle is not a transfer.

**Ranking:** return valid options ordered by cost, duration, and transfers. Do not force three alternatives when only one valid route exists. These ranking dimensions come from the brief. INIF 2026 - Hackathon Problem S…

### C. Alert states and routing impact

Separate **moderation** from **incident lifecycle**.

```text
Moderation: pending / approved / rejected
Lifecycle: active / disputed / resolved / expired
```

For each alert, collect:

```text
observed_at
submitted_at
last_verified_at
expires_at
affected_segment_ids
affected_modes
severity
source_type
```

A road closure should affect the mapped road connections—not every transport mode near the pin.

For a conservative first version, let unverified reports appear as clearly marked warnings, while **route-changing closure decisions require admin approval**. Crowd confirmation should support moderation, not automatically prove truth.

Choose an explicit expiry policy. A reasonable **demo configuration**, not a factual traffic rule, is to expire ordinary un-reverified crowd reports after 30 minutes and require an explicit end/review time for longer verified events.

**Expired means “no longer current enough to rely on,” not “the road is now clear.”**

Also define how to combine duplicate incidents so the same congestion does not multiply the time penalty repeatedly.

The brief requires confirmation/resolution actions, automatic aging, and filtering before unreliable information affects routing. INIF 2026 - Hackathon Problem S… INIF 2026 - Hackathon Problem S…

**Output:** `docs/business-rules.md`, with examples and expected results.

---

## 7. Prepare the Next.js and Mantine skeleton

This is setup work, not full feature implementation.

### A. Standardize the environment

Use the same supported Node.js version and package manager across the team. The current Next.js installation documentation lists Node.js **20.9 as the minimum**; record your chosen compatible version and commit the lockfile. [Next.js](https://nextjs.org/docs/app/getting-started/installation.md?utm_source=chatgpt.com)

Start with:

```bash
npx create-next-app@latest dhakapath
cd dhakapath
```

Choose TypeScript, App Router, ESLint, and a `src` directory. Since you are using Mantine with CSS Modules, leave Tailwind out unless your team has a specific reason to combine them.

Install the initial packages:

```bash
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications
npm install @supabase/supabase-js @supabase/ssr leaflet

npm install -D postcss postcss-preset-mantine postcss-simple-vars @types/leaflet
```

Mantine’s official Next.js guide covers its PostCSS configuration, styles imports, `MantineProvider`, and `ColorSchemeScript`. Supabase’s SSR guide documents the client packages and cookie-based setup. Follow those guides for the installed versions rather than mixing older tutorials. [Mantine](https://mantine.dev/guides/next/)

### B. Establish the project structure

```text
src/
  app/
    page.tsx
    login/
    admin/
    api/
  components/
    layout/
    trip/
    map/
    alerts/
    chat/
  lib/
    db/
    routing/
    fares/
    alerts/
    ai/
    validation/
  types/

docs/
data/
supabase/migrations/
tests/fixtures/
```

Use one shared planning module. **The visual trip form and chat must not implement separate fare or route calculations.**

### C. Set up environment variables

Create a committed `.env.example` with placeholders:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
```

Keep real values in `.env.local` and the deployment environment.

Next.js exposes variables prefixed with `NEXT_PUBLIC_` to browser code. Therefore, **the AI key and any privileged database credentials must never use that prefix**. [Next.js](https://nextjs.org/docs/app/guides/environment-variables)

### D. Prove the skeleton works

Before building features, verify a styled Mantine page, database read, protected admin test page, and one server-side AI request.

For the map, plan a client-only dynamically loaded component. In Next.js, `ssr: false` must be configured from a Client Component, not directly in a Server Component. [Next.js](https://nextjs.org/docs/app/guides/lazy-loading.md?utm_source=chatgpt.com)

Finally, run a production build and open the app on an actual phone—not only desktop device emulation.

**Output:** a reproducible starter project with no real secrets committed.

---

## 8. Define mobile behavior before designing screens

### Proposed screen structure

**Home/search:** origin, destination, student option, budget, and search. No login wall.

**Results:** readable route cards first; map available without dominating a small screen.

**Route details:** legs, boarding notes, regular/student totals, estimate labels, and applicable alerts.

**Report flow:** choose a location, incident type, observation time, and submit.

**Chat:** full-screen or a large drawer on mobile; side panel on desktop.

**Admin:** mobile-friendly review cards, with wider tables where space permits.

### Responsive acceptance targets

Test at **360, 390, 768, and 1280 pixels**, plus phone landscape.

Require no horizontal page overflow, readable long Bangla/Banglish names, visible form errors, and a chat composer that remains usable when the keyboard opens. Manual place selection must work when location permission is denied.

Use Mantine’s CSS-responsive facilities and consistent breakpoints. Its guidance recommends CSS-based responsiveness over media-query hooks for most SSR layouts because the latter can cause hydration issues. [Mantine](https://mantine.dev/styles/responsive/?utm_source=chatgpt.com)

### Map and location-search boundaries

Use local hub/stop aliases for autocomplete. Do not make an external geocoding request on every keystroke: the public Nominatim service explicitly prohibits client-side autocomplete and has strict usage limits. [OSM Foundation Operations](https://operations.osmfoundation.org/policies/nominatim/?utm_source=chatgpt.com)

Display OSM attribution. Do not pre-download its standard tiles for an offline demo; that is prohibited by the tile policy. Keep your own schematic view and approved network data as the fallback. [OSM Foundation Operations](https://operations.osmfoundation.org/policies/tiles/?utm_source=chatgpt.com)

**Output:** low-fidelity screen sketches and a responsive test checklist.

---

## 9. Finalize guest, account, and admin permissions

Your principle should be:

> **No account required to use the app; authorization required to change shared trusted data.**

| Action | Guest | Optional account | Admin |
|---|---|---|---|
| Search, fares, map, public alerts, chat | Allowed | Allowed | Allowed |
| Submit reports or feedback | Controlled/moderated | Controlled/moderated | Allowed |
| Save personal routes across devices | Not initially | Allowed | Allowed |
| Edit the trusted network or fare records | Denied | Denied | Allowed |
| Approve/reject reports | Denied | Denied | Allowed |
| Assign admin roles | Denied | Denied | Restricted administrative process |

For guest contributions, Supabase anonymous sign-in can create a session without asking for email/password. However, it uses the database’s `authenticated` role and is not proof of a unique real-world person. Browser-data deletion can lose that identity. [Supabase](https://supabase.com/docs/guides/auth/auth-anonymous)

Implement database grants and Row Level Security, not merely hidden buttons. Keep admin roles outside user-editable profile fields. Privileged service-role credentials bypass RLS and must remain server-side. [Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

**Prepare abuse controls now:** input validation, repeated-submission protection, rate limits, and bot protection. Ensure direct database access cannot bypass the intended submission controls. Supabase specifically recommends CAPTCHA/Turnstile protection for anonymous sign-ins. [Supabase](https://supabase.com/docs/guides/auth/auth-anonymous)

Store only the location information needed for the selected journey/report. Do not collect continuous location history, and do not expose reporter identifiers publicly.

**Output:** permission matrix, admin-account setup procedure, and allow/deny tests.

---

## 10. Freeze API contracts and the AI boundary

### Shared API contract

Agree on endpoint names and request/response formats before frontend and backend work diverge.

| Endpoint | Responsibility |
|---|---|
| `GET /api/stops?q=` | Search supported names and aliases. |
| `POST /api/plan` | Return validated route options and fare breakdowns. |
| `GET /api/alerts` | Return public alerts with freshness information. |
| `POST /api/reports` | Validate and accept a pending report. |
| `POST /api/reports/:id/feedback` | Record confirmation or resolved feedback. |
| `POST /api/chat` | Interpret conversation and call the same application services. |
| `/api/admin/...` | Authorized network edits and report moderation. |

A proposed planner request:

```json
{
  "originStopId": "stop_a",
  "destinationStopId": "stop_b",
  "student": true,
  "budgetBdt": 80,
  "avoidHubIds": [],
  "allowedModes": ["bus", "metro", "leguna", "rickshaw", "walk"],
  "maxTransfers": 2,
  "scenarioId": null
}
```

These IDs and budget are example inputs, not a real journey.

Responses should include legs, service/stop IDs, fare ranges, duration estimates, transfers, warnings, applicable alert IDs, network revision, and calculation time.

Define explicit outcomes for **unknown/ambiguous place, outside coverage, no valid route, incomplete fare data, and unavailable AI**.

### AI preparation

Since your provider and model were not named, keep the integration provider-neutral. Record its actual model ID, request/token limits, reset behavior, structured-output support, and error format. Do not assume that every free-tier API supports the same SDK or features.

The intended boundary is:

**AI extracts intent → server validates it → application computes the result → chat explains that result.**

The model must not create routes, fares, permissions, or active alerts independently. Grounding against the transit graph is explicitly required. INIF 2026 - Hackathon Problem S…

Prepare English and Banglish examples such as:

> “Banasree theke Motijheel jabo, budget 80.”  
> “Ami student.”  
> “Malibagh avoid koro.”  
> “Ekhane pani jome ase.”

Store structured conversation context: selected origin/destination, student status, budget, avoided hubs, and last result. A report inferred from chat should show a preview and require the user’s submission confirmation.

For quota errors or invalid model output, preserve the trip form and deterministic planner. **AI failure must not become total application failure.**

**Output:** `docs/api-contracts.md`, `docs/ai-contract.md`, and a small set of expected intent-parsing examples.

---

## 11. Prepare tests, ownership, and the “ready to build” gate

### Create test fixtures before feature development

| Test | Expected behavior |
|---|---|
| Valid multimodal trip | Uses only published services and explicit transfers. |
| Student journey through several segments | Charges the appropriate ride fare without repeated minimum-fare charges. |
| Connector fare range crosses budget | Warns that the trip may exceed budget. |
| One relevant connection blocked | Returns an available valid alternative. |
| All valid connections blocked | Returns “no valid route,” not an invented path. |
| Road alert near a different transport mode | Affects only mapped applicable segments/modes. |
| Old or resolved alert | No longer treated as a current verified disruption. |
| Duplicate confirmation from the same actor | Does not count repeatedly. |
| Guest attempts a trusted-network edit | Denied by the server/database. |
| AI returns an unknown stop or malformed output | Rejected or clarified; never executed blindly. |
| AI quota exhausted | Visual search and deterministic results still work. |
| Phone keyboard opens | Chat input and submission controls remain usable. |

Keep synthetic cases in `tests/fixtures/` or `data/demo/`, with expected results recorded separately from real operating data.

### Divide preparation into parallel workstreams

**Data owner:** coverage, collection, provenance, manual review, and seed files.

**Backend owner:** schema, permissions, calculation rules, imports, and API contracts.

**Frontend owner:** Next.js/Mantine setup, mobile layouts, map loading, and screen states.

**AI/integration owner:** provider smoke test, intent examples, conversation contract, and failure handling.

These are responsibilities, not a requirement for four people. Combine roles according to your team size, but keep one owner for each output.

### Start main feature development when these gates pass

| Gate | Required evidence |
|---|---|
| **Data ready** | A connected approved pilot network, explicit gaps, and enough data for the selected demo journeys. |
| **Rules ready** | Fare charging, budget ranges, transfer counting, disruption impact, and expiry behavior agreed. |
| **Setup ready** | Next.js/Mantine skeleton builds; database and server-side AI connections have been tested. |
| **Security ready** | Public reads work; guest/admin permissions are defined and unauthorized writes fail. |
| **Integration ready** | Shared IDs, API contracts, fixtures, and ownership are frozen. |

Keep setup instructions and session work in the repository. The official deliverables allow a deployed or locally demonstrated prototype and require source code, setup instructions, architecture/routing/AI explanations, and a live demo. INIF 2026 - Hackathon Problem S…

---

### The first milestone

**Do not make “the homepage looks good” or “the chatbot replies” your first milestone.**

Make it:

> **“We have a reviewed pilot dataset, reproducible database setup, agreed fare/alert rules, shared API contracts, and a Next.js–Mantine skeleton that works on a phone.”**

That foundation lets the team build the map, trip search, admin tools, alerts, and chat in parallel without each component inventing its own version of the data.