"use client";

import React, { useState } from "react";
import {
  Modal,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Badge,
  Button,
  Select,
  NumberInput,
  Card,
  Grid,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCar,
  IconUsers,
  IconCoins,
  IconUserPlus,
  IconPlus,
} from "@tabler/icons-react";

interface RideShareModalProps {
  opened: boolean;
  onClose: () => void;
}

interface SharedRide {
  id: string;
  originName: string;
  destinationName: string;
  vehicle: "CNG" | "Rickshaw";
  totalFare: number;
  totalSeats: number;
  takenSeats: number;
  departureTime: string;
  pickupLandmark: string;
  initiatorName: string;
}

export function RideShareModal({ opened, onClose }: RideShareModalProps) {
  // Calculator / Splitter Bot State
  const [vehicleType, setVehicleType] = useState<"CNG" | "Rickshaw">("CNG");
  const [passengerCount, setPassengerCount] = useState<number>(3);
  const [customFare, setCustomFare] = useState<number>(180);

  // Community Ride Board State
  const [rides, setRides] = useState<SharedRide[]>([
    {
      id: "ride_1",
      originName: "Gulshan 1 Circle",
      destinationName: "Mohakhali Amtoli",
      vehicle: "CNG",
      totalFare: 180,
      totalSeats: 4,
      takenSeats: 3,
      departureTime: "Departs in ~8 mins",
      pickupLandmark: "Beside DCC Market South Gate",
      initiatorName: "Tanvir A.",
    },
    {
      id: "ride_2",
      originName: "Banasree Block C",
      destinationName: "Rampura Bridge / Badda",
      vehicle: "Rickshaw",
      totalFare: 50,
      totalSeats: 2,
      takenSeats: 1,
      departureTime: "Immediate",
      pickupLandmark: "Ideal School Main Gate",
      initiatorName: "Nusrat J.",
    },
    {
      id: "ride_3",
      originName: "Farmgate Overbridge",
      destinationName: "Shahbagh BSMMU",
      vehicle: "CNG",
      totalFare: 160,
      totalSeats: 3,
      takenSeats: 2,
      departureTime: "Departs in ~15 mins",
      pickupLandmark: "Ananda Cinema Hall Corner",
      initiatorName: "Rahim K.",
    },
  ]);

  const [newRideOrigin] = useState("Gulshan 1 Circle");
  const [newRideDest] = useState("Mohakhali Amtoli");
  const [newRideVehicle] = useState<"CNG" | "Rickshaw">("CNG");
  const [newRideFare] = useState<number>(180);

  // Per person calculation
  const perPersonShare = Math.ceil(customFare / Math.max(1, passengerCount));
  const savingsPct = Math.round(
    ((customFare - perPersonShare) / customFare) * 100,
  );

  // Update typical fare when vehicle changes
  const handleVehicleChange = (val: string | null) => {
    if (val === "Rickshaw") {
      setVehicleType("Rickshaw");
      setPassengerCount(2);
      setCustomFare(50);
    } else {
      setVehicleType("CNG");
      setPassengerCount(3);
      setCustomFare(180);
    }
  };

  const handleJoinRide = (rideId: string) => {
    setRides((prev) =>
      prev.map((r) => {
        if (r.id === rideId && r.takenSeats < r.totalSeats) {
          notifications.show({
            title: "🎉 Joined Shared Ride!",
            message: `Seat confirmed for ${r.originName} ➔ ${r.destinationName}. Meet at: ${r.pickupLandmark}.`,
            color: "teal",
          });
          return { ...r, takenSeats: r.takenSeats + 1 };
        }
        return r;
      }),
    );
  };

  const handlePostRide = () => {
    const newRide: SharedRide = {
      id: `ride_${Date.now()}`,
      originName: newRideOrigin,
      destinationName: newRideDest,
      vehicle: newRideVehicle,
      totalFare: newRideFare,
      totalSeats: newRideVehicle === "CNG" ? 4 : 2,
      takenSeats: 1,
      departureTime: "Departs in ~10 mins",
      pickupLandmark: "Main Passenger Stand",
      initiatorName: "You (Guest)",
    };

    setRides((prev) => [newRide, ...prev]);
    notifications.show({
      title: "✅ Ride Posted to Board",
      message: `Your shared ${newRideVehicle} request from ${newRideOrigin} is live!`,
      color: "teal",
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconCar size={22} color="#2dd4bf" />
          <Title order={4} style={{ color: "var(--text-main)" }}>
            Shared Commute & Fare Splitter Bot
          </Title>
          <Badge size="xs" color="teal" variant="light">
            Bonus Task 4
          </Badge>
        </Group>
      }
      styles={{
        content: {
          background: "var(--bg-card)",
          color: "var(--text-main)",
          border: "1px solid var(--border-subtle)",
        },
        header: {
          background: "var(--bg-card)",
          color: "var(--text-main)",
          borderBottom: "1px solid var(--border-subtle)",
        },
      }}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Coordinate shared Rickshaw or CNG rides from major Dhaka hubs to split
          tariffs, reduce street congestion, and avoid solo peak-hour bargaining
          surge.
        </Text>

        <Grid gap="md">
          {/* Left Column: Per-Person Splitter Bot */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card-inner)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Stack gap="xs">
                <Group gap={6}>
                  <IconCoins size={18} color="#2dd4bf" />
                  <Title order={5} style={{ color: "var(--text-main)" }}>
                    Fare Split Calculator Bot
                  </Title>
                </Group>

                <Select
                  label="Vehicle Mode"
                  size="xs"
                  data={[
                    { value: "CNG", label: "🛺 CNG Auto-rickshaw (150–220 ৳)" },
                    {
                      value: "Rickshaw",
                      label: "🚲 Feeder Rickshaw (40–70 ৳)",
                    },
                  ]}
                  value={vehicleType}
                  onChange={handleVehicleChange}
                  comboboxProps={{ withinPortal: true, zIndex: 3000 }}
                />

                <NumberInput
                  label="Estimated Total Vehicle Fare (BDT)"
                  size="xs"
                  value={customFare}
                  onChange={(v) => setCustomFare(Number(v) || 0)}
                  min={20}
                  max={500}
                  step={10}
                />

                <NumberInput
                  label="Passengers Sharing"
                  size="xs"
                  value={passengerCount}
                  onChange={(v) => setPassengerCount(Number(v) || 1)}
                  min={1}
                  max={vehicleType === "CNG" ? 4 : 2}
                />

                {/* Split Breakdown Result Card */}
                <Card
                  p="sm"
                  radius="md"
                  mt="xs"
                  style={{
                    background: "rgba(45, 212, 191, 0.1)",
                    border: "1px solid #2dd4bf",
                  }}
                >
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed">
                      Each Passenger Pays:
                    </Text>
                    <Title order={2} style={{ color: "#2dd4bf" }}>
                      {perPersonShare} ৳
                    </Title>
                    <Badge size="xs" color="teal" variant="filled">
                      Save {savingsPct}% vs traveling solo!
                    </Badge>
                    <Text size="11px" c="dimmed" mt={4}>
                      Statutory Formula: ⌈ Total {customFare} ৳ /{" "}
                      {passengerCount} commuters ⌉
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column: Community Ride Board */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Group gap={6}>
                  <IconUsers size={18} color="#38bdf8" />
                  <Title order={5} style={{ color: "var(--text-main)" }}>
                    Live Hub Community Board
                  </Title>
                </Group>
                <Badge size="xs" color="cyan" variant="outline">
                  {rides.length} Active Rides
                </Badge>
              </Group>

              <Stack gap="xs">
                {rides.map((ride) => {
                  const seatsLeft = ride.totalSeats - ride.takenSeats;
                  const perSeat = Math.ceil(ride.totalFare / ride.totalSeats);

                  return (
                    <Card
                      key={ride.id}
                      p="xs"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Box>
                          <Group gap={6}>
                            <Badge
                              size="xs"
                              color={ride.vehicle === "CNG" ? "teal" : "orange"}
                            >
                              {ride.vehicle}
                            </Badge>
                            <Text
                              size="xs"
                              fw={700}
                              style={{ color: "var(--text-main)" }}
                            >
                              {ride.originName} ➔ {ride.destinationName}
                            </Text>
                          </Group>
                          <Text size="11px" c="dimmed" mt={2}>
                            📍 {ride.pickupLandmark} • ⏱ {ride.departureTime}
                          </Text>
                          <Text size="11px" c="teal" mt={1}>
                            Posted by {ride.initiatorName}
                          </Text>
                        </Box>

                        <Stack gap={4} align="flex-end">
                          <Group gap={4}>
                            <Text
                              size="sm"
                              fw={700}
                              style={{ color: "#2dd4bf" }}
                            >
                              {perSeat} ৳
                            </Text>
                            <Text size="10px" c="dimmed">
                              / seat
                            </Text>
                          </Group>

                          {seatsLeft > 0 ? (
                            <Button
                              size="compact-xs"
                              variant="gradient"
                              gradient={{ from: "teal", to: "cyan" }}
                              leftSection={<IconUserPlus size={12} />}
                              onClick={() => handleJoinRide(ride.id)}
                            >
                              Join ({seatsLeft} left)
                            </Button>
                          ) : (
                            <Badge size="xs" color="gray" variant="filled">
                              Full
                            </Badge>
                          )}
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>

              {/* Post Ride Quick Trigger */}
              <Paper
                p="xs"
                radius="sm"
                style={{
                  background: "var(--bg-card-inner)",
                  border: "1px dashed var(--border-subtle)",
                }}
              >
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    Want to start your own split ride?
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="cyan"
                    leftSection={<IconPlus size={12} />}
                    onClick={handlePostRide}
                  >
                    Post Request (+1)
                  </Button>
                </Group>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
}
