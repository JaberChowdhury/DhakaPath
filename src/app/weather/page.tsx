"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Card,
  Grid,
  SimpleGrid,
  Button,
  Loader,
  Paper,
  Box,
  Progress,
  ThemeIcon,
  ScrollArea,
} from "@mantine/core";
import {
  IconSun,
  IconCloud,
  IconCloudRain,
  IconCloudStorm,
  IconCloudFog,
  IconDroplet,
  IconWind,
  IconTemperature,
  IconUmbrella,
  IconMask,
  IconTrain,
  IconBus,
  IconRefresh,
  IconAlertTriangle,
  IconShieldCheck,
  IconArrowRight,
  IconCompass,
} from "@tabler/icons-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { DHAKA_WEATHER_HUBS } from "@/lib/weather/service";

export default function WeatherPage() {
  const [selectedHub, setSelectedHub] = useState<string>("all_dhaka");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchWeather = async (hubId: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/weather?hubId=${hubId}`);
      const data = await res.json();
      if (data.success) {
        setWeatherData(data);
        setLastUpdated(
          new Date().toLocaleTimeString("bn-BD", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        );
      }
    } catch (err) {
      console.error("Failed to load weather data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedHub);
  }, [selectedHub]);

  const renderWeatherIcon = (iconType: string, size = 48) => {
    switch (iconType) {
      case "sun":
        return <IconSun size={size} color="#f59f00" stroke={1.8} />;
      case "rain":
        return <IconCloudRain size={size} color="#228be6" stroke={1.8} />;
      case "storm":
        return <IconCloudStorm size={size} color="#7950f2" stroke={1.8} />;
      case "fog":
        return <IconCloudFog size={size} color="#868e96" stroke={1.8} />;
      default:
        return <IconCloud size={size} color="#4dabf7" stroke={1.8} />;
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        color: "var(--text-main)",
      }}
    >
      <Navbar />

      <Container size="lg" py="xl">
        {/* Header & Sub-Hub Selector */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Box>
              <Group gap="xs" mb={4}>
                <Badge size="md" variant="filled" color="dark" radius="xl">
                  Live Public Radar
                </Badge>
                <Badge size="md" variant="outline" color="blue" radius="xl">
                  Open-Meteo & Copernicus Models
                </Badge>
              </Group>
              <Title
                order={1}
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-main)",
                }}
              >
                Dhaka Transit Weather & Monsoon Advisory
              </Title>
              <Text size="sm" style={{ color: "var(--text-muted)" }}>
                ঢাকা শহরের রিয়েল-টাইম আবহাওয়া, বৃষ্টিপাত, জলাবদ্ধতার পূর্বাভাস
                এবং গণপরিবহন সতর্কতা।
              </Text>
            </Box>

            <Group gap="xs">
              {lastUpdated && (
                <Text size="xs" style={{ color: "var(--text-muted)" }}>
                  আপডেট: {lastUpdated}
                </Text>
              )}
              <Button
                size="xs"
                variant="default"
                radius="xl"
                leftSection={
                  <IconRefresh
                    size={14}
                    className={refreshing ? "spin-animation" : ""}
                  />
                }
                onClick={() => fetchWeather(selectedHub, true)}
                loading={refreshing}
                styles={{
                  root: {
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    borderColor: "var(--border-subtle)",
                  },
                }}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Hub Quick Filter Pills */}
          <ScrollArea type="never" offsetScrollbars>
            <Group gap={8} wrap="nowrap" py={4}>
              {DHAKA_WEATHER_HUBS.map((hub) => {
                const isSelected = selectedHub === hub.id;
                return (
                  <Button
                    key={hub.id}
                    size="xs"
                    radius="xl"
                    variant={isSelected ? "filled" : "default"}
                    onClick={() => setSelectedHub(hub.id)}
                    styles={{
                      root: {
                        background: isSelected
                          ? "var(--text-main)"
                          : "var(--bg-card)",
                        color: isSelected
                          ? "var(--bg-page)"
                          : "var(--text-main)",
                        borderColor: "var(--border-subtle)",
                        fontWeight: isSelected ? 700 : 500,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    {hub.name_en} ({hub.name_bn})
                  </Button>
                );
              })}
            </Group>
          </ScrollArea>
        </Stack>

        {loading ? (
          <Paper
            p={60}
            radius="lg"
            style={{ background: "var(--bg-card)", textAlign: "center" }}
          >
            <Loader size="lg" color="dark" />
            <Text size="sm" mt="md" style={{ color: "var(--text-muted)" }}>
              Fetching high-resolution atmospheric telemetry from Open-Meteo
              API...
            </Text>
          </Paper>
        ) : weatherData ? (
          <Stack gap="xl">
            {/* 1. Hero Weather Showcase Card */}
            <Paper
              p={{ base: "lg", md: "xl" }}
              radius="lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Grid align="center" gap="xl">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Group gap="lg" align="center">
                    <Box>
                      {renderWeatherIcon(
                        weatherData.current.condition.iconType,
                        72,
                      )}
                    </Box>
                    <Box>
                      <Group gap="xs" align="baseline">
                        <Title
                          order={2}
                          style={{
                            fontSize: "3.5rem",
                            fontWeight: 800,
                            lineHeight: 1,
                            color: "var(--text-main)",
                            letterSpacing: "-0.04em",
                          }}
                        >
                          {Math.round(weatherData.current.temperature)}°C
                        </Title>
                        <Text
                          size="lg"
                          fw={600}
                          style={{ color: "var(--text-muted)" }}
                        >
                          অনুভূত {Math.round(weatherData.current.feelsLike)}°C
                        </Text>
                      </Group>

                      <Text
                        size="lg"
                        fw={700}
                        mt={6}
                        style={{ color: "var(--text-main)" }}
                      >
                        {weatherData.current.condition.label_en} •{" "}
                        {weatherData.current.condition.label_bn}
                      </Text>

                      <Text
                        size="xs"
                        mt={2}
                        style={{ color: "var(--text-muted)" }}
                      >
                        {weatherData.hub.name_en} ({weatherData.hub.name_bn}) •
                        Lat {weatherData.hub.lat}, Lon {weatherData.hub.lon}
                      </Text>
                    </Box>
                  </Group>

                  {/* Quick Stat Badges */}
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mt="xl">
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Group gap={6} align="center">
                        <IconDroplet size={18} color="#228be6" />
                        <Text size="xs" style={{ color: "var(--text-muted)" }}>
                          আর্দ্রতা
                        </Text>
                      </Group>
                      <Text fw={700} size="md" mt={2}>
                        {weatherData.current.humidity}%
                      </Text>
                    </Paper>

                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Group gap={6} align="center">
                        <IconWind size={18} color="#20c997" />
                        <Text size="xs" style={{ color: "var(--text-muted)" }}>
                          বাতাস
                        </Text>
                      </Group>
                      <Text fw={700} size="md" mt={2}>
                        {weatherData.current.windSpeed} km/h
                      </Text>
                    </Paper>

                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Group gap={6} align="center">
                        <IconCloudRain size={18} color="#4dabf7" />
                        <Text size="xs" style={{ color: "var(--text-muted)" }}>
                          বৃষ্টিপাত
                        </Text>
                      </Group>
                      <Text fw={700} size="md" mt={2}>
                        {weatherData.current.precipitation} mm
                      </Text>
                    </Paper>

                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Group gap={6} align="center">
                        <IconMask
                          size={18}
                          color={
                            weatherData.transitImpact.airQualityStatus.color
                          }
                        />
                        <Text size="xs" style={{ color: "var(--text-muted)" }}>
                          বায়ুমান (AQI)
                        </Text>
                      </Group>
                      <Group gap={4} mt={2}>
                        <Text fw={700} size="md">
                          {weatherData.current.aqi}
                        </Text>
                        <Badge
                          size="xs"
                          variant="filled"
                          style={{
                            background:
                              weatherData.transitImpact.airQualityStatus.color,
                          }}
                        >
                          {
                            weatherData.transitImpact.airQualityStatus
                              .categoryBn
                          }
                        </Badge>
                      </Group>
                    </Paper>
                  </SimpleGrid>
                </Grid.Col>

                {/* Right Side: Commuter Status Verdict */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Paper
                    p="lg"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Group justify="space-between" align="center" mb="xs">
                      <Text
                        size="xs"
                        fw={700}
                        style={{
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-muted)",
                        }}
                      >
                        Commuter Weather Verdict
                      </Text>
                      <Badge
                        size="sm"
                        variant="filled"
                        color={
                          weatherData.transitImpact.waterloggingRisk ===
                          "Severe"
                            ? "red"
                            : weatherData.transitImpact.waterloggingRisk ===
                                "Moderate"
                              ? "orange"
                              : "green"
                        }
                      >
                        {weatherData.transitImpact.waterloggingRiskBn}
                      </Badge>
                    </Group>

                    <Text
                      fw={700}
                      size="sm"
                      mb={4}
                      style={{ color: "var(--text-main)" }}
                    >
                      {weatherData.transitImpact.waterloggingRisk === "Severe"
                        ? "🌧️ বর্ষণ সতর্কতা: গুরুত্বপূর্ণ করিডোরে যানজট ও পানি জমার আশঙ্কা।"
                        : weatherData.transitImpact.waterloggingRisk ===
                            "Moderate"
                          ? "⚠️ হালকা জলাবদ্ধতা সতর্কতা: মালিবাগ ও নিচু এলাকায় ধীরগতি।"
                          : "✅ অনুকূল আবহাওয়া: গণপরিবহন ও রিকশা চলাচল সম্পূর্ণ স্বাভাবিক।"}
                    </Text>

                    <Text size="xs" style={{ color: "var(--text-muted)" }}>
                      {weatherData.transitImpact.metroViability.adviceBn}
                    </Text>

                    {weatherData.transitImpact.airQualityStatus
                      .maskRequired && (
                      <Paper
                        mt="sm"
                        p="xs"
                        radius="sm"
                        style={{
                          background: "rgba(225, 25, 0, 0.08)",
                          border: "1px solid rgba(225, 25, 0, 0.2)",
                        }}
                      >
                        <Group gap={6} align="center">
                          <IconMask size={16} color="#e11900" />
                          <Text size="xs" fw={600} style={{ color: "#e11900" }}>
                            অতিরিক্ত ধুলাবালি ও দূষণ। বাইরে বের হলে মাস্ক পরিধান
                            করুন।
                          </Text>
                        </Group>
                      </Paper>
                    )}

                    <Button
                      component={Link}
                      href="/"
                      mt="md"
                      fullWidth
                      size="xs"
                      radius="xl"
                      rightSection={<IconArrowRight size={14} />}
                      styles={{
                        root: {
                          background: "var(--text-main)",
                          color: "var(--bg-page)",
                          fontWeight: 600,
                        },
                      }}
                    >
                      Plan Route with Weather Adjustments
                    </Button>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* 2. Transit Mode Viability Matrix */}
            <Box>
              <Title
                order={3}
                size="h4"
                mb="sm"
                style={{ color: "var(--text-main)" }}
              >
                Mode-by-Mode Transit Advisory (বাহনভিত্তিক পরামর্শ)
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                {/* Metro Rail */}
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <ThemeIcon size="lg" radius="xl" color="dark">
                      <IconTrain size={20} />
                    </ThemeIcon>
                    <Badge size="xs" color="green" variant="filled">
                      {weatherData.transitImpact.metroViability.statusBn}
                    </Badge>
                  </Group>
                  <Text fw={700} size="sm">
                    MRT Line 6 (মেট্রোরেল)
                  </Text>
                  <Text size="xs" mt={4} style={{ color: "var(--text-muted)" }}>
                    {weatherData.transitImpact.metroViability.adviceBn}
                  </Text>
                </Card>

                {/* City Bus */}
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <ThemeIcon
                      size="lg"
                      radius="xl"
                      color="blue"
                      variant="light"
                    >
                      <IconBus size={20} />
                    </ThemeIcon>
                    <Badge
                      size="xs"
                      variant="filled"
                      color={
                        weatherData.transitImpact.busViability.status ===
                        "Normal"
                          ? "green"
                          : "orange"
                      }
                    >
                      {weatherData.transitImpact.busViability.statusBn}
                    </Badge>
                  </Group>
                  <Text fw={700} size="sm">
                    City Bus (বাস রুট)
                  </Text>
                  <Text size="xs" mt={4} style={{ color: "var(--text-muted)" }}>
                    {weatherData.transitImpact.busViability.adviceBn}
                  </Text>
                </Card>

                {/* Rickshaw */}
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <ThemeIcon
                      size="lg"
                      radius="xl"
                      color="teal"
                      variant="light"
                    >
                      <IconUmbrella size={20} />
                    </ThemeIcon>
                    <Badge
                      size="xs"
                      variant="filled"
                      color={
                        weatherData.transitImpact.rickshawViability.status ===
                        "Optimal"
                          ? "green"
                          : weatherData.transitImpact.rickshawViability
                                .status === "Caution"
                            ? "orange"
                            : "red"
                      }
                    >
                      {weatherData.transitImpact.rickshawViability.statusBn}
                    </Badge>
                  </Group>
                  <Text fw={700} size="sm">
                    Rickshaw & Hauler (রিকশা)
                  </Text>
                  <Text size="xs" mt={4} style={{ color: "var(--text-muted)" }}>
                    {weatherData.transitImpact.rickshawViability.adviceBn}
                  </Text>
                </Card>

                {/* Air Quality & Health */}
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <ThemeIcon
                      size="lg"
                      radius="xl"
                      color="red"
                      variant="light"
                    >
                      <IconMask size={20} />
                    </ThemeIcon>
                    <Badge
                      size="xs"
                      variant="filled"
                      style={{
                        background:
                          weatherData.transitImpact.airQualityStatus.color,
                      }}
                    >
                      AQI {weatherData.transitImpact.airQualityStatus.aqi}
                    </Badge>
                  </Group>
                  <Text fw={700} size="sm">
                    Health & Mask Advisory
                  </Text>
                  <Text size="xs" mt={4} style={{ color: "var(--text-muted)" }}>
                    {weatherData.transitImpact.airQualityStatus.maskRequired
                      ? "বাইরে চলাচলে মাস্ক ব্যবহার আবশ্যক। সংবেদনশীল ব্যক্তিরা দীর্ঘক্ষণ বাইরে না থাকাই ভালো।"
                      : "বায়ুমান স্বাভাবিক সহনশীল মাত্রায় আছে।"}
                  </Text>
                </Card>
              </SimpleGrid>
            </Box>

            {/* 3. 24-Hour Hourly Timeline */}
            <Paper
              p="lg"
              radius="lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Title
                order={3}
                size="h4"
                mb="xs"
                style={{ color: "var(--text-main)" }}
              >
                24-Hour Hourly Weather & Rain Forecast (প্রতি ঘণ্টার পূর্বাভাস)
              </Title>
              <Text size="xs" mb="md" style={{ color: "var(--text-muted)" }}>
                পরবর্তী ২৪ ঘণ্টার তাপমাত্রা এবং সম্ভাব্য বৃষ্টিপাতের সম্ভাবনা
                (Rain Probability)।
              </Text>

              <ScrollArea type="auto" offsetScrollbars>
                <Group gap="sm" wrap="nowrap" pb="xs">
                  {weatherData.hourly.map((step: any, idx: number) => (
                    <Paper
                      key={idx}
                      p="xs"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                        textAlign: "center",
                        minWidth: 84,
                      }}
                    >
                      <Text
                        size="xs"
                        fw={600}
                        style={{ color: "var(--text-muted)" }}
                      >
                        {step.hour}
                      </Text>
                      <Box my={4}>
                        {renderWeatherIcon(step.condition.iconType, 24)}
                      </Box>
                      <Text size="sm" fw={700}>
                        {Math.round(step.temperature)}°
                      </Text>

                      <Group gap={2} justify="center" mt={4}>
                        <IconDroplet size={11} color="#228be6" />
                        <Text size="10px" fw={600} style={{ color: "#228be6" }}>
                          {step.rainProbability}%
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Group>
              </ScrollArea>
            </Paper>

            {/* 4. 7-Day Extended Transit Forecast */}
            <Paper
              p="lg"
              radius="lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Title
                order={3}
                size="h4"
                mb="xs"
                style={{ color: "var(--text-main)" }}
              >
                7-Day Commuter Outlook (সাত দিনের পূর্বাভাস)
              </Title>
              <Text size="xs" mb="md" style={{ color: "var(--text-muted)" }}>
                সাপ্তাহিক রুট পরিকল্পনা এবং বৃষ্টিপাতের সম্ভাবনা বিশ্লেষণ।
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 7 }} spacing="sm">
                {weatherData.daily.map((day: any, idx: number) => (
                  <Paper
                    key={idx}
                    p="sm"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "center",
                    }}
                  >
                    <Text size="sm" fw={700}>
                      {day.dayName} ({day.dayNameBn})
                    </Text>
                    <Text size="11px" style={{ color: "var(--text-muted)" }}>
                      {day.date.slice(5)}
                    </Text>
                    <Box my={6}>
                      {renderWeatherIcon(day.condition.iconType, 28)}
                    </Box>
                    <Text size="xs" fw={600} lineClamp={1}>
                      {day.condition.label_bn}
                    </Text>
                    <Group gap={4} justify="center" mt={6}>
                      <Text size="xs" fw={700}>
                        {Math.round(day.tempMax)}°
                      </Text>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        / {Math.round(day.tempMin)}°
                      </Text>
                    </Group>

                    <Progress
                      value={day.rainProbability}
                      size="xs"
                      color="blue"
                      radius="xl"
                      mt={6}
                    />
                    <Text
                      size="10px"
                      mt={2}
                      style={{ color: "var(--text-muted)" }}
                    >
                      বৃষ্টি: {day.rainProbability}%
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>

            {/* 5. Monsoon Hotspots Monitoring */}
            <Paper
              p="lg"
              radius="lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Group gap="xs" mb="xs">
                <IconAlertTriangle size={20} color="#ff9900" />
                <Title
                  order={3}
                  size="h4"
                  style={{ color: "var(--text-main)" }}
                >
                  Dhaka Monsoon Waterlogging Sensitivity Radar (বৃষ্টিপ্রবণ
                  এলাকা সূচক)
                </Title>
              </Group>
              <Text size="xs" mb="md" style={{ color: "var(--text-muted)" }}>
                ভারী বৃষ্টি হলে ঢাকার যেসব পয়েন্টে দ্রুত পানি জমে বাস ও রিকশা
                চলাচল ব্যাহত হয়:
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {[
                  {
                    name: "Malibagh Railgate & Shantinagar",
                    bn: "মালিবাগ রেলগেট ও শান্তিনগর",
                    risk: "অতি সংবেদনশীল",
                    alt: "MRT Line 6 অথবা মৌচাক ফ্লাইওভার ব্যবহার করুন।",
                  },
                  {
                    name: "Mirpur Shewrapara & Kazipara",
                    bn: "মিরপুর শেওড়াপাড়া ও কাজীপাড়া",
                    risk: "মাঝারি ঝুঁকি",
                    alt: "মেট্রোরেল ব্যবহার করুন (রোড ট্রাফিকের বিকল্প)।",
                  },
                  {
                    name: "Karwan Bazar & Farmgate",
                    bn: "কাওরান বাজার ও ফার্মগেট",
                    risk: "মাঝারি ঝুঁকি",
                    alt: "হাঁটার জন্য ওভারব্রিজ ব্যবহার করুন।",
                  },
                  {
                    name: "Green Road & New Market",
                    bn: "গ্রিন রোড ও নিউমার্কেট",
                    risk: "অতি সংবেদনশীল",
                    alt: "মিরপুর রোড মূল করিডোরে থাকুন।",
                  },
                  {
                    name: "Badda Link Road & Rampura",
                    bn: "বাড্ডা লিংক রোড ও রামপুরা",
                    risk: "মাঝারি ঝুঁকি",
                    alt: "হাতিরঝিল ওয়াটার ট্যাক্সি বা বিকল্প রোড।",
                  },
                  {
                    name: "Motijheel Shapla Chottor",
                    bn: "মতিঝিল শাপলা চত্বর সংলগ্ন",
                    risk: "স্বাভাবিক",
                    alt: "মেট্রোরেল মতিঝিল স্টেশন সবচেয়ে দ্রুততম।",
                  },
                ].map((spot, i) => (
                  <Paper
                    key={i}
                    p="sm"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Group justify="space-between" mb={4}>
                      <Text fw={700} size="xs">
                        {spot.name}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={spot.risk === "অতি সংবেদনশীল" ? "red" : "orange"}
                      >
                        {spot.risk}
                      </Badge>
                    </Group>
                    <Text size="11px" style={{ color: "var(--text-muted)" }}>
                      {spot.bn}
                    </Text>
                    <Text
                      size="xs"
                      mt={4}
                      fw={500}
                      style={{ color: "var(--text-main)" }}
                    >
                      বিকল্প: {spot.alt}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
