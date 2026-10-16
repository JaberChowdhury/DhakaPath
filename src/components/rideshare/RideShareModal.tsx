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
  TextInput,
  NumberInput,
  Card,
  Grid,
  Box,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCar,
  IconUsers,
  IconCoins,
  IconUserPlus,
  IconPlus,
  IconMapPin,
  IconClock,
  IconArrowRight,
  IconCheck,
  IconX,
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

  // Custom Ride Post Form State
  const [showPostForm, setShowPostForm] = useState(false);
  const [postOrigin, setPostOrigin] = useState("Gulshan 1 Circle");
  const [postDest, setPostDest] = useState("Mohakhali Amtoli");
  const [postVehicle, setPostVehicle] = useState<"CNG" | "Rickshaw">("CNG");
  const [postFare, setPostFare] = useState<number>(180);
  const [postLandmark, setPostLandmark] = useState(
    "Beside DCC Market South Gate",
  );

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

  // Per person calculation
  const perPersonShare = Math.ceil(customFare / Math.max(1, passengerCount));
  const savingsPct = Math.round(
    ((customFare - perPersonShare) / customFare) * 100,
  );

  // Update typical fare when vehicle changes
  const handleVehicleSelect = (type: "CNG" | "Rickshaw") => {
    setVehicleType(type);
    if (type === "Rickshaw") {
      setPassengerCount(2);
      setCustomFare(50);
    } else {
      setPassengerCount(3);
      setCustomFare(180);
    }
  };

  const handleJoinRide = (rideId: string) => {
    setRides((prev) =>
      prev.map((r) => {
        if (r.id === rideId && r.takenSeats < r.totalSeats) {
          notifications.show({
            title: "Seat Confirmed",
            message: `You joined ${r.originName} → ${r.destinationName}. Meet at ${r.pickupLandmark}.`,
            color: "dark",
          });
          return { ...r, takenSeats: r.takenSeats + 1 };
        }
        return r;
      }),
    );
  };

  const handlePostRideSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!postOrigin.trim() || !postDest.trim()) {
      notifications.show({
        title: "Incomplete Details",
        message: "Please enter both origin and destination.",
        color: "red",
      });
      return;
    }

    const newRide: SharedRide = {
      id: `ride_${Date.now()}`,
      originName: postOrigin.trim(),
      destinationName: postDest.trim(),
      vehicle: postVehicle,
      totalFare: postFare > 0 ? postFare : postVehicle === "CNG" ? 180 : 50,
      totalSeats: postVehicle === "CNG" ? 4 : 2,
      takenSeats: 1,
      departureTime: "Departs in ~10 mins",
      pickupLandmark: postLandmark.trim() || "Main Road Junction",
      initiatorName: "You (Host)",
    };

    setRides((prev) => [newRide, ...prev]);
    setShowPostForm(false);
    notifications.show({
      title: "Shared Ride Live",
      message: `Your ${postVehicle} ride request is now posted to the community board.`,
      color: "dark",
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="lg"
      padding="lg"
      title={
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--text-main)",
              color: "var(--bg-page)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCar size={20} stroke={2.2} />
          </Box>
          <Box>
            <Title
              order={4}
              style={{
                color: "var(--text-main)",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Shared Commute & Fare Splitter
            </Title>
            <Text size="11px" style={{ color: "var(--text-muted)" }}>
              Dhaka Multi-Commuter Hub Pooling
            </Text>
          </Box>
          <Badge
            size="sm"
            radius="sm"
            variant="outline"
            style={{
              marginLeft: 8,
              borderColor: "var(--border-subtle)",
              color: "var(--text-main)",
              background: "var(--bg-card-inner)",
              fontWeight: 600,
            }}
          >
            UBER POOL STYLE
          </Badge>
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
          paddingBottom: 16,
        },
        close: {
          color: "var(--text-main)",
          borderRadius: "50%",
          "&:hover": {
            backgroundColor: "var(--bg-card-inner)",
          },
        },
      }}
    >
      <Stack gap="lg" mt="xs">
        <Text size="xs" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
          Share Rickshaw or CNG rides from major Dhaka hubs to split tariffs,
          reduce street congestion, and avoid solo peak-hour bargaining surge.
        </Text>

        <Grid gap="lg">
          {/* Left Column: Fare Split Calculator */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper
              p="md"
              radius="md"
              style={{
                background: "var(--bg-card-inner)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Stack gap="sm">
                <Group gap={8} align="center">
                  <IconCoins
                    size={18}
                    stroke={2}
                    style={{ color: "var(--text-main)" }}
                  />
                  <Text
                    fw={700}
                    size="sm"
                    style={{ color: "var(--text-main)" }}
                  >
                    Fare Split Calculator
                  </Text>
                </Group>

                {/* Uber-style Vehicle Selector Cards */}
                <Box>
                  <Text
                    size="11px"
                    fw={600}
                    mb={6}
                    style={{ color: "var(--text-muted)" }}
                  >
                    SELECT VEHICLE MODE
                  </Text>
                  <Grid gap="xs">
                    <Grid.Col span={6}>
                      <UnstyledButton
                        onClick={() => handleVehicleSelect("CNG")}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: 8,
                          background:
                            vehicleType === "CNG"
                              ? "var(--bg-card)"
                              : "transparent",
                          border:
                            vehicleType === "CNG"
                              ? "2px solid var(--text-main)"
                              : "1px solid var(--border-subtle)",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                          cursor: "pointer",
                        }}
                      >
                        <Text size="lg" mb={2}>
                          🛺
                        </Text>
                        <Text
                          size="xs"
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
                          CNG Auto
                        </Text>
                        <Text
                          size="10px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Max 4 seats • 150–220৳
                        </Text>
                      </UnstyledButton>
                    </Grid.Col>

                    <Grid.Col span={6}>
                      <UnstyledButton
                        onClick={() => handleVehicleSelect("Rickshaw")}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: 8,
                          background:
                            vehicleType === "Rickshaw"
                              ? "var(--bg-card)"
                              : "transparent",
                          border:
                            vehicleType === "Rickshaw"
                              ? "2px solid var(--text-main)"
                              : "1px solid var(--border-subtle)",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                          cursor: "pointer",
                        }}
                      >
                        <Text size="lg" mb={2}>
                          🚲
                        </Text>
                        <Text
                          size="xs"
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
                          Rickshaw
                        </Text>
                        <Text
                          size="10px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Max 2 seats • 40–70৳
                        </Text>
                      </UnstyledButton>
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Input Fields */}
                <NumberInput
                  label="Estimated Vehicle Fare (BDT)"
                  size="xs"
                  prefix="৳ "
                  value={customFare}
                  onChange={(v) => setCustomFare(Number(v) || 0)}
                  min={20}
                  max={600}
                  step={10}
                  styles={{
                    label: {
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    },
                    input: {
                      background: "var(--bg-card)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-main)",
                      fontWeight: 600,
                      borderRadius: 6,
                    },
                  }}
                />

                <NumberInput
                  label="Commuters Sharing Fare"
                  size="xs"
                  value={passengerCount}
                  onChange={(v) => setPassengerCount(Number(v) || 1)}
                  min={1}
                  max={vehicleType === "CNG" ? 4 : 2}
                  styles={{
                    label: {
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    },
                    input: {
                      background: "var(--bg-card)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-main)",
                      fontWeight: 600,
                      borderRadius: 6,
                    },
                  }}
                />

                {/* Uber-style High-Contrast Share Card */}
                <Card
                  p="md"
                  radius="md"
                  mt="xs"
                  style={{
                    background: "var(--text-main)",
                    color: "var(--bg-page)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <Stack gap={6} align="center">
                    <Text
                      size="10px"
                      fw={700}
                      style={{
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity: 0.8,
                      }}
                    >
                      Each Commuter Pays
                    </Text>

                    <Group gap={4} align="baseline">
                      <Title
                        order={1}
                        style={{
                          fontSize: 34,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "var(--bg-page)",
                        }}
                      >
                        ৳ {perPersonShare}
                      </Title>
                      <Text
                        size="xs"
                        style={{ opacity: 0.8, color: "var(--bg-page)" }}
                      >
                        / person
                      </Text>
                    </Group>

                    <Badge
                      size="sm"
                      radius="xl"
                      variant="filled"
                      style={{
                        background: "var(--bg-page)",
                        color: "var(--text-main)",
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      Save {savingsPct}% vs solo
                    </Badge>

                    <Text
                      size="10px"
                      style={{
                        opacity: 0.7,
                        textAlign: "center",
                        marginTop: 4,
                        color: "var(--bg-page)",
                      }}
                    >
                      Formula: ⌈ Total {customFare} ৳ ÷ {passengerCount}{" "}
                      commuters ⌉
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column: Live Hub Community Board */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Group gap={8}>
                  <IconUsers
                    size={18}
                    stroke={2}
                    style={{ color: "var(--text-main)" }}
                  />
                  <Text
                    fw={700}
                    size="sm"
                    style={{ color: "var(--text-main)" }}
                  >
                    Live Hub Community Board
                  </Text>
                </Group>
                <Badge
                  size="sm"
                  radius="xl"
                  variant="outline"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-main)",
                    background: "var(--bg-card-inner)",
                    fontWeight: 600,
                  }}
                >
                  {rides.length} Active Rides
                </Badge>
              </Group>

              {/* Ride Items List */}
              <Stack gap="xs">
                {rides.map((ride) => {
                  const seatsLeft = ride.totalSeats - ride.takenSeats;
                  const perSeat = Math.ceil(ride.totalFare / ride.totalSeats);

                  return (
                    <Card
                      key={ride.id}
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        transition:
                          "border-color 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="nowrap"
                      >
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group gap={8} mb={4} wrap="wrap" align="center">
                            <Box
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 7px",
                                borderRadius: 4,
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "var(--text-main)",
                                color: "var(--bg-page)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {ride.vehicle === "CNG"
                                ? "🛺 CNG"
                                : "🚲 Rickshaw"}
                            </Box>
                            <Text
                              size="xs"
                              fw={700}
                              style={{ color: "var(--text-main)" }}
                            >
                              {ride.originName}
                            </Text>
                            <IconArrowRight
                              size={12}
                              style={{
                                color: "var(--text-muted)",
                                flexShrink: 0,
                              }}
                            />
                            <Text
                              size="xs"
                              fw={700}
                              style={{ color: "var(--text-main)" }}
                            >
                              {ride.destinationName}
                            </Text>
                          </Group>

                          <Group gap={12} mt={6}>
                            <Group gap={4}>
                              <IconMapPin
                                size={12}
                                style={{ color: "var(--text-muted)" }}
                              />
                              <Text
                                size="11px"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {ride.pickupLandmark}
                              </Text>
                            </Group>
                            <Group gap={4}>
                              <IconClock
                                size={12}
                                style={{ color: "var(--text-muted)" }}
                              />
                              <Text
                                size="11px"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {ride.departureTime}
                              </Text>
                            </Group>
                          </Group>

                          <Text
                            size="10px"
                            mt={4}
                            style={{ color: "var(--text-muted)" }}
                          >
                            Host: {ride.initiatorName} • {ride.takenSeats}/
                            {ride.totalSeats} seats filled
                          </Text>
                        </Box>

                        {/* Pricing & Join Button */}
                        <Stack
                          gap={6}
                          align="flex-end"
                          style={{ flexShrink: 0 }}
                        >
                          <Group gap={2} align="baseline">
                            <Text
                              size="md"
                              fw={800}
                              style={{ color: "var(--text-main)" }}
                            >
                              ৳ {perSeat}
                            </Text>
                            <Text
                              size="10px"
                              style={{ color: "var(--text-muted)" }}
                            >
                              /seat
                            </Text>
                          </Group>

                          {seatsLeft > 0 ? (
                            <Button
                              size="compact-xs"
                              radius="xl"
                              onClick={() => handleJoinRide(ride.id)}
                              leftSection={<IconUserPlus size={12} />}
                              styles={{
                                root: {
                                  background: "var(--text-main)",
                                  color: "var(--bg-page)",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  border: "none",
                                  transition: "opacity 0.15s ease",
                                  "&:hover": {
                                    opacity: 0.9,
                                  },
                                },
                              }}
                            >
                              Join ({seatsLeft} left)
                            </Button>
                          ) : (
                            <Badge
                              size="xs"
                              radius="xl"
                              variant="outline"
                              style={{
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-muted)",
                                background: "var(--bg-card-inner)",
                              }}
                            >
                              Full
                            </Badge>
                          )}
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>

              {/* Uber-style Post Ride Request Accordion / Drawer */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  background: "var(--bg-card-inner)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {!showPostForm ? (
                  <Group justify="space-between" align="center">
                    <Box>
                      <Text
                        size="xs"
                        fw={600}
                        style={{ color: "var(--text-main)" }}
                      >
                        Need a ride on your route?
                      </Text>
                      <Text size="11px" style={{ color: "var(--text-muted)" }}>
                        Post your request and let nearby commuters join
                      </Text>
                    </Box>
                    <Button
                      size="xs"
                      radius="xl"
                      variant="default"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => setShowPostForm(true)}
                      styles={{
                        root: {
                          background: "var(--bg-card)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                          fontWeight: 600,
                          fontSize: "12px",
                        },
                      }}
                    >
                      Post Request
                    </Button>
                  </Group>
                ) : (
                  <Stack gap="xs" pt={4}>
                    <Group justify="space-between" align="center">
                      <Text
                        size="xs"
                        fw={700}
                        style={{ color: "var(--text-main)" }}
                      >
                        Post a New Shared Commute Request
                      </Text>
                      <UnstyledButton
                        onClick={() => setShowPostForm(false)}
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <IconX size={16} />
                      </UnstyledButton>
                    </Group>

                    <Grid gap="xs">
                      <Grid.Col span={6}>
                        <TextInput
                          label="Origin Hub"
                          size="xs"
                          value={postOrigin}
                          onChange={(e) => setPostOrigin(e.currentTarget.value)}
                          placeholder="e.g. Gulshan 1"
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
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Destination"
                          size="xs"
                          value={postDest}
                          onChange={(e) => setPostDest(e.currentTarget.value)}
                          placeholder="e.g. Mohakhali"
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
                      </Grid.Col>
                    </Grid>

                    <Grid gap="xs">
                      <Grid.Col span={4}>
                        <Group gap={4} mt={6}>
                          <UnstyledButton
                            onClick={() => setPostVehicle("CNG")}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              borderRadius: 6,
                              textAlign: "center",
                              fontSize: "11px",
                              fontWeight: 600,
                              background:
                                postVehicle === "CNG"
                                  ? "var(--text-main)"
                                  : "var(--bg-card)",
                              color:
                                postVehicle === "CNG"
                                  ? "var(--bg-page)"
                                  : "var(--text-main)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            🛺 CNG
                          </UnstyledButton>
                          <UnstyledButton
                            onClick={() => setPostVehicle("Rickshaw")}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              borderRadius: 6,
                              textAlign: "center",
                              fontSize: "11px",
                              fontWeight: 600,
                              background:
                                postVehicle === "Rickshaw"
                                  ? "var(--text-main)"
                                  : "var(--bg-card)",
                              color:
                                postVehicle === "Rickshaw"
                                  ? "var(--bg-page)"
                                  : "var(--text-main)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            🚲 Rickshaw
                          </UnstyledButton>
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Total Fare"
                          size="xs"
                          prefix="৳ "
                          value={postFare}
                          onChange={(v) => setPostFare(Number(v) || 0)}
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
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <TextInput
                          label="Pickup Landmark"
                          size="xs"
                          value={postLandmark}
                          onChange={(e) =>
                            setPostLandmark(e.currentTarget.value)
                          }
                          placeholder="e.g. South Gate"
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
                      </Grid.Col>
                    </Grid>

                    <Group justify="flex-end" gap="xs" mt={4}>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setShowPostForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="xs"
                        radius="xl"
                        leftSection={<IconCheck size={14} />}
                        onClick={handlePostRideSubmit}
                        styles={{
                          root: {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Post to Board
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
}
