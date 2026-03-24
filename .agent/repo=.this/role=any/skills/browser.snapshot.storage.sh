#!/usr/bin/env bash
######################################################################
# .what = capture localStorage and sessionStorage from browser tab
#
# .why  = storage state for auth and app state debug
#
# .pit-of-success:
#   requires both --tab AND --url to prevent wrong-tab mistakes.
#   if unsure which tab, run browser.describe first.
#
# usage:
#   rhx browser.snapshot storage --tab -1 --url 'account.squarespace.com/domains'
#   rhx browser.snapshot storage --tab -1 --url 'account.squarespace.com/domains' --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.storage.json
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.storage.json"

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
  const storage = await page.evaluate(() => {
    const getStorage = (store) => {
      const result = {};
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        result[key] = store.getItem(key);
      }
      return result;
    };

    return {
      localStorage: getStorage(localStorage),
      sessionStorage: getStorage(sessionStorage),
    };
  });

  try {
    require('fs').writeFileSync('$OUTPUT_FILE', JSON.stringify(storage, null, 2));
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot storage');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.storage.json');
    }
  } catch (e) {
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot storage');
      console.log('   └─ ⚠ unavailable: ' + e.message);
    } else {
      console.log('   ├─ ⚠ snapshot.storage.json (unavailable: ' + e.message + ')');
    }
  }

  await browser.close();
})();
"
