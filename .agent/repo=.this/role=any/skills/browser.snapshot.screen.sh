#!/usr/bin/env bash
######################################################################
# .what = capture screenshot of browser tab
#
# .why  = visual record of page state
#
# .pit-of-success:
#   requires both --tab AND --url to prevent wrong-tab mistakes.
#   if unsure which tab, run browser.describe first.
#
# usage:
#   rhx browser.snapshot screen --tab -1 --url 'account.squarespace.com/domains'
#   rhx browser.snapshot screen --tab -1 --url 'account.squarespace.com/domains' --await domcontentloaded
#   rhx browser.snapshot screen --tab -1 --url 'account.squarespace.com/domains' --output .temp/debug
#
# flags:
#   --await <state>   wait for page state before capture (default: none)
#                     values: domcontentloaded, load, networkidle
#
# output:
#   $OUTPUT_PREFIX/snapshot.png
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

browser_parse_snapshot_args "$@"
OUTPUT_FILE="$OUTPUT_PREFIX/snapshot.png"

PW_TEST_SCREENSHOT_NO_FONTS_READY=1 npx tsx -e "
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
  const contexts = browser.contexts();
  const pages = contexts[0].pages();

  const tabIndex = parseInt('$TAB_INDEX', 10);
  const pageIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;
  const page = pages[pageIndex];

  const standalone = '$STANDALONE_MODE' === 'true';
  const awaitState = '$AWAIT_STATE';

  try {
    // optionally wait for page state if --await provided
    if (awaitState) {
      await page.waitForLoadState(awaitState);
    }

    // bring page to front to ensure it's not throttled by Chrome
    await page.bringToFront();

    // use playwright screenshot with disabled animations to avoid font/animation waits
    // .note - disabling caret helps avoid cursor animation issues
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.dirname('$OUTPUT_FILE');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    await page.screenshot({
      path: '$OUTPUT_FILE',
      timeout: 30000,
      caret: 'hide',
      animations: 'disabled',
    });
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
