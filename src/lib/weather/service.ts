export interface WeatherHubCoord {
  id: string;
  name_en: string;
  name_bn: string;
  lat: number;
  lon: number;
}

export const DHAKA_WEATHER_HUBS: WeatherHubCoord[] = [
  {
    id: "all_dhaka",
    name_en: "Dhaka Central",
    name_bn: "ঢাকা কেন্দ্র",
    lat: 23.8103,
    lon: 90.4125,
  },
  {
    id: "hub_mirpur_10",
    name_en: "Mirpur 10",
    name_bn: "মিরপুর ১০",
    lat: 23.8069,
    lon: 90.3687,
  },
  {
    id: "hub_uttara_north",
    name_en: "Uttara North",
    name_bn: "উত্তরা উত্তর",
    lat: 23.8759,
    lon: 90.3795,
  },
  {
    id: "hub_farmgate",
    name_en: "Farmgate",
    name_bn: "ফার্মগেট",
    lat: 23.7561,
    lon: 90.3872,
  },
  {
    id: "hub_shahbagh",
    name_en: "Shahbagh",
    name_bn: "শাহবাগ",
    lat: 23.7383,
    lon: 90.3957,
  },
  {
    id: "hub_motijheel",
    name_en: "Motijheel",
    name_bn: "মতিঝিল",
    lat: 23.7324,
    lon: 90.4175,
  },
  {
    id: "hub_mohakhali",
    name_en: "Mohakhali",
    name_bn: "মহাখালী",
    lat: 23.7776,
    lon: 90.4034,
  },
  {
    id: "hub_banasree",
    name_en: "Banasree",
    name_bn: "বনশ্রী",
    lat: 23.7634,
    lon: 90.4326,
  },
  {
    id: "hub_malibagh",
    name_en: "Malibagh",
    name_bn: "মালিবাগ",
    lat: 23.7485,
    lon: 90.4158,
  },
  {
    id: "hub_badda",
    name_en: "Badda",
    name_bn: "বাড্ডা",
    lat: 23.7806,
    lon: 90.4267,
  },
  {
    id: "hub_gulshan_1",
    name_en: "Gulshan 1",
    name_bn: "গুলশান ১",
    lat: 23.7788,
    lon: 90.4168,
  },
];

export interface WeatherConditionInfo {
  label_en: string;
  label_bn: string;
  iconType: "sun" | "cloud" | "rain" | "storm" | "fog";
}

export function decodeWmoCode(code: number): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        label_en: "Clear Sky",
        label_bn: "পরিষ্কার আকাশ",
        iconType: "sun",
      };
    case 1:
      return {
        label_en: "Mainly Clear",
        label_bn: "মূলত পরিষ্কার",
        iconType: "sun",
      };
    case 2:
      return {
        label_en: "Partly Cloudy",
        label_bn: "আংশিক মেঘলা",
        iconType: "cloud",
      };
    case 3:
      return {
        label_en: "Overcast",
        label_bn: "মেঘাচ্ছন্ন",
        iconType: "cloud",
      };
    case 45:
    case 48:
      return { label_en: "Dense Fog", label_bn: "ঘন কুয়াশা", iconType: "fog" };
    case 51:
    case 53:
    case 55:
      return {
        label_en: "Drizzle",
        label_bn: "গুঁড়ি গুঁড়ি বৃষ্টি",
        iconType: "rain",
      };
    case 61:
      return {
        label_en: "Light Rain",
        label_bn: "হালকা বৃষ্টি",
        iconType: "rain",
      };
    case 63:
      return {
        label_en: "Moderate Rain",
        label_bn: "মাঝারি বৃষ্টি",
        iconType: "rain",
      };
    case 65:
      return {
        label_en: "Heavy Monsoon Rain",
        label_bn: "ভারী বর্ষণ",
        iconType: "rain",
      };
    case 80:
    case 81:
    case 82:
      return {
        label_en: "Rain Showers",
        label_bn: "আকস্মিক বৃষ্টিপাত",
        iconType: "rain",
      };
    case 95:
      return {
        label_en: "Thunderstorm",
        label_bn: "বজ্রঝড়",
        iconType: "storm",
      };
    case 96:
    case 99:
      return {
        label_en: "Severe Thunderstorm & Hail",
        label_bn: "শিলাবৃষ্টিসহ তীব্র ঝড়",
        iconType: "storm",
      };
    default:
      return {
        label_en: "Moderate Weather",
        label_bn: "স্বাভাবিক আবহাওয়া",
        iconType: "cloud",
      };
  }
}

export interface TransitWeatherImpact {
  waterloggingRisk: "None" | "Low" | "Moderate" | "Severe";
  waterloggingRiskBn: string;
  hotspotsAlert: string[];
  metroViability: {
    status: "Optimal" | "Good";
    statusBn: string;
    advice: string;
    adviceBn: string;
  };
  rickshawViability: {
    status: "Optimal" | "Caution" | "Avoid";
    statusBn: string;
    advice: string;
    adviceBn: string;
  };
  busViability: {
    status: "Normal" | "Slow" | "Heavy Delays";
    statusBn: string;
    advice: string;
    adviceBn: string;
  };
  airQualityStatus: {
    aqi: number;
    category: string;
    categoryBn: string;
    maskRequired: boolean;
    color: string;
  };
}

export function computeTransitImpact(
  temp: number,
  apparentTemp: number,
  precipitation: number,
  weatherCode: number,
  aqi: number,
): TransitWeatherImpact {
  // Waterlogging calculation
  let waterloggingRisk: "None" | "Low" | "Moderate" | "Severe" = "None";
  let waterloggingRiskBn = "ঝুঁকিহীন (রাস্তা শুকনো)";
  const hotspotsAlert: string[] = [];

  const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(
    weatherCode,
  );

  if (precipitation > 10 || [65, 82, 95, 96, 99].includes(weatherCode)) {
    waterloggingRisk = "Severe";
    waterloggingRiskBn = "তীব্র জলাবদ্ধতার উচ্চ ঝুঁকি";
    hotspotsAlert.push(
      "মালিবাগ রেলগেট ও শান্তিনগর",
      "মিরপুর কাজীপাড়া-শেওড়াপাড়া",
      "গ্রিন রোড ও নিউমার্কেট",
    );
  } else if (precipitation > 3 || [63, 81].includes(weatherCode)) {
    waterloggingRisk = "Moderate";
    waterloggingRiskBn = "মাঝারি জলাবদ্ধতার ঝুঁকি";
    hotspotsAlert.push("মালিবাগ আন্ডারপাস", "কাওরান বাজার আড়ত রোড");
  } else if (isRain || precipitation > 0.5) {
    waterloggingRisk = "Low";
    waterloggingRiskBn = "সামান্য পিচ্ছিল রাস্তা";
  }

  // Rickshaw
  let rickshawStatus: "Optimal" | "Caution" | "Avoid" = "Optimal";
  let rickshawStatusBn = "উপযুক্ত ও স্বাভাবিক";
  let rickshawAdvice =
    "Ideal for short hub hops and neighborhood feeder routes.";
  let rickshawAdviceBn = "স্বাভাবিক চলাচলের জন্য উপযোগী।";

  if (waterloggingRisk === "Severe" || [95, 96, 99].includes(weatherCode)) {
    rickshawStatus = "Avoid";
    rickshawStatusBn = "পরিহারযোগ্য";
    rickshawAdvice =
      "Flooded corridors and storm lightning make open rickshaw dangerous.";
    rickshawAdviceBn =
      "বজ্রঝড় ও হাঁটু পানির কারণে রিকশা পরিহার করে মেট্রোরেল ব্যবহার করুন।";
  } else if (isRain || apparentTemp > 38) {
    rickshawStatus = "Caution";
    rickshawStatusBn = "সতর্কতা প্রয়োজন";
    rickshawAdvice = isRain
      ? "Rain hood and waterproof bag cover strongly recommended."
      : "High heat index. Carry water and avoid long direct sun rides.";
    rickshawAdviceBn = isRain
      ? "বৃষ্টির কারণে রিকশার হুড তুলে নিন ও ওয়াটারপ্রুফ ব্যাগ ব্যবহার করুন।"
      : "তীব্র গরম। পানি সাথে রাখুন।";
  }

  // Bus
  let busStatus: "Normal" | "Slow" | "Heavy Delays" = "Normal";
  let busStatusBn = "স্বাভাবিক শিডিউল";
  let busAdvice = "Buses running on standard headways.";
  let busAdviceBn = "সিটি বাসগুলো স্বাভাবিক সময়ের ব্যবধানে চলাচল করছে।";

  if (waterloggingRisk === "Severe") {
    busStatus = "Heavy Delays";
    busStatusBn = "চরম ট্রাফিক জ্যাম ও বিলম্ব";
    busAdvice = "Expect +30-45 min crawl through low-lying choke points.";
    busAdviceBn = "জলাবদ্ধতার কারণে বাস চলাচলে ৩০-৪৫ মিনিট বিলম্ব হতে পারে।";
  } else if (waterloggingRisk === "Moderate" || isRain) {
    busStatus = "Slow";
    busStatusBn = "ধীরগতির ট্রাফিক";
    busAdvice = "Slippery roads and slower boarding causing +15 min delays.";
    busAdviceBn = "বৃষ্টির জন্য ধীরগতি ও অতিরিক্ত ১৫ মিনিট সময় লাগতে পারে।";
  }

  // Air Quality
  let aqiCategory = "Good";
  let aqiCategoryBn = "ভালো";
  let maskRequired = false;
  let aqiColor = "#00aa66";

  if (aqi > 200) {
    aqiCategory = "Very Unhealthy";
    aqiCategoryBn = "অত্যন্ত অস্বাস্থ্যকর";
    maskRequired = true;
    aqiColor = "#7e0023";
  } else if (aqi > 150) {
    aqiCategory = "Unhealthy";
    aqiCategoryBn = "অস্বাস্থ্যকর";
    maskRequired = true;
    aqiColor = "#e11900";
  } else if (aqi > 100) {
    aqiCategory = "Sensitive Caution";
    aqiCategoryBn = "সংবেদনশীলদের জন্য ক্ষতিকর";
    maskRequired = false;
    aqiColor = "#ff9900";
  } else if (aqi > 50) {
    aqiCategory = "Moderate";
    aqiCategoryBn = "মাঝারি গ্রহণযোগ্য";
    maskRequired = false;
    aqiColor = "#e8a000";
  }

  return {
    waterloggingRisk,
    waterloggingRiskBn,
    hotspotsAlert,
    metroViability: {
      status: "Optimal",
      statusBn: "সর্বোচ্চ অগ্রাধিকার (আবহাওয়া-মুক্ত)",
      advice:
        "MRT Line 6 is 100% weather-isolated, elevated, and climate controlled.",
      adviceBn:
        "মেট্রোরেল সম্পূর্ণ বৃষ্টি ও জলাবদ্ধতামুক্ত শীতাতপ নিয়ন্ত্রিত নিরাপদ বাহন।",
    },
    rickshawViability: {
      status: rickshawStatus,
      statusBn: rickshawStatusBn,
      advice: rickshawAdvice,
      adviceBn: rickshawAdviceBn,
    },
    busViability: {
      status: busStatus,
      statusBn: busStatusBn,
      advice: busAdvice,
      adviceBn: busAdviceBn,
    },
    airQualityStatus: {
      aqi,
      category: aqiCategory,
      categoryBn: aqiCategoryBn,
      maskRequired,
      color: aqiColor,
    },
  };
}
