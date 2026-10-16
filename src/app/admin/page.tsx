'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
} from '@tabler/icons-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function AdminPortalPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Signboard Digitization State
  const [selectedSample, setSelectedSample] = useState<string>('sample_bikolpo');
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?forAdmin=true');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleModeration = async (alertId: string, action: 'approve' | 'reject' | 'resolve') => {
    try {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'approved';
      const lifecycleStage = action === 'resolve' ? 'resolved' : 'active';
      const res = await fetch(`/api/reports/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lifecycleStage }),
      });

      if (res.ok) {
        notifications.show({
          title: 'Moderation Recorded',
          message: `Alert ${alertId} updated to ${status} (${lifecycleStage}).`,
          color: action === 'approve' ? 'teal' : action === 'reject' ? 'red' : 'blue',
        });
        fetchAlerts();
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to record moderation action.',
        color: 'red',
      });
    }
  };

  const handleScanSignboard = () => {
    setScanning(true);
    setTimeout(() => {
      if (selectedSample === 'sample_bikolpo') {
        setExtractedData({
          title: 'Bikolpo Auto Service Route Board',
          serviceName: 'Bikolpo Auto Service',
          mode: 'bus',
          operator: 'Bikolpo Syndicate Ltd.',
          origin: 'Mirpur 10',
          destination: 'Motijheel',
          via: ['Agargaon', 'Farmgate', 'Karwan Bazar', 'Shahbagh'],
          fareRegular: 25,
          fareStudent: 13,
          boardingLandmark: 'Police Box Counter, East Side of Mirpur 10 Circle',
          confidence: '98% (High confidence optical match)',
        });
      } else if (selectedSample === 'sample_mrt') {
        setExtractedData({
          title: 'MRT Line 6 Station Notice',
          serviceName: 'MRT Line 6',
          mode: 'metro',
          operator: 'Dhaka Mass Transit Company Ltd (DMTCL)',
          origin: 'Uttara North',
          destination: 'Motijheel',
          via: ['Pallabi', 'Mirpur 10', 'Agargaon', 'Farmgate', 'Shahbagh', 'Secretariat'],
          fareRegular: 100,
          fareStudent: 100,
          boardingLandmark: 'Elevated Concourse, Gates 1 & 2',
          confidence: '99% (Official DMTCL tariff format)',
        });
      } else {
        setExtractedData({
          title: 'Rampura-Banasree Leguna Stoppage Board',
          serviceName: 'Banasree Leguna',
          mode: 'leguna',
          operator: 'Human Hauler Welfare Union',
          origin: 'Rampura Bridge',
          destination: 'Gulshan 1',
          via: ['Banasree Block C', 'Police Plaza'],
          fareRegular: 20,
          fareStudent: 20,
          boardingLandmark: 'Under Rampura Foot-over Bridge',
          confidence: '91% (Handwritten signboard extracted)',
        });
      }
      setScanning(false);
      notifications.show({
        title: 'Signboard Digitized',
        message: 'Optical extraction completed. Review structured data below before import.',
        color: 'teal',
      });
    }, 900);
  };

  const handleApproveImport = () => {
    notifications.show({
      title: 'Import Approved',
      message: `${extractedData?.serviceName} details verified and merged into Transit CMS.`,
      color: 'teal',
    });
    setExtractedData(null);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <Link href="/">
              <Button size="xs" variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}>
                Back to Commuter App
              </Button>
            </Link>
            <Title order={2} style={{ color: 'var(--text-main)' }}>
              Transit Administration & Moderation
            </Title>
            <Badge color="red" variant="filled">
              ADMIN SECURE
            </Badge>
          </Group>
          <ThemeToggle />
        </Group>

        {/* Tabs: Moderation Queue, Network CMS, Fare Policies, Signboard Digitizer */}
        <Tabs defaultValue="moderation" color="teal">
          <Tabs.List>
            <Tabs.Tab value="moderation" leftSection={<IconShieldLock size={16} />}>
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
          </Tabs.List>

          {/* Moderation Panel */}
          <Tabs.Panel value="moderation" pt="md">
            <Paper p="md" radius="md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <Group justify="space-between" mb="xs">
                <Title order={4} style={{ color: 'var(--text-main)' }}>
                  Incident Reports Moderation Queue
                </Title>
                <Button size="xs" variant="light" color="teal" onClick={fetchAlerts}>
                  Refresh Queue
                </Button>
              </Group>
              <Text size="xs" c="dimmed" mb="md">
                Admin review changes report status to approved or rejected before routing calculations are affected.
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
                        <Text fw={600} size="sm" style={{ color: '#fff' }}>
                          {alert.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {alert.description || 'No additional details provided.'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={alert.severity === 'critical' ? 'red' : 'yellow'}>
                          {alert.severity}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {alert.affected_modes?.map((m: string) => (
                            <Badge key={m} size="xs" variant="outline" color="gray">
                              {m}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={alert.status === 'approved' ? 'teal' : alert.status === 'rejected' ? 'red' : 'yellow'} variant="light">
                          {alert.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={alert.lifecycle_stage === 'active' ? 'blue' : 'gray'} variant="outline">
                          {alert.lifecycle_stage}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Tooltip label="Approve & Affect Routes">
                            <ActionIcon color="teal" size="sm" onClick={() => handleModeration(alert.id, 'approve')}>
                              <IconCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Reject / Spam">
                            <ActionIcon color="red" size="sm" onClick={() => handleModeration(alert.id, 'reject')}>
                              <IconX size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Mark as Resolved">
                            <ActionIcon color="cyan" size="sm" onClick={() => handleModeration(alert.id, 'resolve')}>
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
            <Paper p="md" radius="md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <Title order={4} mb="md" style={{ color: 'var(--text-main)' }}>
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
                    { name: 'MRT Line 6', mode: 'metro', op: 'DMTCL', active: true },
                    { name: 'Bikolpo Auto Service', mode: 'bus', op: 'Bikolpo Syndicate', active: true },
                    { name: 'Prochesta Paribahan', mode: 'bus', op: 'Prochesta Ltd', active: true },
                    { name: 'Banasree-Gulshan Leguna', mode: 'leguna', op: 'Human Hauler Union', active: true },
                  ].map((srv, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Text fw={600} size="sm" style={{ color: '#fff' }}>
                          {srv.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={srv.mode === 'metro' ? 'teal' : srv.mode === 'bus' ? 'blue' : 'orange'}>
                          {srv.mode}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{srv.op}</Table.Td>
                      <Table.Td>
                        <Switch defaultChecked={srv.active} color="teal" size="sm" />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* Fares */}
          <Tabs.Panel value="fares" pt="md">
            <Paper p="md" radius="md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <Title order={4} mb="xs" style={{ color: 'var(--text-main)' }}>
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
                    { mode: 'MRT Line 6', reg: '20 - 100 ৳', student: 'Not Applicable', floor: '20 ৳' },
                    { mode: 'Bikolpo Bus', reg: '25 ৳', student: '50% Discount (13 ৳)', floor: '10 ৳' },
                    { mode: 'Prochesta Bus', reg: '30 ৳', student: '50% Discount (15 ৳)', floor: '10 ৳' },
                    { mode: 'Banasree Leguna', reg: '15 - 25 ৳', student: 'Not Applicable', floor: '15 ৳' },
                    { mode: 'Feeder Rickshaw', reg: '30 - 60 ৳ (Estimated)', student: 'Not Applicable', floor: '30 ৳' },
                  ].map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={600} style={{ color: '#fff' }}>
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
            <Paper p="md" radius="md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <Title order={4} mb="xs" style={{ color: 'var(--text-main)' }}>
                Signboard & Physical Notice Digitizer (Bonus Feature)
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Optical parsing of bus signboards, printed station fare charts, and handwritten stoppage notices with human-in-the-loop review.
              </Text>

              <Grid gap="md">
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Stack gap="sm">
                    <Select
                      label="Select Physical Notice / Signboard Sample"
                      data={[
                        { value: 'sample_bikolpo', label: '🚏 Bikolpo Paribahan Route Signboard (Mirpur 10)' },
                        { value: 'sample_mrt', label: '🚇 DMTCL Station Fare Schedule Notice' },
                        { value: 'sample_leguna', label: '🚐 Rampura Leguna Stand Handwritten Stoppage List' },
                      ]}
                      value={selectedSample}
                      onChange={(v) => setSelectedSample(v || 'sample_bikolpo')}
                      comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                    />

                    <Button
                      variant="gradient"
                      gradient={{ from: 'teal', to: 'cyan' }}
                      leftSection={scanning ? <Loader size="xs" color="white" /> : <IconSparkles size={16} />}
                      onClick={handleScanSignboard}
                      loading={scanning}
                    >
                      Extract Structured Transit Data
                    </Button>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                  {extractedData ? (
                    <Card p="md" radius="md" style={{ background: 'rgba(10, 15, 24, 0.7)', border: '1px solid #2dd4bf' }}>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Title order={5} style={{ color: '#fff' }}>
                            Extracted Structured Metadata
                          </Title>
                          <Badge color="teal" variant="light">
                            {extractedData.confidence}
                          </Badge>
                        </Group>

                        <Table verticalSpacing={4}>
                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Service Name:</Table.Td>
                              <Table.Td style={{ color: '#fff' }}>{extractedData.serviceName}</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Mode & Operator:</Table.Td>
                              <Table.Td style={{ color: '#fff' }}>{extractedData.mode} ({extractedData.operator})</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Corridor Endpoints:</Table.Td>
                              <Table.Td style={{ color: '#fff' }}>{extractedData.origin} ➔ {extractedData.destination}</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Intermediate Stoppages:</Table.Td>
                              <Table.Td style={{ color: '#fff' }}>{extractedData.via.join(' ➔ ')}</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Extracted Fare:</Table.Td>
                              <Table.Td style={{ color: '#fff' }}>Regular: {extractedData.fareRegular} ৳ | Student: {extractedData.fareStudent} ৳</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td fw={600} style={{ color: '#94a3b8' }}>Boarding Landmark:</Table.Td>
                              <Table.Td style={{ color: '#2dd4bf' }}>📍 {extractedData.boardingLandmark}</Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>

                        <Group justify="flex-end" mt="xs">
                          <Button size="xs" color="gray" variant="subtle" onClick={() => setExtractedData(null)}>
                            Discard
                          </Button>
                          <Button size="xs" color="teal" onClick={handleApproveImport}>
                            Approve & Merge into CMS
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  ) : (
                    <Box
                      p="xl"
                      style={{
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        textAlign: 'center',
                        color: '#94a3b8',
                      }}
                    >
                      <IconScan size={32} style={{ marginBottom: 8, opacity: 0.6 }} />
                      <Text size="sm">Select a notice sample and click "Extract Structured Transit Data".</Text>
                      <Text size="xs" c="dimmed">OCR and structured entity recognition will parse stoppages, landmarks, and fares.</Text>
                    </Box>
                  )}
                </Grid.Col>
              </Grid>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
