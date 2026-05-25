require('dotenv').config();
const express = require('express');

const { log } = require('./lib/logger');
const ArloClient = require('./lib/arloClient');
const WpClient = require('./lib/wpClient');
const Geocoder = require('./lib/geocoder');
const { processApplicator } = require('./lib/processor');

const PORT = process.env.PORT || 3000;

// ===== Initialize shared clients =====
const arlo = new ArloClient({
  clientId: process.env.ARLO_CLIENT_ID,
  clientSecret: process.env.ARLO_CLIENT_SECRET,
  platform: process.env.ARLO_PLATFORM,
  refreshToken: process.env.ARLO_REFRESH_TOKEN,
});

const wp = new WpClient({
  url: process.env.WP_URL,
  user: process.env.WP_USER,
  appPassword: process.env.WP_APP_PASSWORD,
});

const geocoder = new Geocoder(process.env.GOOGLE_API_KEY);

// ===== Process one registration by ID =====
async function handleRegistration(registrationId) {
  log(`Processing registration ${registrationId}...`);

  // Fetch full details from Arlo
  let reg;
  try {
    reg = await arlo.fetchRegistration(registrationId);
  } catch (err) {
    log(`  ERROR fetching registration ${registrationId}: ${err.message}`);
    return { ok: false, reason: 'fetch_failed' };
  }

  const data = arlo.extractApplicator(reg);
  if (!data) {
    log(`  No data extracted for registration ${registrationId}`);
    return { ok: false, reason: 'no_data' };
  }

  log(`  ${data.firstName} ${data.lastName} | ${data.courseCode} | outcome: ${data.outcome}`);

  // Hand off to the shared processor (webhook mode = no existingPosts list)
  return await processApplicator(data, { wp, geocoder }, { dryRun: false });
}

// ===== Express server =====
const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'GMG API - Arlo integration',
    endpoints: ['GET /', 'GET /test?id=NN', 'POST /webhook'],
    time: new Date().toISOString(),
  });
});

// Test endpoint - manually process a registration without a real webhook
app.get('/test', async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Provide a registration ID: /test?id=32' });
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(`TEST: manual trigger for registration ${id}`);
  const result = await handleRegistration(id);
  res.json(result);
});

// Webhook endpoint - receives Arlo events
app.post('/webhook', async (req, res) => {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('Webhook received');
  log(`Payload: ${JSON.stringify(req.body)}`);

  // Acknowledge to Arlo immediately
  res.status(200).json({ received: true });

  const events = req.body?.events || [];
  if (events.length === 0) {
    log('  No events in payload');
    return;
  }

  for (const event of events) {
    const { resourceType, type, resourceId } = event;
    log(`  Event: ${resourceType} | ${type} | ID ${resourceId}`);

    if (resourceType !== 'Registration') {
      log(`  SKIP: not a Registration event`);
      continue;
    }

    await handleRegistration(resourceId);
  }

  log('Webhook processing complete');
});

// ===== Start =====
app.listen(PORT, () => {
  log('');
  log('========================================');
  log('  GMG API - Webhook Server');
  log('========================================');
  log(`  Port:          ${PORT}`);
  log(`  Health check:  http://localhost:${PORT}/`);
  log(`  Test:          http://localhost:${PORT}/test?id=32`);
  log(`  Webhook:       http://localhost:${PORT}/webhook`);
  log('');
  log('  Run a manual bulk sync with:  npm run sync');
  log('========================================');
  log('');
});
