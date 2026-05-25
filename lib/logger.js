const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Log a message to console + dated log file
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  const logFile = path.join(logDir, `gmg-api-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, line + '\n');
}

module.exports = { log };
