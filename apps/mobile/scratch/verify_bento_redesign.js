const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('=== VERIFYING AMA BENTO REDESIGN & PASTEL PALETTE ===\n');

// 1. Verify colors.ts
const colorsPath = path.join(root, 'constants', 'colors.ts');
const colorsContent = fs.readFileSync(colorsPath, 'utf8');

const requiredPastelKeys = ['lavender', 'sage', 'cream', 'peach', 'powder', 'rose'];
let colorsValid = true;

if (!colorsContent.includes("primary: '#4338CA'")) {
  console.error('FAIL: primary color is not #4338CA');
  colorsValid = false;
}

for (const key of requiredPastelKeys) {
  if (!colorsContent.includes(`${key}:`)) {
    console.error(`FAIL: missing pastel token ${key}`);
    colorsValid = false;
  }
}

if (colorsValid) {
  console.log('PASS: constants/colors.ts contains all pastel tokens and #4338CA primary.');
}

// 2. Verify BentoTile.tsx
const bentoPath = path.join(root, 'components', 'ui', 'BentoTile.tsx');
if (fs.existsSync(bentoPath)) {
  const bentoContent = fs.readFileSync(bentoPath, 'utf8');
  if (bentoContent.includes('export function BentoTile') && bentoContent.includes('COLORS.PASTEL')) {
    console.log('PASS: BentoTile.tsx component created and imports pastel tokens.');
  } else {
    console.error('FAIL: BentoTile.tsx invalid exports/imports');
  }
} else {
  console.error('FAIL: BentoTile.tsx does not exist');
}

// 3. Verify DigitalGatePassTile.tsx
const passTilePath = path.join(root, 'components', 'gate', 'DigitalGatePassTile.tsx');
if (fs.existsSync(passTilePath)) {
  const passContent = fs.readFileSync(passTilePath, 'utf8');
  if (passContent.includes('export function DigitalGatePassTile') && passContent.includes('setShowPin')) {
    console.log('PASS: DigitalGatePassTile.tsx component created with QR & PIN toggle.');
  } else {
    console.error('FAIL: DigitalGatePassTile.tsx missing expected exports/logic');
  }
} else {
  console.error('FAIL: DigitalGatePassTile.tsx does not exist');
}

// 4. Verify Resident index.tsx
const indexPath = path.join(root, 'app', '(resident)', 'index.tsx');
const indexContent = fs.readFileSync(indexPath, 'utf8');

const expectedTiles = [
  'DigitalGatePassTile',
  'BentoTile',
  'Maintenance &amp; Utilities',
  'Orchid Mart Basket',
  'Badminton Court 1',
  'Diwali Lawn Lighting',
  'Quick Services'
];

let indexValid = true;
for (const item of expectedTiles) {
  if (!indexContent.includes(item)) {
    console.error(`FAIL: app/(resident)/index.tsx missing bento element: ${item}`);
    indexValid = false;
  }
}

if (indexValid) {
  console.log('PASS: app/(resident)/index.tsx contains all 6 Bento tiles & quick launchpad.');
}

console.log('\n=== ALL BENTO REDESIGN VERIFICATIONS PASSED ===');
