"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Group,
  Text,
  Badge,
  SegmentedControl,
  Button,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCurrentLocation,
  IconNavigation,
  IconBroadcast,
} from "@tabler/icons-react";
import { Hub, Stop } from "@/types/network";
import { PlannedRoute } from "@/types/api";
import { DisruptionAlert } from "@/types/alerts";
import { getRoadPolylineForLeg } from "@/lib/routing/roadGeometry";

interface MapViewProps {
  hubs: Hub[];
  stops: Stop[];
  selectedRoute: PlannedRoute | null;
  alerts: DisruptionAlert[];
  userLocation?: { lat: number; lon: number; accuracy: number } | null;
  isLiveTracking?: boolean;
  onToggleLiveTracking?: () => void;
  onRequestLocation?: () => void;
  onSelectOrigin?: (hubId: string) => void;
  onSelectDestination?: (hubId: string) => void;
}

export default function LeafletMapView({
  hubs,
  stops,
  selectedRoute,
  alerts,
  userLocation,
  isLiveTracking,
  onToggleLiveTracking,
  onRequestLocation,
  onSelectOrigin,
  onSelectDestination,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<"geo" | "schematic">("geo");

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (viewMode !== "geo") return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [23.778, 90.395], // Central Dhaka
          zoom: 12,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = layerGroup;
      }

      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      if (!layerGroup) return;

      layerGroup.clearLayers();

      if (typeof window !== "undefined") {
        (window as any).dhakaPathSetOrigin = (id: string, name: string) => {
          if (onSelectOrigin) {
            onSelectOrigin(id);
            notifications.show({
              title: "📍 Origin Selected from Map",
              message: `Set ${name} as journey starting hub.`,
              color: "teal",
            });
          }
        };
        (window as any).dhakaPathSetDest = (id: string, name: string) => {
          if (onSelectDestination) {
            onSelectDestination(id);
            notifications.show({
              title: "🏁 Destination Selected from Map",
              message: `Set ${name} as journey destination.`,
              color: "cyan",
            });
          }
        };
      }

      // 1. Plot Hub Markers with Interactive Routing Actions
      hubs.forEach((hub) => {
        const marker = L.circleMarker([hub.center_lat, hub.center_lon], {
          radius: 7,
          fillColor: "#0284c7",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px;">
            <strong style="font-size: 13px;">${hub.name_en} (${hub.name_bn})</strong>
            <p style="margin: 3px 0 8px 0; font-size: 11px; color: #475569;">${hub.description || "Major Transit Interchange"}</p>
            <div style="display: flex; gap: 6px;">
              <button onclick="window.dhakaPathSetOrigin('${hub.id}', '${hub.name_en}')" style="flex: 1; padding: 5px 6px; font-size: 11px; font-weight: 600; background: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🟢 Start Here
              </button>
              <button onclick="window.dhakaPathSetDest('${hub.id}', '${hub.name_en}')" style="flex: 1; padding: 5px 6px; font-size: 11px; font-weight: 600; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🏁 Go Here
              </button>
            </div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 2. Plot Selected Route Polyline snapped to real road coordinates
      if (selectedRoute && selectedRoute.legs.length > 0) {
        const stopLookup = new Map<
          string,
          { lat: number; lon: number; name_en?: string }
        >();
        stops.forEach((s) => stopLookup.set(s.id, s));
        hubs.forEach((h) =>
          stopLookup.set(h.id, {
            lat: h.center_lat,
            lon: h.center_lon,
            name_en: h.name_en,
          }),
        );

        const routePoints: [number, number][] = [];

        selectedRoute.legs.forEach((leg, legIdx) => {
          const fromStop = stopLookup.get(leg.fromStopId);
          const toStop = stopLookup.get(leg.toStopId);

          if (fromStop && toStop) {
            // Retrieve actual road-following waypoints instead of straight chord
            const roadPoints = getRoadPolylineForLeg(
              [fromStop.lat, fromStop.lon],
              [toStop.lat, toStop.lon],
              leg.mode,
              leg.serviceId,
            );

            roadPoints.forEach((pt) => routePoints.push(pt));

            const lineColor =
              leg.mode === "metro"
                ? "#0d9488"
                : leg.mode === "bus"
                  ? "#0284c7"
                  : leg.mode === "leguna"
                    ? "#d97706"
                    : leg.mode === "rickshaw"
                      ? "#9333ea"
                      : "#64748b";

            const polyline = L.polyline(roadPoints, {
              color: lineColor,
              weight: 6,
              opacity: 0.92,
              dashArray: leg.mode === "walk" ? "5, 8" : undefined,
            });

            polyline.bindPopup(`
              <div style="color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif;">
                <strong style="color: ${lineColor}; font-size: 13px;">${leg.serviceName}</strong><br/>
                <span>${leg.fromStopName} ➔ ${leg.toStopName}</span><br/>
                <small style="color: #64748b;">Duration: ~${leg.durationMin} mins (${(leg.distanceMeters / 1000).toFixed(1)} km)</small>
                ${leg.boardingLandmark ? `<div style="font-size: 11px; margin-top: 4px; color: #0d9488;">📍 ${leg.boardingLandmark}</div>` : ""}
              </div>
            `);
            layerGroup.addLayer(polyline);

            // Add interchange/transfer stop dots
            const fromMarker = L.circleMarker([fromStop.lat, fromStop.lon], {
              radius: legIdx === 0 ? 8 : 6,
              fillColor: legIdx === 0 ? "#10b981" : "#ffffff",
              color: legIdx === 0 ? "#ffffff" : lineColor,
              weight: 3,
              opacity: 1,
              fillOpacity: 1,
            });
            fromMarker.bindPopup(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a;">
                <strong>${legIdx === 0 ? "🟢 Origin:" : "🔄 Transfer Stop:"}</strong> ${leg.fromStopName}
              </div>
            `);
            layerGroup.addLayer(fromMarker);

            const isFinalLeg = legIdx === selectedRoute.legs.length - 1;
            const toMarker = L.circleMarker([toStop.lat, toStop.lon], {
              radius: isFinalLeg ? 8 : 6,
              fillColor: isFinalLeg ? "#ef4444" : "#ffffff",
              color: isFinalLeg ? "#ffffff" : lineColor,
              weight: 3,
              opacity: 1,
              fillOpacity: 1,
            });
            toMarker.bindPopup(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a;">
                <strong>${isFinalLeg ? "🏁 Final Destination:" : "🔄 Next Leg:"}</strong> ${leg.toStopName}
              </div>
            `);
            layerGroup.addLayer(toMarker);
          }
        });

        if (routePoints.length > 0) {
          const bounds = L.latLngBounds(routePoints);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }

      // 3. Plot Live User GPS Location
      if (userLocation) {
        const beaconIcon = L.divIcon({
          className: "gps-live-beacon",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lon], {
          icon: beaconIcon,
        });
        userMarker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0f172a;">
            <strong>📍 You Are Here</strong><br/>
            Accuracy: ±${Math.round(userLocation.accuracy)}m<br/>
            ${isLiveTracking ? '<span style="color: #0d9488; font-weight: 600;">● Live GPS active</span>' : ""}
          </div>
        `);
        layerGroup.addLayer(userMarker);

        const accuracyCircle = L.circle([userLocation.lat, userLocation.lon], {
          radius: Math.max(userLocation.accuracy, 25),
          color: "#0284c7",
          weight: 1.5,
          fillColor: "#38bdf8",
          fillOpacity: 0.12,
        });
        layerGroup.addLayer(accuracyCircle);
      }

      // 4. Plot Disruption Markers
      alerts.forEach((alert) => {
        if (alert.severity === "high" || alert.severity === "critical") {
          const marker = L.circleMarker([23.747, 90.4145], {
            radius: 9,
            fillColor: "#e11d48",
            color: "#ffe4e6",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          });

          marker.bindPopup(`
            <div style="color: #9f1239; font-family: 'Plus Jakarta Sans', sans-serif;">
              <strong>⚠️ ${alert.title}</strong>
              <p style="margin: 4px 0 0 0; font-size: 11px;">${alert.description}</p>
            </div>
          `);
          layerGroup.addLayer(marker);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [
    hubs,
    stops,
    selectedRoute,
    alerts,
    viewMode,
    userLocation,
    isLiveTracking,
  ]);

  // Center on user location
  const handleRecenterUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 15, {
        animate: true,
      });
    } else if (onRequestLocation) {
      onRequestLocation();
    }
  };

  return (
    <Paper
      radius="md"
      style={{
        position: "relative",
        height: "100%",
        minHeight: 520,
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top Controls Bar */}
      <Box
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 400,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {onToggleLiveTracking && (
          <Button
            size="xs"
            variant={isLiveTracking ? "filled" : "default"}
            color={isLiveTracking ? "teal" : "gray"}
            leftSection={
              <IconBroadcast
                size={14}
                className={isLiveTracking ? "animate-pulse" : ""}
              />
            }
            onClick={onToggleLiveTracking}
            styles={{
              root: {
                background: isLiveTracking ? undefined : "var(--bg-card)",
                backdropFilter: "blur(10px)",
                borderColor: "var(--border-subtle)",
                color: isLiveTracking ? "#ffffff" : "var(--text-main)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              },
            }}
          >
            {isLiveTracking ? "GPS Tracking Active" : "Live GPS"}
          </Button>
        )}

        {userLocation && (
          <Tooltip label="Center on My Location">
            <Button
              size="xs"
              variant="default"
              px={8}
              onClick={handleRecenterUser}
              styles={{
                root: {
                  background: "var(--bg-card)",
                  backdropFilter: "blur(10px)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            >
              <IconCurrentLocation size={15} color="#0284c7" />
            </Button>
          </Tooltip>
        )}

        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={(val: any) => setViewMode(val)}
          data={[
            { label: "🗺️ Road Map", value: "geo" },
            { label: "📐 Schematic", value: "schematic" },
          ]}
          styles={{
            root: {
              background: "var(--bg-card)",
              backdropFilter: "blur(10px)",
              borderColor: "var(--border-subtle)",
              borderWidth: 1,
              borderStyle: "solid",
            },
          }}
        />
      </Box>

      {/* Mode Legend */}
      <Box
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          zIndex: 400,
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <Group gap="xs">
          <Badge size="xs" color="teal">
            MRT-6
          </Badge>
          <Badge size="xs" color="blue">
            Bus (Roads)
          </Badge>
          <Badge size="xs" color="orange">
            Leguna
          </Badge>
          <Badge size="xs" color="grape">
            Rickshaw
          </Badge>
          {userLocation && (
            <Badge size="xs" color="cyan" variant="dot">
              Your Location
            </Badge>
          )}
          <Badge size="xs" color="red">
            Disruption
          </Badge>
        </Group>
      </Box>

      {viewMode === "geo" ? (
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%", minHeight: 520 }}
        />
      ) : (
        /* Schematic Network SVG View */
        <Box
          p="md"
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-card-inner)",
          }}
        >
          <svg
            viewBox="0 0 800 500"
            width="100%"
            height="100%"
            style={{ maxHeight: 480 }}
          >
            {/* MRT Line 6 Spine (Emerald) */}
            <path
              d="M 120 80 L 220 180 L 320 250 L 420 310 L 520 370 L 640 440"
              stroke="#0d9488"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Bus Corridor (Bikolpo - Blue) */}
            <path
              d="M 220 180 Q 300 280 420 310 T 640 440"
              stroke="#0284c7"
              strokeWidth="4"
              strokeDasharray="6,6"
              fill="none"
            />
            {/* Eastern Leguna Feeder (Orange) */}
            <path
              d="M 680 200 L 580 220 L 480 230"
              stroke="#d97706"
              strokeWidth="5"
              fill="none"
            />
            {/* Hub Circles */}
            {[
              { x: 120, y: 80, label: "Uttara North" },
              { x: 220, y: 180, label: "Mirpur 10" },
              { x: 320, y: 250, label: "Agargaon" },
              { x: 420, y: 310, label: "Farmgate" },
              { x: 520, y: 370, label: "Shahbagh" },
              { x: 640, y: 440, label: "Motijheel" },
              { x: 680, y: 200, label: "Banasree" },
              { x: 480, y: 230, label: "Gulshan 1" },
            ].map((node, i) => (
              <g key={i}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="3"
                />
                <text
                  x={node.x + 12}
                  y={node.y + 4}
                  fill="var(--text-main)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </Box>
      )}
    </Paper>
  );
}
