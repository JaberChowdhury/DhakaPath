"use client";

import React from "react";
import { Box, Button, Tooltip, Group, Text, Badge } from "@mantine/core";
import { IconMessageChatbot, IconSparkles } from "@tabler/icons-react";

interface FloatingChatButtonProps {
  onClick: () => void;
  opened?: boolean;
}

export function FloatingChatButton({
  onClick,
  opened,
}: FloatingChatButtonProps) {
  return (
    <Box
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1200,
        pointerEvents: "auto",
      }}
    >
      <Tooltip
        label="Ask DhakaPath AI (English, বাংলা, Banglish)"
        position="left"
        withArrow
        arrowSize={6}
      >
        {/* Desktop Pill Button */}
        <Button
          visibleFrom="sm"
          size="md"
          radius="xl"
          variant="filled"
          color="dark"
          leftSection={
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <IconMessageChatbot size={20} stroke={2.2} />
              <Box
                style={{
                  position: "absolute",
                  top: -2,
                  right: -3,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  border: "1.5px solid #000000",
                }}
              />
            </Box>
          }
          onClick={onClick}
          style={{
            background: "var(--text-main)",
            color: "var(--bg-page)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border-subtle)",
            transition: "all 0.2s ease",
            paddingLeft: 16,
            paddingRight: 18,
            height: 46,
          }}
          className="floating-ai-button"
        >
          <Group gap={8} align="center">
            <Text fw={700} size="sm" style={{ letterSpacing: "-0.01em" }}>
              Ask Transit AI
            </Text>
            <Badge
              size="xs"
              variant="filled"
              color="gray"
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "var(--bg-page)",
                padding: "0 6px",
                height: 18,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              LIVE
            </Badge>
          </Group>
        </Button>
      </Tooltip>

      {/* Mobile Floating Action Button (FAB) */}
      <Tooltip label="Ask AI" position="left">
        <Button
          hiddenFrom="sm"
          radius="xl"
          variant="filled"
          color="dark"
          onClick={onClick}
          p={0}
          style={{
            width: 52,
            height: 52,
            background: "var(--text-main)",
            color: "var(--bg-page)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="floating-ai-button"
        >
          <Box
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMessageChatbot size={24} />
            <Box
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "1.5px solid #000000",
              }}
            />
          </Box>
        </Button>
      </Tooltip>
    </Box>
  );
}
