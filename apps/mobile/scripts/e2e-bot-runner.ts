/**
 * AMA End-to-End Automated Verification Bot CLI Runner
 * Executes all 12 test suites (40+ scenarios) across Resident, Guard, Admin, and Vendor roles.
 */

// Module alias hook for Node.js execution: map 'react-native' to 'react-native-web'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'react-native') {
    return origResolveFilename.call(this, 'react-native-web', parent, isMain, options);
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};

// Polyfill for browser/mobile globals if running in pure Node.js CLI
if (typeof global !== 'undefined') {
  if (!global.window) (global as any).window = {};
  if (!global.navigator) (global as any).navigator = { userAgent: 'Node/AMA-Bot' };
}

import type { useTestBotStore as UseTestBotStoreType, TestSuite, TestScenario } from '../stores/testBotStore';

async function runCliBot() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useTestBotStore }: { useTestBotStore: typeof UseTestBotStoreType } = require('../stores/testBotStore');
  console.log('\n' + '='.repeat(78));
  console.log('🤖  AMA END-TO-END AUTOMATED TEST RUNNER & VERIFICATION BOT');
  console.log('='.repeat(78));
  console.log('Platform: Node.js / TypeScript (Headless CLI Mode)');
  console.log('Target: AMA SuperApp (Resident, Guard, President, Vendor)');
  console.log('Timestamp: ' + new Date().toISOString());
  console.log('-'.repeat(78) + '\n');

  const store = useTestBotStore.getState();
  const suites = store.suites;
  let totalScenarios = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let sIdx = 0; sIdx < suites.length; sIdx++) {
    const suite = suites[sIdx];
    console.log(`[Suite ${sIdx + 1}/${suites.length}] 📦 ${suite.name}`);
    console.log(`  ${suite.description}`);

    for (let scIdx = 0; scIdx < suite.scenarios.length; scIdx++) {
      const scenario = suite.scenarios[scIdx];
      process.stdout.write(`    (${scIdx + 1}/${suite.scenarios.length}) ${scenario.title}... `);

      const passed = await store.runScenario(scenario.id);
      totalScenarios++;

      // Read updated scenario from store
      const updatedSuite = useTestBotStore.getState().suites.find(s => s.id === suite.id);
      const updatedScenario = updatedSuite?.scenarios.find(s => s.id === scenario.id);

      if (passed) {
        totalPassed++;
        console.log(`\x1b[32mPASSED\x1b[0m (${updatedScenario?.durationMs || 0}ms)`);
        if (updatedScenario?.assertions) {
          for (const a of updatedScenario.assertions) {
            console.log(`        \x1b[32m✓\x1b[0m ${a.description}` + (a.details ? ` (\x1b[90m${a.details}\x1b[0m)` : ''));
          }
        }
      } else {
        totalFailed++;
        console.log(`\x1b[31mFAILED\x1b[0m (${updatedScenario?.durationMs || 0}ms)`);
        if (updatedScenario?.assertions) {
          for (const a of updatedScenario.assertions) {
            if (!a.passed) {
              console.log(`        \x1b[31m✗\x1b[0m ${a.description}` + (a.details ? ` (${a.details})` : ''));
            }
          }
        }
        if (updatedScenario?.error) {
          console.log(`        \x1b[31mError: ${updatedScenario.error}\x1b[0m`);
        }
      }
    }
    console.log('');
  }

  const durationSec = Math.round((Date.now() - startTime) / 100) / 10;

  console.log('='.repeat(78));
  console.log('📊  END-TO-END VERIFICATION SUMMARY REPORT');
  console.log('='.repeat(78));
  console.log(`Total Test Suites:       ${suites.length}`);
  console.log(`Total Scenarios Tested: ${totalScenarios}`);
  console.log(`Passed:                 \x1b[32m${totalPassed} (${Math.round((totalPassed / totalScenarios) * 100)}%)\x1b[0m`);
  console.log(`Failed:                 ` + (totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : `\x1b[32m0\x1b[0m`));
  console.log(`Total Execution Time:   ${durationSec}s`);
  console.log('='.repeat(78));

  if (totalFailed === 0) {
    console.log(`\n\x1b[32m🎉 ALL ${suites.length} SUITES / ${totalPassed} SCENARIOS PASSED WITH 100% SUCCESS RATE!\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\n\x1b[31m⚠️ ${totalFailed} SCENARIOS FAILED VERIFICATION.\x1b[0m\n`);
    process.exit(1);
  }
}

runCliBot().catch((err) => {
  console.error('Fatal Test Bot Error:', err);
  process.exit(1);
});
