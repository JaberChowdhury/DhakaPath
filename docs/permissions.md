# DhakaPath: Authorization, Security & Permissions Matrix

## 1. Guiding Authorization Principle
> **"Public utility requires zero-barrier public access. Data integrity requires strict cryptographic authorization."**

Anyone in Dhaka can search routes, view fares, inspect disruptions, and chat with the AI assistant without creating an account or logging in. However, modifying authoritative network geometry, overriding fare rules, and approving public disruption alerts requires verified administrative roles.

---

## 2. Permissions Matrix

| Capability / API Operation | Anonymous Guest (`anon`) | Authenticated Commuter (`user`) | Authorized Transit Admin (`admin`) |
|---|---|---|---|
| View hubs, stops, services & segments | Allowed | Allowed | Allowed |
| Compute multimodal routes & fares (`POST /api/plan`) | Allowed | Allowed | Allowed |
| Conversational AI route queries (`POST /api/chat`) | Allowed | Allowed | Allowed |
| View active/approved disruption alerts | Allowed | Allowed | Allowed |
| Submit crowd disruption report (`POST /api/reports`) | Allowed (via `pending` queue with rate limits) | Allowed (tied to user profile) | Allowed (instant auto-approval) |
| Vote / confirm disruption (`POST /api/reports/:id/feedback`) | Allowed (1 vote per client fingerprint) | Allowed (1 vote per user ID) | Allowed (administrative override) |
| Save personal favorite routes | LocalStorage only | Saved to Supabase Database | Saved to Supabase Database |
| Approve / reject pending crowd reports | **DENIED** (403 Forbidden) | **DENIED** (403 Forbidden) | Allowed |
| Edit network topology (hubs, stops, segments) | **DENIED** (403 Forbidden) | **DENIED** (403 Forbidden) | Allowed |
| Modify statutory fare tables | **DENIED** (403 Forbidden) | **DENIED** (403 Forbidden) | Allowed |
| Assign or revoke admin roles | **DENIED** (403 Forbidden) | **DENIED** (403 Forbidden) | Restricted to `superadmin` |

---

## 3. Database Row Level Security (RLS) Policies
1. **`hubs`, `stops`, `services`, `service_stops`, `segments`, `fare_rules`**:
   - `SELECT`: `TRUE` for `anon` and `authenticated`.
   - `INSERT`, `UPDATE`, `DELETE`: Restricted to users where `auth.uid()` exists in `admin_roles` with `role = 'admin'`.
2. **`alerts`**:
   - `SELECT`: `status = 'approved'` OR `auth.uid() = reporter_id` OR user is `admin`.
   - `INSERT`: Allowed for `anon` (with `status = 'pending'`), `authenticated` (with `status = 'pending'`), and `admin` (with `status = 'approved'`).
   - `UPDATE`, `DELETE`: Restricted to `admin`.
3. **`alert_votes`**:
   - `SELECT`: `TRUE`.
   - `INSERT`: Enforces uniqueness on `(alert_id, voter_fingerprint)` via composite primary key / unique index.
4. **`admin_roles`**:
   - Protected from all client mutations; readable only by server service role or authenticated owner.

---

## 4. Abuse Prevention & Rate Limiting
- **Anonymous Report Submission Rate Limit:** Maximum 3 incident submissions per 15 minutes per IP/client fingerprint.
- **Payload Validation:** Schema-enforced validation (Zod) on all incoming requests; coordinates checked against Dhaka bounding box.
- **Bot Mitigation:** Integration with Cloudflare Turnstile on public report forms to eliminate automated spam attacks.
