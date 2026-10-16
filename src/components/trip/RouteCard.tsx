"use client";

import React, { useState } from "react";
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Accordion,
  ThemeIcon,
  Box,
  Divider,
  Alert,
  Button,
  Modal,
  Table,
  ActionIcon,
  Tooltip,
  Paper,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconClock,
  IconCoins,
  IconArrowsExchange,
  IconTrain,
  IconBus,
  IconCar,
  IconWalk,
  IconMapPin,
  IconAlertTriangle,
  IconDiscountCheck,
  IconVolume,
  IconPrinter,
  IconInfoCircle,
  IconPlayerStop,
} from "@tabler/icons-react";
import { PlannedRoute } from "@/types/api";

interface RouteCardProps {
  route: PlannedRoute;
  isStudent: boolean;
  budgetBdt: number | null;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function RouteCard({
  route,
  isStudent,
  budgetBdt,
  isSelected,
  onSelect,
}: RouteCardProps) {
  const {
    rankingProfile,
    totalDurationMin,
    transfers,
    fareRegularBdt,
    fareStudentBdt,
    fareEstimatedRange,
    budgetCategorization,
    hasActiveDisruptions,
    legs,
    warnings,
  } = route;

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const displayFare = isStudent ? fareStudentBdt : fareRegularBdt;
  const savings = fareRegularBdt - fareStudentBdt;

  const getProfileGradient = () => {
    switch (rankingProfile) {
      case "fastest":
        return { from: "cyan", to: "blue" };
      case "cheapest":
        return { from: "teal", to: "green" };
      case "balanced":
      default:
        return { from: "violet", to: "indigo" };
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "metro":
        return <IconTrain size={16} />;
      case "bus":
        return <IconBus size={16} />;
      case "leguna":
        return <IconCar size={16} />;
      case "walk":
        return <IconWalk size={16} />;
      default:
        return <IconMapPin size={16} />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "metro":
        return "teal";
      case "bus":
        return "blue";
      case "leguna":
        return "orange";
      case "rickshaw":
        return "grape";
      default:
        return "gray";
    }
  };

  const handleSpeakBriefing = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      notifications.show({
        title: "Speech Unavailable",
        message: "Speech synthesis is not supported on this browser.",
        color: "yellow",
      });
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const firstLeg = legs[0];
    const text = `DhakaPath Route Briefing. Your optimal journey takes approximately ${totalDurationMin} minutes with ${
      transfers === 0 ? "no transfers" : `${transfers} transfers`
    }. Total fare is ${displayFare} Taka. Start by boarding ${firstLeg.serviceName} at ${firstLeg.fromStopName}. Landmark: ${
      firstLeg.boardingLandmark || "Main transit counter"
    }. ${warnings.length > 0 ? warnings.join(". ") : "Corridor is operating normally."} Have a safe journey.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    notifications.show({
      title: "Playing Audio Briefing",
      message: "Audio playback active. Tap the speaker again to stop.",
      color: "teal",
    });
  };

  const handleOpenPrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintModalOpen(true);
  };

  return (
    <>
      <Card
        p="md"
        radius="lg"
        onClick={onSelect}
        style={{
          background: isSelected ? "var(--bg-card-hover)" : "var(--bg-card)",
          border: isSelected
            ? "2px solid var(--text-main)"
            : "1px solid var(--border-subtle)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: isSelected
            ? "0 4px 16px rgba(0, 0, 0, 0.1)"
            : "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Stack gap="xs">
          {/* Top Header: Ranking Profile, Disruption Indicator, Actions */}
          <Group justify="space-between" align="center">
            <Group gap={6}>
              <Badge
                size="sm"
                variant="filled"
                color="dark"
                radius="sm"
                styles={{
                  root: {
                    background: "var(--text-main)",
                    color: "var(--bg-page)",
                    fontWeight: 700,
                  },
                }}
              >
                {rankingProfile.toUpperCase()}
              </Badge>

              {hasActiveDisruptions && (
                <Badge
                  size="sm"
                  color="red"
                  variant="filled"
                  radius="sm"
                  leftSection={<IconAlertTriangle size={12} />}
                >
                  Active Disruption
                </Badge>
              )}
            </Group>

            {/* Quick Action Controls: Audio & Print */}
            <Group gap={4}>
              <Tooltip
                label={
                  speaking ? "Stop Audio Briefing" : "Listen to Audio Briefing"
                }
              >
                <ActionIcon
                  size="sm"
                  variant={speaking ? "filled" : "subtle"}
                  color="gray"
                  onClick={handleSpeakBriefing}
                >
                  {speaking ? (
                    <IconPlayerStop size={14} />
                  ) : (
                    <IconVolume size={14} />
                  )}
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Printable Journey Card">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleOpenPrint}
                >
                  <IconPrinter size={14} />
                </ActionIcon>
              </Tooltip>

              {/* Budget status badge */}
              {budgetBdt !== null && (
                <Badge
                  size="xs"
                  color={
                    budgetCategorization === "WITHIN_BUDGET"
                      ? "dark"
                      : budgetCategorization === "MAY_EXCEED_BUDGET"
                        ? "yellow"
                        : "red"
                  }
                  variant="light"
                  radius="sm"
                >
                  {budgetCategorization === "WITHIN_BUDGET"
                    ? "Within Budget"
                    : budgetCategorization === "MAY_EXCEED_BUDGET"
                      ? "May Exceed"
                      : "Over Budget"}
                </Badge>
              )}
            </Group>
          </Group>

          {/* Key Metrics: Time, Transfers, Fare */}
          <Group justify="space-between" align="baseline">
            <Group gap="md">
              <Group gap={4} align="center">
                <IconClock size={16} />
                <Text
                  fw={700}
                  size="xl"
                  style={{
                    color: "var(--text-main)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {totalDurationMin} min
                </Text>
              </Group>

              <Group gap={4} align="center">
                <IconArrowsExchange size={16} color="var(--text-muted)" />
                <Text size="sm" c="dimmed">
                  {transfers === 0
                    ? "Direct"
                    : `${transfers} ${transfers === 1 ? "transfer" : "transfers"}`}
                </Text>
              </Group>
            </Group>

            <Group gap={6} align="baseline">
              <Text
                fw={800}
                size="xl"
                style={{
                  color: "var(--text-main)",
                  fontSize: "1.4rem",
                  letterSpacing: "-0.03em",
                }}
              >
                {displayFare} ৳
              </Text>
              {isStudent && savings > 0 && (
                <Badge
                  size="xs"
                  color="dark"
                  variant="light"
                  radius="sm"
                  leftSection={<IconDiscountCheck size={12} />}
                >
                  Save {savings} ৳
                </Badge>
              )}
            </Group>
          </Group>

          {/* Route Leg Pills */}
          <Group gap={6} wrap="wrap" my={4}>
            {legs.map((leg, i) => (
              <React.Fragment key={i}>
                <Badge
                  size="sm"
                  variant="light"
                  color={getModeColor(leg.mode)}
                  leftSection={getModeIcon(leg.mode)}
                >
                  {leg.serviceName}
                </Badge>
                {i < legs.length - 1 && (
                  <Text size="xs" c="dimmed">
                    ➔
                  </Text>
                )}
              </React.Fragment>
            ))}
          </Group>

          {/* Warnings / Advisory Banner */}
          {warnings.length > 0 && (
            <Alert
              color="orange"
              variant="light"
              p="xs"
              icon={<IconAlertTriangle size={16} />}
            >
              <Text size="xs">{warnings.join(" ")}</Text>
            </Alert>
          )}

          <Divider my={4} color="rgba(255, 255, 255, 0.06)" />

          {/* Detailed Leg Accordion */}
          <Accordion variant="separated" radius="sm">
            <Accordion.Item
              value="steps"
              style={{ background: "transparent", border: "none" }}
            >
              <Accordion.Control p={0}>
                <Text size="xs" c="cyan" fw={500}>
                  View Landmark-by-Landmark Steps ({legs.length} legs)
                </Text>
              </Accordion.Control>
              <Accordion.Panel pt="xs">
                <Stack gap="xs">
                  {legs.map((leg, idx) => (
                    <Box
                      key={idx}
                      p="xs"
                      style={{
                        background: "var(--bg-card-inner)",
                        borderRadius: 8,
                        borderLeft: `3px solid var(--mantine-color-${getModeColor(leg.mode)}-6)`,
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
                          <ThemeIcon
                            size="sm"
                            variant="light"
                            color={getModeColor(leg.mode)}
                          >
                            {getModeIcon(leg.mode)}
                          </ThemeIcon>
                          <Box>
                            <Text
                              size="sm"
                              fw={600}
                              style={{ color: "var(--text-main)" }}
                            >
                              {leg.serviceName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {leg.fromStopName} ➔ {leg.toStopName}
                            </Text>
                          </Box>
                        </Group>

                        <Box style={{ textAlign: "right" }}>
                          <Text
                            size="xs"
                            fw={600}
                            style={{ color: "var(--text-main)" }}
                          >
                            ~{leg.durationMin} min
                          </Text>
                          <Text size="xs" c="dimmed">
                            {isStudent ? leg.fareStudent : leg.fareRegular} ৳
                          </Text>
                        </Box>
                      </Group>

                      {leg.boardingLandmark && (
                        <Text
                          size="xs"
                          c="teal"
                          mt={4}
                          style={{ fontStyle: "italic" }}
                        >
                          📍 Boarding: {leg.boardingLandmark}
                        </Text>
                      )}

                      {leg.directionNotes && (
                        <Text size="xs" c="dimmed" mt={2}>
                          ℹ️ Transfer note: {leg.directionNotes}
                        </Text>
                      )}

                      {leg.disruptions.length > 0 && (
                        <Text size="xs" c="red" mt={2} fw={500}>
                          ⚠️ Disruption: {leg.disruptions.join(", ")}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Card>

      {/* Printable / Downloadable Journey Card Modal */}
      <Modal
        opened={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Official Transit Commuter Card (ঢাকা ট্রানজিট কার্ড)"
        size="lg"
        centered
        styles={{
          content: {
            background: "var(--bg-card)",
            color: "var(--text-main)",
            border: "1px solid var(--border-subtle)",
          },
          header: { background: "var(--bg-card)", color: "var(--text-main)" },
        }}
      >
        <Stack gap="md" id="printable-transit-card">
          <Paper
            p="sm"
            radius="md"
            style={{
              background: "var(--bg-card-inner)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Group justify="space-between" align="center">
              <Box>
                <Title order={4} style={{ color: "#2dd4bf" }}>
                  DhakaPath Transit Journey Card
                </Title>
                <Text size="xs" c="dimmed">
                  Calculation Timestamp: {new Date().toLocaleString()} (Verified
                  for immediate commute)
                </Text>
              </Box>
              <Badge color="teal" size="md">
                {displayFare} BDT
              </Badge>
            </Group>
          </Paper>

          <Table striped verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Leg #</Table.Th>
                <Table.Th>Service & Mode</Table.Th>
                <Table.Th>From ➔ To</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Fare</Table.Th>
                <Table.Th>Landmark / Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {legs.map((leg, i) => (
                <Table.Tr key={i}>
                  <Table.Td fw={700}>#{i + 1}</Table.Td>
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={600}
                      style={{ color: "var(--text-main)" }}
                    >
                      {leg.serviceName}
                    </Text>
                    <Badge
                      size="xs"
                      variant="outline"
                      color={getModeColor(leg.mode)}
                    >
                      {leg.mode}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" style={{ color: "var(--text-main)" }}>
                      {leg.fromStopName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      ➔ {leg.toStopName}
                    </Text>
                  </Table.Td>
                  <Table.Td>{leg.durationMin} min</Table.Td>
                  <Table.Td fw={600}>
                    {isStudent ? leg.fareStudent : leg.fareRegular} ৳
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="teal">
                      {leg.boardingLandmark || "Standard platform"}
                    </Text>
                    {leg.directionNotes && (
                      <Text size="xs" c="dimmed">
                        {leg.directionNotes}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Paper
            p="xs"
            radius="sm"
            style={{
              background: "var(--bg-card-inner)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Profile:{" "}
                <Text span fw={600} style={{ color: "var(--text-main)" }}>
                  {rankingProfile.toUpperCase()}
                </Text>{" "}
                | Student Concession:{" "}
                <Text span fw={600} style={{ color: "var(--text-main)" }}>
                  {isStudent ? "Yes (50% Bus Discount Applied)" : "No"}
                </Text>
              </Text>
              <Text size="xs" fw={700} style={{ color: "#2dd4bf" }}>
                Total: {displayFare} ৳ (~{totalDurationMin} min)
              </Text>
            </Group>
          </Paper>

          <Group justify="flex-end" mt="xs">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setPrintModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="xs"
              variant="gradient"
              gradient={{ from: "teal", to: "cyan" }}
              leftSection={<IconPrinter size={14} />}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
            >
              Print Journey Card
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
