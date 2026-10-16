# DhakaPath: Core API Contracts & Route Handler Specifications

All API route handlers reside in `src/app/api/` and output JSON with consistent HTTP status codes.

---

## 1. `GET /api/stops`
Search supported transit hubs, boarding stops, and colloquial aliases.

### Request Query Parameters
- `q` (string, optional): Search query (e.g. `mirpur`, `কাওরান`, `farmgate`).
- `mode` (string, optional): Filter by mode (`metro`, `bus`, `leguna`, `rickshaw`).

### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "stop_mirpur_10_metro",
      "hubId": "hub_mirpur_10",
      "nameEn": "Mirpur 10 Metro Station",
      "nameBn": "মিরপুর ১০ মেট্রোরেল স্টেশন",
      "mode": "metro",
      "lat": 23.8072,
      "lon": 90.3686,
      "boardingLandmark": "Concourse Level Gates 1-4, Mirpur Roundabout",
      "directionNotes": "Both Northbound to Uttara and Southbound to Motijheel"
    }
  ]
}
```

---

## 2. `POST /api/plan`
Deterministic multi-modal transit trip planning and fare estimation engine.

### Request Body
```json
{
  "originHubId": "hub_mirpur_10",
  "destinationHubId": "hub_shahbagh",
  "student": true,
  "budgetBdt": 50,
  "avoidHubIds": ["hub_farmgate"],
  "allowedModes": ["metro", "bus", "leguna", "rickshaw", "walk"],
  "maxTransfers": 2,
  "scenarioId": null
}
```

### Response Body (`200 OK`)
```json
{
  "success": true,
  "networkRevision": "rev_2026_03_pilot",
  "calculatedAt": "2026-03-02T10:00:00Z",
  "routes": [
    {
      "id": "route_bus_direct_bikolpo",
      "rankingProfile": "cheapest",
      "totalDurationMin": 42,
      "transfers": 0,
      "fareRegularBdt": 25,
      "fareStudentBdt": 13,
      "fareEstimatedRange": [13, 13],
      "budgetCategorization": "WITHIN_BUDGET",
      "hasActiveDisruptions": false,
      "legs": [
        {
          "legIndex": 0,
          "serviceId": "srv_bus_bikolpo",
          "serviceName": "Bikolpo Auto Service",
          "mode": "bus",
          "fromStopId": "stop_mirpur_10_bus_south",
          "fromStopName": "Mirpur 10 Bus Stand (Southbound)",
          "toStopId": "stop_shahbagh_bus_stop",
          "toStopName": "Shahbagh Bus Stoppage (BSMMU Gate)",
          "durationMin": 42,
          "distanceMeters": 9200,
          "fareRegular": 25,
          "fareStudent": 13,
          "fareRange": [13, 13],
          "boardingLandmark": "Beside Fire Service Station, Mirpur 10",
          "disruptions": []
        }
      ]
    }
  ],
  "warnings": []
}
```

### No Route Outcome (`200 OK` with explicit status)
```json
{
  "success": false,
  "status": "NO_VALID_ROUTE",
  "message": "No valid route could be constructed between Banasree and Kawran Bazar with the specified constraints because connecting segments are blocked by active disruptions.",
  "routes": []
}
```

---

## 3. `GET /api/alerts`
Retrieve public disruptions and transit incident warnings.

### Request Query Parameters
- `status` (string, optional, default: `approved`): Filter by moderation status.
- `mode` (string, optional): Filter by mode.

### Response Body (`200 OK`)
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alt_malibagh_waterlogging",
      "title": "Severe Waterlogging near Malibagh Railgate",
      "titleBn": "মালিবাগ রেলগেটে তীব্র জলাবদ্ধতা",
      "description": "Knee-deep water on southbound lanes following heavy rain. Bus movement restricted; rickshaws charging 2x surge.",
      "severity": "high",
      "status": "approved",
      "lifecycleStage": "active",
      "affectedModes": ["bus", "rickshaw", "leguna"],
      "observedAt": "2026-03-02T09:15:00Z",
      "expiresAt": "2026-03-02T13:15:00Z",
      "delayMinutes": 25,
      "isClosed": false,
      "upvotes": 14,
      "downvotes": 1
    }
  ]
}
```

---

## 4. `POST /api/reports`
Submit a crowdsourced transit disruption report.

### Request Body
```json
{
  "hubId": "hub_malibagh",
  "title": "Waterlogging on railgate road",
  "description": "Slow movement for buses, knee deep water",
  "severity": "medium",
  "affectedModes": ["bus", "rickshaw"]
}
```

### Response Body (`201 Created`)
```json
{
  "success": true,
  "message": "Report received and placed in moderation queue. Verified status will update shortly.",
  "reportId": "alt_user_submitted_uuid",
  "status": "pending"
}
```

---

## 5. `POST /api/chat`
Conversational intent parsing and grounded transit query response.

### Request Body
```json
{
  "message": "Banasree theke Motijheel jabo, ami student, budget 40 taka",
  "history": []
}
```

### Response Body (`200 OK`)
```json
{
  "success": true,
  "extractedIntent": {
    "origin": "Banasree",
    "originHubId": "hub_banasree",
    "destination": "Motijheel",
    "destinationHubId": "hub_motijheel",
    "student": true,
    "budgetBdt": 40,
    "avoidHubIds": []
  },
  "explanation": "I found the best route for you within your 40 BDT student budget. You can take a Leguna to Rampura Bridge (15 BDT), then board Prochesta Paribahan bus to Motijheel using your 50% student discount (15 BDT), totaling 30 BDT with a travel time of ~55 minutes.",
  "suggestedRoute": {
    "totalDurationMin": 55,
    "totalFareBdt": 30,
    "transfers": 1
  }
}
```
