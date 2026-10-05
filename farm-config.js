/**
 * Yala-Maha Assist · Farm Configuration & Coverage Data
 * ----------------------------------------------------
 * Stores crop hierarchies, coverage thresholds, schematic map landmarks,
 * and sample farm datasets for Mahaweli B Zone / Palugaswewa.
 */

const FARM_CONFIG = {
  // Region
  regions: [
    { id: "mahaweli-b", name: "Mahaweli B Zone (System B)", sinhalaName: "මහවැලි B කලාපය", tamilName: "மகாவலி B வலயம்", default: true }
  ],

  // Crop Hierarchy: Category -> Crops -> Varieties / Species
  cropHierarchy: {
    paddy: {
      name: "Paddy",
      sinhalaName: "වී වගාව",
      tamilName: "நெல்",
      crops: {
        "White Rice (BG)": {
          sinhala: "සුදු කැකුළු (BG)",
          tamil: "வெள்ளை அரிசி (BG)",
          varieties: ["BG 352 (3.5 Months)", "BG 358 (3 Months)", "BG 300 (3 Months)", "BG 379-2 (4 Months)"]
        },
        "Red Rice (AT)": {
          sinhala: "රතු කැකුළු (AT)",
          tamil: "சிவப்பு அரிசி (AT)",
          varieties: ["AT 362 (3.5 Months)", "AT 308 (3 Months)", "AT 307 (3 Months)"]
        },
        "Samba & Specialty": {
          sinhala: "සම්බා සහ විශේෂ ප්‍රභේද",
          tamil: "சம்பா & சிறப்பு வகைகள்",
          varieties: ["Keeri Samba", "Suwandel (Traditional)", "Kalu Heenati (Traditional)", "Basmati 370"]
        }
      }
    },
    vegetables: {
      name: "Vegetables",
      sinhalaName: "එළවළු",
      tamilName: "காய்கறிகள்",
      crops: {
        "Tomato": {
          sinhala: "තක්කාලි",
          tamil: "தக்காளி",
          varieties: ["Thilina", "Padma Hybrid", "Maheshi", "Cherry Tomato"]
        },
        "Green Chilli": {
          sinhala: "අමු මිරිස්",
          tamil: "பச்சை மிளகாய்",
          varieties: ["MI-2 (High Yield)", "MIPC-1", "Galkiriyagama Selection", "Cobra Hot Hybrid"]
        },
        "Brinjal (Eggplant)": {
          sinhala: "වම්බටු",
          tamil: "கத்தரிக்காய்",
          varieties: ["SM-164", "Padagoda", "Thinnaveli Purple", "Black Beauty"]
        },
        "Okra (Ladies' Finger)": {
          sinhala: "බණ්ඩක්කා",
          tamil: "வெண்டைக்காய்",
          varieties: ["Haritha", "MI-5", "Pratibha F1"]
        },
        "Cabbage": {
          sinhala: "ගෝවා",
          tamil: "முட்டைக்கோஸ்",
          varieties: ["Golden Acre", "Green Coronet F1", "Pretoria"]
        }
      }
    },
    fruit: {
      name: "Fruit",
      sinhalaName: "පලතුරු",
      tamilName: "பழங்கள்",
      crops: {
        "Banana": {
          sinhala: "කෙසෙල්",
          tamil: "வாழை",
          varieties: ["Kolikuttu", "Ambul (Sour)", "Seeni (Sweet)", "Anamalu", "Embon"]
        },
        "Papaya": {
          sinhala: "පැපොල්",
          tamil: "பப்பாளி",
          varieties: ["Red Lady (F1)", "Rathna", "Sinta"]
        },
        "Mango": {
          sinhala: "අඹ",
          tamil: "மாம்பழம்",
          varieties: ["Tom EJC (Super)", "Karthacolomban", "Vellacolomban", "Vilad"]
        },
        "Lime": {
          sinhala: "දෙහි",
          tamil: "எலுமிச்சை",
          varieties: ["Monaragala Local", "Seedless Hybrid"]
        }
      }
    },
    other: {
      name: "Other Field Crops (OFC)",
      sinhalaName: "අනෙකුත් ක්ෂේත්‍ර බෝග",
      tamilName: "ஏனைய களப் பயிர்கள்",
      crops: {
        "Maize": {
          sinhala: "ඉරිඟු",
          tamil: "சோளம்",
          varieties: ["Pacific 999", "Jet 999", "Sampath (Local Composite)", "Badra-1"]
        },
        "Soya Bean": {
          sinhala: "සෝයා බෝංචි",
          tamil: "சோயா பீன்ஸ்",
          varieties: ["Pb-1", "PM-13", "MISB-1"]
        },
        "Green Gram (Mung)": {
          sinhala: "මුං ඇට",
          tamil: "பாசிப்பயறு",
          varieties: ["MI-5", "MI-6", "Ari"]
        },
        "Groundnut": {
          sinhala: "රටකජු",
          tamil: "நிலக்கடலை",
          varieties: ["Tikka", "Walawa", "Indi"]
        },
        "Sesame (Gingelly)": {
          sinhala: "තල",
          tamil: "எள்",
          varieties: ["MI-1 (Black)", "MI-2 (White)", "Malee"]
        }
      }
    },
    mixed: {
      name: "Mixed Farming",
      sinhalaName: "මිශ්‍ර වගාව",
      tamilName: "கலப்பு விவசாயம்",
      crops: {
        "Paddy & Field Crops": {
          sinhala: "වී සහ ක්ෂේත්‍ර බෝග",
          tamil: "நெல் & களப் பயிர்கள்",
          varieties: ["Yala OFC / Maha Paddy Rotation", "Double Crop Paddy & Maize"]
        },
        "Integrated Homegarden": {
          sinhala: "ඒකාබද්ධ ගෙවතු වගාව",
          tamil: "ஒருங்கிணைந்த வீட்டுத் தோட்டம்",
          varieties: ["Fruit Trees & Vegetables", "Spices & Banana Grove"]
        }
      }
    }
  },

  // Yield measurement units
  yieldUnits: [
    { id: "kg_acre", en: "kg per acre", si: "අක්කරයකට කි.ග්‍රෑ.", ta: "ஏக்கருக்கு கி.கி." },
    { id: "bushel_acre", en: "bushels per acre", si: "අක්කරයකට බුසල්", ta: "ஏக்கருக்கு புஷல்" },
    { id: "mt_acre", en: "metric tons / acre", si: "අක්කරයකට මෙ.ටොන්", ta: "ஏக்கருக்கு மெ.தொன்" }
  ],

  // Schematic Map Landmarks for Search & Live Distance Calculation
  mapLandmarks: [
    { id: "palugaswewa_tank", name: "Palugaswewa Tank", type: "tank", x: 230, y: 175, radius: 85, en: "Palugaswewa Tank", si: "පලුගස්වැව වැව", ta: "பழுகஸ்வெவ குளம்" },
    { id: "kudawewa_tank", name: "Kudawewa Tank", type: "tank", x: 620, y: 320, radius: 70, en: "Kudawewa Tank", si: "කුඩාවැව වැව", ta: "குடாவெவ குளம்" },
    { id: "main_canal", name: "Mahaweli Main Canal B-02", type: "canal", x: 410, y: 240, en: "Mahaweli Main Canal B-02", si: "මහවැලි ප්‍රධාන ඇළ B-02", ta: "மகாவலி பிரதான கால்வாய் B-02" },
    { id: "branch_canal_1", name: "Kudawewa Feeder Canal", type: "canal", x: 500, y: 270, en: "Kudawewa Feeder Canal", si: "කුඩාවැව පෝෂක ඇළ", ta: "குடாவெவ ஊட்டுக் கால்வாய்" },
    { id: "horiwila_village", name: "Horiwila Village Center", type: "village", x: 380, y: 110, en: "Horiwila Village", si: "හොරිවිල ගම්මානය", ta: "ஹொரிவில கிராமம்" },
    { id: "maradankadawala", name: "Maradankadawala Valley", type: "village", x: 680, y: 140, en: "Maradankadawala", si: "මරදන්කඩවල", ta: "மரதன்கடவல" },
    { id: "spillway", name: "Hurulu Wewa Spillway Gate", type: "canal", x: 130, y: 380, en: "Hurulu Wewa Spillway", si: "හුරුළු වැව පිටවාන", ta: "ஹுருலு வெவ வான் கதவு" }
  ],

  // Coverage Thresholds
  coverage: {
    thresholds: {
      goodMin: 70,    // >= 70%: Good (Green)
      lowMin: 40,     // 40% - 69%: Low (Amber)
                      // < 40%: Very Low (Red)
    },
    levels: {
      good: { id: "good", label: "Good Coverage", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", pill: "ok" },
      low: { id: "low", label: "Low Coverage", color: "#B45309", bg: "#FEF3C7", border: "#FDE68A", pill: "am" },
      veryLow: { id: "veryLow", label: "Very Low / Critical", color: "#BE123C", bg: "#FFF1F2", border: "#FECDD3", pill: "bd" }
    }
  },

  // Sample Registered Farms (15 farms with a balanced mix of Good, Low, and Very Low coverage)
  sampleFarms: [
    {
      id: "FAR-001",
      farmerName: "Sunil Bandara",
      firstName: "Sunil",
      nic: "821453298V",
      maskedNic: "••••••298V",
      mobile: "+94 77 123 4567",
      village: "Palugaswewa North",
      region: "Mahaweli B Zone",
      x: 290,
      y: 190,
      crops: [
        { category: "paddy", crop: "White Rice (BG)", species: "BG 352 (3.5 Months)", acres: 3.5, yield: 2400, yieldUnit: "kg_acre" }
      ],
      totalAcres: 3.5,
      waterScore: 88,
      signalScore: 92,
      nearestLandmark: "Palugaswewa Tank",
      distMeters: 240,
      notes: "Direct gravity canal feed; excellent water and 4G signal."
    },
    {
      id: "FAR-002",
      farmerName: "Kamal Wickramasinghe",
      firstName: "Kamal",
      nic: "198421098456",
      maskedNic: "••••••••8456",
      mobile: "+94 71 456 7890",
      village: "Kudawewa Lowlands",
      region: "Mahaweli B Zone",
      x: 580,
      y: 330,
      crops: [
        { category: "paddy", crop: "Samba & Specialty", species: "Keeri Samba", acres: 4.0, yield: 2100, yieldUnit: "kg_acre" }
      ],
      totalAcres: 4.0,
      waterScore: 94,
      signalScore: 85,
      nearestLandmark: "Kudawewa Tank",
      distMeters: 180,
      notes: "Near Kudawewa spillway; good reception and abundant irrigation."
    },
    {
      id: "FAR-003",
      farmerName: "Priyantha Kumara",
      firstName: "Priyantha",
      nic: "791563214V",
      maskedNic: "••••••214V",
      mobile: "+94 76 890 1234",
      village: "Palugaswewa South",
      region: "Mahaweli B Zone",
      x: 210,
      y: 340,
      crops: [
        { category: "other", crop: "Maize", species: "Pacific 999", acres: 2.5, yield: 2800, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.5,
      waterScore: 44, // Low water
      signalScore: 82, // Good signal
      nearestLandmark: "Palugaswewa Tank",
      distMeters: 620,
      notes: "Elevated terrace plot. Canal water pressure drops mid-week."
    },
    {
      id: "FAR-004",
      farmerName: "Nimal Dissanayake",
      firstName: "Nimal",
      nic: "199105432109",
      maskedNic: "••••••••2109",
      mobile: "+94 70 234 5678",
      village: "Kudawewa Tail-end",
      region: "Mahaweli B Zone",
      x: 720,
      y: 390,
      crops: [
        { category: "paddy", crop: "Red Rice (AT)", species: "AT 362 (3.5 Months)", acres: 2.0, yield: 1800, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.0,
      waterScore: 32, // Very Low water
      signalScore: 78, // Good signal
      nearestLandmark: "Kudawewa Tank",
      distMeters: 780,
      notes: "Canal tail-end blockage; requires water rationing scheduling."
    },
    {
      id: "FAR-005",
      farmerName: "Ravichandran Pillai",
      firstName: "Ravichandran",
      nic: "852901432V",
      maskedNic: "••••••432V",
      mobile: "+94 77 987 6543",
      village: "Maradankadawala Valley",
      region: "Mahaweli B Zone",
      x: 690,
      y: 110,
      crops: [
        { category: "fruit", crop: "Banana", species: "Kolikuttu", acres: 3.0, yield: 4500, yieldUnit: "kg_acre" }
      ],
      totalAcres: 3.0,
      waterScore: 82, // Good water
      signalScore: 35, // Very Low signal
      nearestLandmark: "Maradankadawala Valley",
      distMeters: 190,
      notes: "Valley terrain causes carrier blind spot. Physical notices needed."
    },
    {
      id: "FAR-006",
      farmerName: "Samantha Abeysekara",
      firstName: "Samantha",
      nic: "198834561234",
      maskedNic: "••••••••1234",
      mobile: "+94 71 345 6789",
      village: "Horiwila Ridge",
      region: "Mahaweli B Zone",
      x: 450,
      y: 90,
      crops: [
        { category: "other", crop: "Green Gram (Mung)", species: "MI-6", acres: 1.8, yield: 950, yieldUnit: "kg_acre" }
      ],
      totalAcres: 1.8,
      waterScore: 48, // Low water
      signalScore: 28, // Very Low signal
      nearestLandmark: "Horiwila Village Center",
      distMeters: 450,
      notes: "Double deficit: low canal flow and weak cell coverage."
    },
    {
      id: "FAR-007",
      farmerName: "Fathima Rameez",
      firstName: "Fathima",
      nic: "905671234V",
      maskedNic: "••••••234V",
      mobile: "+94 76 112 2334",
      village: "Palugaswewa Canal Bend",
      region: "Mahaweli B Zone",
      x: 340,
      y: 220,
      crops: [
        { category: "vegetables", crop: "Brinjal (Eggplant)", species: "Padagoda", acres: 1.2, yield: 5200, yieldUnit: "kg_acre" }
      ],
      totalAcres: 1.2,
      waterScore: 91,
      signalScore: 94,
      nearestLandmark: "Mahaweli Main Canal B-02",
      distMeters: 120,
      notes: "Adjacent to main branch canal; optimal water and high signal."
    },
    {
      id: "FAR-008",
      farmerName: "Anura Senanayake",
      firstName: "Anura",
      nic: "197609876543",
      maskedNic: "••••••••6543",
      mobile: "+94 77 445 5667",
      village: "Kudawewa Sluice Margin",
      region: "Mahaweli B Zone",
      x: 640,
      y: 260,
      crops: [
        { category: "paddy", crop: "White Rice (BG)", species: "BG 358 (3 Months)", acres: 5.0, yield: 2650, yieldUnit: "kg_acre" }
      ],
      totalAcres: 5.0,
      waterScore: 95,
      signalScore: 89,
      nearestLandmark: "Kudawewa Tank",
      distMeters: 90,
      notes: "Premier commercial paddy tract; consistent water gate supply."
    },
    {
      id: "FAR-009",
      farmerName: "Chandana Herath",
      firstName: "Chandana",
      nic: "863124567V",
      maskedNic: "••••••567V",
      mobile: "+94 71 889 9001",
      village: "Horiwila Spillway Basin",
      region: "Mahaweli B Zone",
      x: 320,
      y: 80,
      crops: [
        { category: "vegetables", crop: "Tomato", species: "Padma Hybrid", acres: 1.5, yield: 6400, yieldUnit: "kg_acre" },
        { category: "vegetables", crop: "Green Chilli", species: "MI-2 (High Yield)", acres: 1.0, yield: 3100, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.5,
      waterScore: 52, // Low water
      signalScore: 36, // Very Low signal
      nearestLandmark: "Horiwila Village Center",
      distMeters: 380,
      notes: "High vegetable harvest; needs extension officer in-person alerts."
    },
    {
      id: "FAR-010",
      farmerName: "Sarath Jayawardena",
      firstName: "Sarath",
      nic: "198129871234",
      maskedNic: "••••••••1234",
      mobile: "+94 70 778 8990",
      village: "Palugaswewa High Ground",
      region: "Mahaweli B Zone",
      x: 150,
      y: 240,
      crops: [
        { category: "other", crop: "Maize", species: "Jet 999", acres: 2.8, yield: 2950, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.8,
      waterScore: 34, // Very Low water
      signalScore: 88, // Good signal
      nearestLandmark: "Palugaswewa Tank",
      distMeters: 550,
      notes: "Upland soil; requires diesel pump lift from secondary canal."
    },
    {
      id: "FAR-011",
      farmerName: "Jayasinghe Banda",
      firstName: "Jayasinghe",
      nic: "831987654V",
      maskedNic: "••••••654V",
      mobile: "+94 77 334 4556",
      village: "Maradankadawala Fringe",
      region: "Mahaweli B Zone",
      x: 640,
      y: 170,
      crops: [
        { category: "vegetables", crop: "Green Chilli", species: "MIPC-1", acres: 1.5, yield: 2900, yieldUnit: "kg_acre" }
      ],
      totalAcres: 1.5,
      waterScore: 46, // Low water
      signalScore: 72, // Good signal
      nearestLandmark: "Maradankadawala Valley",
      distMeters: 420,
      notes: "Minor feeder canal subject to siltation during mid-Maha."
    },
    {
      id: "FAR-012",
      farmerName: "Thilak Rathnayake",
      firstName: "Thilak",
      nic: "199345678901",
      maskedNic: "••••••••8901",
      mobile: "+94 71 223 3445",
      village: "Kudawewa Canal Branch 3",
      region: "Mahaweli B Zone",
      x: 480,
      y: 310,
      crops: [
        { category: "paddy", crop: "Samba & Specialty", species: "Suwandel (Traditional)", acres: 2.2, yield: 1650, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.2,
      waterScore: 86,
      signalScore: 78,
      nearestLandmark: "Kudawewa Feeder Canal",
      distMeters: 210,
      notes: "Heritage rice parcel; dependable water delivery."
    },
    {
      id: "FAR-013",
      farmerName: "Siripala Wickrema",
      firstName: "Siripala",
      nic: "771890234V",
      maskedNic: "••••••234V",
      mobile: "+94 76 667 7889",
      village: "Horiwila South Scrub",
      region: "Mahaweli B Zone",
      x: 410,
      y: 50,
      crops: [
        { category: "other", crop: "Groundnut", species: "Tikka", acres: 1.6, yield: 1100, yieldUnit: "kg_acre" }
      ],
      totalAcres: 1.6,
      waterScore: 36, // Very Low water
      signalScore: 24, // Very Low signal (Double Deficit!)
      nearestLandmark: "Horiwila Village Center",
      distMeters: 620,
      notes: "High risk profile. Officer field visit required before water shutoff."
    },
    {
      id: "FAR-014",
      farmerName: "Karunaratne Menike",
      firstName: "Karunaratne",
      nic: "885671239V",
      maskedNic: "••••••239V",
      mobile: "+94 70 556 6778",
      village: "Palugaswewa Central",
      region: "Mahaweli B Zone",
      x: 260,
      y: 280,
      crops: [
        { category: "fruit", crop: "Papaya", species: "Red Lady (F1)", acres: 2.0, yield: 8500, yieldUnit: "kg_acre" }
      ],
      totalAcres: 2.0,
      waterScore: 82,
      signalScore: 91,
      nearestLandmark: "Palugaswewa Tank",
      distMeters: 310,
      notes: "Drip irrigation installed with steady secondary canal recharge."
    },
    {
      id: "FAR-015",
      farmerName: "Buddhika Alwis",
      firstName: "Buddhika",
      nic: "199512349876",
      maskedNic: "••••••••9876",
      mobile: "+94 77 889 0012",
      village: "Palugaswewa West Canal",
      region: "Mahaweli B Zone",
      x: 160,
      y: 130,
      crops: [
        { category: "vegetables", crop: "Okra (Ladies' Finger)", species: "Haritha", acres: 1.4, yield: 4100, yieldUnit: "kg_acre" }
      ],
      totalAcres: 1.4,
      waterScore: 78,
      signalScore: 84,
      nearestLandmark: "Palugaswewa Tank",
      distMeters: 290,
      notes: "Reliable commercial okra plot with regular SMS advisory intake."
    }
  ],

  // NIC Validator and Masker
  validateNIC: function(nicStr) {
    if (!nicStr) return { valid: false, messageEn: "Please enter your National Identity Card (NIC) number.", messageSi: "කරුණාකර ඔබගේ ජාතික හැඳුනුම්පත් අංකය ඇතුළත් කරන්න.", messageTa: "தயவுசெய்து உங்கள் தேசிய அடையாள அட்டை எண்ணை உள்ளிடவும்." };
    const clean = nicStr.trim().toUpperCase();
    const oldRegex = /^[0-9]{9}[VX]$/;
    const newRegex = /^[0-9]{12}$/;
    if (oldRegex.test(clean)) {
      return { valid: true, type: "old", formatted: clean };
    }
    if (newRegex.test(clean)) {
      return { valid: true, type: "new", formatted: clean };
    }
    return {
      valid: false,
      messageEn: "Enter a valid NIC (e.g. 851234567V or 198512345678).",
      messageSi: "වලංගු හැඳුනුම්පත් අංකයක් ඇතුළත් කරන්න (උදා. 851234567V හෝ 198512345678).",
      messageTa: "சரியான அடையாள அட்டை எண்ணை உள்ளிடவும் (எ.கா. 851234567V அல்லது 198512345678)."
    };
  },

  maskNIC: function(nicStr) {
    if (!nicStr) return "••••••••";
    const clean = nicStr.trim().toUpperCase();
    if (clean.length === 10) {
      return "••••••" + clean.slice(6);
    } else if (clean.length === 12) {
      return "••••••••" + clean.slice(8);
    }
    return "••••" + clean.slice(-4);
  }
};

// Export for Node/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FARM_CONFIG;
}
