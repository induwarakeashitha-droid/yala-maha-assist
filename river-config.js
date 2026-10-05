/**
 * Yala-Maha Assist · River Monitoring & Flood Warning Configuration
 * ------------------------------------------------------------------
 * Central configuration file for river hydrological monitoring, real-time
 * flood prediction, risk thresholds, and automated SMS alerts.
 * 
 * Edit risk thresholds, river capacity, API credentials, or village profiles here.
 */

const RIVER_CONFIG = {
  // ----------------------------------------------------------------
  // 1. API CONFIGURATION
  // ----------------------------------------------------------------
  api: {
    // API Key: Keep your API key here (leave empty to use sample data or public endpoints)
    apiKey: "",
    
    // If true, will use sample data whenever apiKey is empty (ideal for offline testing)
    requireApiKeyForLive: false,

    // Real-time Flood API Endpoint (Open-Meteo Flood API - ECMWF Global Flood Awareness System)
    floodApiUrl: "https://flood-api.open-meteo.com/v1/flood",

    // Catchment Weather / Rainfall Forecast Endpoint (Open-Meteo Weather API)
    weatherApiUrl: "https://api.open-meteo.com/v1/forecast",

    // Coordinates for Yan Oya River Basin (Palugaswewa / Hurulu Wewa, North Central Sri Lanka)
    latitude: 8.15,
    longitude: 80.60,

    // Forecast and historical window in days
    forecastDays: 7,
    pastDays: 7,

    // Auto-refresh interval in minutes (e.g. 30 minutes)
    refreshIntervalMinutes: 30,
  },

  // ----------------------------------------------------------------
  // 2. RIVER BASIN & HYDROLOGICAL PARAMETERS
  // ----------------------------------------------------------------
  river: {
    id: "yan-oya-01",
    name: "Yan Oya",
    sinhalaName: "යාන් ඔය",
    tamilName: "யான் ஓயா",
    basin: "Yan Oya River Basin",
    subBasin: "Palugaswewa Catchment & Kudawewa Cascade",
    stationName: "Yan Oya Hydrological Gauge Station Y-04",
    
    // Safe bank capacity in meters (water level above river bed before bank overflow occurs)
    safeCapacityMeters: 4.50,

    // Normal base discharge in cubic meters per second (m³/s)
    normalDischargeM3s: 18.0,

    // Discharge threshold where river exceeds safe bank capacity (m³/s)
    overflowDischargeM3s: 60.0,

    // Maximum gauge height display for chart (meters)
    maxChartGaugeMeters: 6.0,
  },

  // ----------------------------------------------------------------
  // 3. FLOOD PREDICTION RISK THRESHOLDS (% of safe capacity)
  // ----------------------------------------------------------------
  // Safe: below 60% · Watch: 60-80% · Warning: 80-100% · Flood: above 100%
  thresholds: {
    safeMax: 60,     // < 60% = Safe
    watchMax: 80,    // 60% - 80% = Watch
    warningMax: 100, // 80% - 100% = Warning
                     // > 100% = Flood
  },

  // ----------------------------------------------------------------
  // 4. AUTOMATED OFFICER & FARMER ALERT SETTINGS
  // ----------------------------------------------------------------
  alerts: {
    // Default mode for automatic SMS sending (true = auto-send, false = officer approval required)
    autoSendEnabledDefault: true,

    // Target farmer phone group for flood alerts
    targetGroup: "Downstream",
    
    // Number of reachable farmers in flood impact zone
    affectedFarmerCount: 412,

    // Automatic message templates in 3 languages
    messages: {
      en: "Flood warning: Yan Oya River may overflow by Thursday evening. Move livestock and equipment to higher ground. Avoid crossing the river. — Yala-Maha Assist",
      si: "ගංවතුර අනතුරු ඇඟවීම: බ්‍රහස්පතින්දා සවස් වන විට යාන් ඔය පිටාර ගැලීමේ අවදානමක් ඇත. ගවයන් සහ උපකරණ උස් ස්ථානවලට ගෙන යන්න. ගඟ හරහා යාමෙන් වළකින්න. — Yala-Maha Assist",
      ta: "வெள்ள எச்சரிக்கை: வியாழன் மாலைக்குள் யான் ஓயா நதி நிரம்பி வழியக்கூடும். கால்நடைகள் மற்றும் உபகரணங்களை உயரமான இடங்களுக்கு நகர்த்தவும். நதியைக் கடப்பதைத் தவிர்க்கவும். — Yala-Maha Assist"
    }
  },

  // ----------------------------------------------------------------
  // 5. DOWNSTREAM VULNERABLE VILLAGES
  // ----------------------------------------------------------------
  villages: [
    {
      name: "Kudawewa Lowlands",
      sinhalaName: "කුඩාවැව පහළ පෙදෙස",
      tamilName: "குடாவெவ தாழ்நிலங்கள்",
      distanceKm: "0.8 km",
      elevation: "Low river terrace (92m)",
      safeThresholdM: 4.20,
      riskMultiplier: 1.05,
      farmers: 148,
      actionEn: "Evacuate livestock & pumps to high bund",
      actionSi: "ගවයන් සහ ජල පොම්ප උස් වැටි වෙත ගෙන යන්න",
      actionTa: "கால்நடைகள் & பம்புகளை உயரமான வரப்புக்கு மாற்றவும்"
    },
    {
      name: "Palugaswewa South",
      sinhalaName: "පලුගස්වැව දකුණ",
      tamilName: "பழுகஸ்வெவ தெற்கு",
      distanceKm: "1.4 km",
      elevation: "Alluvial floodplain (95m)",
      safeThresholdM: 4.50,
      riskMultiplier: 1.00,
      farmers: 112,
      actionEn: "Move tractors, avoid culvert crossing",
      actionSi: "ට්‍රැක්ටර් ගෙනයන්න, බෝක්කු හරහා යාමෙන් වළකින්න",
      actionTa: "டிராக்டர்களை நகர்த்தவும், மதகுகளைக் கடப்பதைத் தவிர்க்கவும்"
    },
    {
      name: "Horiwila Paddy Tracts",
      sinhalaName: "හොරිවිල වෙල්යාය",
      tamilName: "ஹொரிவில நெல் வயல்கள்",
      distanceKm: "2.1 km",
      elevation: "Canal spillway margin (98m)",
      safeThresholdM: 4.80,
      riskMultiplier: 0.92,
      farmers: 96,
      actionEn: "Sandbag canal bunds, monitor spillway",
      actionSi: "ඇළ බැමි වැලි කොට්ට වලින් ශක්තිමත් කරන්න",
      actionTa: "மணல் மூட்டைகளால் வரப்பை பலப்படுத்தவும்"
    },
    {
      name: "Maradankadawala Basin",
      sinhalaName: "මරදන්කඩවල නිම්නය",
      tamilName: "மரதன்கடவல வடிநிலம்",
      distanceKm: "3.5 km",
      elevation: "Valley fringe (104m)",
      safeThresholdM: 5.20,
      riskMultiplier: 0.80,
      farmers: 56,
      actionEn: "Normal watch; monitor river gauge updates",
      actionSi: "සාමාන්‍ය විමසිල්ල; මට්ටම් වාර්තා නිරීක්ෂණය කරන්න",
      actionTa: "இயல்பான கண்காணிப்பு; நிலை அறிக்கைகளைக் கண்காணிக்கவும்"
    }
  ],

  // ----------------------------------------------------------------
  // 6. SAMPLE / TEST DATA (Used when API is offline or testing scenarios)
  // ----------------------------------------------------------------
  sampleScenarios: {
    // 1. Safe Scenario (Normal dry season baseline)
    safe: {
      name: "Normal / Safe Condition",
      currentLevelM: 2.15,
      currentDischargeM3s: 14.5,
      peakLevelM: 2.55,
      peakDischargeM3s: 18.2,
      peakDate: "Saturday morning",
      timeToPeakHours: 72,
      exceedsCapacity: false,
      history: [
        { label: "Sep 29", levelM: 1.85, discharge: 11.2 },
        { label: "Sep 30", levelM: 1.90, discharge: 12.0 },
        { label: "Oct 01", levelM: 2.05, discharge: 13.5 },
        { label: "Oct 02", levelM: 2.10, discharge: 14.0 },
        { label: "Oct 03", levelM: 2.12, discharge: 14.2 },
        { label: "Oct 04", levelM: 2.14, discharge: 14.3 },
        { label: "Oct 05", levelM: 2.15, discharge: 14.5 }
      ],
      forecast: [
        { label: "Oct 06 (Today)", levelM: 2.20, discharge: 15.0, rainMm: 1.5 },
        { label: "Oct 07 (Wed)",   levelM: 2.30, discharge: 16.0, rainMm: 2.0 },
        { label: "Oct 08 (Thu)",   levelM: 2.45, discharge: 17.2, rainMm: 3.5 },
        { label: "Oct 09 (Fri)",   levelM: 2.55, discharge: 18.2, rainMm: 4.0 },
        { label: "Oct 10 (Sat)",   levelM: 2.40, discharge: 16.8, rainMm: 2.0 },
        { label: "Oct 11 (Sun)",   levelM: 2.25, discharge: 15.5, rainMm: 1.0 },
        { label: "Oct 12 (Mon)",   levelM: 2.10, discharge: 14.0, rainMm: 0.5 }
      ]
    },

    // 2. Watch Scenario (Moderate rainfall & rising water)
    watch: {
      name: "Watch Condition (60-80%)",
      currentLevelM: 3.15,
      currentDischargeM3s: 28.5,
      peakLevelM: 3.45,
      peakDischargeM3s: 33.0,
      peakDate: "Friday afternoon",
      timeToPeakHours: 60,
      exceedsCapacity: false,
      history: [
        { label: "Sep 29", levelM: 2.20, discharge: 15.0 },
        { label: "Sep 30", levelM: 2.35, discharge: 16.5 },
        { label: "Oct 01", levelM: 2.50, discharge: 18.2 },
        { label: "Oct 02", levelM: 2.75, discharge: 21.0 },
        { label: "Oct 03", levelM: 2.90, discharge: 23.5 },
        { label: "Oct 04", levelM: 3.05, discharge: 26.0 },
        { label: "Oct 05", levelM: 3.15, discharge: 28.5 }
      ],
      forecast: [
        { label: "Oct 06 (Today)", levelM: 3.25, discharge: 30.0, rainMm: 5.0 },
        { label: "Oct 07 (Wed)",   levelM: 3.35, discharge: 31.5, rainMm: 7.5 },
        { label: "Oct 08 (Thu)",   levelM: 3.42, discharge: 32.5, rainMm: 8.0 },
        { label: "Oct 09 (Fri)",   levelM: 3.45, discharge: 33.0, rainMm: 6.0 },
        { label: "Oct 10 (Sat)",   levelM: 3.30, discharge: 30.5, rainMm: 3.0 },
        { label: "Oct 11 (Sun)",   levelM: 3.05, discharge: 26.5, rainMm: 1.5 },
        { label: "Oct 12 (Mon)",   levelM: 2.80, discharge: 22.0, rainMm: 0.5 }
      ]
    },

    // 3. Warning Scenario (80-100% capacity - close to spill)
    warning: {
      name: "Warning Condition (80-100%)",
      currentLevelM: 3.85,
      currentDischargeM3s: 42.0,
      peakLevelM: 4.28,
      peakDischargeM3s: 53.0,
      peakDate: "Thursday evening",
      timeToPeakHours: 42,
      exceedsCapacity: false,
      history: [
        { label: "Sep 29", levelM: 2.40, discharge: 17.0 },
        { label: "Sep 30", levelM: 2.65, discharge: 20.0 },
        { label: "Oct 01", levelM: 2.95, discharge: 24.5 },
        { label: "Oct 02", levelM: 3.25, discharge: 29.0 },
        { label: "Oct 03", levelM: 3.50, discharge: 34.0 },
        { label: "Oct 04", levelM: 3.70, discharge: 38.5 },
        { label: "Oct 05", levelM: 3.85, discharge: 42.0 }
      ],
      forecast: [
        { label: "Oct 06 (Today)", levelM: 3.98, discharge: 45.0, rainMm: 12.0 },
        { label: "Oct 07 (Wed)",   levelM: 4.15, discharge: 49.5, rainMm: 16.5 },
        { label: "Oct 08 (Thu)",   levelM: 4.28, discharge: 53.0, rainMm: 21.0 },
        { label: "Oct 09 (Fri)",   levelM: 4.20, discharge: 50.5, rainMm: 11.0 },
        { label: "Oct 10 (Sat)",   levelM: 3.95, discharge: 44.0, rainMm: 5.0 },
        { label: "Oct 11 (Sun)",   levelM: 3.60, discharge: 36.0, rainMm: 2.0 },
        { label: "Oct 12 (Mon)",   levelM: 3.20, discharge: 28.0, rainMm: 0.5 }
      ]
    },

    // 4. Flood Scenario (>100% capacity - severe overflow expected)
    flood: {
      name: "Flood Overflow Condition (>100%)",
      currentLevelM: 3.65,
      currentDischargeM3s: 37.0,
      peakLevelM: 4.82,
      peakDischargeM3s: 68.5,
      peakDate: "Thursday evening",
      timeToPeakHours: 48,
      exceedsCapacity: true,
      exceedDate: "Thursday evening",
      history: [
        { label: "Sep 29", levelM: 2.30, discharge: 16.0 },
        { label: "Sep 30", levelM: 2.50, discharge: 18.5 },
        { label: "Oct 01", levelM: 2.75, discharge: 22.0 },
        { label: "Oct 02", levelM: 3.00, discharge: 26.0 },
        { label: "Oct 03", levelM: 3.25, discharge: 30.0 },
        { label: "Oct 04", levelM: 3.48, discharge: 34.0 },
        { label: "Oct 05", levelM: 3.65, discharge: 37.0 }
      ],
      forecast: [
        { label: "Oct 06 (Today)", levelM: 3.90, discharge: 43.0, rainMm: 14.0 },
        { label: "Oct 07 (Wed)",   levelM: 4.35, discharge: 54.0, rainMm: 28.5 },
        { label: "Oct 08 (Thu)",   levelM: 4.82, discharge: 68.5, rainMm: 46.0 }, // Peak overflow!
        { label: "Oct 09 (Fri)",   levelM: 4.62, discharge: 61.0, rainMm: 18.0 }, // Sustained flood
        { label: "Oct 10 (Sat)",   levelM: 4.10, discharge: 47.5, rainMm: 8.0 },
        { label: "Oct 11 (Sun)",   levelM: 3.55, discharge: 35.0, rainMm: 2.5 },
        { label: "Oct 12 (Mon)",   levelM: 3.00, discharge: 25.0, rainMm: 0.5 }
      ]
    }
  }
};

// Export for Node/CommonJS environments if ever imported as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RIVER_CONFIG;
}
