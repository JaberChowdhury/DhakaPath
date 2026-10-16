"use client";

import React, { useState, useEffect } from "react";
import { Container, Box, Loader, Stack, Text } from "@mantine/core";
import { Navbar } from "@/components/layout/Navbar";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import { Hub } from "@/types/network";
import { DisruptionAlert } from "@/types/alerts";

export default function AlertsPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [alerts, setAlerts] = useState<DisruptionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertsData = async () => {
    try {
      const [netRes, alertRes] = await Promise.all([
        fetch("/api/network"),
        fetch("/api/alerts"),
      ]);
      const netData = await netRes.json();
      const alertData = await alertRes.json();

      setHubs(netData.hubs || []);
      setAlerts(alertData.alerts || []);
    } catch (err) {
      console.error("Failed to load alerts data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

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
        size="lg"
        py="lg"
        style={{ flex: 1, width: "100%", maxWidth: 1080 }}
      >
        {loading ? (
          <Stack align="center" justify="center" py={80} gap="sm">
            <Loader color="dark" size="md" />
            <Text size="xs" style={{ color: "var(--text-muted)" }}>
              Loading live street disruption feed...
            </Text>
          </Stack>
        ) : (
          <AlertFeed
            alerts={alerts}
            hubs={hubs}
            onRefreshAlerts={fetchAlertsData}
          />
        )}
      </Container>
    </Box>
  );
}
