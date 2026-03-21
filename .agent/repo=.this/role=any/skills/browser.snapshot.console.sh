#!/usr/bin/env bash
######################################################################
# .what = capture console log entries from browser tab
#
# .why  = JS errors and debug output for diagnosis
#
# .note = only captures NEW logs after listener attaches.
#         for extant pages, historical logs are not available.
#         trigger a page action to capture fresh logs.
#
# usage:
#   rhx browser.snapshot console --tab 0
#   rhx browser.snapshot console --tab 0 --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.console.json
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.console.json"

npx tsx -e "
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
  const contexts = browser.contexts();
  const pages = contexts[0].pages();

  const tabIndex = parseInt('$TAB_INDEX', 10);
  const pageIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;
  const page = pages[pageIndex];

  const standalone = '$STANDALONE_MODE' === 'true';

  await page.waitForLoadState('domcontentloaded').catch(() => {});

  // attach listener and capture any new logs
  const entries = [];
  page.on('console', (msg) => {
    entries.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
      location: msg.location() ? \`\${msg.location().url}:\${msg.location().lineNumber}\` : null,
    });
  });

  // trigger a small wait to capture any pending logs
  await page.waitForTimeout(100);

  // also capture any JS errors
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push({
      type: 'error',
      text: err.message,
      timestamp: new Date().toISOString(),
    });
  });

  const output = {
    note: 'only captures logs after listener attached; historical logs unavailable',
    entries,
    errors,
  };

  try {
    require('fs').writeFileSync('$OUTPUT_FILE', JSON.stringify(output, null, 2));
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot console');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.console.json');
    }
  } catch (e) {
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot console');
      console.log('   └─ ⚠ unavailable: ' + e.message);
    } else {
      console.log('   ├─ ⚠ snapshot.console.json (unavailable: ' + e.message + ')');
    }
  }

  await browser.close();
})();
"
