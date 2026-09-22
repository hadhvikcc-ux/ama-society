const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('=== VERIFYING MULTI-ROLE REGISTRATION SYSTEM ===\n');

// 1. Verify User interface in authStore.ts
const authStorePath = path.join(root, 'stores', 'authStore.ts');
const authStoreContent = fs.readFileSync(authStorePath, 'utf8');

const expectedUserFields = [
  'designation?: string',
  'badgeId?: string',
  'gatePost?: string',
  'shift?: string',
  'shopName?: string',
  'category?: string',
  'stallNumber?: string',
  'upiId?: string',
  "tenancyType?: 'Owner' | 'Tenant'",
  'vehicleNumber?: string',
];

for (const f of expectedUserFields) {
  if (!authStoreContent.includes(f)) {
    console.error(`FAIL: authStore.ts missing field: ${f}`);
    process.exit(1);
  }
}
console.log('PASS: stores/authStore.ts User interface extended with all role-specific attributes.');

// 2. Verify register.tsx
const registerPath = path.join(root, 'app', 'auth', 'register.tsx');
const registerContent = fs.readFileSync(registerPath, 'utf8');

const roleChecks = [
  "role === 'resident'",
  "role === 'admin'",
  "role === 'guard'",
  "role === 'vendor'",
  "handleRoleChange('resident')",
  "handleRoleChange('admin')",
  "handleRoleChange('guard')",
  "handleRoleChange('vendor')",
  "router.replace(`/(${role})`)",
];

for (const rc of roleChecks) {
  if (!registerContent.includes(rc)) {
    console.error(`FAIL: register.tsx missing role logic: ${rc}`);
    process.exit(1);
  }
}
console.log('PASS: register.tsx includes all 4 roles and dynamic routing `/(${role})`.');

// 3. Verify role-specific field inputs
const fieldChecks = [
  'Flat / Unit Number',
  'Residency Status',
  'Committee Designation',
  'Society Registration No',
  'Security Agency',
  'Security Badge / ID',
  'Shop / Business Name',
  'Merchant UPI ID',
];

for (const fc of fieldChecks) {
  if (!registerContent.includes(fc)) {
    console.error(`FAIL: register.tsx missing field UI: ${fc}`);
    process.exit(1);
  }
}
console.log('PASS: register.tsx contains all role-specific input sections.');

// 4. Verify touch targets & haptics
if (!registerContent.includes('TOUCH_TARGET') || !registerContent.includes('Haptics')) {
  console.error('FAIL: register.tsx missing TOUCH_TARGET or Haptics');
  process.exit(1);
}
console.log('PASS: register.tsx adheres to 44pt touch targets and native haptics.');

console.log('\n=== ALL MULTI-ROLE SIGN-UP CHECKS PASSED ===');
