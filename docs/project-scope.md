# DhakaPath: Project Scope & Architectural Decisions

## 1. Project Purpose & Direction
DhakaPath is a mobile-first, multimodal public transit navigation and disruption awareness platform designed specifically for the transit realities of Dhaka. It integrates buses, Metro Rail (MRT Line 6), legunas (human haulers), and feeder connectors (rickshaws and walking) into a single deterministic planning engine with conversational natural-language discovery and community incident reporting.

## 2. Frozen Technical Architecture

| Dimension | Frozen Decision | Architectural Rationale |
|---|---|---|
| **Frontend Framework** | Next.js (App Router), TypeScript | Unified full-stack TypeScript codebase, server components for initial state, route handlers for backend logic. |
| **Component Library & Styling** | Mantine UI v7 + Vanilla CSS Modules | High-density controls, accessible modals/drawers, native responsive layout hooks, zero conflict with CSS Modules. |
| **Responsive Target** | Mobile-First (360px, 390px, 768px, 1280px) | Commuters primarily use mobile phones on 3G/4G in transit. All workflows (routing, chat, report submission, admin moderation) must be 100% usable on mobile. |
| **Backend Architecture** | Next.js Route Handlers (`src/app/api/*`) | No secondary microservice tier needed for hackathon milestone; shared deterministic engine across UI and API. |
| **Database & Auth** | Supabase PostgreSQL + Supabase Auth | Managed relational schema with PostGIS/coordinate support, Row Level Security (RLS) for data governance, and anonymous auth for guest contributions. |
| **Map Rendering** | Leaflet with OpenStreetMap tiles + Schematic fallback | Client-only dynamic import with strict attribution; fallback to schematic SVG/HTML topology when offline or bandwidth-constrained. |
| **AI Boundary** | Provider-agnostic LLM (Gemini / Groq / OpenAI compatible) | Server-side only. AI is strictly constrained to **intent extraction** and **response framing**. Routing, fare calculations, and alert filtering are 100% deterministic code. |
| **Public Access** | No mandatory login | Route search, multi-criteria comparison, interactive map, active alerts, and chat require zero authentication. |
| **Contributions** | Controlled Guest Submissions | Anonymous sessions submit reports into a `pending` moderation queue. Abuse prevention via rate limiting, payload validation, and fingerprinting. |
| **Admin Governance** | Server-verified RBAC | Elevated roles (`admin`) manage pilot data, inspect audit logs, approve/reject crowdsourced disruptions, and apply network overrides. |

## 3. Explicit Boundaries (Out of Scope for Initial Version)
To guarantee delivery of a hardened, verifiable core system, the following features are explicitly deferred:
- **Live Vehicle GPS Tracking:** Dhaka's bus fleet does not expose unified GTFS-RT APIs. Real-time conditions are modeled via crowdsourced segment disruptions and administrative incident overrides.
- **In-App Ticketing & Digital Payments:** Ticketing requires external payment gateway licensing and transport agency clearinghouse integration. DhakaPath estimates and quotes fares with 100% breakdown accuracy instead.
- **Full Citywide Road Network Geocoding:** DhakaPath focuses on a verified pilot multimodal network (12–15 major hubs and connecting routes) rather than noisy, unverified scraping of the entire metropolitan area.
- **Rider-to-Driver Ride Hailing:** Feeder connections (rickshaws) are modeled as distance/time/fare estimation arcs, not active dispatch channels.

## 4. Scope Governance & Owners
Any modification to this scope requires sign-off from the project lead. All downstream deliverables (`src/`, `docs/`, `data/`, `supabase/`) strictly implement this specification.
