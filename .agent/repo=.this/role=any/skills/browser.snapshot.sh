#!/usr/bin/env bash
######################################################################
# .what = capture diagnostic snapshot of browser tab
#
# .why  = single command captures full debug context:
#         - screenshot, html, console, network, storage, metadata
#         - collocated files for easy correlation
#         - enables async debug (snapshot now, analyze later)
#
# .pit-of-success:
#   requires --focused OR (--tab AND --url) to prevent wrong-tab mistakes.
#   if unsure which tab, run browser.describe first.
#
# .important:
#   --tab N    = ABSOLUTE index (tab 4 means the 4th tab, period)
#   --url 'x'  = VERIFICATION key (asserts tab N has this URL, fails if not)
#   --url is NOT a filter; it does NOT search for tabs that match the URL
#
# usage:
#   rhx browser.snapshot --focused                                               # snapshot focused tab
#   rhx browser.snapshot --tab -1 --url 'account.squarespace.com/domains'        # snapshot by index
#   rhx browser.snapshot screen --focused                                        # just screenshot
#
# output:
#   .cache/browser.$session/snapshot.$isotime.tab$tab/
#   ├── snapshot.meta.json
#   ├── snapshot.png
#   ├── snapshot.html
#   ├── snapshot.console.json
#   ├── snapshot.network.json
#   └── snapshot.storage.json
#
# guarantee:
#   - auto-discovers browser from state file
#   - fail-fast if --tab not supplied
#   - fail-fast if --url not supplied (run browser.describe first)
#   - fail-fast if tab URL doesn't match --url
#   - fail-fast if no browser found
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/browser.lib.sh"

# parse args (strips rhachet passthrough flags)
SUBCOMMAND=""
TAB_INDEX=""
EXPECTED_URL=""
SESSION="default"
OUTPUT_PREFIX=""
USE_FOCUSED_TAB=""

while [[ $# -gt 0 ]]; do
  case $1 in
    # subcommands
    screenshot|screen|html|meta|console|network|storage)
      SUBCOMMAND="$1"
      shift
      ;;
    # known flags
    --tab) TAB_INDEX="$2"; shift 2 ;;
    --focused) USE_FOCUSED_TAB="true"; shift ;;
    --url) EXPECTED_URL="$2"; shift 2 ;;
    --session) SESSION="$2"; shift 2 ;;
    --output) OUTPUT_PREFIX="$2"; shift 2 ;;
    # rhachet passthrough args - ignore
    --repo|--role|--skill|--local|--global)
      shift
      # if next arg exists and is not a flag, skip it too
      if [[ $# -gt 0 && "$1" != --* && "$1" != -* ]]; then
        shift
      fi
      ;;
    --) shift ;;
    *) shift ;;
  esac
done

# require --focused OR (--tab + --url)
if [[ -z "$TAB_INDEX" && -z "$USE_FOCUSED_TAB" ]]; then
  echo "error: --focused OR (--tab + --url) required" >&2
  echo "" >&2
  echo "usage:" >&2
  echo "  rhx browser.snapshot --focused                     # snapshot focused tab" >&2
  echo "  rhx browser.snapshot --tab 0 --url 'example.com'   # snapshot by index" >&2
  exit 1
fi

browser_init_session "$SESSION"
browser_require_endpoint

# if --focused, find the focused tab
if [[ -n "$USE_FOCUSED_TAB" ]]; then
  TAB_INDEX=$(browser_find_focused_tab)
  if [[ -z "$TAB_INDEX" || "$TAB_INDEX" == "-1" ]]; then
    echo "error: no focused tab found" >&2
    exit 1
  fi
  EXPECTED_URL=$(browser_get_tab_url "$TAB_INDEX")
else
  # require --url with --tab
  if [[ -z "$EXPECTED_URL" ]]; then
    echo "error: --url required with --tab" >&2
    echo "" >&2
    echo "run browser.describe to find the tab:" >&2
    echo "  rhx browser.describe" >&2
    echo "" >&2
    echo "or use --focused:" >&2
    echo "  rhx browser.snapshot --focused" >&2
    exit 1
  fi
  browser_validate_tab "$TAB_INDEX"
  browser_verify_tab_url "$TAB_INDEX" "$EXPECTED_URL"
fi

browser_init_output "$TAB_INDEX"

# export for sub-scripts
export BROWSER_WS_ENDPOINT
export TAB_INDEX
export OUTPUT_PREFIX

# map subcommand aliases
case "$SUBCOMMAND" in
  screenshot) SUBCOMMAND="screen" ;;
esac

# run subcommand or all
if [[ -n "$SUBCOMMAND" ]]; then
  # run single sub-skill
  bash "$SCRIPT_DIR/browser.snapshot.$SUBCOMMAND.sh"
else
  # run all sub-skills
  echo "🐢 sweet"
  echo ""
  echo "🐚 browser.snapshot"
  echo "   ├─ session: $SESSION"
  echo "   ├─ tab: $TAB_INDEX"
  echo "   │"

  bash "$SCRIPT_DIR/browser.snapshot.meta.sh"
  bash "$SCRIPT_DIR/browser.snapshot.screen.sh"
  bash "$SCRIPT_DIR/browser.snapshot.html.sh"
  bash "$SCRIPT_DIR/browser.snapshot.console.sh"
  bash "$SCRIPT_DIR/browser.snapshot.storage.sh"
  bash "$SCRIPT_DIR/browser.snapshot.network.sh"

  echo "   │"
  echo "   ├─ output"
  files=("$OUTPUT_PREFIX/"*)
  count=${#files[@]}
  for i in "${!files[@]}"; do
    if [[ $i -eq $((count - 1)) ]]; then
      echo "   │  └─ ${files[$i]}"
    else
      echo "   │  ├─ ${files[$i]}"
    fi
  done
  echo "   │"
  echo "   └─ done"
fi
