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
  Card,
  Modal,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Checkbox,
  ActionIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconPlus,
  IconThumbUp,
  IconThumbDown,
  IconCheck,
  IconClock,
  IconTrain,
  IconBus,
  IconCar,
} from "@tabler/icons-react";
import { DisruptionAlert } from "@/types/alerts";
import { Hub } from "@/types/network";

interface AlertFeedProps {
  alerts: DisruptionAlert[];
  hubs: Hub[];
  onRefreshAlerts: () => void;
}

export function AlertFeed({ alerts, hubs, onRefreshAlerts }: AlertFeedProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [affectedModes, setAffectedModes] = useState<string[]>(["bus"]);
  const [delayMinutes, setDelayMinutes] = useState<number>(20);
  const [isClosed, setIsClosed] = useState(false);
  const [severity, setSeverity] = useState<string>("medium");

  const hubOptions = hubs.map((h) => ({
    value: h.id,
    label: `${h.name_en} (${h.name_bn})`,
  }));

  const handleVote = async (
    alertId: string,
    voteType: "confirm" | "dispute" | "resolved",
  ) => {
    try {
      const res = await fetch(`/api/reports/${alertId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      if (res.ok) {
        notifications.show({
          title: "Feedback Recorded",
          message: `Your ${voteType} observation was registered.`,
          color: "teal",
        });
        onRefreshAlerts();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Could not record feedback.",
        color: "red",
      });
    }
  };

  const handleReportSubmit = async () => {
    if (!title || affectedModes.length === 0) {
      notifications.show({
        title: "Validation Error",
        message:
          "Please provide an incident title and at least one affected mode.",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          hubId: selectedHubId,
          affectedModes,
          delayMinutes,
          isClosed,
          severity,
        }),
      });

      if (res.ok) {
        notifications.show({
          title: "Report Submitted",
          message:
            "Your incident was queued for moderation and community validation.",
          color: "teal",
        });
        setReportModalOpen(false);
        setTitle("");
        setDescription("");
        onRefreshAlerts();
      }
    } catch {
      notifications.show({
        title: "Submission Failed",
        message: "Unable to submit incident report.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      default:
        return "blue";
    }
  };

  return (
    <Stack gap="md">
      {/* Top Banner & Report CTA */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="xs">
              <IconAlertTriangle size={24} color="#f59e0b" />
              <Title order={3} style={{ color: "var(--text-main)" }}>
                Live Street Alerts
              </Title>
              <Badge color="orange" variant="light">
                {alerts.length} Active
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Real-time crowd and verified alerts impacting Dhaka transit
              corridors.
            </Text>
          </Box>

          <Button
            size="sm"
            variant="gradient"
            gradient={{ from: "orange", to: "red" }}
            leftSection={<IconPlus size={16} />}
            onClick={() => setReportModalOpen(true)}
          >
            Report Incident
          </Button>
        </Group>
      </Paper>

      {/* Alert Feed Cards */}
      {alerts.length === 0 ? (
        <Paper
          p="xl"
          radius="md"
          style={{
            textAlign: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Text c="dimmed">
            No active street disruptions currently reported on the pilot
            corridor.
          </Text>
        </Paper>
      ) : (
        alerts.map((alert) => (
          <Card
            key={alert.id}
            p="md"
            radius="md"
            style={{
              background: "var(--bg-card)",
              border:
                alert.severity === "critical"
                  ? "1px solid #ef4444"
                  : "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge
                    color={getSeverityBadgeColor(alert.severity)}
                    variant="filled"
                    size="sm"
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                  {alert.is_closed && (
                    <Badge color="red" variant="outline" size="sm">
                      Road Closed
                    </Badge>
                  )}
                  {alert.reported_by_type === "simulation" && (
                    <Badge color="grape" variant="light" size="xs">
                      Simulation Fixture
                    </Badge>
                  )}
                </Group>

                <Group gap={4} align="center">
                  <IconClock size={14} color="#94a3b8" />
                  <Text size="xs" c="dimmed">
                    {new Date(alert.observed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Group>
              </Group>

              <Text fw={700} size="md" style={{ color: "var(--text-main)" }}>
                {alert.title}
              </Text>

              {alert.title_bn && (
                <Text size="sm" c="dimmed">
                  {alert.title_bn}
                </Text>
              )}

              <Text size="sm" c="gray.3">
                {alert.description}
              </Text>

              {/* Modes affected and Delay */}
              <Group justify="space-between" mt="xs" align="center">
                <Group gap={6}>
                  <Text size="xs" c="dimmed">
                    Affected:
                  </Text>
                  {alert.affected_modes.map((mode) => (
                    <Badge key={mode} size="xs" variant="outline" color="gray">
                      {mode}
                    </Badge>
                  ))}
                  {alert.delay_minutes > 0 && (
                    <Badge size="xs" color="yellow" variant="light">
                      +{alert.delay_minutes} min delay
                    </Badge>
                  )}
                </Group>

                {/* Corroboration Actions */}
                <Group gap={6}>
                  <Tooltip label="Confirm this incident is active">
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="teal"
                      leftSection={<IconThumbUp size={12} />}
                      onClick={() => handleVote(alert.id, "confirm")}
                    >
                      {alert.upvotes || 0}
                    </Button>
                  </Tooltip>

                  <Tooltip label="Dispute: road is clear or report is false">
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      leftSection={<IconThumbDown size={12} />}
                      onClick={() => handleVote(alert.id, "dispute")}
                    >
                      {alert.downvotes || 0}
                    </Button>
                  </Tooltip>

                  <Tooltip label="Mark as resolved">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="green"
                      onClick={() => handleVote(alert.id, "resolved")}
                    >
                      <IconCheck size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Card>
        ))
      )}

      {/* Report Modal */}
      <Modal
        opened={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Submit Street Disruption Report"
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
        <Stack gap="sm">
          <Select
            label="Location Hub"
            placeholder="Select nearest hub..."
            data={hubOptions}
            value={selectedHubId}
            onChange={setSelectedHubId}
            searchable
            clearable
            comboboxProps={{ withinPortal: true, zIndex: 3000 }}
          />

          <TextInput
            label="Incident Title"
            placeholder="e.g. Waterlogging at Malibagh Railgate"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Observation Details"
            placeholder="Knee-deep water, buses unable to pass..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <MultiSelect
            label="Affected Transport Modes"
            data={["bus", "leguna", "rickshaw", "metro", "walk"]}
            value={affectedModes}
            onChange={setAffectedModes}
            comboboxProps={{ withinPortal: true, zIndex: 3000 }}
          />

          <Group grow>
            <Select
              label="Severity"
              data={["low", "medium", "high", "critical"]}
              value={severity}
              onChange={(val) => setSeverity(val || "medium")}
              comboboxProps={{ withinPortal: true, zIndex: 3000 }}
            />
            <NumberInput
              label="Estimated Delay (minutes)"
              value={delayMinutes}
              onChange={(val) => setDelayMinutes(Number(val) || 0)}
              min={0}
              max={180}
            />
          </Group>

          <Checkbox
            label="Road is completely blocked / closed"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.currentTarget.checked)}
            color="red"
          />

          <Button
            fullWidth
            mt="md"
            color="teal"
            onClick={handleReportSubmit}
            loading={submitting}
          >
            Submit for Moderation
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
