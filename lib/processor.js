/**
 * processor.js
 *
 * The shared core logic: take a registration's data → add/update it in WordPress.
 * Both the bulk sync (sync.js) and the webhook (index.js) call this.
 *
 * This is also where the email step will plug in later.
 */

const { log } = require('./logger');

const SPRAY_ACADEMY_CODE = process.env.SPRAY_ACADEMY_CODE || 'SPRA1-OA-001';

// ===== Helpers =====

function formatCertDate(isoDate) {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch {
    return isoDate;
  }
}

function deriveRegion(city, state) {
  if (city) return city.toUpperCase();
  if (state) return state.toUpperCase();
  return '';
}

function buildDisplayAddress(suburb, city, state, postCode) {
  return [suburb, city, state, postCode].filter(Boolean).join(', ');
}

// Decide if a registration counts as "passed / certified"
function hasPassed(data) {
  if (data.outcome === 'Pass') return true;
  if (data.certDate && data.certDate.trim() !== '') return true;
  return false;
}

// Detect if an existing WP post needs updating
function hasChanged(existingPost, incoming) {
  const acf = existingPost.acf || {};
  return (
    existingPost.title?.rendered !== incoming.title ||
    acf.email !== incoming.email ||
    acf.phone_number !== incoming.phone ||
    acf.company !== incoming.company ||
    acf.city !== incoming.city ||
    acf.state !== incoming.state ||
    acf.suburb !== incoming.suburb ||
    acf.post_code !== incoming.postCode
  );
}

/**
 * Process one applicator's data and sync to WordPress.
 *
 * @param {object} data       - extracted applicator data (from arlo.extractApplicator)
 * @param {object} deps       - { wp, geocoder }
 * @param {object} options    - { dryRun, existingPosts }
 * @returns {object} result   - { ok, action, reason, postId, skipped }
 */
async function processApplicator(data, deps, options = {}) {
  const { wp, geocoder } = deps;
  const { dryRun = false, existingPosts = null } = options;

  if (!data) {
    return { ok: false, reason: 'no_data' };
  }

  const fullName = `${data.firstName} ${data.lastName}`.trim();

  // 1. Filter: is this the Spray Academy?
  if (data.courseCode !== SPRAY_ACADEMY_CODE) {
    log(`  SKIP ${fullName}: not Spray Academy (course: ${data.courseCode || 'none'})`);
    return { ok: true, skipped: true, reason: 'not_spray_academy' };
  }

  // 2. Filter: have they passed / been certified?
  if (!hasPassed(data)) {
    log(`  SKIP ${fullName}: not passed (outcome: ${data.outcome || 'none'})`);
    return { ok: true, skipped: true, reason: 'not_passed' };
  }

  // 3. Build the WordPress payload
  const displayAddress = buildDisplayAddress(
    data.suburb,
    data.city,
    data.state,
    data.postCode
  );

  const wpData = {
    title: fullName,
    arloRegistrationId: data.arloRegistrationId,
    licenseNumber: '',
    phone: data.phone,
    email: data.email,
    certDate: formatCertDate(data.certDate),
    company: data.company,
    region: deriveRegion(data.city, data.state),
    suburb: data.suburb,
    city: data.city,
    state: data.state,
    postCode: data.postCode,
    streetAddress: data.streetAddress,
    displayAddress,
    lat: null,
    lng: null,
  };

  // 4. Geocode the address
  if (data.city || data.suburb) {
    const geo = await geocoder.geocode({
      street: data.streetAddress,
      suburb: data.suburb,
      city: data.city,
      state: data.state,
      postCode: data.postCode,
      country: data.country,
    });
    if (geo) {
      wpData.lat = geo.lat;
      wpData.lng = geo.lng;
      log(`  Geocoded ${fullName}: ${geo.lat}, ${geo.lng}`);
    } else {
      log(`  Could not geocode ${fullName}`);
    }
  }

  // 5. Check if this person already exists in WordPress
  let existing;
  if (existingPosts) {
    // Bulk sync passes the full list - search it (avoids many API calls)
    existing = wp.findByArloId(existingPosts, data.arloRegistrationId);
  } else {
    // Webhook mode - look up live
    existing = await wp.findByArloIdLive(data.arloRegistrationId);
  }

  // 6. Create or update
  if (existing) {
    if (!hasChanged(existing, wpData)) {
      log(`  UNCHANGED ${fullName} (post #${existing.id})`);
      return { ok: true, action: 'unchanged', postId: existing.id };
    }

    if (dryRun) {
      log(`  [DRY RUN] Would UPDATE ${fullName} (post #${existing.id})`);
      return { ok: true, action: 'updated', postId: existing.id, dryRun: true };
    }

    try {
      await wp.updateApplicator(existing.id, wpData);
      log(`  UPDATED ${fullName} (post #${existing.id})`);

      // --- EMAIL HOOK (future) ---
      // await maybeSendEmail(data, 'updated');

      return { ok: true, action: 'updated', postId: existing.id };
    } catch (err) {
      log(`  ERROR updating ${fullName}: ${err.message}`);
      return { ok: false, reason: 'wp_update_failed' };
    }
  } else {
    if (dryRun) {
      log(`  [DRY RUN] Would CREATE ${fullName}`);
      return { ok: true, action: 'created', dryRun: true };
    }

    try {
      const newPost = await wp.createApplicator(wpData);
      log(`  CREATED ${fullName} (post #${newPost.id})`);

      // --- EMAIL HOOK (future) ---
      // When ready, this is where the congratulations email goes:
      // await maybeSendEmail(data, 'created');

      return { ok: true, action: 'created', postId: newPost.id };
    } catch (err) {
      log(`  ERROR creating ${fullName}: ${err.message}`);
      if (err.response) {
        log(`    Status ${err.response.status}: ${JSON.stringify(err.response.data).substring(0, 200)}`);
      }
      return { ok: false, reason: 'wp_create_failed' };
    }
  }
}

module.exports = { processApplicator, hasPassed };
