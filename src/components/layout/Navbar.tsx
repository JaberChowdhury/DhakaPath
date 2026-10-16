"use client";

import React, { useState, useEffect } from "react";
import { Group, Title, Badge, Button, Box } from "@mantine/core";
import {
  IconCar,
  IconBus,
  IconAlertTriangle,
  IconShieldLock,
  IconLogout,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  activeTab?: "planner" | "alerts" | "network" | "admin";
  setActiveTab?: (tab: "planner" | "alerts" | "network" | "admin") => void;
  activeAlertsCount?: number;
}

export function Navbar({
  activeTab: propActiveTab,
  setActiveTab,
  activeAlertsCount = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);

  // Compute active tab from pathname or prop
  let currentTab: "planner" | "alerts" | "network" | "admin" = "planner";
  if (pathname === "/transit-lines" || pathname?.startsWith("/transit")) {
    currentTab = "network";
  } else if (pathname === "/alerts" || pathname?.startsWith("/live-alerts")) {
    currentTab = "alerts";
  } else if (pathname === "/admin") {
    currentTab = "admin";
  } else if (propActiveTab) {
    currentTab = propActiveTab;
  }

  // Check admin authentication session
  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (
          data?.authenticated &&
          data.user &&
          (data.user.role === "admin" ||
            data.user.role === "super_admin" ||
            data.user.role === "moderator")
        ) {
          setAdminUser(data.user);
        } else {
          setAdminUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setAdminUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAdminUser(null);
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <Box
      component="header"
      px={{ base: "md", md: "xl" }}
      py={14}
      style={{
        borderBottom: "1px solid var(--nav-border)",
        background: "var(--nav-bg)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Group justify="space-between" align="center">
        {/* Brand Logo & Product Mode Switcher */}
        <Group gap="xl" align="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Group gap={6} style={{ cursor: "pointer" }}>
              <Title
                order={1}
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--text-main)",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                DhakaPath
              </Title>
            </Group>
          </Link>

          {/* Uber-like top tab bar: Ride / Transit Lines / Alerts */}
          <Group gap={8} visibleFrom="sm">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button
                size="sm"
                variant={currentTab === "planner" ? "filled" : "subtle"}
                color="dark"
                leftSection={<IconCar size={18} stroke={2.2} />}
                onClick={() => setActiveTab?.("planner")}
                radius="xl"
                styles={{
                  root: {
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      currentTab === "planner"
                        ? "var(--text-main)"
                        : "transparent",
                    color:
                      currentTab === "planner"
                        ? "var(--bg-page)"
                        : "var(--text-sub)",
                    height: 38,
                    padding: "0 18px",
                  },
                }}
              >
                Ride
              </Button>
            </Link>

            <Link href="/transit-lines" style={{ textDecoration: "none" }}>
              <Button
                size="sm"
                variant={currentTab === "network" ? "filled" : "subtle"}
                color="dark"
                leftSection={<IconBus size={18} stroke={2} />}
                onClick={() => setActiveTab?.("network")}
                radius="xl"
                styles={{
                  root: {
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      currentTab === "network"
                        ? "var(--text-main)"
                        : "transparent",
                    color:
                      currentTab === "network"
                        ? "var(--bg-page)"
                        : "var(--text-sub)",
                    height: 38,
                    padding: "0 18px",
                  },
                }}
              >
                Transit Lines
              </Button>
            </Link>

            <Link href="/alerts" style={{ textDecoration: "none" }}>
              <Button
                size="sm"
                variant={currentTab === "alerts" ? "filled" : "subtle"}
                color="dark"
                leftSection={<IconAlertTriangle size={18} stroke={2} />}
                rightSection={
                  activeAlertsCount > 0 ? (
                    <Badge size="xs" color="red" variant="filled">
                      {activeAlertsCount}
                    </Badge>
                  ) : null
                }
                onClick={() => setActiveTab?.("alerts")}
                radius="xl"
                styles={{
                  root: {
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      currentTab === "alerts"
                        ? "var(--text-main)"
                        : "transparent",
                    color:
                      currentTab === "alerts"
                        ? "var(--bg-page)"
                        : "var(--text-sub)",
                    height: 38,
                    padding: "0 18px",
                  },
                }}
              >
                Live Alerts
              </Button>
            </Link>
          </Group>
        </Group>

        {/* Right Actions: Admin (Role Protected Only), Theme, Login/Signout */}
        <Group gap="sm" align="center">
          <ThemeToggle />

          {/* Role-Based Protected Admin CMS - ONLY visible to verified Admin accounts */}
          {adminUser && (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <Button
                size="xs"
                variant={currentTab === "admin" ? "filled" : "default"}
                leftSection={<IconShieldLock size={15} />}
                radius="xl"
                visibleFrom="sm"
                styles={{
                  root: {
                    fontWeight: 600,
                    background:
                      currentTab === "admin"
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                    color:
                      currentTab === "admin"
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    border: "1px solid var(--border-subtle)",
                  },
                }}
              >
                Admin CMS
              </Button>
            </Link>
          )}

          {adminUser ? (
            <Button
              size="xs"
              radius="xl"
              variant="default"
              leftSection={<IconLogout size={14} />}
              onClick={handleLogout}
              styles={{
                root: {
                  fontWeight: 600,
                  height: 34,
                  padding: "0 14px",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  background: "var(--bg-card)",
                },
              }}
            >
              Sign out
            </Button>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button
                size="xs"
                radius="xl"
                variant="filled"
                styles={{
                  root: {
                    background: "var(--text-main)",
                    color: "var(--bg-page)",
                    fontWeight: 600,
                    height: 34,
                    padding: "0 16px",
                  },
                }}
              >
                Log in
              </Button>
            </Link>
          )}
        </Group>
      </Group>
    </Box>
  );
}
