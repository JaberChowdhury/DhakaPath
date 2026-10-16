'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Container,
  Grid,
  Stack,
  Box,
  Text,
  Title,
  Alert,
  SegmentedControl,
  Paper,
  Badge,
  Group,
  Button,
  Loader,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconSparkles,
  IconTrain,
  IconBus,
  IconCar,
  IconCurrentLocation,
  IconShieldCheck,
  IconSchool,
  IconClock,
  IconArrowRight,
} from '@tabler/icons-react';

import { Navbar } from '@/components/layout/Navbar';
import { TripPlannerForm } from '@/components/trip/TripPlannerForm';
import { RouteCard } from '@/components/trip/RouteCard';
import { AlertFeed } from '@/components/alerts/AlertFeed';
import { TransitNetworkBrowser } from '@/components/network/TransitNetworkBrowser';
import { SimulationComparisonBanner } from '@/components/trip/SimulationComparisonBanner';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { Hub, Stop, TransitMode } from '@/types/network';
import { PlannedRoute, PlanResponse } from '@/types/api';
import { DisruptionAlert } from '@/types/alerts';

// Dynamic import for Leaflet client component
const LeafletMapView = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <Box
      style={{
        height: '100%',
        minHeight: 520,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}
    >
      <Stack align="center" gap="xs">
        <Loader color="teal" />
        <Text size="sm" c="dimmed">
          Loading Dhaka Transit Road Map...
        </Text>
      </Stack>
    </Box>
  ),
});

// Haversine distance calculator in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'planner' | 'alerts' | 'network' | 'admin'>('planner');
  const [chatOpened, setChatOpened] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // Network State
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [alerts, setAlerts] = useState<DisruptionAlert[]>([]);

  // Trip Search State (default empty destination as requested)
  const [originHubId, setOriginHubId] = useState<string>('');
  const [destinationHubId, setDestinationHubId] = useState<string>('');
  const [student, setStudent] = useState<boolean>(true);
  const [budgetBdt, setBudgetBdt] = useState<number | null>(null);
  const [avoidHubIds, setAvoidHubIds] = useState<string[]>([]);
  const [allowedModes, setAllowedModes] = useState<TransitMode[]>([
    'metro',
    'bus',
    'leguna',
    'rickshaw',
    'walk',
  ]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

  // Search Results & Comparison
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [baselineRoute, setBaselineRoute] = useState<PlannedRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<PlannedRoute | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  // Geolocation & Live Tracking State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  // Fetch Network Data
  const fetchNetworkData = async () => {
    try {
      const [stopsRes, alertsRes] = await Promise.all([
        fetch('/api/stops'),
        fetch(`/api/alerts${scenarioId ? `?scenarioId=${scenarioId}` : ''}`),
      ]);
      const stopsData = await stopsRes.json();
      const alertsData = await alertsRes.json();

      setHubs(stopsData.hubs || []);
      setStops(stopsData.stops || []);
      setAlerts(alertsData.alerts || []);
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [scenarioId]);

  // Request browser geolocation permission & identify closest station
  const handleRequestLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      notifications.show({
        title: 'Geolocation Not Available',
        message: 'Your browser does not support geolocation.',
        color: 'red',
      });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        setUserLocation({ lat, lon, accuracy });
        setLocationLoading(false);

        // Find nearest hub using Haversine formula
        if (hubs.length > 0) {
          let closestHub = hubs[0];
          let minDistance = Infinity;

          hubs.forEach((hub) => {
            const dist = calculateDistanceKm(lat, lon, hub.center_lat, hub.center_lon);
            if (dist < minDistance) {
              minDistance = dist;
              closestHub = hub;
            }
          });

          setOriginHubId(closestHub.id);
          const distLabel =
            minDistance < 1
              ? `${Math.round(minDistance * 1000)} meters`
              : `${minDistance.toFixed(1)} km`;

          notifications.show({
            title: '📍 Location Detected',
            message: `Closest station is ${closestHub.name_en} (~${distLabel} away). Origin updated!`,
            color: 'teal',
          });
        }
      },
      (err) => {
        setLocationLoading(false);
        notifications.show({
          title: 'Location Permission',
          message: err.message || 'Please enable location permissions in your browser.',
          color: 'orange',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Toggle Continuous Live GPS Tracking
  const handleToggleLiveTracking = () => {
    if (isLiveTracking) {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
      notifications.show({
        title: 'Live Tracking Paused',
        message: 'Continuous GPS tracking paused.',
        color: 'gray',
      });
    } else {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        notifications.show({
          title: 'Geolocation Not Available',
          message: 'Your browser does not support GPS tracking.',
          color: 'red',
        });
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          setIsLiveTracking(false);
          notifications.show({
            title: 'GPS Tracking Error',
            message: err.message || 'Could not watch current GPS coordinates.',
            color: 'red',
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      watchIdRef.current = id;
      setIsLiveTracking(true);
      notifications.show({
        title: '📡 Live GPS Tracking Active',
        message: 'Your live position is updating in real time on the road map.',
        color: 'teal',
      });
    }
  };

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!originHubId || !destinationHubId) {
      notifications.show({
        title: 'Selection Required',
        message: 'Please choose both starting hub and destination.',
        color: 'red',
      });
      return;
    }

    setSearching(true);
    try {
      if (scenarioId) {
        // Fetch both unperturbed baseline and disrupted route to compute comparison delta
        const [baselineRes, disruptedRes] = await Promise.all([
          fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originHubId,
              destinationHubId,
              student,
              budgetBdt,
              avoidHubIds,
              allowedModes,
              scenarioId: null,
            }),
          }),
          fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originHubId,
              destinationHubId,
              student,
              budgetBdt,
              avoidHubIds,
              allowedModes,
              scenarioId,
            }),
          }),
        ]);

        const baselineData: PlanResponse = await baselineRes.json();
        const disruptedData: PlanResponse = await disruptedRes.json();

        setBaselineRoute(baselineData.routes?.[0] || null);
        setPlanResult(disruptedData);
        setSelectedRoute(disruptedData.routes?.[0] || null);
      } else {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originHubId,
            destinationHubId,
            student,
            budgetBdt,
            avoidHubIds,
            allowedModes,
            scenarioId: null,
          }),
        });

        const data: PlanResponse = await res.json();
        setPlanResult(data);
        setBaselineRoute(data.routes?.[0] || null);
        setSelectedRoute(data.routes?.[0] || null);
      }
    } catch {
      notifications.show({
        title: 'Planning Error',
        message: 'Failed to communicate with the routing engine.',
        color: 'red',
      });
    } finally {
      setSearching(false);
    }
  };

  // Re-run search only if both origin and destination are already selected and scenario changes
  useEffect(() => {
    if (originHubId && destinationHubId) {
      handleSearch();
    }
  }, [scenarioId]);

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'admin') {
            window.location.href = '/admin';
          } else {
            setActiveTab(tab);
          }
        }}
        activeAlertsCount={alerts.length}
        onOpenChat={() => setChatOpened(true)}
      />

      <Container size="xl" py="md" style={{ flex: 1, width: '100%', maxWidth: 1440 }}>
        {activeTab === 'alerts' ? (
          <AlertFeed alerts={alerts} hubs={hubs} onRefreshAlerts={fetchNetworkData} />
        ) : activeTab === 'network' ? (
          <TransitNetworkBrowser
            hubs={hubs}
            stops={stops}
            alerts={alerts}
            onSelectHubForPlan={(hubId) => {
              setOriginHubId(hubId);
              setActiveTab('planner');
            }}
          />
        ) : (
          <Stack gap="md">
            {/* Mobile View Switcher (Only visible on screens < 992px) */}
            <Box hiddenFrom="md">
              <SegmentedControl
                fullWidth
                size="sm"
                value={mobileView}
                onChange={(val: any) => setMobileView(val)}
                data={[
                  { label: '📋 Trip Options', value: 'list' },
                  { label: '🗺️ Road Map', value: 'map' },
                ]}
                styles={{
                  root: { background: 'var(--bg-card)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-subtle)' },
                }}
              />
            </Box>

            {/* Desktop Split-Grid: Responsive Left Scroll Pane + Sticky Right Map */}
            <Grid gap="lg" align="flex-start">
              {/* Left Column: Form, Suggestions, Results */}
              <Grid.Col
                span={{ base: 12, md: 5, lg: 5 }}
                className={mobileView === 'map' ? 'mobile-hide-list desktop-scroll-pane' : 'desktop-scroll-pane'}
              >
                <Stack gap="md">
                  <TripPlannerForm
                    hubs={hubs}
                    originHubId={originHubId}
                    setOriginHubId={setOriginHubId}
                    destinationHubId={destinationHubId}
                    setDestinationHubId={setDestinationHubId}
                    student={student}
                    setStudent={setStudent}
                    budgetBdt={budgetBdt}
                    setBudgetBdt={setBudgetBdt}
                    avoidHubIds={avoidHubIds}
                    setAvoidHubIds={setAvoidHubIds}
                    allowedModes={allowedModes}
                    setAllowedModes={setAllowedModes}
                    scenarioId={scenarioId}
                    setScenarioId={setScenarioId}
                    onSearch={handleSearch}
                    loading={searching}
                    onRequestLocation={handleRequestLocation}
                    locationLoading={locationLoading}
                  />

                  {/* Disruption Simulation Comparison Banner */}
                  {scenarioId && (
                    <SimulationComparisonBanner
                      scenarioId={scenarioId}
                      baselineRoute={baselineRoute}
                      disruptedRoute={planResult?.routes?.[0] || null}
                      isStudent={student}
                      onResetSimulation={() => setScenarioId(null)}
                    />
                  )}

                  {/* No Route Outcome Warning */}
                  {planResult && !planResult.success && planResult.status === 'NO_VALID_ROUTE' && (
                    <Alert
                      color="red"
                      variant="filled"
                      title="No Valid Route Found (Honest Routing Guarantee)"
                      icon={<IconAlertCircle size={20} />}
                    >
                      <Text size="sm">{planResult.message}</Text>
                      <Text size="xs" mt="xs" opacity={0.9}>
                        DhakaPath guarantees honest route reporting without inventing impassable detours or phantom connections.
                      </Text>
                    </Alert>
                  )}

                  {/* Candidate Route Results */}
                  {planResult && planResult.routes && planResult.routes.length > 0 && (
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text fw={600} size="sm" c="dimmed">
                          {planResult.routes.length} Multimodal Options Found:
                        </Text>
                        <Badge size="xs" color="teal">
                          {planResult.networkRevision}
                        </Badge>
                      </Group>

                      {planResult.routes.map((route) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          isStudent={student}
                          budgetBdt={budgetBdt}
                          isSelected={selectedRoute?.id === route.id}
                          onSelect={() => setSelectedRoute(route)}
                        />
                      ))}
                    </Stack>
                  )}

                  {/* Welcome Exploration Card (When no search has been performed yet) */}
                  {!planResult && !searching && (
                    <Paper
                      p="lg"
                      radius="md"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    >
                      <Stack gap="sm">
                        <Group gap="xs">
                          <ThemeIcon size="md" color="teal" variant="light" radius="md">
                            <IconSparkles size={18} />
                          </ThemeIcon>
                          <Title order={5} style={{ color: 'var(--text-main)' }}>
                            Dhaka Multimodal Transit Engine
                          </Title>
                        </Group>

                        <Text size="xs" c="dimmed" lh={1.6}>
                          Plan realistic trips across MRT Line 6, licensed city buses, and local legunas with real-world road alignments, student concession calculations, and live disruption intelligence.
                        </Text>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="xs">
                          <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                            <Group gap={8}>
                              <IconTrain size={16} color="#0d9488" />
                              <Box>
                                <Text size="xs" fw={600}>Metro Rail (MRT-6)</Text>
                                <Text size="11px" c="dimmed">Uttara to Motijheel spine</Text>
                              </Box>
                            </Group>
                          </Paper>

                          <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                            <Group gap={8}>
                              <IconBus size={16} color="#0284c7" />
                              <Box>
                                <Text size="xs" fw={600}>Bikolpo & Prochesta</Text>
                                <Text size="11px" c="dimmed">Major road corridors</Text>
                              </Box>
                            </Group>
                          </Paper>

                          <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                            <Group gap={8}>
                              <IconCar size={16} color="#d97706" />
                              <Box>
                                <Text size="xs" fw={600}>Hatirjheel Leguna</Text>
                                <Text size="11px" c="dimmed">Banasree to Gulshan feeder</Text>
                              </Box>
                            </Group>
                          </Paper>

                          <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                            <Group gap={8}>
                              <IconCurrentLocation size={16} color="#0284c7" />
                              <Box>
                                <Text size="xs" fw={600}>Live GPS Proximity</Text>
                                <Text size="11px" c="dimmed">Auto-detect nearest stop</Text>
                              </Box>
                            </Group>
                          </Paper>
                        </SimpleGrid>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Grid.Col>

              {/* Right Column: Sticky Full-Height Road Map */}
              <Grid.Col
                span={{ base: 12, md: 7, lg: 7 }}
                className={mobileView === 'list' ? 'mobile-hide-map desktop-sticky-map' : 'desktop-sticky-map'}
              >
                <LeafletMapView
                  hubs={hubs}
                  stops={stops}
                  selectedRoute={selectedRoute}
                  alerts={alerts}
                  userLocation={userLocation}
                  isLiveTracking={isLiveTracking}
                  onToggleLiveTracking={handleToggleLiveTracking}
                  onRequestLocation={handleRequestLocation}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        )}
      </Container>

      {/* Conversational AI Chat Drawer */}
      <ChatDrawer
        opened={chatOpened}
        onClose={() => setChatOpened(false)}
        onSelectRouteFromChat={(route) => {
          setSelectedRoute(route);
          setPlanResult({
            success: true,
            networkRevision: 'rev_2026_03_pilot',
            calculatedAt: new Date().toISOString(),
            routes: [route],
            activeAlertsCount: alerts.length,
          });
        }}
      />
    </Box>
  );
}
