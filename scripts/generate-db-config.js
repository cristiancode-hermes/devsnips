/**
 * Build-time script: reads NEON_API_KEY (from env or .neon-api-key),
 * fetches the DB password from Neon's API, and writes _db-config.js
 * (underscore prefix so Netlify doesn't treat it as a separate function).
 *
 * The serverless function imports this file instead of fetching at runtime.
 *
 * Usage: node scripts/generate-db-config.js
 * ENV: NEON_API_KEY
 */

const fs = require('fs');
const path = require('path');

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const PROJECT_ID = 'raspy-star-93431686';
const BRANCH_ID = 'br-wispy-dew-abytefxv';
const ROLE_NAME = 'neondb_owner';
const HOST = 'ep-old-star-abhpdbpp-pooler.eu-west-2.aws.neon.tech';

async function main() {
  let apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    const keyFile = path.resolve('/opt/data/.neon-api-key');
    if (fs.existsSync(keyFile)) {
      apiKey = fs.readFileSync(keyFile, 'utf8').trim();
    }
  }
  if (!apiKey) {
    console.error('ERROR: NEON_API_KEY not set and .neon-api-key not found.');
    process.exit(1);
  }

  const pwUrl = NEON_API_BASE + '/projects/' + PROJECT_ID + '/branches/' + BRANCH_ID + '/roles/' + ROLE_NAME + '/reveal_password';
  const pwRes = await fetch(pwUrl, {
    headers: { Authorization: 'Bearer ' + apiKey, Accept: 'application/json' },
  });

  if (!pwRes.ok) {
    const errText = await pwRes.text();
    console.error('ERROR: Failed to fetch DB password:', pwRes.status, errText);
    process.exit(1);
  }

  const data = await pwRes.json();
  const dbSecret = data['password'];
  const connStr = 'postgresql://neondb_owner:' + dbSecret + '@' + HOST + '/neondb?sslmode=require';

  // Write _db-config.js — simple CommonJS module
  const outputPath = path.resolve(__dirname, '..', 'netlify', 'functions', '_db-config.js');
  const lines = [
    '// Auto-generated — do not edit',
    '// prettier-ignore',
    'module.exports = {',
    '  databaseUrl: "' + connStr + '"',
    '};',
    ''
  ];
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log('✅ _db-config.js written to netlify/functions/');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
