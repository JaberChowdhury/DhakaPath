"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Divider,
  Badge,
  Alert,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconShieldLock,
  IconUser,
  IconArrowLeft,
  IconAlertTriangle,
  IconKey,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get("redirect") || "/admin";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If redirected to login with redirect param pointing to /admin, default to admin mode
    if (redirectUrl.startsWith("/admin")) {
      setIsAdminMode(true);
    }
  }, [redirectUrl]);

  // Quick fill default official credentials
  const handleFillDemoAdmin = () => {
    setEmail("admin@dhakapath.gov.bd");
    setPassword("dhakapath@admin2026");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isAdminMode) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          notifications.show({
            title: "Admin Session Authenticated",
            message: `Welcome, ${data.user?.displayName || "Transit Admin"}! Elevated privileges active.`,
            color: "teal",
            icon: <IconCheck size={18} />,
          });

          router.push(redirectUrl);
          router.refresh();
        } else {
          notifications.show({
            title: "Authentication Denied",
            message: data.message || "Invalid administrative credentials.",
            color: "red",
            icon: <IconAlertTriangle size={18} />,
          });
        }
      } catch {
        notifications.show({
          title: "Connection Error",
          message: "Unable to reach authentication server.",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Commuter optional sign-in
      notifications.show({
        title: "Commuter Sign-In",
        message: "Signed in. Saved favorite journeys will now sync.",
        color: "cyan",
      });
      router.push("/");
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py={60}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Link href="/">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Public Commuter App
            </Button>
          </Link>
          <ThemeToggle />
        </Group>

        {errorParam === "auth_required" && (
          <Alert
            color="red"
            variant="light"
            title="Authentication Required"
            icon={<IconAlertTriangle size={18} />}
          >
            Access to the DhakaPath Admin CMS requires verified administrative
            credentials. Please log in below.
          </Alert>
        )}

        {errorParam === "session_expired" && (
          <Alert
            color="orange"
            variant="light"
            title="Session Expired"
            icon={<IconAlertTriangle size={18} />}
          >
            Your administrative session has timed out. Please authenticate again
            to continue.
          </Alert>
        )}

        <Paper
          p="xl"
          radius="md"
          style={{
            background: "var(--bg-card)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {isAdminMode ? (
                  <IconShieldLock size={26} color="#e11d48" />
                ) : (
                  <IconUser size={26} color="#0d9488" />
                )}
                <Title
                  order={3}
                  style={{ color: "var(--text-main)", fontSize: "1.25rem" }}
                >
                  {isAdminMode ? "Transit Authority Admin" : "Commuter Account"}
                </Title>
              </Group>

              <Badge color={isAdminMode ? "red" : "teal"} variant="light">
                {isAdminMode ? "Elevated CMS" : "Optional"}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed">
              {isAdminMode
                ? "Authorized transit officials: verify user disruption reports, calibrate delays, and inspect network telemetry."
                : "Commuters can save favorite multimodal corridors across devices."}
            </Text>

            {isAdminMode && (
              <Paper
                p="xs"
                radius="sm"
                style={{
                  background: "var(--bg-card-inner)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Group justify="space-between" align="center">
                  <Box>
                    <Text size="11px" fw={600} c="dimmed">
                      Official Admin Credentials:
                    </Text>
                    <Text size="11px" style={{ fontFamily: "monospace" }}>
                      admin@dhakapath.gov.bd / dhakapath@admin2026
                    </Text>
                  </Box>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconKey size={12} />}
                    onClick={handleFillDemoAdmin}
                  >
                    Auto-Fill
                  </Button>
                </Group>
              </Paper>
            )}

            <form onSubmit={handleLogin}>
              <Stack gap="sm">
                <TextInput
                  label="Official Email"
                  placeholder={
                    isAdminMode
                      ? "admin@dhakapath.gov.bd"
                      : "commuter@gmail.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  styles={{
                    input: {
                      background: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--text-main)",
                    },
                  }}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  styles={{
                    input: {
                      background: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--text-main)",
                    },
                  }}
                />

                <Button
                  fullWidth
                  mt="md"
                  type="submit"
                  variant="gradient"
                  gradient={
                    isAdminMode
                      ? { from: "teal", to: "cyan" }
                      : { from: "cyan", to: "blue" }
                  }
                  loading={loading}
                >
                  {isAdminMode ? "Authenticate Admin Session" : "Sign In"}
                </Button>
              </Stack>
            </form>

            <Divider my="xs" color="var(--border-subtle)" />

            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={() => setIsAdminMode(!isAdminMode)}
            >
              {isAdminMode
                ? "Switch to Public Commuter Account"
                : "Switch to Transit Authority Admin Portal"}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box p="xl" style={{ textAlign: "center" }}>
          Loading authentication portal...
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
