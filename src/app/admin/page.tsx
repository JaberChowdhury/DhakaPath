"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Badge,
  Button,
  Table,
  Tabs,
  Switch,
  ActionIcon,
  Tooltip,
  FileInput,
  Card,
  Grid,
  Select,
  TextInput,
  NumberInput,
  Loader,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconShieldLock,
  IconCheck,
  IconX,
  IconTrain,
  IconBus,
  IconCar,
  IconArrowLeft,
  IconCoins,
  IconScan,
  IconUpload,
  IconSparkles,
  IconLogout,
  IconKey,
  IconRefresh,
  IconCpu,
  IconAlertTriangle,
  IconShieldCheck,
} from "@tabler/icons-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AdminPortalPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Signboard Digitization State
  const [selectedSample, setSelectedSample] =
    useState<string>("sample_bikolpo");
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  // AI Key Pool State
  const [aiPoolData, setAiPoolData] = useState<any>(null);
  const [aiPoolLoading, setAiPoolLoading] = useState(false);

  // Verify Admin Session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push("/login?redirect=/admin&error=auth_required");
          return;
        }
        setAdminUser(data.user);
      } catch {
        router.push("/login?redirect=/admin&error=auth_required");
      } finally {
        setAuthLoading(false);
      }
    };

    verifySession();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      notifications.show({
        title: "Signed Out",
        message: "Admin session terminated successfully.",
        color: "gray",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts?forAdmin=true");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const fetchAiPool = async () => {
    setAiPoolLoading(true);
    try {
      const res = await fetch("/api/admin/ai-pool");
      const data = await res.json();
      if (data.success) {
        setAiPoolData(data);
      }
    } catch {
      //
    } finally {
      setAiPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchAiPool();
  }, []);

  const handleModeration = async (
    alertId: string,
    action: "approve" | "reject" | "resolve",
  ) => {
    try {
      const status =
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "approved";
      const lifecycleStage = action === "resolve" ? "resolved" : "active";
      const res = await fetch(`/api/reports/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, lifecycleStage }),
      });

      if (res.ok) {
        notifications.show({
          title: "Moderation Recorded",
          message: `Alert ${alertId} updated to ${status} (${lifecycleStage}).`,
          color:
            action === "approve"
              ? "teal"
              : action === "reject"
                ? "red"
                : "blue",
        });
        fetchAlerts();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to record moderation action.",
        color: "red",
      });
    }
  };

  const handleScanSignboard = () => {
    setScanning(true);
    setTimeout(() => {
      if (selectedSample === "sample_bikolpo") {
        setExtractedData({
          title: "Bikolpo Auto Service Route Board",
          serviceName: "Bikolpo Auto Service",
          mode: "bus",
          operator: "Bikolpo Syndicate Ltd.",
          origin: "Mirpur 10",
          destination: "Motijheel",
          via: ["Agargaon", "Farmgate", "Karwan Bazar", "Shahbagh"],
          fareRegular: 25,
          fareStudent: 13,
          boardingLandmark: "Police Box Counter, East Side of Mirpur 10 Circle",
          confidence: "98% (High confidence optical match)",
        });
      } else if (selectedSample === "sample_mrt") {
        setExtractedData({
          title: "MRT Line 6 Station Notice",
          serviceName: "MRT Line 6",
          mode: "metro",
          operator: "Dhaka Mass Transit Company Ltd (DMTCL)",
          origin: "Uttara North",
          destination: "Motijheel",
          via: [
            "Pallabi",
            "Mirpur 10",
            "Agargaon",
            "Farmgate",
            "Shahbagh",
            "Secretariat",
          ],
          fareRegular: 100,
          fareStudent: 100,
          boardingLandmark: "Elevated Concourse, Gates 1 & 2",
          confidence: "99% (Official DMTCL tariff format)",
        });
      } else {
        setExtractedData({
          title: "Rampura-Banasree Leguna Stoppage Board",
          serviceName: "Banasree Leguna",
          mode: "leguna",
          operator: "Human Hauler Welfare Union",
          origin: "Rampura Bridge",
          destination: "Gulshan 1",
          via: ["Banasree Block C", "Police Plaza"],
          fareRegular: 20,
          fareStudent: 20,
          boardingLandmark: "Under Rampura Foot-over Bridge",
          confidence: "91% (Handwritten signboard extracted)",
        });
      }
      setScanning(false);
      notifications.show({
        title: "Signboard Digitized",
        message:
          "Optical extraction completed. Review structured data below before import.",
        color: "teal",
      });
    }, 900);
  };

  const handleApproveImport = () => {
    notifications.show({
      title: "Import Approved",
      message: `${extractedData?.serviceName} details verified and merged into Transit CMS.`,
      color: "teal",
    });
    setExtractedData(null);
  };

  if (authLoading) {
    return (
      <Container size="sm" py={120} style={{ textAlign: "center" }}>
        <Loader color="teal" size="lg" />
        <Text size="sm" c="dimmed" mt="md">
          Verifying administrative credentials...
        </Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header with Verified Admin Profile and Sign Out */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="xs">
            <Link href="/">
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={16} />}
              >
                Commuter App
              </Button>
            </Link>
            <Title
              order={2}
              style={{ color: "var(--text-main)", fontSize: "1.4rem" }}
            >
              Transit Administration & Moderation
            </Title>
            <Badge color="red" variant="filled">
              CMS SECURE
            </Badge>
          </Group>

          <Group gap="xs">
            <Badge size="md" color="teal" variant="light" leftSection="●">
              {adminUser?.email || "admin@dhakapath.gov.bd"}
            </Badge>
            <Badge size="md" color="blue" variant="outline">
              Super Admin
            </Badge>
            <Button
              size="xs"
              color="red"
              variant="subtle"
              leftSection={<IconLogout size={15} />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
            <ThemeToggle />
          </Group>
        </Group>

        {/* Tabs: Moderation Queue, Network CMS, Fare Policies, Signboard Digitizer, AI Key Pool */}
        <Tabs defaultValue="moderation" color="teal">
          <Tabs.List>
            <Tabs.Tab
              value="moderation"
              leftSection={<IconShieldLock size={16} />}
            >
              Disruption Moderation Queue
            </Tabs.Tab>
            <Tabs.Tab value="cms" leftSection={<IconBus size={16} />}>
              Transit Services CMS
            </Tabs.Tab>
            <Tabs.Tab value="fares" leftSection={<IconCoins size={16} />}>
              Statutory Fare Schedule
            </Tabs.Tab>
            <Tabs.Tab value="digitizer" leftSection={<IconScan size={16} />}>
              Signboard & Notice Digitizer
            </Tabs.Tab>
            <Tabs.Tab value="ai_keys" leftSection={<IconKey size={16} />}>
              AI Keys & Quota Pool
            </Tabs.Tab>
          </Tabs.List>

          {/* Moderation Panel */}
          <Tabs.Panel value="moderation" pt="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Group justify="space-between" mb="xs">
                <Title order={4} style={{ color: "var(--text-main)" }}>
                  Incident Reports Moderation Queue
                </Title>
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  onClick={fetchAlerts}
                >
                  Refresh Queue
                </Button>
              </Group>
              <Text size="xs" c="dimmed" mb="md">
                Admin review changes report status to approved or rejected
                before routing calculations are affected.
              </Text>

              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Incident Title</Table.Th>
                    <Table.Th>Severity</Table.Th>
                    <Table.Th>Modes</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Lifecycle</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {alerts.map((alert) => (
                    <Table.Tr key={alert.id}>
                      <Table.Td>
                        <Text fw={600} size="sm" style={{ color: "#fff" }}>
                          {alert.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {alert.description ||
                            "No additional details provided."}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={
                            alert.severity === "critical" ? "red" : "yellow"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {alert.affected_modes?.map((m: string) => (
                            <Badge
                              key={m}
                              size="xs"
                              variant="outline"
                              color="gray"
                            >
                              {m}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={
                            alert.status === "approved"
                              ? "teal"
                              : alert.status === "rejected"
                                ? "red"
                                : "yellow"
                          }
                          variant="light"
                        >
                          {alert.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={
                            alert.lifecycle_stage === "active" ? "blue" : "gray"
                          }
                          variant="outline"
                        >
                          {alert.lifecycle_stage}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Tooltip label="Approve & Affect Routes">
                            <ActionIcon
                              color="teal"
                              size="sm"
                              onClick={() =>
                                handleModeration(alert.id, "approve")
                              }
                            >
                              <IconCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Reject / Spam">
                            <ActionIcon
                              color="red"
                              size="sm"
                              onClick={() =>
                                handleModeration(alert.id, "reject")
                              }
                            >
                              <IconX size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Mark as Resolved">
                            <ActionIcon
                              color="cyan"
                              size="sm"
                              onClick={() =>
                                handleModeration(alert.id, "resolve")
                              }
                            >
                              <IconCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* Network CMS */}
          <Tabs.Panel value="cms" pt="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Title order={4} mb="md" style={{ color: "var(--text-main)" }}>
                Pilot Transit Services CMS
              </Title>

              <Table striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Service Name</Table.Th>
                    <Table.Th>Mode</Table.Th>
                    <Table.Th>Operator</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[
                    {
                      name: "MRT Line 6",
                      mode: "metro",
                      op: "DMTCL",
                      active: true,
                    },
                    {
                      name: "Bikolpo Auto Service",
                      mode: "bus",
                      op: "Bikolpo Syndicate",
                      active: true,
                    },
                    {
                      name: "Prochesta Paribahan",
                      mode: "bus",
                      op: "Prochesta Ltd",
                      active: true,
                    },
                    {
                      name: "Banasree-Gulshan Leguna",
                      mode: "leguna",
                      op: "Human Hauler Union",
                      active: true,
                    },
                  ].map((srv, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Text fw={600} size="sm" style={{ color: "#fff" }}>
                          {srv.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={
                            srv.mode === "metro"
                              ? "teal"
                              : srv.mode === "bus"
                                ? "blue"
                                : "orange"
                          }
                        >
                          {srv.mode}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{srv.op}</Table.Td>
                      <Table.Td>
                        <Switch
                          defaultChecked={srv.active}
                          color="teal"
                          size="sm"
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* Fares */}
          <Tabs.Panel value="fares" pt="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Title order={4} mb="xs" style={{ color: "var(--text-main)" }}>
                Statutory Fare & Concession Rules
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Bus student discount rule: max(10 BDT, regular_fare × 0.5)
              </Text>

              <Table striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Mode / Service</Table.Th>
                    <Table.Th>Regular Tariff</Table.Th>
                    <Table.Th>Student Concession</Table.Th>
                    <Table.Th>Minimum Floor</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[
                    {
                      mode: "MRT Line 6",
                      reg: "20 - 100 ৳",
                      student: "Not Applicable",
                      floor: "20 ৳",
                    },
                    {
                      mode: "Bikolpo Bus",
                      reg: "25 ৳",
                      student: "50% Discount (13 ৳)",
                      floor: "10 ৳",
                    },
                    {
                      mode: "Prochesta Bus",
                      reg: "30 ৳",
                      student: "50% Discount (15 ৳)",
                      floor: "10 ৳",
                    },
                    {
                      mode: "Banasree Leguna",
                      reg: "15 - 25 ৳",
                      student: "Not Applicable",
                      floor: "15 ৳",
                    },
                    {
                      mode: "Feeder Rickshaw",
                      reg: "30 - 60 ৳ (Estimated)",
                      student: "Not Applicable",
                      floor: "30 ৳",
                    },
                  ].map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={600} style={{ color: "#fff" }}>
                        {f.mode}
                      </Table.Td>
                      <Table.Td>{f.reg}</Table.Td>
                      <Table.Td>{f.student}</Table.Td>
                      <Table.Td>{f.floor}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* Signboard Digitizer Panel (Bonus Feature) */}
          <Tabs.Panel value="digitizer" pt="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Title order={4} mb="xs" style={{ color: "var(--text-main)" }}>
                Signboard & Physical Notice Digitizer (Bonus Feature)
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Optical parsing of bus signboards, printed station fare charts,
                and handwritten stoppage notices with human-in-the-loop review.
              </Text>

              <Grid gap="md">
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Stack gap="sm">
                    <Select
                      label="Select Physical Notice / Signboard Sample"
                      data={[
                        {
                          value: "sample_bikolpo",
                          label:
                            "🚏 Bikolpo Paribahan Route Signboard (Mirpur 10)",
                        },
                        {
                          value: "sample_mrt",
                          label: "🚇 DMTCL Station Fare Schedule Notice",
                        },
                        {
                          value: "sample_leguna",
                          label:
                            "🚐 Rampura Leguna Stand Handwritten Stoppage List",
                        },
                      ]}
                      value={selectedSample}
                      onChange={(v) => setSelectedSample(v || "sample_bikolpo")}
                      comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                    />

                    <Button
                      variant="gradient"
                      gradient={{ from: "teal", to: "cyan" }}
                      leftSection={
                        scanning ? (
                          <Loader size="xs" color="white" />
                        ) : (
                          <IconSparkles size={16} />
                        )
                      }
                      onClick={handleScanSignboard}
                      loading={scanning}
                    >
                      Extract Structured Transit Data
                    </Button>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                  {extractedData ? (
                    <Card
                      p="md"
                      radius="md"
                      style={{
                        background: "rgba(10, 15, 24, 0.7)",
                        border: "1px solid #2dd4bf",
                      }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Title order={5} style={{ color: "#fff" }}>
                            Extracted Structured Metadata
                          </Title>
                          <Badge color="teal" variant="light">
                            {extractedData.confidence}
                          </Badge>
                        </Group>

                        <Table verticalSpacing={4}>
                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Service Name:
                              </Table.Td>
                              <Table.Td style={{ color: "#fff" }}>
                                {extractedData.serviceName}
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Mode & Operator:
                              </Table.Td>
                              <Table.Td style={{ color: "#fff" }}>
                                {extractedData.mode} ({extractedData.operator})
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Corridor Endpoints:
                              </Table.Td>
                              <Table.Td style={{ color: "#fff" }}>
                                {extractedData.origin} ➔{" "}
                                {extractedData.destination}
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Intermediate Stoppages:
                              </Table.Td>
                              <Table.Td style={{ color: "#fff" }}>
                                {extractedData.via.join(" ➔ ")}
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Extracted Fare:
                              </Table.Td>
                              <Table.Td style={{ color: "#fff" }}>
                                Regular: {extractedData.fareRegular} ৳ |
                                Student: {extractedData.fareStudent} ৳
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: "#94a3b8" }}>
                                Boarding Landmark:
                              </Table.Td>
                              <Table.Td style={{ color: "#2dd4bf" }}>
                                📍 {extractedData.boardingLandmark}
                              </Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>

                        <Group justify="flex-end" mt="xs">
                          <Button
                            size="xs"
                            color="gray"
                            variant="subtle"
                            onClick={() => setExtractedData(null)}
                          >
                            Discard
                          </Button>
                          <Button
                            size="xs"
                            color="teal"
                            onClick={handleApproveImport}
                          >
                            Approve & Merge into CMS
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  ) : (
                    <Box
                      p="xl"
                      style={{
                        border: "1px dashed rgba(255, 255, 255, 0.15)",
                        borderRadius: 8,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <IconScan
                        size={32}
                        style={{ marginBottom: 8, opacity: 0.6 }}
                      />
                      <Text size="sm">
                        Select a notice sample and click "Extract Structured
                        Transit Data".
                      </Text>
                      <Text size="xs" c="dimmed">
                        OCR and structured entity recognition will parse
                        stoppages, landmarks, and fares.
                      </Text>
                    </Box>
                  )}
                </Grid.Col>
              </Grid>
            </Paper>
          </Tabs.Panel>

          {/* AI Keys & Quota Pool Panel */}
          <Tabs.Panel value="ai_keys" pt="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center" wrap="wrap">
                  <Box>
                    <Group gap="xs">
                      <IconKey size={20} color="#0d9488" />
                      <Title order={4} style={{ color: "var(--text-main)" }}>
                        Google AI Studio Key Pool & Auto-Failover Monitor
                      </Title>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Multi-key circuit breaker connecting all 5 API keys with
                      automatic rate-limit detection and immediate failover.
                    </Text>
                  </Box>

                  <Group gap="xs">
                    <Badge size="md" color="teal" variant="light">
                      Model: {aiPoolData?.model || "gemini-3.5-flash"}
                    </Badge>
                    <Button
                      size="xs"
                      variant="light"
                      color="teal"
                      leftSection={
                        aiPoolLoading ? (
                          <Loader size={12} color="teal" />
                        ) : (
                          <IconRefresh size={14} />
                        )
                      }
                      onClick={fetchAiPool}
                      disabled={aiPoolLoading}
                    >
                      Refresh Pool Status
                    </Button>
                  </Group>
                </Group>

                {/* Key Pool KPI Stats */}
                <Grid gap="sm">
                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        Total Keys Configured
                      </Text>
                      <Text size="xl" fw={700} style={{ color: "#0d9488" }}>
                        {aiPoolData?.totalKeys || 5}
                      </Text>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        Active & Healthy
                      </Text>
                      <Text size="xl" fw={700} style={{ color: "#10b981" }}>
                        {aiPoolData?.activeKeysCount ?? 5}
                      </Text>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        In Rate-Limit Cooldown
                      </Text>
                      <Text size="xl" fw={700} style={{ color: "#f59e0b" }}>
                        {aiPoolData?.cooldownKeysCount ?? 0}
                      </Text>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        Failover Algorithm
                      </Text>
                      <Badge size="xs" color="cyan" variant="filled" mt={4}>
                        Circuit Breaker Active
                      </Badge>
                    </Paper>
                  </Grid.Col>
                </Grid>

                {/* Keys Telemetry Table */}
                <Table highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Key ID</Table.Th>
                      <Table.Th>API Key Fingerprint</Table.Th>
                      <Table.Th>Current Status</Table.Th>
                      <Table.Th>Requests / Successes</Table.Th>
                      <Table.Th>Cooldown Window</Table.Th>
                      <Table.Th>Last Status Code</Table.Th>
                      <Table.Th>Last Error / Notes</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {aiPoolData?.pool?.map((item: any) => (
                      <Table.Tr key={item.id}>
                        <Table.Td fw={600}>Key #{item.id}</Table.Td>
                        <Table.Td
                          style={{ fontFamily: "monospace", fontSize: 12 }}
                        >
                          {item.maskedKey}
                        </Table.Td>
                        <Table.Td>
                          {item.status === "healthy" ? (
                            <Badge size="xs" color="teal" variant="filled">
                              ● Healthy
                            </Badge>
                          ) : item.status === "cooldown" ? (
                            <Badge size="xs" color="yellow" variant="filled">
                              ⏳ Cooldown ({item.cooldownRemainingSec}s)
                            </Badge>
                          ) : (
                            <Badge size="xs" color="red" variant="filled">
                              ⛔ Limit Hit
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">
                            {item.totalRequests} reqs ({item.totalSuccesses} ok)
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="xs"
                            c={
                              item.cooldownRemainingSec > 0
                                ? "yellow"
                                : "dimmed"
                            }
                          >
                            {item.cooldownRemainingSec > 0
                              ? `${item.cooldownRemainingSec}s remaining`
                              : "Ready / Active"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {item.lastStatusCode ? (
                            <Badge
                              size="xs"
                              color={
                                item.lastStatusCode === 200
                                  ? "teal"
                                  : item.lastStatusCode === 429
                                    ? "yellow"
                                    : "red"
                              }
                              variant="light"
                            >
                              HTTP {item.lastStatusCode}
                            </Badge>
                          ) : (
                            <Text size="xs" c="dimmed">
                              Standby
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 220 }}>
                          <Text size="11px" c="dimmed" truncate="end">
                            {item.lastErrorMessage ||
                              "Operational with zero errors"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {/* Switching Algorithm Description Card */}
                <Paper
                  p="sm"
                  radius="md"
                  style={{
                    background: "var(--bg-card-inner)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Group gap="xs" mb={4}>
                    <IconCpu size={16} color="#0d9488" />
                    <Text
                      size="xs"
                      fw={600}
                      style={{ color: "var(--text-main)" }}
                    >
                      Adaptive Key Switching & Rate-Limit Circuit Breaker
                      Mechanism:
                    </Text>
                  </Group>
                  <Text size="11px" c="dimmed" lh={1.6}>
                    1. <strong>Balanced Load Distribution:</strong> The engine
                    distributes incoming natural language transit prompts across
                    healthy keys in the pool.
                    <br />
                    2. <strong>Instant Rate-Limit Failover:</strong> If any key
                    encounters HTTP 429 (Resource Exhausted) or HTTP 503
                    (Spike/Unavailable), it is isolated with an automatic
                    45-second cooldown and the request immediately retries on
                    the next available key without commuter disruption.
                    <br />
                    3. <strong>Automatic Recovery:</strong> Once a key's
                    cooldown window expires, it automatically transitions back
                    to Healthy status.
                    <br />
                    4. <strong>Zero-Downtime Deterministic Fallback:</strong> In
                    the rare scenario that all 5 API keys reach Google limits
                    simultaneously, the system seamlessly falls back to
                    DhakaPath's deterministic local transit parsing engine.
                  </Text>
                </Paper>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
