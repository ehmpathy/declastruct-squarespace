#!/usr/bin/env bash
######################################################################
# .what = execute browser playbooks (.play.ts files)
#
# .why  = enables reusable, versionable browser automation sequences:
#         - playbooks are TypeScript files with full playwright access
#         - stored in .play/ for permanence and reuse
#         - can be complex multi-step sequences
#
# usage:
#   rhx browser.action --play .play/permanent/open-domains-click-first.play.ts
#   rhx browser.action --play .play/permanent/navigate-to-dns-settings.play.ts
#
# playbook format (.play.ts):
#   import type { Page, Browser } from 'playwright';
#   export const action = async (input: { page: Page; browser: Browser }) => {
#     await input.page.goto('https://example.com');
#     await input.page.click('button');
#     return { success: true };
#   };
#
# guarantee:
#   - auto-discovers browser from state file
#   - fail-fast if no browser found
#   - fail-fast if playbook not found
#   - uses tab 0 by default (override with --tab)
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/browser.lib.sh"

# parse args
PLAYBOOK=""
TAB_INDEX="0"
SESSION="default"

while [[ $# -gt 0 ]]; do
  case $1 in
    --play) PLAYBOOK="$2"; shift 2 ;;
    --tab) TAB_INDEX="$2"; shift 2 ;;
    --session) SESSION="$2"; shift 2 ;;
    # rhachet passthrough args - ignore
    --repo|--role|--skill|--local|--global)
      shift
      if [[ $# -gt 0 && "$1" != --* && "$1" != -* ]]; then
        shift
      fi
      ;;
    --) shift ;;
    *) shift ;;
  esac
done

# require --play
if [[ -z "$PLAYBOOK" ]]; then
  echo "error: --play required" >&2
  echo "" >&2
  echo "usage:" >&2
  echo "  rhx browser.action --play .play/permanent/my-playbook.play.ts" >&2
  echo "  rhx browser.action --play .play/permanent/my-playbook.play.ts --tab 2" >&2
  echo "" >&2
  echo "playbook format (.play.ts):" >&2
  echo "  import type { Page, Browser } from 'playwright';" >&2
  echo "  export const action = async (input: { page: Page; browser: Browser }) => {" >&2
  echo "    await input.page.goto('https://example.com');" >&2
  echo "    return { success: true };" >&2
  echo "  };" >&2
  exit 1
fi

# require playbook file exists
if [[ ! -f "$PLAYBOOK" ]]; then
  echo "error: playbook not found: $PLAYBOOK" >&2
  exit 1
fi

browser_init_session "$SESSION"
browser_require_endpoint

# run playbook via tsx
echo "🐢 run playbook"
echo "   ├─ file: $PLAYBOOK"
echo "   ├─ tab: $TAB_INDEX"
echo "   │"

NO_COLOR=1 FORCE_COLOR=0 npx tsx -e "
  import { chromium } from 'playwright';
  import { action } from './$PLAYBOOK';

  (async () => {
    const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
    const contexts = browser.contexts();
    const pages = contexts.flatMap(c => c.pages());
    const page = pages[$TAB_INDEX];
    if (!page) {
      console.error('   └─ error: tab $TAB_INDEX not found');
      process.exit(1);
    }
    console.log('   ├─ url before: ' + page.url());

    const result = await action({ page, browser });

    console.log('   ├─ url after: ' + page.url());
    if (result) {
      console.log('   ├─ result: ' + JSON.stringify(result));
    }
    console.log('   └─ done');

    await browser.close();
  })().catch(e => {
    console.error('   └─ error: ' + e.message);
    process.exit(1);
  });
"
