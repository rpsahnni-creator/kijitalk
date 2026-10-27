const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const copies = [
  ['backend/.env.example', 'backend/.env'],
  ['frontend/.env.example', 'frontend/.env.local'],
  ['mobile/.env.example', 'mobile/.env'],
  ['speech-service/.env.example', 'speech-service/.env'],
];

for (const [from, to] of copies) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  if (!fs.existsSync(src)) continue;
  if (fs.existsSync(dest)) {
    console.log(`⏭️  Skip (exists): ${to}`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`✅ Created: ${to}`);
}

console.log('\n📝 Ab in files mein apni API keys bharein:');
console.log('   - backend/.env');
console.log('   - frontend/.env.local');
console.log('   - mobile/.env');
