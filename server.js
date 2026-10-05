/**
 * Yala-Maha Assist · Node.js Application Server
 * ---------------------------------------------
 * Clean, zero-external-dependency HTTP server built on Node.js standard library.
 * Serves static web assets (HTML, CSS, JS, SVG) with correct MIME types and
 * provides lightweight REST API endpoints for farms, river monitoring, and SMS broadcasts.
 *
 * Usage:
 *   node server.js
 *   npm start
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// In-memory runtime data cache initialized from farm-config.js
let farmsCache = null;
function loadFarmsCache() {
  if (farmsCache) return farmsCache;
  try {
    const farmConfig = require(path.join(PUBLIC_DIR, 'farm-config.js'));
    if (farmConfig && Array.isArray(farmConfig.sampleFarms)) {
      farmsCache = JSON.parse(JSON.stringify(farmConfig.sampleFarms));
      return farmsCache;
    }
  } catch (err) {
    console.warn('Could not preload farms from config:', err.message);
  }
  farmsCache = [];
  return farmsCache;
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const query = Object.fromEntries(reqUrl.searchParams.entries());

  // Add CORS headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- REST API Endpoints ---
  if (pathname.startsWith('/api/')) {
    handleApiRoutes(req, res, pathname, query);
    return;
  }

  // --- HTML Route Aliases ---
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html' || pathname === '/dashboard' || pathname === '/river' || pathname === '/map' || pathname === '/sms') {
    filePath = path.join(PUBLIC_DIR, 'yala-maha-assist.html');
  } else if (pathname === '/portal' || pathname === '/farmer-portal' || pathname === '/farmer') {
    filePath = path.join(PUBLIC_DIR, 'farmer-portal.html');
  } else {
    // Sanitize path to prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(PUBLIC_DIR, safePath);
  }

  // Check if file exists and serve it
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}\nTry / (Dashboard) or /portal (Farmer Portal)`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function handleApiRoutes(req, res, pathname, query) {
  const jsonResponse = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
  };

  if (pathname === '/api/health') {
    jsonResponse(200, {
      status: 'healthy',
      app: 'Yala-Maha Assist',
      nodeVersion: process.version,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/farms') {
    const farms = loadFarmsCache();

    if (req.method === 'GET') {
      let filtered = [...farms];
      if (query.village) {
        filtered = filtered.filter(f => f.village.toLowerCase().includes(query.village.toLowerCase()));
      }
      if (query.crop) {
        filtered = filtered.filter(f => f.crops.some(c => c.category === query.crop));
      }
      jsonResponse(200, { count: filtered.length, farms: filtered });
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newFarm = JSON.parse(body);
          newFarm.id = 'FAR-' + String(farms.length + 1).padStart(3, '0');
          newFarm.createdAt = new Date().toISOString();
          farms.push(newFarm);
          jsonResponse(201, { success: true, message: 'Farm registered', farm: newFarm });
        } catch (e) {
          jsonResponse(400, { error: 'Invalid JSON payload' });
        }
      });
      return;
    }
  }

  if (pathname === '/api/river') {
    jsonResponse(200, {
      river: 'Yan Oya River',
      basin: 'Yan Oya River Basin',
      safeCapacityMeters: 4.50,
      currentLevelMeters: 3.65,
      forecastPeakMeters: 4.82,
      riskLevel: 'FLOOD',
      exceedanceExpected: 'Thursday evening',
      source: 'Open-Meteo Flood API & Sri Lanka Catchment Calibration'
    });
    return;
  }

  if (pathname === '/api/sms' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        jsonResponse(200, {
          status: 'dispatched',
          recipientsCount: payload.recipients || 412,
          targetGroup: payload.group || 'Downstream',
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        jsonResponse(400, { error: 'Invalid SMS dispatch payload' });
      }
    });
    return;
  }

  jsonResponse(404, { error: 'API route not found' });
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 Yala-Maha Assist Node.js Server is running!`);
  console.log(`📡 Local URL:       http://localhost:${PORT}`);
  console.log(`📱 Farmer Portal:   http://localhost:${PORT}/portal`);
  console.log(`💧 River & Map:     http://localhost:${PORT}/river`);
  console.log(`🛠  API Health:      http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
