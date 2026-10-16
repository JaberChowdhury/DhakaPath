"use client";

import React from "react";
import {
  Group,
  Title,
  Badge,
  Button,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconCar,
  IconRoute,
  IconBus,
  IconAlertTriangle,
  IconShieldLock,
  IconShare,
  IconUser,
} from "@tabler/icons-react";

import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  activeTab: "planner" | "alerts" | "network" | "admin";
  setActiveTab: (tab: "planner" | "alerts" | "network" | "admin") => void;
  activeAlertsCount: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  activeAlertsCount,
}: NavbarProps) {
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
          <Group
            gap={6}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("planner")}
          >
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

          {/* Uber-like top tab bar: Ride / Network / Alerts */}
          <Group gap={8} visibleFrom="sm">
            <Button
              size="sm"
              variant={activeTab === "planner" ? "filled" : "subtle"}
              color="dark"
              leftSection={<IconCar size={18} stroke={2.2} />}
              onClick={() => setActiveTab("planner")}
              radius="xl"
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 14,
                  background:
                    activeTab === "planner"
                      ? "var(--text-main)"
                      : "transparent",
                  color:
                    activeTab === "planner"
                      ? "var(--bg-page)"
                      : "var(--text-sub)",
                  height: 38,
                  padding: "0 18px",
                },
              }}
            >
              Ride
            </Button>

            <Button
              size="sm"
              variant={activeTab === "network" ? "filled" : "subtle"}
              color="dark"
              leftSection={<IconBus size={18} stroke={2} />}
              onClick={() => setActiveTab("network")}
              radius="xl"
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 14,
                  background:
                    activeTab === "network"
                      ? "var(--text-main)"
                      : "transparent",
                  color:
                    activeTab === "network"
                      ? "var(--bg-page)"
                      : "var(--text-sub)",
                  height: 38,
                  padding: "0 18px",
                },
              }}
            >
              Transit Lines
            </Button>

            <Button
              size="sm"
              variant={activeTab === "alerts" ? "filled" : "subtle"}
              color="dark"
              leftSection={<IconAlertTriangle size={18} stroke={2} />}
              rightSection={
                activeAlertsCount > 0 ? (
                  <Badge size="xs" color="red" variant="filled">
                    {activeAlertsCount}
                  </Badge>
                ) : null
              }
              onClick={() => setActiveTab("alerts")}
              radius="xl"
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 14,
                  background:
                    activeTab === "alerts" ? "var(--text-main)" : "transparent",
                  color:
                    activeTab === "alerts"
                      ? "var(--bg-page)"
                      : "var(--text-sub)",
                  height: 38,
                  padding: "0 18px",
                },
              }}
            >
              Live Alerts
            </Button>
          </Group>
        </Group>

        {/* Right Actions: Share, Admin, Theme */}
        <Group gap="sm" align="center">
          <ThemeToggle />

          <Button
            size="xs"
            variant="subtle"
            color="gray"
            leftSection={<IconShieldLock size={15} />}
            onClick={() => setActiveTab("admin")}
            radius="xl"
            visibleFrom="sm"
            styles={{
              root: {
                fontWeight: 600,
                color: "var(--text-main)",
              },
            }}
          >
            Admin CMS
          </Button>

          <Button
            size="xs"
            radius="xl"
            variant="filled"
            color="dark"
            onClick={() => {
              window.location.href = "/login";
            }}
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
            Login
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
