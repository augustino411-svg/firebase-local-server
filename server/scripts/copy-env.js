const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../.env');
const target = path.resolve(__dirname, '../dist/.env');

try {
  fs.copyFileSync(source, target);
  console.log('✅ .env copied to dist/.env');
} catch (err) {
  console.error('❌ Failed to copy .env:', err);
  process.exit(1);
}