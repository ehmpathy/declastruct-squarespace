#!/usr/bin/env bash
######################################################################
# .what = describe tabs open in the persistent browser
#
# .why  = enables agent to see what tabs exist before screenshot:
#         - know which --tab index to use
#         - verify test navigated to correct page
#         - debug tab state
#
# usage:
#   rhx browser.describe
#   rhx browser.describe --session test1   # specific session
#
# output:
#   lists all tabs with index and url
#
# prereq:
#   browser must be started via browser.start skill
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

SESSION="default"
while [[ $# -gt 0 ]]; do
  case $1 in
    --session) SESSION="$2"; shift 2 ;;
    *) shift ;;
  esac
done

browser_init_session "$SESSION"
browser_require_endpoint

# describe tabs via inline node executable
npx tsx -e "
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
  const contexts = browser.contexts();

  if (contexts.length === 0) {
    console.log('🐢 gnarly');
    console.log('');
    console.log('🐚 browser.describe');
    console.log('   ├─ session: $SESSION');
    console.log('   │');
    console.log('   └─ no browser contexts found');
    process.exit(0);
  }

  const pages = contexts[0].pages();

  console.log('🐢 gnarly');
  console.log('');
  console.log('🐚 browser.describe');
  console.log('   ├─ session: $SESSION');
  console.log('   ├─ tabs: ' + pages.length);
  console.log('   │');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const isLast = i === pages.length - 1;
    const prefix = isLast ? '   └─' : '   ├─';
    const indent = isLast ? '      ' : '   │  ';
    try {
      const title = await page.title();
      const url = page.url();
      console.log(prefix + ' [' + i + '] ' + (title || '(no title)'));
      console.log(indent + url);
    } catch {
      console.log(prefix + ' [' + i + '] (page unavailable)');
      console.log(indent + '(context destroyed)');
    }
  }

  await browser.close();
})();
"
