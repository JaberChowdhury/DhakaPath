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
          variant="gradient"
          gradient={{ from: "teal", to: "cyan" }}
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
                  border: "1.5px solid #ffffff",
                }}
              />
            </Box>
          }
          onClick={onClick}
          style={{
            boxShadow:
              "0 8px 28px rgba(13, 148, 136, 0.4), 0 2px 10px rgba(2, 132, 199, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            paddingLeft: 16,
            paddingRight: 18,
            height: 44,
          }}
          className="floating-ai-button"
        >
          <Group gap={6} align="center">
            <Text fw={600} size="sm" style={{ letterSpacing: "-0.01em" }}>
              Ask Transit AI
            </Text>
            <Badge
              size="xs"
              variant="filled"
              color="dark"
              style={{
                background: "rgba(0, 0, 0, 0.25)",
                color: "#ffffff",
                padding: "0 5px",
                height: 16,
                fontSize: 9,
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
          variant="gradient"
          gradient={{ from: "teal", to: "cyan" }}
          onClick={onClick}
          p={0}
          style={{
            width: 50,
            height: 50,
            boxShadow: "0 8px 24px rgba(13, 148, 136, 0.45)",
            border: "1.5px solid rgba(255, 255, 255, 0.3)",
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
                border: "1.5px solid #ffffff",
              }}
            />
          </Box>
        </Button>
      </Tooltip>
    </Box>
  );
}
