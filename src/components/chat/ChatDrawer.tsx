"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Drawer,
  Stack,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Paper,
  Box,
  Badge,
  ScrollArea,
  Button,
} from "@mantine/core";
import {
  IconSend,
  IconMessageChatbot,
  IconSparkles,
  IconUser,
  IconNavigation,
  IconMapPin,
} from "@tabler/icons-react";
import { RouteCard } from "@/components/trip/RouteCard";
import { PlannedRoute } from "@/types/api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  routeResult?: PlannedRoute | null;
  extractedIntent?: any;
  timestamp: string;
}

interface ChatDrawerProps {
  opened: boolean;
  onClose: () => void;
  onSelectRouteFromChat?: (route: PlannedRoute, intent?: any) => void;
  onAutoSyncRoute?: (route: PlannedRoute, intent?: any) => void;
}

export function ChatDrawer({
  opened,
  onClose,
  onSelectRouteFromChat,
  onAutoSyncRoute,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      sender: "assistant",
      text: 'আসসালামু আলাইকুম! I am DhakaPath AI. You can ask me transit queries in English, Bangla, or Banglish.\n\nTry: "Banasree theke Motijheel jabo, budget 80", "Ami student", or "Malibagh avoid koro".',
      timestamp: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const [conversationContext, setConversationContext] = useState<any>(null);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          currentContext: conversationContext,
        }),
      });

      const data = await res.json();
      if (data.extractedIntent) {
        setConversationContext(data.extractedIntent);
      }
      const topRoute = data.planResponse?.routes?.[0] || null;

      // Automatically sync route to background map when chat returns a route
      if (topRoute && onAutoSyncRoute) {
        onAutoSyncRoute(topRoute, data.extractedIntent);
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "assistant",
        text: data.explanation || "I could not process your request.",
        routeResult: topRoute,
        extractedIntent: data.extractedIntent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: `ai_err_${Date.now()}`,
        sender: "assistant",
        text: "Sorry, I encountered an issue connecting to the transit server.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMessageChatbot size={22} color="#0d9488" />
          <Text fw={700} style={{ color: "var(--text-main)" }}>
            DhakaPath Transit Assistant
          </Text>
          <Badge
            size="xs"
            variant="gradient"
            gradient={{ from: "teal", to: "cyan" }}
          >
            Bilingual
          </Badge>
        </Group>
      }
      position="right"
      size="md"
      styles={{
        content: { background: "var(--bg-page)", color: "var(--text-main)" },
        header: {
          background: "var(--bg-page)",
          borderBottom: "1px solid var(--border-subtle)",
          color: "var(--text-main)",
        },
      }}
    >
      <Stack justify="space-between" style={{ height: "calc(100vh - 80px)" }}>
        {/* Message Log */}
        <ScrollArea viewportRef={scrollViewportRef} style={{ flex: 1 }} p="xs">
          <Stack gap="md">
            {messages.map((msg) => (
              <Box
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                }}
              >
                <Paper
                  p="sm"
                  radius="md"
                  style={{
                    background:
                      msg.sender === "user"
                        ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                        : "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: msg.sender === "user" ? "#fff" : "var(--text-main)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <Group gap={6} mb={4} align="center">
                    {msg.sender === "user" ? (
                      <IconUser size={14} />
                    ) : (
                      <IconSparkles size={14} />
                    )}
                    <Text size="xs" fw={700} style={{ color: "inherit" }}>
                      {msg.sender === "user" ? "You" : "DhakaPath Assistant"}
                    </Text>
                    <Text size="xs" style={{ opacity: 0.7 }}>
                      {msg.timestamp}
                    </Text>
                  </Group>

                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </Text>

                  {/* Grounded Route Preview inside chat */}
                  {msg.routeResult && (
                    <Box mt="xs">
                      <RouteCard
                        route={msg.routeResult}
                        isStudent={msg.extractedIntent?.student || false}
                        budgetBdt={msg.extractedIntent?.budgetBdt || null}
                        onSelect={() => {
                          if (onSelectRouteFromChat && msg.routeResult) {
                            onSelectRouteFromChat(
                              msg.routeResult,
                              msg.extractedIntent,
                            );
                            onClose();
                          }
                        }}
                      />
                      <Button
                        fullWidth
                        size="sm"
                        mt={8}
                        variant="filled"
                        color="dark"
                        radius="md"
                        leftSection={<IconNavigation size={15} />}
                        onClick={() => {
                          if (onSelectRouteFromChat && msg.routeResult) {
                            onSelectRouteFromChat(
                              msg.routeResult,
                              msg.extractedIntent,
                            );
                            onClose();
                          }
                        }}
                        styles={{
                          root: {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 700,
                          },
                        }}
                      >
                        View Directions on Map
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}
          </Stack>
        </ScrollArea>

        {/* Quick Suggestion Pills */}
        <Box px="xs">
          <Group gap={6} mb="xs">
            <Button
              size="compact-xs"
              variant="default"
              radius="sm"
              onClick={() =>
                handleSend(
                  "Banasree theke Motijheel jabo, budget 40, ami student",
                )
              }
            >
              Banasree ➔ Motijheel (Student)
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="sm"
              onClick={() =>
                handleSend("Mirpur 10 theke Shahbagh under 20 taka")
              }
            >
              Mirpur ➔ Shahbagh (≤ 20৳)
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="sm"
              onClick={() =>
                handleSend("Farmgate to Gulshan 1, avoid Malibagh")
              }
            >
              Avoid Malibagh
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="sm"
              onClick={() =>
                handleSend("Gulshan 1 theke Mohakhali CNG share korbo")
              }
            >
              🛺 CNG Share Bot
            </Button>
          </Group>

          {/* Chat Composer */}
          <Group gap="xs">
            <TextInput
              placeholder="Type in Bangla, English or Banglish..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{ flex: 1 }}
              styles={{
                input: {
                  background: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-main)",
                  borderRadius: 8,
                  height: 44,
                },
              }}
            />
            <ActionIcon
              size="xl"
              variant="filled"
              color="dark"
              radius="md"
              onClick={() => handleSend()}
              loading={loading}
              disabled={!input.trim()}
              styles={{
                root: {
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  height: 44,
                  width: 44,
                },
              }}
            >
              <IconSend size={18} />
            </ActionIcon>
          </Group>
        </Box>
      </Stack>
    </Drawer>
  );
}
