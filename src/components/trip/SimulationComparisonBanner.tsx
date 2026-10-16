'use client';

import React from 'react';
import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Grid,
  Card,
  ThemeIcon,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconSparkles,
  IconArrowRight,
  IconClock,
  IconCoins,
  IconAlertTriangle,
  IconArrowsExchange,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { PlannedRoute } from '@/types/api';

interface SimulationComparisonBannerProps {
  scenarioId: string;
  baselineRoute: PlannedRoute | null;
  disruptedRoute: PlannedRoute | null;
  isStudent: boolean;
  onResetSimulation: () => void;
}

export function SimulationComparisonBanner({
  scenarioId,
  baselineRoute,
  disruptedRoute,
  isStudent,
  onResetSimulation,
}: SimulationComparisonBannerProps) {
  const getScenarioDetails = () => {
    switch (scenarioId) {
      case 'disrupt_malibagh_waterlogging':
        return {
          title: '🌊 Waterlogging at Malibagh Railgate',
          brokenSegment: 'Malibagh Railgate ➔ Mouchak (Road Corridor)',
          affectedModes: ['bus', 'rickshaw', 'leguna'],
          rerouteReason: 'Roadway inundated with knee-deep water. Traffic rerouted via Gulshan 1 and Mohakhali bypass.',
        };
      case 'disrupt_farmgate_vip_movement':
        return {
          title: '🚔 VIP Motorcade Movement at Farmgate',
          brokenSegment: 'Farmgate Intersection Corridor',
          affectedModes: ['bus'],
          rerouteReason: 'Surface road holds for VIP convoy create +20 min delay on arterial buses. Metro remains unaffected.',
        };
      case 'disrupt_mrt_shewrapara_delay':
        return {
          title: '🚇 MRT Line 6 Signaling Calibration',
          brokenSegment: 'Shewrapara Elevated Viaduct',
          affectedModes: ['metro'],
          rerouteReason: 'Temporary speed restrictions add +10 min transit time on rapid transit trains.',
        };
      case 'disrupt_rampura_blockade':
        return {
          title: '🚫 Rampura Canal Access Blockade',
          brokenSegment: 'Rampura Bridge Feeder Corridor',
          affectedModes: ['rickshaw', 'walk', 'leguna'],
          rerouteReason: 'Critical connector severed with no bypass. Demonstrates honest NO_VALID_ROUTE outcome without hallucination.',
        };
      default:
        return {
          title: `Synthetic Disruption: ${scenarioId}`,
          brokenSegment: 'Corridor Segments',
          affectedModes: ['bus'],
          rerouteReason: 'Injected disruption alters transit travel times and segment accessibility.',
        };
    }
  };

  const details = getScenarioDetails();

  const baselineDuration = baselineRoute?.totalDurationMin || 0;
  const disruptedDuration = disruptedRoute?.totalDurationMin || 0;
  const timeDelta = disruptedDuration - baselineDuration;

  const baselineFare = isStudent ? baselineRoute?.fareStudentBdt || 0 : baselineRoute?.fareRegularBdt || 0;
  const disruptedFare = isStudent ? disruptedRoute?.fareStudentBdt || 0 : disruptedRoute?.fareRegularBdt || 0;
  const fareDelta = disruptedFare - baselineFare;

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.9) 0%, rgba(18, 25, 38, 0.95) 100%)',
        border: '1.5px solid #a855f7',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.25)',
      }}
    >
      <Stack gap="sm">
        {/* Banner Header */}
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon size="md" color="grape" variant="filled">
              <IconSparkles size={18} />
            </ThemeIcon>
            <Box>
              <Group gap={6} align="center">
                <Title order={4} style={{ color: '#fff' }}>
                  {details.title}
                </Title>
                <Badge color="grape" variant="light" size="xs">
                  Phase 6 Simulation
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Interactive before-and-after dynamic rerouting analysis.
              </Text>
            </Box>
          </Group>

          <Button
            size="xs"
            color="grape"
            variant="light"
            leftSection={<IconRefresh size={14} />}
            onClick={onResetSimulation}
          >
            Reset to Live Conditions
          </Button>
        </Group>

        {/* Broken Segment Info */}
        <Box p="xs" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconAlertTriangle size={16} color="#ef4444" />
              <Text size="xs" fw={600} style={{ color: '#fca5a5' }}>
                Blocked / Impassable Corridor:
              </Text>
              <Badge color="red" size="xs" variant="filled">
                {details.brokenSegment}
              </Badge>
            </Group>
            <Group gap={4}>
              {details.affectedModes.map((m) => (
                <Badge key={m} size="xs" color="gray" variant="outline">
                  {m}
                </Badge>
              ))}
            </Group>
          </Group>
          <Text size="xs" c="gray.3" mt={4}>
            💡 <Text span fw={600}>Reroute Rationale:</Text> {details.rerouteReason}
          </Text>
        </Box>

        {/* Comparative Cards: Baseline vs Disrupted */}
        {baselineRoute && disruptedRoute ? (
          <Grid gap="sm">
            {/* Baseline Route */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Card
                p="sm"
                radius="sm"
                style={{
                  background: 'rgba(10, 15, 24, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Badge size="xs" color="gray" variant="light">
                      Baseline Route (Original)
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {baselineRoute.transfers} transfers
                    </Text>
                  </Group>

                  <Group justify="space-between" align="baseline" mt={4}>
                    <Group gap={4}>
                      <IconClock size={16} color="#94a3b8" />
                      <Text fw={700} size="md" style={{ color: '#fff' }}>
                        {baselineDuration} min
                      </Text>
                    </Group>
                    <Group gap={4}>
                      <IconCoins size={16} color="#94a3b8" />
                      <Text fw={700} size="md" style={{ color: '#94a3b8' }}>
                        {baselineFare} ৳
                      </Text>
                    </Group>
                  </Group>

                  <Group gap={4} mt={4} wrap="wrap">
                    {baselineRoute.legs.map((l, i) => (
                      <Badge key={i} size="xs" variant="outline" color="gray">
                        {l.serviceName}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Disrupted / Detour Route */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Card
                p="sm"
                radius="sm"
                style={{
                  background: 'rgba(10, 15, 24, 0.6)',
                  border: '1px solid #2dd4bf',
                }}
              >
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Badge size="xs" color="teal" variant="filled">
                      Calculated Detour (Active)
                    </Badge>
                    <Text size="xs" c="teal">
                      {disruptedRoute.transfers} transfers
                    </Text>
                  </Group>

                  <Group justify="space-between" align="baseline" mt={4}>
                    <Group gap={6} align="center">
                      <IconClock size={16} color="#38bdf8" />
                      <Text fw={700} size="md" style={{ color: '#fff' }}>
                        {disruptedDuration} min
                      </Text>
                      {timeDelta > 0 && (
                        <Badge size="xs" color="orange" variant="light">
                          +{timeDelta} min
                        </Badge>
                      )}
                    </Group>
                    <Group gap={6} align="center">
                      <IconCoins size={16} color="#2dd4bf" />
                      <Text fw={700} size="md" style={{ color: '#2dd4bf' }}>
                        {disruptedFare} ৳
                      </Text>
                      {fareDelta > 0 && (
                        <Badge size="xs" color="yellow" variant="light">
                          +{fareDelta} ৳
                        </Badge>
                      )}
                    </Group>
                  </Group>

                  <Group gap={4} mt={4} wrap="wrap">
                    {disruptedRoute.legs.map((l, i) => (
                      <Badge key={i} size="xs" variant="filled" color="teal">
                        {l.serviceName}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        ) : null}
      </Stack>
    </Paper>
  );
}
