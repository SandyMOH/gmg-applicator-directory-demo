require('dotenv').config();

const { log } = require('./lib/logger');
const ArloClient = require('./lib/arloClient');
const WpClient = require('./lib/wpClient');
const Geocoder = require('./lib/geocoder');
const { processApplicator } = require('./lib/processor');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  log('========================================');
  log(`  GMG API - Bulk Sync${DRY_RUN ? ' (DRY RUN)' : ''}`);
  log('========================================');

  // Initialize clients
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

  // 1. Authenticate
  log('Authenticating with Arlo...');
  const authOk = await arlo.authenticate();
  if (!authOk) {
    log('ERROR: Arlo authentication failed.');
    process.exit(1);
  }
  log('  Authenticated');

  // 2. Fetch all completed registrations
  log('Fetching completed registrations...');
  let registrations;
  try {
    registrations = await arlo.fetchCompletedRegistrations();
  } catch (err) {
    log(`ERROR fetching registrations: ${err.message}`);
    process.exit(1);
  }
  log(`  Found ${registrations.length} completed registrations`);

  // 3. Fetch existing WP posts once (so the processor can search the list)
  log('Fetching existing WordPress posts...');
  let existingPosts;
  try {
    existingPosts = await wp.getAllApplicators();
  } catch (err) {
    log(`ERROR fetching WP posts: ${err.message}`);
    process.exit(1);
  }
  log(`  Found ${existingPosts.length} existing posts`);

  // 4. Process each registration through the shared processor
  log('');
  log('Processing registrations...');

  const stats = { created: 0, updated: 0, unchanged: 0, skipped: 0, errors: 0 };

  for (const reg of registrations) {
    const data = arlo.extractApplicator(reg);

    const result = await processApplicator(
      data,
      { wp, geocoder },
      { dryRun: DRY_RUN, existingPosts }
    );

    if (!result.ok) {
      stats.errors++;
    } else if (result.skipped) {
      stats.skipped++;
    } else if (result.action === 'created') {
      stats.created++;
    } else if (result.action === 'updated') {
      stats.updated++;
    } else if (result.action === 'unchanged') {
      stats.unchanged++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  // 5. Summary
  log('');
  log('========================================');
  log('  Sync Complete');
  log('========================================');
  log(`  Created:   ${stats.created}`);
  log(`  Updated:   ${stats.updated}`);
  log(`  Unchanged: ${stats.unchanged}`);
  log(`  Skipped:   ${stats.skipped}  (not Spray Academy or not passed)`);
  log(`  Errors:    ${stats.errors}`);
  if (DRY_RUN) {
    log('');
    log('  DRY RUN - no changes were made.');
    log('  Run "npm run sync" to sync for real.');
  }
  log('========================================');
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
