#  Yala-Maha Assist 
Agricultural hydrological monitoring, farm registration with schematic vector maps, river flood early warning, and multilingual SMS dispatch system for Mahaweli B Zone (Palugaswewa / Kudawewa system), Sri Lanka.

---

##  Quick Start (Node.js)

The application includes a clean, zero-external-dependency built-in Node.js server.

### 1. Start the Server
```bash
npm start
# or
node server.js
```
The server will start at **`http://localhost:3000`**.

### 2. Run the Automated Test Suite
```bash
npm test
```
Runs 29 automated tests verifying domain configurations, NIC validation, privacy masking, trilingual translations, static asset delivery, and REST API endpoints.

---

##  URLs & Pages

| Page | URL Path | Description |
|---|---|---|
| **Full Operations Suite** | `http://localhost:3000/` | Complete operational suite: Dashboard, River, Coverage Map, SMS Gateway, Farmer Portal |
| **River Monitoring** | `http://localhost:3000/river` | Real-time Yan Oya river gauge, 14-day history/forecast, village risks, and auto SMS warnings |
| **Coverage Map** | `http://localhost:3000/map` | Schematic SVG farm plots with dual-axis water supply and mobile/SMS signal evaluation |
| **SMS Gateway** | `http://localhost:3000/sms` | Trilingual broadcast composer with GSM/Unicode segment counter and dispatch history |
| **Farmer Portal** | `http://localhost:3000/portal` | Mobile-first farmer self-registration (4-step profile, crops, schematic pin map, consent) |

*Note: Both [`yala-maha-assist.html`](./yala-maha-assist.html) and [`farmer-portal.html`](./farmer-portal.html) use relative asset paths and can also be opened directly in any web browser without running a server.*

---

##  Clean Modular Architecture

All previously duplicated inline CSS stylesheets, trilingual translations, SVG icons, and JavaScript functions have been refactored into a clear, maintainable modular structure:

```
visionex/
├── css/
│   └── style.css            # Unified design system (tokens, cards, tables, maps, badges)
├── js/
│   ├── icons.js             # Centralized SVG icons (ico.*), DOM selectors $, $$, toast()
│   ├── translations.js      # Trilingual dictionary (English, Sinhala, Tamil)
│   ├── schematic-map.js     # Schematic vector map base renderer & landmark distance calculator
│   ├── farmer-portal.js     # Farmer authentication & 4-step registration flow
│   ├── dashboard.js         # Tank water level SVG curve chart & 7-day rainfall bar graph
│   ├── sms-gateway.js       # SMS broadcast compose, character counter, audit history
│   ├── coverage-map.js      # Officer farm plots map, mode switcher, popup card & low-coverage table
│   ├── river-monitoring.js  # Open-Meteo Flood API, scenario simulation, gauge & alert dispatch
│   └── app.js               # Main application navigation controller & lifecycle binder
├── test/
│   └── test-suite.js        # Comprehensive automated test suite
├── farm-config.js           # Sample farms, NIC validator/masker, crop taxonomy
├── river-config.js          # River safe capacities, thresholds, villages, sample scenarios
├── server.js                # Node.js HTTP static server & REST API endpoints
├── package.json             # Node.js package manifest and scripts
├── yala-maha-assist.html    # Clean operations management interface (modular script links)
└── farmer-portal.html       # Clean mobile-first farmer registration portal
```

---

##  REST API Endpoints

The Node.js server provides lightweight REST API endpoints:

- **`GET /api/health`** — Server health check and uptime status.
- **`GET /api/farms`** — Returns registered farms list (optional query filters: `?village=...&crop=...`).
- **`POST /api/farms`** — Registers a new farm with assigned ID.
- **`GET /api/river`** — Returns current Yan Oya river flood risk data.
- **`POST /api/sms`** — Dispatches mock SMS broadcasts to downstream/upstream farmers.

---

## 🇱🇰 Trilingual Support

puk sudud
