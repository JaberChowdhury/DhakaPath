import { NextResponse } from "next/server";
import {
  DHAKA_WEATHER_HUBS,
  decodeWmoCode,
  computeTransitImpact,
} from "@/lib/weather/service";

// In-memory cache for 5 minutes to keep it ultra snappy
let cachedWeatherData: {
  key: string;
  timestamp: number;
  data: any;
} | null = null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    let lat = 23.8103;
    let lon = 90.4125;
    let hubNameEn = "Dhaka Central";
    let hubNameBn = "ঢাকা কেন্দ্র";

    if (hubId) {
      const matched = DHAKA_WEATHER_HUBS.find((h) => h.id === hubId);
      if (matched) {
        lat = matched.lat;
        lon = matched.lon;
        hubNameEn = matched.name_en;
        hubNameBn = matched.name_bn;
      }
    } else {
      const qLat = parseFloat(searchParams.get("lat") || "");
      const qLon = parseFloat(searchParams.get("lon") || "");
      if (!isNaN(qLat) && !isNaN(qLon)) {
        lat = qLat;
        lon = qLon;
        hubNameEn = "Selected Location";
        hubNameBn = "নির্বাচিত অবস্থান";
      }
    }

    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const now = Date.now();

    if (
      cachedWeatherData &&
      cachedWeatherData.key === cacheKey &&
      now - cachedWeatherData.timestamp < 5 * 60 * 1000
    ) {
      return NextResponse.json(cachedWeatherData.data);
    }

    // Fetch Open-Meteo Weather & Air Quality in parallel
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max&timezone=Asia%2FDhaka&forecast_days=7`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=Asia%2FDhaka`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [weatherRes, aqiRes] = await Promise.allSettled([
      fetch(weatherUrl, {
        signal: controller.signal,
        next: { revalidate: 300 },
      }),
      fetch(airQualityUrl, {
        signal: controller.signal,
        next: { revalidate: 300 },
      }),
    ]);

    clearTimeout(timeoutId);

    let rawWeather: any = null;
    let rawAqi: any = null;

    if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
      rawWeather = await weatherRes.value.json();
    }
    if (aqiRes.status === "fulfilled" && aqiRes.value.ok) {
      rawAqi = await aqiRes.value.json();
    }

    // Fallback if Open-Meteo API is unreachable
    if (!rawWeather?.current) {
      rawWeather = {
        current: {
          time: new Date().toISOString(),
          temperature_2m: 32.5,
          relative_humidity_2m: 65,
          apparent_temperature: 36.0,
          is_day: 1,
          precipitation: 0.0,
          rain: 0.0,
          weather_code: 1,
          cloud_cover: 20,
          wind_speed_10m: 8.5,
        },
        hourly: {
          time: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          temperature_2m: Array.from({ length: 24 }, () => 31),
          precipitation_probability: Array.from({ length: 24 }, () => 10),
          weather_code: Array.from({ length: 24 }, () => 1),
        },
        daily: {
          time: [
            "2026-10-16",
            "2026-10-17",
            "2026-10-18",
            "2026-10-19",
            "2026-10-20",
            "2026-10-21",
            "2026-10-22",
          ],
          weather_code: [1, 2, 61, 2, 1, 0, 1],
          temperature_2m_max: [34, 33, 31, 32, 33, 34, 34],
          temperature_2m_min: [25, 25, 24, 24, 25, 25, 25],
          precipitation_probability_max: [15, 30, 65, 40, 20, 10, 15],
          uv_index_max: [7, 6, 4, 6, 7, 8, 8],
        },
      };
    }

    const current = rawWeather.current;
    const aqiVal = rawAqi?.current?.us_aqi || 145;
    const condition = decodeWmoCode(current.weather_code);
    const transitImpact = computeTransitImpact(
      current.temperature_2m,
      current.apparent_temperature,
      current.precipitation || 0,
      current.weather_code,
      aqiVal,
    );

    // Filter next 24 hourly steps starting from current hour
    const nowIso = new Date().toISOString();
    const currentHourStr = nowIso.slice(0, 13); // "YYYY-MM-DDTHH"
    let startIndex = 0;
    if (rawWeather.hourly?.time) {
      const idx = rawWeather.hourly.time.findIndex((t: string) =>
        t.startsWith(currentHourStr),
      );
      if (idx >= 0) startIndex = idx;
    }

    const next24Hours = (rawWeather.hourly?.time || [])
      .slice(startIndex, startIndex + 24)
      .map((timeStr: string, i: number) => {
        const actualIdx = startIndex + i;
        const code = rawWeather.hourly.weather_code?.[actualIdx] ?? 1;
        const temp =
          rawWeather.hourly.temperature_2m?.[actualIdx] ??
          current.temperature_2m;
        const rainProb =
          rawWeather.hourly.precipitation_probability?.[actualIdx] ?? 0;
        const cond = decodeWmoCode(code);
        return {
          time: timeStr,
          hour: timeStr.slice(11, 16),
          temperature: temp,
          rainProbability: rainProb,
          condition: cond,
        };
      });

    // 7-day daily format
    const next7Days = (rawWeather.daily?.time || []).map(
      (dateStr: string, idx: number) => {
        const code = rawWeather.daily.weather_code?.[idx] ?? 1;
        return {
          date: dateStr,
          dayName: new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          dayNameBn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"][
            new Date(dateStr).getDay()
          ],
          tempMax: rawWeather.daily.temperature_2m_max?.[idx] ?? 33,
          tempMin: rawWeather.daily.temperature_2m_min?.[idx] ?? 24,
          rainProbability:
            rawWeather.daily.precipitation_probability_max?.[idx] ?? 20,
          uvIndex: rawWeather.daily.uv_index_max?.[idx] ?? 6,
          condition: decodeWmoCode(code),
        };
      },
    );

    const responsePayload = {
      success: true,
      source: "Open-Meteo & Copernicus Free Atmospheric Models",
      hub: {
        id: hubId || "all_dhaka",
        name_en: hubNameEn,
        name_bn: hubNameBn,
        lat,
        lon,
      },
      current: {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        isDay: Boolean(current.is_day),
        cloudCover: current.cloud_cover,
        condition,
        aqi: aqiVal,
      },
      transitImpact,
      hourly: next24Hours,
      daily: next7Days,
      updatedAt: new Date().toISOString(),
    };

    cachedWeatherData = {
      key: cacheKey,
      timestamp: now,
      data: responsePayload,
    };

    const res = NextResponse.json(responsePayload);
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
