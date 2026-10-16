"use client";

import React, { useState, useEffect } from "react";
import { Container, Box, Loader, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { TransitNetworkBrowser } from "@/components/network/TransitNetworkBrowser";
import { Hub, Stop } from "@/types/network";
import { DisruptionAlert } from "@/types/alerts";

export default function TransitLinesPage() {
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [alerts, setAlerts] = useState<DisruptionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [netRes, alertRes] = await Promise.all([
          fetch("/api/network"),
          fetch("/api/alerts"),
        ]);
        const netData = await netRes.json();
        const alertData = await alertRes.json();

        setHubs(netData.hubs || []);
        setStops(netData.stops || []);
        setAlerts(alertData.alerts || []);
      } catch (err) {
        console.error("Failed to load network data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectHubForPlan = (hubId: string) => {
    router.push(`/?origin=${encodeURIComponent(hubId)}`);
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-page)",
      }}
    >
      <Navbar activeAlertsCount={alerts.length} />

      <Container
        size="xl"
        py="lg"
        style={{ flex: 1, width: "100%", maxWidth: 1440 }}
      >
        {loading ? (
          <Stack align="center" justify="center" py={80} gap="sm">
            <Loader color="dark" size="md" />
            <Text size="xs" style={{ color: "var(--text-muted)" }}>
              Loading official transit network catalog...
            </Text>
          </Stack>
        ) : (
          <TransitNetworkBrowser
            hubs={hubs}
            stops={stops}
            alerts={alerts}
            onSelectHubForPlan={handleSelectHubForPlan}
          />
        )}
      </Container>
    </Box>
  );
}
