# DhakaPath: Data Quality, Provenance & Validation Report

## 1. Provenance Classifications
Every operational record in DhakaPath's transit graph adheres to strict dual classification:
- **`data_kind`**:
  - `sourced`: Extracted from authoritative public or published sources (e.g. DMTCL fare chart, OpenStreetMap geocoding, verified bus route databases).
  - `estimated`: Derived from verified field surveys and local commuter sampling where formal open data does not exist (e.g. rickshaw fare ranges, leguna intermediate boardings).
  - `demo`: Synthetic test fixtures and simulation injections; strictly isolated from live routing queries unless `scenarioId` is explicitly supplied.
- **`verification_status`**:
  - `unreviewed`: Ingested into staging but not yet verified by an administrator or transit lead.
  - `verified`: Manually audited against physical stops, timetable bounds, and tariff guidelines. Only verified records enter the production graph.
  - `rejected`: Deprecated or faulty coordinate/service definitions flagged during audit.

## 2. Multi-tier Data Pipeline
DhakaPath maintains strict physical separation between raw inputs, transformed staging records, approved master datasets, and simulation scenarios:

```
data/
  raw/                 # Original, untouched downloads and CSV snapshots
  staging/             # Intermediate transformed tables prior to approval
  approved/            # Version-controlled, audited canonical JSON/CSV seed sets
  demo/                # Synthetic test disruptions and benchmark scenarios
  source-register.csv  # Metadata catalog recording retrieval dates and licenses
  data-quality-report.md # Audit log of coverage and data anomalies
```

## 3. Data Cleansing & Validation Rules
1. **Coordinate Verification:** All latitudes must fall strictly within the Greater Dhaka bounding box ($23.65^\circ\text{N} \le \text{lat} \le 23.95^\circ\text{N}$) and longitudes ($90.30^\circ\text{E} \le \text{lon} \le 90.50^\circ\text{E}$).
2. **Directional Topology:** Directed graph edges (`segments`) must not be assumed symmetric. An A $\to$ B link on a divided avenue (e.g. Kazi Nazrul Islam Ave or Mirpur Road) does not imply B $\to$ A boarding availability without verified return geometry.
3. **Multi-lingual Aliases:** Hubs and boarding points provide English, Bengali script (বাংলা), and phonetic Banglish variants to support fuzzy input matching.
4. **Fare Invariants:** Unknown fares must be marked as `NULL` or given an explicit `[min, max]` range. Zero-fare records are restricted strictly to free pedestrian interchange links (`mode = 'walk'`).
5. **No Silent Overwrites:** Administrative overrides on segment speeds or transfer costs are tracked with `updated_by` and audit log trails. External batch imports cannot overwrite manually reviewed records without an explicit migration flag.
