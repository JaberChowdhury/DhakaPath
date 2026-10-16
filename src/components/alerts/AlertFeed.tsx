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
  IconClock,
  IconCheck,
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
          color: "dark",
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
            "আপনার রিপোর্টটি গ্রহণ করা হয়েছে। Admin Panel থেকে ভেরিফাই ও approve করার পর এটি Public Notice Board-এ প্রকাশিত হবে।",
          color: "dark",
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

  return (
    <Stack gap="lg">
      {/* Top Banner & Report CTA - Uber Theme */}
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
                <IconAlertTriangle size={18} stroke={2.2} />
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
                Public Transit Notice Board & Live Alerts
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
                {alerts.length} VERIFIED ACTIVE
              </Badge>
            </Group>
            <Text
              size="xs"
              style={{ color: "var(--text-muted)", marginTop: 4 }}
            >
              শুধুমাত্র Admin দ্বারা যাচাইকৃত ও অনুমোদিত (Approved) রিপোর্টগুলোই
              এই পাবলিক নোটিশ বোর্ডে প্রদর্শিত হয় এবং স্বয়ংক্রিয়ভাবে ট্রানজিট
              রাউটিংকে প্রভাবিত করে।
            </Text>
          </Box>

          <Button
            size="sm"
            radius="xl"
            leftSection={<IconPlus size={16} />}
            onClick={() => setReportModalOpen(true)}
            styles={{
              root: {
                background: "var(--text-main)",
                color: "var(--bg-page)",
                fontWeight: 600,
                height: 38,
                padding: "0 18px",
              },
            }}
          >
            Report Incident
          </Button>
        </Group>
      </Paper>

      {/* Alert Feed Cards */}
      {alerts.length === 0 ? (
        <Paper
          p="xl"
          radius="lg"
          style={{
            textAlign: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Text size="sm" style={{ color: "var(--text-muted)" }}>
            No active street disruptions currently reported on Dhaka transit
            corridors.
          </Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <Badge
                      radius="sm"
                      size="xs"
                      variant="filled"
                      style={{
                        background:
                          alert.severity === "critical"
                            ? "#e11900"
                            : "var(--text-main)",
                        color: "var(--bg-page)",
                        fontWeight: 700,
                      }}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge
                      radius="sm"
                      size="xs"
                      variant="outline"
                      style={{
                        borderColor: "#00aa66",
                        color: "#00aa66",
                        background: "rgba(0, 170, 102, 0.08)",
                        fontWeight: 600,
                      }}
                    >
                      ✓ VERIFIED BY ADMIN
                    </Badge>
                    {alert.is_closed && (
                      <Badge
                        radius="sm"
                        size="xs"
                        variant="outline"
                        style={{
                          borderColor: "#e11900",
                          color: "#e11900",
                          fontWeight: 600,
                        }}
                      >
                        ROAD CLOSED
                      </Badge>
                    )}
                    {alert.reported_by_type === "simulation" && (
                      <Badge
                        radius="sm"
                        size="xs"
                        variant="outline"
                        style={{
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                          background: "var(--bg-card-inner)",
                          fontWeight: 600,
                        }}
                      >
                        SIMULATION FIXTURE
                      </Badge>
                    )}
                  </Group>

                  <Group gap={4} align="center">
                    <IconClock
                      size={13}
                      style={{ color: "var(--text-muted)" }}
                    />
                    <Text size="11px" style={{ color: "var(--text-muted)" }}>
                      {new Date(alert.observed_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Group>
                </Group>

                <Box>
                  <Text
                    fw={700}
                    size="sm"
                    style={{ color: "var(--text-main)" }}
                  >
                    {alert.title}
                  </Text>
                  {alert.title_bn && (
                    <Text size="xs" style={{ color: "var(--text-muted)" }}>
                      {alert.title_bn}
                    </Text>
                  )}
                </Box>

                <Text
                  size="xs"
                  style={{ color: "var(--text-sub)", lineHeight: 1.5 }}
                >
                  {alert.description}
                </Text>

                {/* Modes affected and Delay */}
                <Group
                  justify="space-between"
                  mt="xs"
                  align="center"
                  wrap="wrap"
                >
                  <Group gap={6}>
                    <Text size="11px" style={{ color: "var(--text-muted)" }}>
                      Affected:
                    </Text>
                    {alert.affected_modes.map((mode) => (
                      <Badge
                        key={mode}
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
                        {mode.toUpperCase()}
                      </Badge>
                    ))}
                    {alert.delay_minutes > 0 && (
                      <Badge
                        size="xs"
                        radius="sm"
                        variant="filled"
                        style={{
                          background: "var(--bg-card-inner)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                          fontWeight: 700,
                        }}
                      >
                        +{alert.delay_minutes} MIN DELAY
                      </Badge>
                    )}
                  </Group>

                  {/* Corroboration Actions */}
                  <Group gap={6}>
                    <Tooltip label="Confirm this incident is active">
                      <Button
                        size="compact-xs"
                        radius="xl"
                        variant="default"
                        leftSection={<IconThumbUp size={12} />}
                        onClick={() => handleVote(alert.id, "confirm")}
                        styles={{
                          root: {
                            background: "var(--bg-card-inner)",
                            color: "var(--text-main)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "11px",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Confirm ({alert.upvotes ?? 0})
                      </Button>
                    </Tooltip>

                    <Tooltip label="Dispute or report cleared">
                      <Button
                        size="compact-xs"
                        radius="xl"
                        variant="default"
                        leftSection={<IconThumbDown size={12} />}
                        onClick={() => handleVote(alert.id, "dispute")}
                        styles={{
                          root: {
                            background: "var(--bg-card-inner)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "11px",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Dispute ({alert.downvotes ?? 0})
                      </Button>
                    </Tooltip>
                  </Group>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Modal: Report Incident - Uber Clean Style */}
      <Modal
        opened={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        size="md"
        radius="lg"
        centered
        title={
          <Group gap="xs">
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
              <IconAlertTriangle size={16} stroke={2.2} />
            </Box>
            <Title
              order={4}
              style={{ color: "var(--text-main)", fontWeight: 700 }}
            >
              Report Street Disruption
            </Title>
          </Group>
        }
        styles={{
          content: {
            background: "var(--bg-card)",
            color: "var(--text-main)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
          },
          header: {
            background: "var(--bg-card)",
            color: "var(--text-main)",
            borderBottom: "1px solid var(--border-subtle)",
          },
        }}
      >
        <Stack gap="sm">
          <Text size="xs" style={{ color: "var(--text-muted)" }}>
            ঢাকার যাত্রীদের যানজট এড়াতে সাহায্য করুন। আপনার রিপোর্টটি সরাসরি
            Admin Moderation Queue-তে জমা হবে। অ্যাডমিন অনুমোদন (Approve) করলেই
            এটি Public Notice Board-এ প্রকাশিত হবে এবং রাউট রি-প্ল্যানিংয়ে যুক্ত
            হবে।
          </Text>

          <TextInput
            label="Incident Title"
            placeholder="e.g. Waterlogging near Rampura Bridge"
            required
            size="xs"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            styles={{
              label: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
              },
              input: {
                background: "var(--bg-card-inner)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-main)",
              },
            }}
          />

          <Select
            label="Corridor / Hub Impacted"
            placeholder="Select hub (optional)"
            data={hubOptions}
            value={selectedHubId}
            onChange={setSelectedHubId}
            clearable
            searchable
            size="xs"
            comboboxProps={{ withinPortal: true, zIndex: 3000 }}
            styles={{
              label: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
              },
              input: {
                background: "var(--bg-card-inner)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-main)",
              },
            }}
          />

          <MultiSelect
            label="Affected Transit Modes"
            placeholder="Select modes"
            data={[
              { value: "bus", label: "Bus" },
              { value: "metro", label: "MRT Line 6 (Metro)" },
              { value: "leguna", label: "Leguna (Human Hauler)" },
              { value: "rickshaw", label: "Rickshaw" },
            ]}
            value={affectedModes}
            onChange={setAffectedModes}
            size="xs"
            comboboxProps={{ withinPortal: true, zIndex: 3000 }}
            styles={{
              label: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
              },
              input: {
                background: "var(--bg-card-inner)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-main)",
              },
            }}
          />

          <Group grow>
            <NumberInput
              label="Expected Delay (mins)"
              value={delayMinutes}
              onChange={(v) => setDelayMinutes(Number(v) || 0)}
              min={0}
              max={180}
              size="xs"
              styles={{
                label: {
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                },
                input: {
                  background: "var(--bg-card-inner)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            />

            <Select
              label="Severity Level"
              data={[
                { value: "low", label: "Low (Minor slowdown)" },
                { value: "medium", label: "Medium (15-30 min delay)" },
                { value: "high", label: "High (Severe gridlock)" },
                { value: "critical", label: "Critical (Complete standstill)" },
              ]}
              value={severity}
              onChange={(v) => setSeverity(v || "medium")}
              size="xs"
              comboboxProps={{ withinPortal: true, zIndex: 3000 }}
              styles={{
                label: {
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                },
                input: {
                  background: "var(--bg-card-inner)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            />
          </Group>

          <Checkbox
            label="Road Completely Impassable / Closed"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.currentTarget.checked)}
            size="xs"
            color="dark"
            styles={{
              label: {
                fontSize: "12px",
                color: "var(--text-main)",
                fontWeight: 500,
              },
            }}
          />

          <Textarea
            label="Additional Details (Optional)"
            placeholder="Describe landmark, bottleneck cause, or advisory..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={2}
            size="xs"
            styles={{
              label: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
              },
              input: {
                background: "var(--bg-card-inner)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-main)",
              },
            }}
          />

          <Group justify="flex-end" gap="xs" mt="sm">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              radius="xl"
              onClick={handleReportSubmit}
              loading={submitting}
              styles={{
                root: {
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  fontWeight: 600,
                },
              }}
            >
              Submit Report
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
