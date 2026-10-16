"use client";

import React from "react";
import {
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
  useComputedColorScheme,
  Group,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const toggleTheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };

  const isDark = computedColorScheme === "dark";

  if (showLabel) {
    return (
      <UnstyledButton
        onClick={toggleTheme}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-main)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {isDark ? (
          <IconSun size={16} color="#f59e0b" />
        ) : (
          <IconMoon size={16} color="#6366f1" />
        )}
        <Text size="xs" fw={500}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </Text>
      </UnstyledButton>
    );
  }

  return (
    <Tooltip
      label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      withArrow
    >
      <ActionIcon
        onClick={toggleTheme}
        size="md"
        radius="md"
        variant="default"
        aria-label="Toggle color scheme"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
          color: isDark ? "#f59e0b" : "#6366f1",
          transition: "all 0.2s ease",
          boxShadow: isDark
            ? "0 0 10px rgba(245, 158, 11, 0.2)"
            : "0 0 10px rgba(99, 102, 241, 0.15)",
        }}
      >
        {isDark ? (
          <IconSun size={17} stroke={2} />
        ) : (
          <IconMoon size={17} stroke={2} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
