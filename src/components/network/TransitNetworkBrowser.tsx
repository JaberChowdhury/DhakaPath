'use client';

import React, { useState } from 'react';
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
  TextInput,
  Tabs,
  Table,
  ThemeIcon,
  Box,
  SimpleGrid,
} from '@mantine/core';
import {
  IconSearch,
  IconMapPin,
  IconRoute,
  IconTrain,
  IconBus,
  IconCar,
  IconCoins,
  IconAlertTriangle,
  IconCheck,
  IconArrowRight,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Hub, Stop, Service, ServiceStop, TransitMode } from '@/types/network';
import { DisruptionAlert } from '@/types/alerts';

interface TransitNetworkBrowserProps {
  hubs: Hub[];
  stops: Stop[];
  alerts: DisruptionAlert[];
  onSelectHubForPlan: (hubId: string) => void;
}

export function TransitNetworkBrowser({
  hubs,
  stops,
  alerts,
  onSelectHubForPlan,
}: TransitNetworkBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('hubs');

  // Filter hubs by search query (name en, name bn, or alias)
  const filteredHubs = hubs.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      h.name_en.toLowerCase().includes(q) ||
      h.name_bn.includes(q) ||
      h.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  // Services metadata
  const servicesList: Array<{
    id: string;
    name: string;
    mode: TransitMode;
    operator: string;
    routeCode: string;
    description: string;
    regularFare: string;
    studentFare: string;
    minFloor: string;
    stopsSequence: string[];
  }> = [
    {
      id: 'srv_metro_mrt6',
      name: 'MRT Line 6 (ঢাকা মেট্রোরেল)',
      mode: 'metro',
      operator: 'Dhaka Mass Transit Company Ltd (DMTCL)',
      routeCode: 'MRT-6',
      description: 'Grade-separated elevated rapid transit corridor along North-South spine.',
      regularFare: '20 - 100 ৳ (distance graduated)',
      studentFare: 'Not Applicable (10% discount on registered MRT Pass)',
      minFloor: '20 ৳',
      stopsSequence: [
        'Uttara North',
        'Mirpur 10',
        'Kazipara',
        'Shewrapara',
        'Agargaon',
        'Farmgate',
        'Karwan Bazar',
        'Shahbagh',
        'Motijheel',
      ],
    },
    {
      id: 'srv_bus_bikolpo',
      name: 'Bikolpo Auto Service (বিকল্প অটো সার্ভিস)',
      mode: 'bus',
      operator: 'Bikolpo Paribahan Syndicate',
      routeCode: 'BIK-01',
      description: 'Major arterial city bus connecting Mirpur, Central Dhaka, and Motijheel Commercial Area.',
      regularFare: '25 ৳ flat',
      studentFare: '13 ৳ (Statutory 50% discount with 10 BDT floor applied)',
      minFloor: '10 ৳',
      stopsSequence: [
        'Mirpur 10',
        'Kazipara',
        'Shewrapara',
        'Agargaon',
        'Farmgate',
        'Karwan Bazar',
        'Shahbagh',
        'Motijheel',
      ],
    },
    {
      id: 'srv_bus_prochesta',
      name: 'Prochesta Paribahan (প্রচেষ্টা পরিবহন)',
      mode: 'bus',
      operator: 'Prochesta Ltd.',
      routeCode: 'PRO-02',
      description: 'Airport Road and East Central corridor bus connecting Uttara to Motijheel via Mohakhali and Malibagh.',
      regularFare: '30 ৳ flat',
      studentFare: '15 ৳ (Statutory 50% discount with 10 BDT floor applied)',
      minFloor: '10 ৳',
      stopsSequence: [
        'Uttara North',
        'Airport',
        'Banani',
        'Mohakhali',
        'Moghbazar',
        'Malibagh',
        'Motijheel',
      ],
    },
    {
      id: 'srv_leguna_banasree',
      name: 'Banasree-Gulshan Leguna (বনশ্রী-গুলশান লেগুনা)',
      mode: 'leguna',
      operator: 'Human Hauler Welfare Union',
      routeCode: 'LEG-09',
      description: 'High-frequency feeder connector bridging East Dhaka residential areas to Gulshan Diplomatic Zone.',
      regularFare: '15 - 25 ৳',
      studentFare: 'Not Applicable (Exempt commercial feeder tariff)',
      minFloor: '15 ৳',
      stopsSequence: [
        'Rampura',
        'Banasree',
        'Gulshan 1',
      ],
    },
  ];

  // Helper to determine active disruption status for a hub
  const getHubAlertStatus = (hub: Hub) => {
    const hubStops = stops.filter((s) => s.hub_id === hub.id);
    const stopIds = new Set(hubStops.map((s) => s.id));

    // Check if any active alert affects this hub
    const activeDisruptions = alerts.filter((a) => {
      // Direct title match or affected segment involvement
      const titleMatch = a.title.toLowerCase().includes(hub.name_en.toLowerCase()) ||
        (hub.name_bn && a.title.includes(hub.name_bn));
      return titleMatch;
    });

    if (activeDisruptions.length > 0) {
      return {
        hasAlert: true,
        message: activeDisruptions[0].title,
        severity: activeDisruptions[0].severity,
      };
    }

    return {
      hasAlert: false,
      message: 'No active disruptions reported',
      severity: 'none',
    };
  };

  const getModeColor = (mode: TransitMode) => {
    switch (mode) {
      case 'metro':
        return 'teal';
      case 'bus':
        return 'blue';
      case 'leguna':
        return 'orange';
      case 'rickshaw':
        return 'grape';
      default:
        return 'gray';
    }
  };

  const getModeIcon = (mode: TransitMode) => {
    switch (mode) {
      case 'metro':
        return <IconTrain size={16} />;
      case 'bus':
        return <IconBus size={16} />;
      case 'leguna':
        return <IconCar size={16} />;
      default:
        return <IconMapPin size={16} />;
    }
  };

  return (
    <Stack gap="md">
      {/* Top Banner */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Box>
            <Group gap="xs">
              <IconRoute size={24} color="#2dd4bf" />
              <Title order={3} style={{ color: 'var(--text-main)' }}>
                Dhaka Transit Network (ঢাকা ট্রানজিট নেটওয়ার্ক)
              </Title>
              <Badge color="teal" variant="light">
                14 Hubs • 4 Services
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Official multimodal corridor catalog covering Rapid Transit (MRT-6), City Buses, Feeder Haulers, and Rickshaw links.
            </Text>
          </Box>

          <TextInput
            placeholder="Search hub or service..."
            leftSection={<IconSearch size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="xs"
            style={{ width: 260 }}
            styles={{
              input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
            }}
          />
        </Group>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'hubs')} color="teal">
        <Tabs.List>
          <Tabs.Tab value="hubs" leftSection={<IconMapPin size={16} />}>
            Multimodal Hubs ({filteredHubs.length})
          </Tabs.Tab>
          <Tabs.Tab value="services" leftSection={<IconBus size={16} />}>
            Transit Services & Routes (4)
          </Tabs.Tab>
          <Tabs.Tab value="fares" leftSection={<IconCoins size={16} />}>
            Statutory Fare Schedules
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Hubs Catalog */}
        <Tabs.Panel value="hubs" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filteredHubs.map((hub) => {
              const hubStops = stops.filter((s) => s.hub_id === hub.id);
              const status = getHubAlertStatus(hub);
              const modes = Array.from(new Set(hubStops.map((s) => s.mode)));

              return (
                <Card
                  key={hub.id}
                  p="md"
                  radius="md"
                  style={{
                    background: 'var(--bg-card)',
                    border: status.hasAlert
                      ? '1px solid #f59e0b'
                      : '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Stack gap="xs" justify="space-between" style={{ height: '100%' }}>
                    <Box>
                      <Group justify="space-between" align="flex-start">
                        <Box>
                          <Text fw={700} size="md" style={{ color: 'var(--text-main)' }}>
                            {hub.name_en}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {hub.name_bn}
                          </Text>
                        </Box>

                        <Badge
                          size="xs"
                          color={status.hasAlert ? 'yellow' : 'teal'}
                          variant="light"
                          leftSection={status.hasAlert ? <IconAlertTriangle size={10} /> : <IconCheck size={10} />}
                        >
                          {status.hasAlert ? 'Alert Reported' : 'Normal Operations'}
                        </Badge>
                      </Group>

                      {/* Modes Badges */}
                      <Group gap={4} mt="xs">
                        {modes.map((m) => (
                          <Badge
                            key={m}
                            size="xs"
                            variant="outline"
                            color={getModeColor(m)}
                            leftSection={getModeIcon(m)}
                          >
                            {m.toUpperCase()}
                          </Badge>
                        ))}
                      </Group>

                      {/* Landmarks */}
                      {hubStops.length > 0 && hubStops[0].boarding_landmark && (
                        <Text size="xs" c="gray.3" mt="xs">
                          📍 <Text span c="dimmed">Boarding:</Text> {hubStops[0].boarding_landmark}
                        </Text>
                      )}

                      {/* Active Alert Note */}
                      {status.hasAlert && (
                        <Text size="xs" c="yellow" mt={4} fw={500}>
                          ⚠️ {status.message}
                        </Text>
                      )}
                    </Box>

                    {/* Action: Plan Trip From Here */}
                    <Button
                      fullWidth
                      size="xs"
                      variant="light"
                      color="teal"
                      rightSection={<IconArrowRight size={14} />}
                      onClick={() => onSelectHubForPlan(hub.id)}
                      mt="xs"
                    >
                      Plan Trip from Here
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>

        {/* Tab 2: Transit Services */}
        <Tabs.Panel value="services" pt="md">
          <Stack gap="md">
            {servicesList.map((srv) => (
              <Card
                key={srv.id}
                p="md"
                radius="md"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="xs">
                        <ThemeIcon size="md" color={getModeColor(srv.mode)} variant="light">
                          {getModeIcon(srv.mode)}
                        </ThemeIcon>
                        <Box>
                          <Text fw={700} size="md" style={{ color: 'var(--text-main)' }}>
                            {srv.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {srv.operator} • Route Code: {srv.routeCode}
                          </Text>
                        </Box>
                      </Group>
                    </Box>

                    <Badge size="sm" color={getModeColor(srv.mode)} variant="filled">
                      {srv.mode.toUpperCase()}
                    </Badge>
                  </Group>

                  <Text size="sm" c="gray.3">
                    {srv.description}
                  </Text>

                  {/* Route Sequence Pills */}
                  <Box>
                    <Text size="xs" fw={600} c="dimmed" mb={4}>
                      STOP SEQUENCE (স্টপেজ তালিকা):
                    </Text>
                    <Group gap={4} wrap="wrap">
                      {srv.stopsSequence.map((stopName, idx) => (
                        <React.Fragment key={idx}>
                          <Badge size="xs" variant="light" color="gray">
                            {stopName}
                          </Badge>
                          {idx < srv.stopsSequence.length - 1 && (
                            <Text size="xs" c="dimmed">
                              ➔
                            </Text>
                          )}
                        </React.Fragment>
                      ))}
                    </Group>
                  </Box>

                  {/* Fare and Concession Specs */}
                  <Grid mt="xs" gap="xs">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                        <Text size="xs" c="dimmed">
                          Regular Tariff:
                        </Text>
                        <Text size="sm" fw={600} style={{ color: '#2dd4bf' }}>
                          {srv.regularFare}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                        <Text size="xs" c="dimmed">
                          Student Concession:
                        </Text>
                        <Text size="sm" fw={600} style={{ color: '#38bdf8' }}>
                          {srv.studentFare}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Paper p="xs" radius="sm" style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-subtle)' }}>
                        <Text size="xs" c="dimmed">
                          Statutory Floor:
                        </Text>
                        <Text size="sm" fw={600} style={{ color: 'var(--text-main)' }}>
                          {srv.minFloor}
                        </Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        {/* Tab 3: Fare Schedules */}
        <Tabs.Panel value="fares" pt="md">
          <Paper p="md" radius="md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
            <Group gap="xs" mb="xs">
              <IconCoins size={20} color="#2dd4bf" />
              <Title order={4} style={{ color: 'var(--text-main)' }}>
                Statutory Fare Schedule & Student Discount Policies
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mb="md">
              Evaluated per continuous vehicle ride (not per graph segment). Buses apply: max(10 BDT, ceil(regular × 0.5)).
            </Text>

            <Table striped verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mode / Corridor</Table.Th>
                  <Table.Th>Calculation Basis</Table.Th>
                  <Table.Th>Regular Fare</Table.Th>
                  <Table.Th>Student Concession</Table.Th>
                  <Table.Th>Statutory Floor</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600} style={{ color: '#2dd4bf' }}>
                    🚇 MRT Line 6
                  </Table.Td>
                  <Table.Td>Distance graduated (Elevated rail)</Table.Td>
                  <Table.Td>20 - 100 ৳</Table.Td>
                  <Table.Td>Standard tariff (10% MRT Pass discount)</Table.Td>
                  <Table.Td>20 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600} style={{ color: '#38bdf8' }}>
                    🚌 Bikolpo Auto Service
                  </Table.Td>
                  <Table.Td>Per continuous ride</Table.Td>
                  <Table.Td>25 ৳</Table.Td>
                  <Table.Td>13 ৳ (50% statutory discount)</Table.Td>
                  <Table.Td>10 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600} style={{ color: '#38bdf8' }}>
                    🚌 Prochesta Paribahan
                  </Table.Td>
                  <Table.Td>Per continuous ride</Table.Td>
                  <Table.Td>30 ৳</Table.Td>
                  <Table.Td>15 ৳ (50% statutory discount)</Table.Td>
                  <Table.Td>10 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600} style={{ color: '#f59e0b' }}>
                    🚐 Banasree Leguna
                  </Table.Td>
                  <Table.Td>Fixed corridor tariff</Table.Td>
                  <Table.Td>15 - 25 ৳</Table.Td>
                  <Table.Td>Exempt from student concession</Table.Td>
                  <Table.Td>15 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600} style={{ color: '#a855f7' }}>
                    🛺 Feeder Rickshaw
                  </Table.Td>
                  <Table.Td>Non-metered negotiated range</Table.Td>
                  <Table.Td>30 - 60 ৳ (Estimated)</Table.Td>
                  <Table.Td>Exempt from student concession</Table.Td>
                  <Table.Td>30 ৳</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
