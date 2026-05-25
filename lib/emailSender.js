/**
 * emailSender.js
 *
 * PLACEHOLDER - not active yet.
 *
 * This will handle sending the Spray Academy congratulations email
 * via Microsoft 365 SMTP (Nodemailer) when someone passes.
 *
 * When ready to build:
 *   1. npm install nodemailer
 *   2. Fill in the SMTP_* values in .env
 *   3. Implement sendCongratulationsEmail() below
 *   4. Uncomment the email hook in lib/processor.js
 */

// const nodemailer = require('nodemailer');
const { log } = require('./logger');

// Placeholder - does nothing yet
async function sendCongratulationsEmail(applicant) {
  log(`  [EMAIL] (not implemented) Would send congrats email to ${applicant.email}`);
  return { sent: false, reason: 'not_implemented' };
}

module.exports = { sendCongratulationsEmail };
