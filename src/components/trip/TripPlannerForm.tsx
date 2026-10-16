"use client";

import React, { useState } from "react";
import {
  Paper,
  Select,
  MultiSelect,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Collapse,
  Loader,
  Box,
} from "@mantine/core";
import {
  IconArrowsExchange,
  IconAdjustmentsHorizontal,
  IconSchool,
  IconTrain,
  IconBus,
  IconCar,
  IconCurrentLocation,
} from "@tabler/icons-react";
import { Hub, TransitMode } from "@/types/network";

interface TripPlannerFormProps {
  hubs: Hub[];
  originHubId: string;
  setOriginHubId: (id: string) => void;
  destinationHubId: string;
  setDestinationHubId: (id: string) => void;
  student: boolean;
  setStudent: (val: boolean) => void;
  budgetBdt: number | null;
  setBudgetBdt: (val: number | null) => void;
  avoidHubIds: string[];
  setAvoidHubIds: (ids: string[]) => void;
  allowedModes: TransitMode[];
  setAllowedModes: (modes: TransitMode[]) => void;
  scenarioId: string | null;
  setScenarioId: (id: string | null) => void;
  onSearch: () => void;
  loading: boolean;
  onRequestLocation?: () => void;
  locationLoading?: boolean;
}

export function TripPlannerForm({
  hubs,
  originHubId,
  setOriginHubId,
  destinationHubId,
  setDestinationHubId,
  student,
  setStudent,
  budgetBdt,
  setBudgetBdt,
  avoidHubIds,
  setAvoidHubIds,
  allowedModes,
  setAllowedModes,
  scenarioId,
  setScenarioId,
  onSearch,
  loading,
  onRequestLocation,
  locationLoading,
}: TripPlannerFormProps) {
  const [showPreferences, setShowPreferences] = useState(false);

  const hubOptions = hubs.map((h) => ({
    value: h.id,
    label: `${h.name_en} (${h.name_bn})`,
  }));

  const handleSwap = () => {
    const temp = originHubId;
    setOriginHubId(destinationHubId);
    setDestinationHubId(temp);
  };

  const toggleMode = (mode: TransitMode) => {
    if (allowedModes.includes(mode)) {
      if (allowedModes.length > 1) {
        setAllowedModes(allowedModes.filter((m) => m !== mode));
      }
    } else {
      setAllowedModes([...allowedModes, mode]);
    }
  };

  const popularCorridors = [
    {
      label: "Mirpur 10 ➔ Motijheel",
      origin: "hub_mirpur_10",
      dest: "hub_motijheel",
    },
    {
      label: "Uttara ➔ Shahbagh",
      origin: "hub_uttara_north",
      dest: "hub_shahbagh",
    },
    {
      label: "Banasree ➔ Gulshan 1",
      origin: "hub_banasree",
      dest: "hub_gulshan_1",
    },
  ];

  return (
    <Paper
      p="lg"
      radius="lg"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        transition: "all 0.2s ease",
      }}
    >
      <Stack gap="md">
        {/* Uber Header */}
        <Group justify="space-between" align="center">
          <Text
            fw={800}
            size="xl"
            style={{
              letterSpacing: "-0.03em",
              color: "var(--text-main)",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Get a ride
          </Text>
          {onRequestLocation && (
            <Button
              size="compact-xs"
              variant="subtle"
              color="dark"
              leftSection={
                locationLoading ? (
                  <Loader size={12} color="gray" />
                ) : (
                  <IconCurrentLocation size={14} />
                )
              }
              onClick={onRequestLocation}
              disabled={locationLoading}
              radius="xl"
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 12,
                  color: "var(--text-sub)",
                },
              }}
            >
              {locationLoading ? "Locating..." : "Locate Me"}
            </Button>
          )}
        </Group>

        {/* Uber Pick-up & Destination Stacked Inputs with Connecting Line */}
        <Box style={{ position: "relative" }}>
          {/* Visual Connecting Line between Dot and Square */}
          <Box
            style={{
              position: "absolute",
              left: 20,
              top: 26,
              bottom: 26,
              width: 2,
              background: "var(--border-subtle)",
              zIndex: 1,
            }}
          />

          <Stack gap="xs">
            {/* Origin Input (Black Circle) */}
            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  position: "absolute",
                  left: 17,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--text-main)",
                  zIndex: 2,
                }}
              />
              <Select
                placeholder="Pickup location..."
                data={hubOptions}
                value={originHubId || null}
                onChange={(val) => setOriginHubId(val || "")}
                searchable
                clearable
                comboboxProps={{
                  withinPortal: true,
                  zIndex: 2000,
                  transitionProps: { duration: 150, transition: "fade" },
                }}
                styles={{
                  input: {
                    background: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-main)",
                    paddingLeft: 38,
                    height: 48,
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  },
                }}
              />
            </Box>

            {/* Destination Input (Black Square) */}
            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  position: "absolute",
                  left: 17,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 8,
                  background: "var(--text-main)",
                  zIndex: 2,
                }}
              />
              <Select
                placeholder="Where to?"
                data={hubOptions}
                value={destinationHubId || null}
                onChange={(val) => setDestinationHubId(val || "")}
                searchable
                clearable
                comboboxProps={{
                  withinPortal: true,
                  zIndex: 2000,
                  transitionProps: { duration: 150, transition: "fade" },
                }}
                styles={{
                  input: {
                    background: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-main)",
                    paddingLeft: 38,
                    height: 48,
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Swap Button on Right */}
          <ActionIcon
            size="md"
            variant="default"
            radius="xl"
            onClick={handleSwap}
            disabled={!originHubId && !destinationHubId}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderColor: "var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <IconArrowsExchange size={16} />
          </ActionIcon>
        </Box>

        {/* Clean, Subtle Suggestions & Preferences Bar */}
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={8} align="center">
            <Text
              size="11px"
              style={{ color: "var(--text-muted)", fontWeight: 600 }}
            >
              Popular:
            </Text>
            {popularCorridors.map((c, i) => (
              <Text
                key={i}
                size="11px"
                style={{
                  color: "var(--text-sub)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  fontWeight: 500,
                }}
                onClick={() => {
                  setOriginHubId(c.origin);
                  setDestinationHubId(c.dest);
                }}
              >
                {c.label}
              </Text>
            ))}
          </Group>

          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconAdjustmentsHorizontal size={14} />}
            onClick={() => setShowPreferences(!showPreferences)}
            radius="xl"
            styles={{
              root: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
              },
            }}
          >
            {showPreferences ? "Hide Options" : "Options & Concessions"}
          </Button>
        </Group>

        {/* Expandable Preferences & Concessions Panel (Keeps main UI pristine for non-students) */}
        {showPreferences && (
          <Paper
            p="sm"
            radius="md"
            style={{
              background: "var(--bg-card-inner)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="wrap">
                <Switch
                  checked={student}
                  onChange={(e) => setStudent(e.currentTarget.checked)}
                  color="dark"
                  size="xs"
                  label={
                    <Group gap={4}>
                      <IconSchool size={15} />
                      <Text
                        size="xs"
                        fw={600}
                        style={{ color: "var(--text-main)" }}
                      >
                        Student Pass (50% Off Bus)
                      </Text>
                    </Group>
                  }
                />

                <Group gap={6} align="center">
                  <Text size="11px" style={{ color: "var(--text-muted)" }}>
                    Max Budget:
                  </Text>
                  {[30, 50, 100].map((amt) => (
                    <Badge
                      key={amt}
                      size="xs"
                      variant={budgetBdt === amt ? "filled" : "outline"}
                      color="dark"
                      radius="sm"
                      style={{
                        cursor: "pointer",
                        background:
                          budgetBdt === amt ? "var(--text-main)" : undefined,
                        color:
                          budgetBdt === amt
                            ? "var(--bg-page)"
                            : "var(--text-sub)",
                      }}
                      onClick={() =>
                        setBudgetBdt(budgetBdt === amt ? null : amt)
                      }
                    >
                      ≤ {amt} ৳
                    </Badge>
                  ))}
                  {budgetBdt !== null && (
                    <Badge
                      size="xs"
                      variant="subtle"
                      color="gray"
                      style={{ cursor: "pointer" }}
                      onClick={() => setBudgetBdt(null)}
                    >
                      Clear
                    </Badge>
                  )}
                </Group>
              </Group>

              {/* Mode Filters */}
              <Group gap={6} mt={2}>
                <Text size="11px" style={{ color: "var(--text-muted)" }}>
                  Modes:
                </Text>
                <Button
                  size="compact-xs"
                  variant={
                    allowedModes.includes("metro") ? "filled" : "default"
                  }
                  radius="xl"
                  leftSection={<IconTrain size={12} />}
                  onClick={() => toggleMode("metro")}
                  styles={{
                    root: {
                      fontSize: "11px",
                      background: allowedModes.includes("metro")
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                      color: allowedModes.includes("metro")
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    },
                  }}
                >
                  Metro
                </Button>
                <Button
                  size="compact-xs"
                  variant={allowedModes.includes("bus") ? "filled" : "default"}
                  radius="xl"
                  leftSection={<IconBus size={12} />}
                  onClick={() => toggleMode("bus")}
                  styles={{
                    root: {
                      fontSize: "11px",
                      background: allowedModes.includes("bus")
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                      color: allowedModes.includes("bus")
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    },
                  }}
                >
                  Bus
                </Button>
                <Button
                  size="compact-xs"
                  variant={
                    allowedModes.includes("leguna") ? "filled" : "default"
                  }
                  radius="xl"
                  leftSection={<IconCar size={12} />}
                  onClick={() => toggleMode("leguna")}
                  styles={{
                    root: {
                      fontSize: "11px",
                      background: allowedModes.includes("leguna")
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                      color: allowedModes.includes("leguna")
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    },
                  }}
                >
                  Leguna
                </Button>
                <Button
                  size="compact-xs"
                  variant={
                    allowedModes.includes("rickshaw") ? "filled" : "default"
                  }
                  radius="xl"
                  onClick={() => toggleMode("rickshaw")}
                  styles={{
                    root: {
                      fontSize: "11px",
                      background: allowedModes.includes("rickshaw")
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                      color: allowedModes.includes("rickshaw")
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    },
                  }}
                >
                  Rickshaw
                </Button>
              </Group>

              <MultiSelect
                label="Avoid Corridors / Hubs"
                placeholder="Select hubs to avoid..."
                data={hubOptions}
                value={avoidHubIds}
                onChange={setAvoidHubIds}
                clearable
                size="xs"
                comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                styles={{
                  label: {
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  },
                  input: {
                    background: "var(--bg-card)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-main)",
                  },
                }}
              />

              <Select
                label="Simulation Scenario"
                placeholder="Live Conditions (No Simulation)"
                data={[
                  {
                    value: "",
                    label: "🟢 Live Conditions (No Simulation)",
                  },
                  {
                    value: "disrupt_malibagh_waterlogging",
                    label: "🌊 Malibagh Waterlogging (Detour via Mohakhali)",
                  },
                  {
                    value: "disrupt_farmgate_vip_movement",
                    label: "🚔 Farmgate VIP Movement (+20m bus delay)",
                  },
                  {
                    value: "disrupt_mrt_shewrapara_delay",
                    label: "🚇 MRT-6 Signaling Calibration (+10m delay)",
                  },
                  {
                    value: "disrupt_rampura_blockade",
                    label: "🚫 Rampura Canal Blockade (Simulates No Route)",
                  },
                ]}
                value={scenarioId || ""}
                onChange={(val) => setScenarioId(val || null)}
                size="xs"
                comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                styles={{
                  label: {
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  },
                  input: {
                    background: "var(--bg-card)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-main)",
                  },
                }}
              />
            </Stack>
          </Paper>
        )}

        {/* Uber Primary Solid Black Search CTA */}
        <Button
          fullWidth
          size="lg"
          variant="filled"
          onClick={onSearch}
          loading={loading}
          disabled={!originHubId || !destinationHubId}
          radius="md"
          styles={{
            root: {
              background: "var(--text-main)",
              color: "var(--bg-page)",
              fontWeight: 700,
              fontSize: 16,
              height: 52,
              letterSpacing: "-0.01em",
              transition: "transform 0.1s ease, background-color 0.2s ease",
              "&:hover": {
                opacity: 0.9,
              },
            },
          }}
        >
          {originHubId && destinationHubId
            ? "Search"
            : "Enter pickup & destination"}
        </Button>
      </Stack>
    </Paper>
  );
}
