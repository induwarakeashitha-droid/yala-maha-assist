/**
 * Yala-Maha Assist · Automated Test Suite
 * -----------------------------------------
 * Tests configs, validation algorithms, translation dictionaries,
 * and HTTP server routes & REST API endpoints.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 Starting Yala-Maha Assist Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --- 1. Test Domain Configurations ---
  console.log('1. Testing Domain Configurations...');
  const farmConfig = require('../farm-config.js');
  const riverConfig = require('../river-config.js');

  assert('farm-config exports sampleFarms array', Array.isArray(farmConfig.sampleFarms) && farmConfig.sampleFarms.length >= 15);
  assert('farm-config exports cropHierarchy with paddy, vegetables, fruit', Boolean(farmConfig.cropHierarchy.paddy && farmConfig.cropHierarchy.vegetables));
  assert('river-config exports safeCapacityMeters', riverConfig.river.safeCapacityMeters === 4.50);
  assert('river-config exports flood thresholds', riverConfig.thresholds.warningMax === 100 && riverConfig.thresholds.safeMax === 60);

  // --- 2. Test NIC Validation & Privacy Masking ---
  console.log('\n2. Testing NIC Validation & Privacy Masking...');
  const validOldNic = farmConfig.validateNIC('821453298V');
  assert('Old 9-digit + V NIC is valid', validOldNic.valid && validOldNic.type === 'old');

  const validNewNic = farmConfig.validateNIC('198421098456');
  assert('New 12-digit NIC is valid', validNewNic.valid && validNewNic.type === 'new');

  const invalidNic = farmConfig.validateNIC('12345');
  assert('Invalid NIC format is rejected', !invalidNic.valid);

  const maskedOld = farmConfig.maskNIC('821453298V');
  assert('Old NIC masked properly (••••••298V)', maskedOld === '••••••298V');

  const maskedNew = farmConfig.maskNIC('198421098456');
  assert('New NIC masked properly (••••••••8456)', maskedNew === '••••••••8456');

  // --- 3. Test Translations & Schema Files ---
  console.log('\n3. Testing Translation Completeness & File Existence...');
  const transCode = fs.readFileSync(path.join(__dirname, '../js/translations.js'), 'utf8');
  assert('translations.js contains English, Sinhala, Tamil', transCode.includes('en:') && transCode.includes('si:') && transCode.includes('ta:'));

  const filesToCheck = [
    'css/style.css',
    'js/icons.js',
    'js/schematic-map.js',
    'js/farmer-portal.js',
    'js/dashboard.js',
    'js/sms-gateway.js',
    'js/coverage-map.js',
    'js/river-monitoring.js',
    'js/app.js',
    'yala-maha-assist.html',
    'farmer-portal.html',
    'server.js'
  ];

  filesToCheck.forEach(f => {
    assert(`File exists: ${f}`, fs.existsSync(path.join(__dirname, '..', f)));
  });

  // --- 4. Test HTTP Server & API Endpoints ---
  console.log('\n4. Testing HTTP Server & API Endpoints...');
  const TEST_PORT = 3199;
  process.env.PORT = TEST_PORT;

  // Start server
  const serverModule = require('../server.js');

  await new Promise(r => setTimeout(r, 600));

  function makeRequest(urlPath, method = 'GET', postData = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: urlPath,
        method: method,
        headers: {}
      };
      if (postData) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  try {
    const resRoot = await makeRequest('/');
    assert('GET / returns 200 and loads main app', resRoot.status === 200 && resRoot.body.includes('Tank Dashboard'));

    const resPortal = await makeRequest('/portal');
    assert('GET /portal returns 200 and loads farmer portal', resPortal.status === 200 && resPortal.body.includes('Farmer Portal'));

    const resCss = await makeRequest('/css/style.css');
    assert('GET /css/style.css returns 200 and text/css', resCss.status === 200 && resCss.headers['content-type'].includes('text/css'));

    const resHealth = await makeRequest('/api/health');
    assert('GET /api/health returns 200 and status healthy', resHealth.status === 200 && JSON.parse(resHealth.body).status === 'healthy');

    const resFarms = await makeRequest('/api/farms');
    assert('GET /api/farms returns registered farms count >= 15', resFarms.status === 200 && JSON.parse(resFarms.body).count >= 15);

    const resRiver = await makeRequest('/api/river');
    assert('GET /api/river returns flood risk information', resRiver.status === 200 && JSON.parse(resRiver.body).riskLevel === 'FLOOD');

    const postSmsPayload = JSON.stringify({ group: 'Downstream', recipients: 412, message: 'Test alert' });
    const resSms = await makeRequest('/api/sms', 'POST', postSmsPayload);
    assert('POST /api/sms dispatches mock broadcast', resSms.status === 200 && JSON.parse(resSms.body).status === 'dispatched');

  } catch (err) {
    console.error('Request error:', err);
    failed++;
  }

  console.log(`\n=========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`=========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
