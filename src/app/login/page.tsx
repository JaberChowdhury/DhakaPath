"use client";

import React, { useState, Suspense } from "react";
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
  Alert,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconAlertTriangle,
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
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        notifications.show({
          title: "Admin Authenticated",
          message: `Welcome, ${data.user?.displayName || "Transit Admin"}! Session verified.`,
          color: "dark",
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
  };

  return (
    <Container size="xs" py={80}>
      <Stack gap="xl">
        {/* Top Bar Navigation & Theme Toggle */}
        <Group justify="space-between" align="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              size="xs"
              variant="subtle"
              radius="md"
              leftSection={<IconArrowLeft size={16} />}
              styles={{
                root: {
                  fontWeight: 600,
                  color: "var(--text-main)",
                  paddingLeft: 0,
                  "&:hover": {
                    background: "transparent",
                    textDecoration: "underline",
                  },
                },
              }}
            >
              Back to DhakaPath
            </Button>
          </Link>
          <ThemeToggle />
        </Group>

        {errorParam === "auth_required" && (
          <Alert
            color="red"
            variant="light"
            title="Administrative Access Restricted"
            icon={<IconAlertTriangle size={18} />}
            radius="md"
          >
            The page you requested requires verified administrative credentials.
            Please sign in below.
          </Alert>
        )}

        {/* Uber-Inspired Minimalist Login Card */}
        <Paper
          p={{ base: "xl", sm: 40 }}
          radius="md"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Stack gap="lg">
            {/* Header */}
            <Box>
              <Title
                order={2}
                style={{
                  color: "var(--text-main)",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Sign in to DhakaPath
              </Title>
              <Text
                size="sm"
                mt={4}
                style={{ color: "var(--text-muted)", lineHeight: 1.5 }}
              >
                Transit Authority Administrative Portal
              </Text>
            </Box>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <Stack gap="md">
                <TextInput
                  label="Official Email"
                  placeholder="admin@dhakapath.gov.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="md"
                  styles={{
                    label: {
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-sub)",
                      marginBottom: 6,
                    },
                    input: {
                      background: "var(--input-bg)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      borderRadius: 8,
                      height: 48,
                      fontSize: "14px",
                    },
                  }}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="md"
                  styles={{
                    label: {
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-sub)",
                      marginBottom: 6,
                    },
                    input: {
                      background: "var(--input-bg)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      borderRadius: 8,
                      height: 48,
                      fontSize: "14px",
                    },
                  }}
                />

                <Button
                  fullWidth
                  mt="sm"
                  type="submit"
                  size="md"
                  loading={loading}
                  styles={{
                    root: {
                      background: "#000000",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      height: 48,
                      borderRadius: 8,
                      fontSize: "15px",
                      border: "none",
                    },
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </form>
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
