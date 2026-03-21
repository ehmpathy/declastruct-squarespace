#!/usr/bin/env bash
######################################################################
# .what = capture screenshot of browser tab
#
# .why  = visual record of page state
#
# usage:
#   rhx browser.snapshot screen --tab 0
#   rhx browser.snapshot screen --tab 0 --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.png
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.png"

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
  try {
    await page.screenshot({ path: '$OUTPUT_FILE', fullPage: true });
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot screen');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.png');
    }
  } catch (e) {
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot screen');
      console.log('   └─ ⚠ unavailable: ' + e.message);
    } else {
      console.log('   ├─ ⚠ snapshot.png (' + e.message + ')');
    }
  }

  await browser.close();
})();
"
