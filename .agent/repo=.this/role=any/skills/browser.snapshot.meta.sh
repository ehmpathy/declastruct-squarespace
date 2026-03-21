#!/usr/bin/env bash
######################################################################
# .what = capture tab metadata (url, title, viewport)
#
# .why  = context for snapshot interpretation
#
# usage:
#   rhx browser.snapshot meta --tab 0
#   rhx browser.snapshot meta --tab 0 --output .temp/debug
#
# output:
#   $OUTPUT_PREFIX/snapshot.meta.json
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.meta.json"

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
  const meta = {
    url: page.url(),
    title: await page.title().catch(() => '(unavailable)'),
    viewport: page.viewportSize(),
    timestamp: new Date().toISOString(),
    tabIndex: pageIndex,
    tabCount: pages.length,
  };

  require('fs').writeFileSync('$OUTPUT_FILE', JSON.stringify(meta, null, 2));

  if (standalone) {
    console.log('🐢 cool');
    console.log('');
    console.log('🐚 browser.snapshot meta');
    console.log('   └─ $OUTPUT_FILE');
  } else {
    console.log('   ├─ ✓ snapshot.meta.json');
  }

  await browser.close();
})();
"
