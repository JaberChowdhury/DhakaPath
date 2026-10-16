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
  UnstyledButton,
} from "@mantine/core";
import {
  IconSend,
  IconMessageChatbot,
  IconSparkles,
  IconUser,
  IconNavigation,
  IconSchool,
  IconCoins,
  IconCheck,
  IconMicrophone,
  IconMicrophoneOff,
  IconVolume,
  IconPlayerStop,
} from "@tabler/icons-react";
import { RouteCard } from "@/components/trip/RouteCard";
import { PlannedRoute } from "@/types/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isStudent?: boolean | null;
  targetBudget?: number | null;
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
  // Questionnaire State
  const [isStudent, setIsStudent] = useState<boolean | null>(true);
  const [targetBudget, setTargetBudget] = useState<number | null>(50);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      sender: "assistant",
      text: '**আসসালামু আলাইকুম! Welcome to DhakaPath Transit AI.** 🚇\n\nযেকোনো প্রশ্ন **বাংলা (Bangla)**, **Banglish**, বা **English**-এ করুন — আমি আপনাকে সরাসরি রুট, ছাত্র হাফ ভাড়া, এবং লাইভ ট্রাফিক অবস্থা জানাব।\n\n*উদ্ধৃতি:* `"ফার্মগেট থেকে মতিঝিল যাব"`, `"Banasree theke Badda koto lagbe"`, কিংবা `"How to go from Mirpur to Motijheel"`।',
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
  }, [messages, loading]);

  const [conversationContext, setConversationContext] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition (Chrome, Safari, Edge, Android)
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice speech recognition is not supported on this browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Bengali with auto English/Banglish fallback
      recognition.lang = "bn-BD";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setIsListening(false);
    }
  };

  // Speak AI message
  const handleSpeakAiMessage = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural TTS speech
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#+\s/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith("bn")) ||
      voices.find((v) => v.lang.startsWith("en-IN")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageText?: string) => {
    const rawText = (messageText || input).trim();
    if (!rawText || loading) return;

    // Synthesize user prompt with active questionnaire preferences
    const constraints: string[] = [];
    if (isStudent === true && !rawText.toLowerCase().includes("student")) {
      constraints.push("student");
    } else if (
      isStudent === false &&
      !rawText.toLowerCase().includes("student")
    ) {
      constraints.push("regular non-student");
    }

    if (
      targetBudget !== null &&
      targetBudget > 0 &&
      !rawText.toLowerCase().includes("budget")
    ) {
      constraints.push(`budget ${targetBudget}`);
    }

    const payloadText =
      constraints.length > 0
        ? `${rawText} (${constraints.join(", ")})`
        : rawText;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: rawText,
      isStudent,
      targetBudget,
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
          message: payloadText,
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
      position="right"
      size="md"
      withCloseButton={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
      closeButtonProps={{
        "aria-label": "Close Transit AI Chat",
        size: "md",
      }}
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      title={
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--text-main)",
              color: "var(--bg-page)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMessageChatbot size={18} stroke={2.2} />
          </Box>
          <Box>
            <Text fw={700} size="sm" style={{ color: "var(--text-main)" }}>
              DhakaPath Transit AI
            </Text>
            <Text size="11px" style={{ color: "var(--text-muted)" }}>
              Bangla, English & Banglish
            </Text>
          </Box>
          <Badge
            size="xs"
            radius="sm"
            variant="outline"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-main)",
              background: "var(--bg-card-inner)",
              fontWeight: 600,
            }}
          >
            SMART ASSISTANT
          </Badge>
        </Group>
      }
      styles={{
        content: {
          background: "var(--bg-page)",
          color: "var(--text-main)",
        },
        header: {
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-subtle)",
          color: "var(--text-main)",
          padding: "16px 20px",
        },
        close: {
          color: "var(--text-main)",
          background: "var(--bg-card-inner)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          width: 32,
          height: 32,
          transition: "all 0.15s ease",
          cursor: "pointer",
        },
      }}
    >
      <Stack justify="space-between" style={{ height: "calc(100vh - 84px)" }}>
        {/* Interactive Questionnaire Prompter at Top */}
        <Paper
          p="xs"
          radius="md"
          m="xs"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Stack gap={8}>
            {/* Question 1: Are you a student? */}
            <Box>
              <Group gap={6} mb={4} align="center">
                <IconSchool size={14} style={{ color: "var(--text-main)" }} />
                <Text
                  size="11px"
                  fw={700}
                  style={{ color: "var(--text-main)" }}
                >
                  Are you a student?
                </Text>
              </Group>
              <Group gap={6}>
                <UnstyledButton
                  onClick={() => setIsStudent(true)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    fontSize: "11px",
                    fontWeight: 600,
                    background:
                      isStudent === true
                        ? "var(--text-main)"
                        : "var(--bg-card-inner)",
                    color:
                      isStudent === true
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    border: "1px solid var(--border-subtle)",
                    transition: "all 0.15s ease",
                  }}
                >
                  🎓 Yes (50% Bus Discount)
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setIsStudent(false)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    fontSize: "11px",
                    fontWeight: 600,
                    background:
                      isStudent === false
                        ? "var(--text-main)"
                        : "var(--bg-card-inner)",
                    color:
                      isStudent === false
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    border: "1px solid var(--border-subtle)",
                    transition: "all 0.15s ease",
                  }}
                >
                  👤 Regular Commuter
                </UnstyledButton>
              </Group>
            </Box>

            {/* Question 2: Target money / budget */}
            <Box>
              <Group gap={6} mb={4} align="center">
                <IconCoins size={14} style={{ color: "var(--text-main)" }} />
                <Text
                  size="11px"
                  fw={700}
                  style={{ color: "var(--text-main)" }}
                >
                  Target budget to reach destination:
                </Text>
              </Group>
              <Group gap={4} wrap="wrap">
                {[
                  { label: "Flexible", val: null },
                  { label: "≤ 30 ৳", val: 30 },
                  { label: "≤ 50 ৳", val: 50 },
                  { label: "≤ 80 ৳", val: 80 },
                  { label: "≤ 100 ৳", val: 100 },
                ].map((b, i) => (
                  <UnstyledButton
                    key={i}
                    onClick={() => setTargetBudget(b.val)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: "11px",
                      fontWeight: 600,
                      background:
                        targetBudget === b.val
                          ? "var(--text-main)"
                          : "var(--bg-card-inner)",
                      color:
                        targetBudget === b.val
                          ? "var(--bg-page)"
                          : "var(--text-main)",
                      border: "1px solid var(--border-subtle)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {b.label}
                  </UnstyledButton>
                ))}
              </Group>
            </Box>
          </Stack>
        </Paper>

        {/* Message Log */}
        <ScrollArea viewportRef={scrollViewportRef} style={{ flex: 1 }} p="xs">
          <Stack gap="md">
            {messages.map((msg) => (
              <Box
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                <Paper
                  p="sm"
                  radius="lg"
                  style={{
                    background:
                      msg.sender === "user"
                        ? "var(--text-main)"
                        : "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color:
                      msg.sender === "user"
                        ? "var(--bg-page)"
                        : "var(--text-main)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <Group justify="space-between" mb={4} align="center">
                    <Group gap={6} align="center">
                      {msg.sender === "user" ? (
                        <IconUser size={13} />
                      ) : (
                        <IconSparkles size={13} />
                      )}
                      <Text size="11px" fw={700} style={{ color: "inherit" }}>
                        {msg.sender === "user" ? "You" : "DhakaPath AI"}
                      </Text>
                      <Text size="10px" style={{ opacity: 0.6 }}>
                        {msg.timestamp}
                      </Text>
                    </Group>
                    {msg.sender === "assistant" && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => handleSpeakAiMessage(msg.id, msg.text)}
                        title={
                          speakingMsgId === msg.id
                            ? "Stop Audio"
                            : "Listen to Voice Response"
                        }
                      >
                        {speakingMsgId === msg.id ? (
                          <IconPlayerStop size={12} />
                        ) : (
                          <IconVolume size={12} />
                        )}
                      </ActionIcon>
                    )}
                  </Group>

                  {/* If user sent message, show applied constraints */}
                  {msg.sender === "user" && (
                    <Group gap={4} mb={6}>
                      <Badge
                        size="xs"
                        radius="xl"
                        variant="filled"
                        style={{
                          background: "var(--bg-page)",
                          color: "var(--text-main)",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        {msg.isStudent ? "🎓 Student" : "👤 Regular"}
                      </Badge>
                      {msg.targetBudget && (
                        <Badge
                          size="xs"
                          radius="xl"
                          variant="filled"
                          style={{
                            background: "var(--bg-page)",
                            color: "var(--text-main)",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          💰 ≤ {msg.targetBudget} ৳
                        </Badge>
                      )}
                    </Group>
                  )}

                  {msg.sender === "user" ? (
                    <Text
                      size="xs"
                      style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}
                    >
                      {msg.text}
                    </Text>
                  ) : (
                    <div className="ai-markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

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
                        size="xs"
                        mt={8}
                        variant="filled"
                        radius="xl"
                        leftSection={<IconNavigation size={14} />}
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

            {/* ChatGPT-Style Live Thinking/Loading Indicator Animation */}
            {loading && (
              <Box
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "88%",
                }}
              >
                <Paper
                  p="sm"
                  radius="lg"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <Group gap={6} mb={6} align="center">
                    <IconSparkles
                      size={13}
                      style={{ color: "var(--text-main)" }}
                    />
                    <Text
                      size="11px"
                      fw={700}
                      style={{ color: "var(--text-main)" }}
                    >
                      DhakaPath AI
                    </Text>
                    <Text size="10px" style={{ opacity: 0.6 }}>
                      Thinking...
                    </Text>
                  </Group>
                  <Group gap={6} py={6} px={4} align="center">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </Group>
                </Paper>
              </Box>
            )}
          </Stack>
        </ScrollArea>

        {/* Quick Suggestion Pills & Chat Composer */}
        <Box px="xs" pb="xs">
          <Group gap={6} mb="xs" wrap="wrap">
            <Button
              size="compact-xs"
              variant="default"
              radius="xl"
              onClick={() => handleSend("Banasree theke Motijheel jabo")}
              styles={{
                root: {
                  fontSize: "11px",
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            >
              Banasree ➔ Motijheel
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="xl"
              onClick={() =>
                handleSend("Shahbagh theke Badda student vara koto")
              }
              styles={{
                root: {
                  fontSize: "11px",
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            >
              Shahbagh ➔ Badda
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="xl"
              onClick={() => handleSend("ফার্মগেট থেকে মতিঝিল যাব")}
              styles={{
                root: {
                  fontSize: "11px",
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            >
              ফার্মগেট ➔ মতিঝিল
            </Button>
            <Button
              size="compact-xs"
              variant="default"
              radius="xl"
              onClick={() =>
                handleSend("How to go from Mirpur 10 to Motijheel?")
              }
              styles={{
                root: {
                  fontSize: "11px",
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-main)",
                },
              }}
            >
              Mirpur ➔ Motijheel
            </Button>
          </Group>

          {/* Chat Composer */}
          <Group gap="xs">
            <TextInput
              placeholder="Ask route in Bangla, English or Banglish..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{ flex: 1 }}
              styles={{
                input: {
                  background: "var(--bg-card-inner)",
                  borderColor: isListening ? "#00aa66" : "var(--border-subtle)",
                  color: "var(--text-main)",
                  borderRadius: 9999,
                  height: 44,
                  fontSize: "13px",
                  paddingLeft: 16,
                  transition: "border-color 0.2s ease",
                },
              }}
            />

            {/* Voice Input Microphone Button */}
            <ActionIcon
              size="lg"
              variant={isListening ? "filled" : "default"}
              radius="xl"
              onClick={toggleVoiceInput}
              title={isListening ? "Listening... (Tap to stop)" : "Voice Search (বাংলায় বলুন)"}
              styles={{
                root: {
                  background: isListening ? "#00aa66" : "var(--bg-card-inner)",
                  borderColor: isListening ? "#00aa66" : "var(--border-subtle)",
                  color: isListening ? "#ffffff" : "var(--text-main)",
                  height: 44,
                  width: 44,
                  transition: "all 0.2s ease",
                },
              }}
            >
              {isListening ? (
                <IconMicrophoneOff size={18} />
              ) : (
                <IconMicrophone size={18} />
              )}
            </ActionIcon>

            <ActionIcon
              size="lg"
              variant="filled"
              radius="xl"
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
