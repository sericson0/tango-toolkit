/**
 * Validates that all required environment variables are set before build.
 * Run with: node scripts/validate-env.mjs
 */

const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'HISSTORY_KEYGEN_SECRET',
  'HISSTORY_STRIPE_PRICE_ID',
  'TIGERTAG_KEYGEN_SECRET',
  'TIGERTAG_STRIPE_PRICE_ID',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_AUDIENCE_ID',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n\x1b[31mMissing required environment variables:\x1b[0m');
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error('\nSee .env.example for the full list.\n');
  process.exit(1);
}

console.log('\x1b[32m✓ All required environment variables are set.\x1b[0m');
