#!/usr/bin/env bash
######################################################################
# .what = capture network requests from browser tab
#
# .why  = HAR data for API debug and replay
#
# .pit-of-success:
#   requires both --tab AND --url to prevent wrong-tab mistakes.
#   if unsure which tab, run browser.describe first.
#
# .note = only captures NEW requests after listener attaches.
#         for extant pages, historical requests are not available.
#         trigger a page action to capture fresh requests.
#
# usage:
#   rhx browser.snapshot network --tab -1 --url 'account.squarespace.com/domains'
#   rhx browser.snapshot network --tab -1 --url 'account.squarespace.com/domains' --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.network.json
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.network.json"

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

  // collect recent requests from page (limited to what we can access)
  const requests = [];

  try {
    // get performance entries if available
    const entries = await page.evaluate(() => {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        return performance.getEntriesByType('resource').map(e => ({
          name: e.name,
          type: e.initiatorType,
          duration: e.duration,
          size: e.transferSize || 0,
        }));
      }
      return [];
    });

    const output = {
      note: 'captures performance resource entries; for full HAR, use page.routeFromHAR',
      url: page.url(),
      entries,
    };

    require('fs').writeFileSync('$OUTPUT_FILE', JSON.stringify(output, null, 2));
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot network');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.network.json');
    }
  } catch (e) {
    const output = {
      note: 'network data unavailable: ' + e.message,
      entries: [],
    };
    require('fs').writeFileSync('$OUTPUT_FILE', JSON.stringify(output, null, 2));
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot network');
      console.log('   └─ ⚠ unavailable: ' + e.message);
    } else {
      console.log('   ├─ ⚠ snapshot.network.json (unavailable)');
    }
  }

  await browser.close();
})();
"
