#!/usr/bin/env bash
######################################################################
# .what = capture diagnostic snapshot of browser tab
#
# .why  = single command captures full debug context:
#         - screenshot, html, console, network, storage, metadata
#         - collocated files for easy correlation
#         - enables async debug (snapshot now, analyze later)
#
# usage:
#   rhx browser.snapshot --tab 0                   # all assets
#   rhx browser.snapshot screenshot --tab 0        # just screenshot
#   rhx browser.snapshot html --tab 0              # just html
#   rhx browser.snapshot meta --tab 0              # just metadata
#   rhx browser.snapshot console --tab 0           # just console
#   rhx browser.snapshot network --tab 0           # just network
#   rhx browser.snapshot storage --tab 0           # just storage
#   rhx browser.snapshot --tab 0 --session test1   # specific session
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
#   - fail-fast if no browser found
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/browser.lib.sh"

# parse args (strips rhachet passthrough flags)
SUBCOMMAND=""
TAB_INDEX=""
SESSION="default"
OUTPUT_PREFIX=""

while [[ $# -gt 0 ]]; do
  case $1 in
    # subcommands
    screenshot|screen|html|meta|console|network|storage)
      SUBCOMMAND="$1"
      shift
      ;;
    # known flags
    --tab) TAB_INDEX="$2"; shift 2 ;;
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

# require --tab
if [[ -z "$TAB_INDEX" ]]; then
  echo "error: --tab required" >&2
  echo "" >&2
  echo "usage:" >&2
  echo "  rhx browser.snapshot --tab 0              # all assets" >&2
  echo "  rhx browser.snapshot screenshot --tab 0   # just screenshot" >&2
  echo "  rhx browser.snapshot html --tab 0         # just html" >&2
  exit 1
fi

browser_init_session "$SESSION"
browser_require_endpoint
browser_validate_tab "$TAB_INDEX"
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
