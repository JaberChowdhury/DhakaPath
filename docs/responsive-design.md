# DhakaPath: Mobile-First Responsive Design & Layout Specification

## 1. Core Principles
Public transit commuters in Dhaka primarily access navigation tools on smartphones while walking, standing on crowded buses, or sitting in rickshaws over variable mobile cellular connections (3G/4G). The UI must prioritize:
1. **Zero Horizontal Scroll:** At viewport widths from 360px upwards.
2. **One-Thumb Reachability:** Essential search, filter, and alert interaction triggers placed within comfortable reach at the bottom of the viewport.
3. **High Contrast Sunlight Legibility:** High-contrast text tokens, crisp icons, and uncluttered route cards.
4. **Keyboard-Safe Inputs:** Chat input bars and report submission modals must remain pinned and visible when the mobile virtual keyboard pops up (`interactive-widget=resizes-content`).

---

## 2. Tested Responsive Breakpoints

| Breakpoint | Target Screen Width | Target Device Class | Layout Adaptation |
|---|---|---|---|
| `xs` | `360px` | Entry-level Android (Samsung Galaxy A03, Walton, Symphony) | Single column; compact route cards; map hidden behind a toggle tab; bottom fixed search CTA. |
| `sm` | `390px – 430px` | Standard iPhones & Modern Androids (iPhone 14/15, Pixel) | Full-width route summary pills; collapsible map drawer; sticky filter chip bar. |
| `md` | `768px – 1023px` | Tablets & Foldables (iPad Mini, Galaxy Fold unfolded) | Split view: 45% sidebar for trip options & chat drawer, 55% interactive Leaflet map canvas. |
| `lg` | `1024px – 1280px` | Desktop laptops & monitors | 3-column dashboard: Left (Search & Route list), Center (Interactive Leaflet Map), Right (AI Transit Assistant & Live Alert Feed). |

---

## 3. Screen Structure & State Transitions

### A. Home / Journey Search Screen
- **Input Fields:** Autocomplete inputs for Origin and Destination supporting English, Bangla, and Banglish aliases with fast local indexing (no round-trip geocoder bottleneck).
- **Preference Controls:**
  - Student Concession toggle (`[x] Student (50% Bus Discount)`).
  - Maximum Budget filter pill (`< 30 BDT`, `< 60 BDT`, `< 100 BDT`, `Any`).
  - Mode exclusion filters (`[Metro] [Bus] [Leguna] [Rickshaw]`).

### B. Route Results & Details View
- Primary display order:
  1. Quick summary metric pills (Fare, Time, Transfers, Disruption Indicator).
  2. Step-by-step multimodal journey accordion:
     - Boarding landmark guidance (e.g. *"Walk under footbridge opposite Ananda Cinema to Metro Concourse Gate 2"*).
     - Individual leg fare breakdown with student subsidy indicator.
     - Feeder estimated fare ranges and surge warnings.
  3. Real-time disruption badge alerting if any leg has active congestion, waterlogging, or closures.

### C. Conversational Chat Drawer
- **Mobile (`< 768px`):** Slides up from the bottom as an accessible Mantine Drawer (85% viewport height) with an auto-scrolling message list and sticky bottom input.
- **Desktop (`>= 1024px`):** Embedded docked right sidebar.
- Preserves full state when toggled; allows conversational filtering (e.g. *"Avoid Farmgate, I only have 50 taka"*).

### D. Crowd Incident Submission Flow
- Accessible directly from mobile navbar (`+ Report Incident`).
- Simplified 3-step bottom modal:
  1. Select affected transit hub / location from dropdown or map pin.
  2. Select incident type: Waterlogging, Road Closure, Severe Jam, VIP Movement, Metro Delay.
  3. Severity & optional photo/note.
- Optimistic feedback with instant confirmation notification.

### E. Administrative Moderation Portal
- Responsive card view for mobile moderation:
  - Incident details, reporter type (`guest` vs `admin`), reported time, and map extent.
  - One-tap quick actions: `[Approve & Broadcast]`, `[Reject / Spam]`, `[Add Delay Override]`.
- Desktop view provides full-width data tables with bulk actions and network topology editing.
