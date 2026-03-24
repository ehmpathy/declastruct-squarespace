#!/usr/bin/env bash
######################################################################
# .what = capture HTML source of browser tab
#
# .why  = DOM state for selector debug
#
# .pit-of-success:
#   requires both --tab AND --url to prevent wrong-tab mistakes.
#   if unsure which tab, run browser.describe first.
#
# usage:
#   rhx browser.snapshot html --tab -1 --url 'account.squarespace.com/domains'
#   rhx browser.snapshot html --tab -1 --url 'account.squarespace.com/domains' --output .temp/debug
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

  // try page.content() first, fallback to evaluate innerHTML
  let html = null;
  let error = null;

  try {
    html = await page.content();
  } catch (e) {
    error = e;
  }

  // fallback: grab innerHTML directly via evaluate (works even when page.content() fails)
  if (!html) {
    try {
      html = await page.evaluate(() => document.documentElement.outerHTML);
    } catch (e2) {
      error = error || e2;
    }
  }

  if (html) {
    require('fs').writeFileSync('$OUTPUT_FILE', html);
    if (standalone) {
      console.log('🐢 cool');
      console.log('');
      console.log('🐚 browser.snapshot html');
      console.log('   └─ $OUTPUT_FILE');
    } else {
      console.log('   ├─ ✓ snapshot.html');
    }
  } else {
    require('fs').writeFileSync('$OUTPUT_FILE', '<!-- content unavailable: ' + (error ? error.message : 'unknown') + ' -->');
    if (standalone) {
      console.log('🐢 bummer dude');
      console.log('');
      console.log('🐚 browser.snapshot html');
      console.log('   └─ ⚠ unavailable: ' + (error ? error.message : 'unknown'));
    } else {
      console.log('   ├─ ⚠ snapshot.html (content unavailable)');
    }
  }

  await browser.close();
})();
"
