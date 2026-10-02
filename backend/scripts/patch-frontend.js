'use strict';

/**
 * patch-frontend.js — Update frontend/index.html and ref/index.html with the deployed contract address
 *
 * Usage:  node scripts/patch-frontend.js 0xYOUR_CONTRACT_ADDRESS
 *    or:  node scripts/patch-frontend.js   (reads from deployed.json or .env)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');

let contractAddress = process.argv[2];

// Try reading from deployed.json if no arg
if (!contractAddress) {
  const recPath = path.join(__dirname, '..', '..', 'deployed.json');
  if (fs.existsSync(recPath)) {
    try {
      contractAddress = JSON.parse(fs.readFileSync(recPath, 'utf8')).contractAddress;
    } catch (_) {}
  }
}

// Try reading from .env
if (!contractAddress) {
  contractAddress = process.env.GATEWAY_ADDRESS;
}

if (!contractAddress || contractAddress === 'PENDING_DEPLOY') {
  console.error('❌  No contract address found. Pass it as argument:');
  console.error('    node scripts/patch-frontend.js 0xYOUR_CONTRACT');
  process.exit(1);
}

const filesToPatch = [
  path.join(__dirname, '..', '..', 'frontend', 'index.html'),
  path.join(__dirname, '..', '..', 'frontend', 'ref', 'index.html'),
  path.join(__dirname, '..', '..', 'public', 'index.html'),
  path.join(__dirname, '..', '..', 'public', 'ref', 'index.html')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  const targetRegex = /const GATEWAY\s*=\s*["'](?:0x[a-fA-F0-9]{40}|0xYOUR_GATEWAY_ADDRESS_HERE)["']/;
  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, `const GATEWAY   = "${contractAddress}"`);
    fs.writeFileSync(filePath, content);
    console.log(`✅  Patched ${path.relative(path.join(__dirname, '..', '..'), filePath)} with GATEWAY = ${contractAddress}`);
  }
}
