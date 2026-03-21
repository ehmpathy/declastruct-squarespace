#!/usr/bin/env bash
######################################################################
# .what = capture HTML source of browser tab
#
# .why  = DOM state for selector debug
#
# usage:
#   rhx browser.snapshot html --tab 0
#   rhx browser.snapshot html --tab 0 --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.html
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.html"

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
    const html = await page.content();
    require('fs').writeFileSync('$OUTPUT_FILE', html);
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot html');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.html');
    }
  } catch (e) {
    require('fs').writeFileSync('$OUTPUT_FILE', '<!-- content unavailable: ' + e.message + ' -->');
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot html');
      console.log('   └─ ⚠ unavailable: ' + e.message);
    } else {
      console.log('   ├─ ⚠ snapshot.html (content unavailable)');
    }
  }

  await browser.close();
})();
"
