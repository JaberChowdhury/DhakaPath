"use client";

import React, { useState } from "react";
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
  Box,
  SimpleGrid,
} from "@mantine/core";
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
} from "@tabler/icons-react";
import { Hub, Stop, TransitMode } from "@/types/network";
import { DisruptionAlert } from "@/types/alerts";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("hubs");

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
      id: "srv_metro_mrt6",
      name: "MRT Line 6 (ঢাকা মেট্রোরেল)",
      mode: "metro",
      operator: "Dhaka Mass Transit Company Ltd (DMTCL)",
      routeCode: "MRT-6",
      description:
        "Grade-separated elevated rapid transit corridor along North-South spine.",
      regularFare: "20 - 100 ৳ (distance graduated)",
      studentFare: "Not Applicable (10% discount on registered MRT Pass)",
      minFloor: "20 ৳",
      stopsSequence: [
        "Uttara North",
        "Mirpur 10",
        "Kazipara",
        "Shewrapara",
        "Agargaon",
        "Farmgate",
        "Karwan Bazar",
        "Shahbagh",
        "Motijheel",
      ],
    },
    {
      id: "srv_bus_bikolpo",
      name: "Bikolpo Auto Service (বিকল্প অটো সার্ভিস)",
      mode: "bus",
      operator: "Bikolpo Paribahan Syndicate",
      routeCode: "BIK-01",
      description:
        "Major arterial city bus connecting Mirpur, Central Dhaka, and Motijheel Commercial Area.",
      regularFare: "25 ৳ flat",
      studentFare: "13 ৳ (Statutory 50% discount with 10 BDT floor applied)",
      minFloor: "10 ৳",
      stopsSequence: [
        "Mirpur 10",
        "Kazipara",
        "Shewrapara",
        "Agargaon",
        "Farmgate",
        "Karwan Bazar",
        "Shahbagh",
        "Motijheel",
      ],
    },
    {
      id: "srv_bus_prochesta",
      name: "Prochesta Paribahan (প্রচেষ্টা পরিবহন)",
      mode: "bus",
      operator: "Prochesta Ltd.",
      routeCode: "PRO-02",
      description:
        "Airport Road and East Central corridor bus connecting Uttara to Motijheel via Mohakhali and Malibagh.",
      regularFare: "30 ৳ flat",
      studentFare: "15 ৳ (Statutory 50% discount with 10 BDT floor applied)",
      minFloor: "10 ৳",
      stopsSequence: [
        "Uttara North",
        "Airport",
        "Banani",
        "Mohakhali",
        "Moghbazar",
        "Malibagh",
        "Motijheel",
      ],
    },
    {
      id: "srv_leguna_banasree",
      name: "Banasree-Gulshan Leguna (বনশ্রী-গুলশান লেগুনা)",
      mode: "leguna",
      operator: "Human Hauler Welfare Union",
      routeCode: "LEG-09",
      description:
        "High-frequency feeder connector bridging East Dhaka residential areas to Gulshan Diplomatic Zone.",
      regularFare: "15 - 25 ৳",
      studentFare: "Not Applicable (feeder hauler fixed tariff)",
      minFloor: "15 ৳",
      stopsSequence: [
        "Banasree Block C",
        "Rampura Bridge",
        "Hatirjheel Circular Road",
        "Police Plaza Concord",
        "Gulshan 1 Circle",
      ],
    },
  ];

  const getHubAlertStatus = (hub: Hub) => {
    const hubAlerts = alerts.filter(
      (a) =>
        ((a as any).hub_id === hub.id || (a as any).hubId === hub.id) &&
        a.lifecycle_stage === "active",
    );
    if (hubAlerts.length > 0) {
      return {
        hasAlert: true,
        message: hubAlerts[0].title,
        severity: hubAlerts[0].severity,
      };
    }
    return {
      hasAlert: false,
      message: "Normal Operations",
      severity: "none",
    };
  };

  const getModeIcon = (mode: TransitMode) => {
    switch (mode) {
      case "metro":
        return <IconTrain size={14} />;
      case "bus":
        return <IconBus size={14} />;
      case "leguna":
        return <IconCar size={14} />;
      default:
        return <IconMapPin size={14} />;
    }
  };

  return (
    <Stack gap="lg">
      {/* Top Banner - Uber Style */}
      <Paper
        p="lg"
        radius="lg"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" align="center">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconRoute size={18} stroke={2.2} />
              </Box>
              <Title
                order={2}
                style={{
                  color: "var(--text-main)",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Dhaka Transit Network
              </Title>
              <Badge
                variant="outline"
                size="sm"
                radius="sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                  background: "var(--bg-card-inner)",
                  fontWeight: 600,
                }}
              >
                14 HUBS • 4 LINES
              </Badge>
            </Group>
            <Text
              size="xs"
              style={{ color: "var(--text-muted)", marginTop: 4 }}
            >
              Official multimodal corridor catalog covering MRT-6 Metro Rail,
              City Buses, and Feeder routes.
            </Text>
          </Box>

          <TextInput
            placeholder="Search hub or line..."
            leftSection={<IconSearch size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="xs"
            radius="xl"
            style={{ width: 260 }}
            styles={{
              input: {
                background: "var(--bg-card-inner)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-main)",
              },
            }}
          />
        </Group>
      </Paper>

      {/* Tabs - Uber Monochrome Style */}
      <Tabs
        value={activeTab}
        onChange={(val) => setActiveTab(val || "hubs")}
        color="dark"
        styles={{
          tab: {
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-muted)",
            "&[data-active]": {
              color: "var(--text-main)",
              borderColor: "var(--text-main)",
            },
          },
        }}
      >
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
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <Stack
                    gap="xs"
                    justify="space-between"
                    style={{ height: "100%" }}
                  >
                    <Box>
                      <Group justify="space-between" align="flex-start">
                        <Box>
                          <Text
                            fw={700}
                            size="md"
                            style={{ color: "var(--text-main)" }}
                          >
                            {hub.name_en}
                          </Text>
                          <Text
                            size="xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {hub.name_bn}
                          </Text>
                        </Box>

                        <Badge
                          size="xs"
                          radius="xl"
                          variant="outline"
                          style={{
                            borderColor: status.hasAlert
                              ? "var(--accent-amber)"
                              : "var(--border-subtle)",
                            color: status.hasAlert
                              ? "var(--accent-amber)"
                              : "var(--text-muted)",
                            background: "var(--bg-card-inner)",
                            fontWeight: 600,
                          }}
                          leftSection={
                            status.hasAlert ? (
                              <IconAlertTriangle size={10} />
                            ) : (
                              <IconCheck size={10} />
                            )
                          }
                        >
                          {status.hasAlert
                            ? "Alert Active"
                            : "Normal Operations"}
                        </Badge>
                      </Group>

                      {/* Modes Badges */}
                      <Group gap={6} mt="xs">
                        {modes.map((m) => (
                          <Badge
                            key={m}
                            size="xs"
                            radius="sm"
                            variant="filled"
                            style={{
                              background: "var(--text-main)",
                              color: "var(--bg-page)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                            leftSection={getModeIcon(m)}
                          >
                            {m}
                          </Badge>
                        ))}
                      </Group>

                      {/* Landmarks */}
                      {hubStops.length > 0 && hubStops[0].boarding_landmark && (
                        <Text
                          size="xs"
                          mt="xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          📍 {hubStops[0].boarding_landmark}
                        </Text>
                      )}

                      {/* Active Alert Note */}
                      {status.hasAlert && (
                        <Text
                          size="xs"
                          mt={4}
                          fw={600}
                          style={{ color: "var(--accent-amber)" }}
                        >
                          ⚠️ {status.message}
                        </Text>
                      )}
                    </Box>

                    {/* Action: Plan Trip From Here */}
                    <Button
                      fullWidth
                      size="xs"
                      radius="xl"
                      variant="default"
                      rightSection={<IconArrowRight size={14} />}
                      onClick={() => onSelectHubForPlan(hub.id)}
                      mt="xs"
                      styles={{
                        root: {
                          background: "var(--bg-card-inner)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                          fontWeight: 600,
                          "&:hover": {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                          },
                        },
                      }}
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
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="xs" align="center">
                        <Box
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getModeIcon(srv.mode)}
                        </Box>
                        <Box>
                          <Text
                            fw={700}
                            size="md"
                            style={{ color: "var(--text-main)" }}
                          >
                            {srv.name}
                          </Text>
                          <Text
                            size="xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {srv.operator} • Code: {srv.routeCode}
                          </Text>
                        </Box>
                      </Group>
                    </Box>

                    <Badge
                      size="sm"
                      radius="sm"
                      variant="filled"
                      style={{
                        background: "var(--text-main)",
                        color: "var(--bg-page)",
                        fontWeight: 700,
                      }}
                    >
                      {srv.mode.toUpperCase()}
                    </Badge>
                  </Group>

                  <Text size="xs" style={{ color: "var(--text-muted)" }}>
                    {srv.description}
                  </Text>

                  {/* Stops Sequence Progression */}
                  <Box>
                    <Text
                      size="10px"
                      fw={700}
                      mb={4}
                      style={{
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      STOP SEQUENCE
                    </Text>
                    <Group gap={6} wrap="wrap">
                      {srv.stopsSequence.map((stopName, idx) => (
                        <React.Fragment key={idx}>
                          <Badge
                            size="xs"
                            radius="sm"
                            variant="outline"
                            style={{
                              borderColor: "var(--border-subtle)",
                              color: "var(--text-main)",
                              background: "var(--bg-card-inner)",
                              fontWeight: 600,
                            }}
                          >
                            {stopName}
                          </Badge>
                          {idx < srv.stopsSequence.length - 1 && (
                            <Text
                              size="xs"
                              style={{ color: "var(--text-muted)" }}
                            >
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
                      <Paper
                        p="xs"
                        radius="md"
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Text
                          size="11px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Regular Tariff:
                        </Text>
                        <Text
                          size="sm"
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
                          {srv.regularFare}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Paper
                        p="xs"
                        radius="md"
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Text
                          size="11px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Student Concession:
                        </Text>
                        <Text
                          size="sm"
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
                          {srv.studentFare}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Paper
                        p="xs"
                        radius="md"
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Text
                          size="11px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Statutory Floor:
                        </Text>
                        <Text
                          size="sm"
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
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
          <Paper
            p="md"
            radius="md"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Group gap="xs" mb="xs">
              <IconCoins
                size={20}
                stroke={2}
                style={{ color: "var(--text-main)" }}
              />
              <Title
                order={4}
                style={{ color: "var(--text-main)", fontWeight: 700 }}
              >
                Statutory Fare Schedule & Student Concession
              </Title>
            </Group>
            <Text
              size="xs"
              style={{ color: "var(--text-muted)", marginBottom: 16 }}
            >
              Evaluated per continuous vehicle ride (not per graph segment).
              Buses apply: max(10 BDT, ceil(regular × 0.5)).
            </Text>

            <Table striped verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ color: "var(--text-main)" }}>
                    Mode / Corridor
                  </Table.Th>
                  <Table.Th style={{ color: "var(--text-main)" }}>
                    Calculation Basis
                  </Table.Th>
                  <Table.Th style={{ color: "var(--text-main)" }}>
                    Regular Fare
                  </Table.Th>
                  <Table.Th style={{ color: "var(--text-main)" }}>
                    Student Concession
                  </Table.Th>
                  <Table.Th style={{ color: "var(--text-main)" }}>
                    Statutory Floor
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={700} style={{ color: "var(--text-main)" }}>
                    🚇 MRT Line 6
                  </Table.Td>
                  <Table.Td>Distance graduated (Elevated rail)</Table.Td>
                  <Table.Td>20 - 100 ৳</Table.Td>
                  <Table.Td>Standard tariff (10% MRT Pass discount)</Table.Td>
                  <Table.Td>20 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={700} style={{ color: "var(--text-main)" }}>
                    🚌 Bikolpo Auto Service
                  </Table.Td>
                  <Table.Td>Per continuous ride</Table.Td>
                  <Table.Td>25 ৳</Table.Td>
                  <Table.Td>13 ৳ (50% statutory discount)</Table.Td>
                  <Table.Td>10 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={700} style={{ color: "var(--text-main)" }}>
                    🚌 Prochesta Paribahan
                  </Table.Td>
                  <Table.Td>Per continuous ride</Table.Td>
                  <Table.Td>30 ৳</Table.Td>
                  <Table.Td>15 ৳ (50% statutory discount)</Table.Td>
                  <Table.Td>10 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={700} style={{ color: "var(--text-main)" }}>
                    🚐 Banasree Leguna
                  </Table.Td>
                  <Table.Td>Fixed corridor tariff</Table.Td>
                  <Table.Td>15 - 25 ৳</Table.Td>
                  <Table.Td>Exempt from student concession</Table.Td>
                  <Table.Td>15 ৳</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={700} style={{ color: "var(--text-main)" }}>
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
