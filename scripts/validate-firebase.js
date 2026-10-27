/**
 * Validates Firebase env configuration
 * Run: node scripts/validate-firebase.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../frontend/.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ frontend/.env.local missing!');
  console.log('Run: powershell -File scripts/configure-firebase.ps1');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const keys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

let ok = true;
for (const key of keys) {
  const match = content.match(new RegExp(`${key}=(.+)`));
  const value = match?.[1]?.trim() ?? '';
  const placeholder = value.includes('your_') || value.includes('123456789');
  if (!value || placeholder) {
    console.error(`❌ ${key} — not configured`);
    ok = false;
  } else {
    console.log(`✅ ${key}`);
  }
}

if (ok) {
  console.log('\n✅ Firebase frontend config OK!');
  console.log('Restart frontend: cd frontend && npm run dev');
} else {
  console.log('\n⚠️  Run: scripts\\configure-firebase.bat');
  process.exit(1);
}
