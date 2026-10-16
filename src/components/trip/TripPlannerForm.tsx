'use client';

import React from 'react';
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
  Tooltip,
  Collapse,
  Loader,
  Box,
} from '@mantine/core';
import {
  IconArrowRight,
  IconArrowsExchange,
  IconAdjustmentsHorizontal,
  IconSchool,
  IconAlertCircle,
  IconTrain,
  IconBus,
  IconCar,
  IconCurrentLocation,
  IconSparkles,
} from '@tabler/icons-react';
import { Hub, TransitMode } from '@/types/network';

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
  const [showFilters, setShowFilters] = React.useState(false);

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

  // Popular dynamic corridors
  const popularCorridors = [
    { label: 'Mirpur 10 ➔ Motijheel', origin: 'hub_mirpur_10', dest: 'hub_motijheel' },
    { label: 'Uttara ➔ Shahbagh', origin: 'hub_uttara_north', dest: 'hub_shahbagh' },
    { label: 'Banasree ➔ Gulshan 1', origin: 'hub_banasree', dest: 'hub_gulshan_1' },
    { label: 'Farmgate ➔ Kawran Bazar', origin: 'hub_farmgate', dest: 'hub_kawran_bazar' },
  ];

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.2s ease',
      }}
    >
      <Stack gap="sm">
        {/* Origin & Destination with Swap and Geolocation Trigger */}
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <Box style={{ flex: 1 }}>
            <Group justify="space-between" mb={3} gap={4}>
              <Text size="xs" fw={600} c="dimmed">
                Origin (কোথা থেকে)
              </Text>
              {onRequestLocation && (
                <Tooltip label="Ask for browser GPS permission to detect nearest station">
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="teal"
                    leftSection={locationLoading ? <Loader size={12} color="teal" /> : <IconCurrentLocation size={13} />}
                    onClick={onRequestLocation}
                    disabled={locationLoading}
                    styles={{
                      root: { padding: '2px 6px', height: 20, fontSize: 11 },
                    }}
                  >
                    {locationLoading ? 'Locating...' : 'Locate Me'}
                  </Button>
                </Tooltip>
              )}
            </Group>
            <Select
              placeholder="Select starting hub..."
              data={hubOptions}
              value={originHubId || null}
              onChange={(val) => setOriginHubId(val || '')}
              searchable
              clearable
              comboboxProps={{
                withinPortal: true,
                zIndex: 2000,
                transitionProps: { duration: 150, transition: 'fade' },
              }}
              styles={{
                input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
              }}
            />
          </Box>

          <Tooltip label="Swap endpoints">
            <ActionIcon
              size="lg"
              variant="light"
              color="teal"
              mb={2}
              onClick={handleSwap}
              disabled={!originHubId && !destinationHubId}
            >
              <IconArrowsExchange size={18} />
            </ActionIcon>
          </Tooltip>

          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={600} c="dimmed" mb={3}>
              Destination (কোথায় যাবেন)
            </Text>
            <Select
              placeholder="Select destination hub..."
              data={hubOptions}
              value={destinationHubId || null}
              onChange={(val) => setDestinationHubId(val || '')}
              searchable
              clearable
              comboboxProps={{
                withinPortal: true,
                zIndex: 2000,
                transitionProps: { duration: 150, transition: 'fade' },
              }}
              styles={{
                input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
              }}
            />
          </Box>
        </Group>

        {/* Dynamic Quick Corridor Suggestions */}
        <Group gap={6} align="center">
          <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconSparkles size={12} color="#0d9488" /> Quick:
          </Text>
          {popularCorridors.map((c, i) => (
            <Badge
              key={i}
              size="xs"
              variant="light"
              color="teal"
              style={{ cursor: 'pointer', textTransform: 'none' }}
              onClick={() => {
                setOriginHubId(c.origin);
                setDestinationHubId(c.dest);
              }}
            >
              {c.label}
            </Badge>
          ))}
        </Group>

        {/* Student Concession & Budget Pills */}
        <Group justify="space-between" align="center" wrap="wrap">
          <Switch
            checked={student}
            onChange={(e) => setStudent(e.currentTarget.checked)}
            color="teal"
            size="sm"
            label={
              <Group gap={4}>
                <IconSchool size={16} color="#0d9488" />
                <Text size="sm" fw={500}>
                  Student Concession
                </Text>
                <Badge size="xs" color="teal" variant="light">
                  50% Bus Off
                </Badge>
              </Group>
            }
          />

          {/* Quick Budget Pills */}
          <Group gap={6} align="center">
            <Text size="xs" c="dimmed">
              Budget:
            </Text>
            {[30, 50, 100].map((amt) => (
              <Badge
                key={amt}
                size="sm"
                variant={budgetBdt === amt ? 'filled' : 'outline'}
                color="cyan"
                style={{ cursor: 'pointer' }}
                onClick={() => setBudgetBdt(budgetBdt === amt ? null : amt)}
              >
                ≤ {amt} ৳
              </Badge>
            ))}
            {budgetBdt !== null && (
              <Badge
                size="sm"
                variant="light"
                color="gray"
                style={{ cursor: 'pointer' }}
                onClick={() => setBudgetBdt(null)}
              >
                Clear
              </Badge>
            )}
          </Group>
        </Group>

        {/* Mode Selector Chips */}
        <Group justify="space-between" align="center">
          <Group gap={6}>
            <Text size="xs" c="dimmed">
              Modes:
            </Text>
            <Button
              size="compact-xs"
              variant={allowedModes.includes('metro') ? 'filled' : 'subtle'}
              color="teal"
              leftSection={<IconTrain size={13} />}
              onClick={() => toggleMode('metro')}
            >
              Metro
            </Button>
            <Button
              size="compact-xs"
              variant={allowedModes.includes('bus') ? 'filled' : 'subtle'}
              color="blue"
              leftSection={<IconBus size={13} />}
              onClick={() => toggleMode('bus')}
            >
              Bus
            </Button>
            <Button
              size="compact-xs"
              variant={allowedModes.includes('leguna') ? 'filled' : 'subtle'}
              color="orange"
              leftSection={<IconCar size={13} />}
              onClick={() => toggleMode('leguna')}
            >
              Leguna
            </Button>
            <Button
              size="compact-xs"
              variant={allowedModes.includes('rickshaw') ? 'filled' : 'subtle'}
              color="grape"
              onClick={() => toggleMode('rickshaw')}
            >
              Rickshaw
            </Button>
          </Group>

          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconAdjustmentsHorizontal size={14} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Advanced' : 'Disruptions'}
          </Button>
        </Group>

        {/* Advanced Simulation Collapsible */}
        <Collapse expanded={showFilters}>
          <Stack gap="xs" pt="xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <MultiSelect
              label="Avoid Corridors / Hubs"
              placeholder="Select hubs to route around..."
              data={hubOptions}
              value={avoidHubIds}
              onChange={setAvoidHubIds}
              clearable
              comboboxProps={{
                withinPortal: true,
                zIndex: 2000,
              }}
              styles={{
                input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
              }}
            />

            <Select
              label="Inject Synthetic Disruption Scenario"
              placeholder="Live Conditions (No Simulation)"
              data={[
                { value: '', label: '🟢 Live Conditions (No Injected Simulation)' },
                { value: 'disrupt_malibagh_waterlogging', label: '🌊 Malibagh Waterlogging (Closed to buses/rickshaws)' },
                { value: 'disrupt_farmgate_vip_movement', label: '🚔 Farmgate VIP Movement (+20m bus delay)' },
                { value: 'disrupt_mrt_shewrapara_delay', label: '🚇 MRT-6 Signaling Calibration (+10m metro delay)' },
                { value: 'disrupt_rampura_blockade', label: '🚫 Rampura Canal Blockade (Simulates No Valid Route)' },
              ]}
              value={scenarioId || ''}
              onChange={(val) => setScenarioId(val || null)}
              comboboxProps={{
                withinPortal: true,
                zIndex: 2000,
              }}
              styles={{
                input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
              }}
            />
          </Stack>
        </Collapse>

        {/* Search CTA */}
        <Button
          fullWidth
          size="md"
          variant="gradient"
          gradient={{ from: 'teal', to: 'cyan' }}
          rightSection={<IconArrowRight size={18} />}
          onClick={onSearch}
          loading={loading}
          disabled={!originHubId || !destinationHubId}
          style={{
            boxShadow: '0 4px 20px rgba(45, 212, 191, 0.25)',
          }}
        >
          {originHubId && destinationHubId ? 'Find Optimal Routes' : 'Select Origin & Destination'}
        </Button>
      </Stack>
    </Paper>
  );
}
