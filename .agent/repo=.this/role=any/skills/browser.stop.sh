#!/usr/bin/env bash
######################################################################
# .what = stop the persistent browser started via browser.start
#
# .why  = clean shutdown of browser and state file
#
# usage:
#   rhx browser.stop
#   rhx browser.stop --session test1   # specific session
#
# guarantee:
#   - kills browser process on CDP port
#   - removes state file
#   - idempotent (safe to run if browser already stopped)
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
CDP_PORT=$(browser_cdp_port)

# determine status before action
BROWSER_ACTIVE=""
if fuser "$CDP_PORT/tcp" > /dev/null 2>&1; then
  BROWSER_ACTIVE="true"
fi

# kill browser on CDP port
if [[ -n "$BROWSER_ACTIVE" ]]; then
  fuser -k "$CDP_PORT/tcp" > /dev/null 2>&1 || true
fi

# clean up state file
STATE_FILE_REMOVED=""
if [[ -f "$WSENDPOINT_FILE" ]]; then
  rm -f "$WSENDPOINT_FILE"
  STATE_FILE_REMOVED="true"
fi

# turtle shell header
echo "🐢 later dude"
echo ""
echo "🐚 browser.stop"
echo "   ├─ session: $SESSION"
echo "   ├─ port: $CDP_PORT"
echo "   │"
if [[ -n "$BROWSER_ACTIVE" ]]; then
  echo "   ├─ browser: stopped"
else
  echo "   ├─ browser: no browser found"
fi
if [[ -n "$STATE_FILE_REMOVED" ]]; then
  echo "   └─ state: removed"
else
  echo "   └─ state: no state file"
fi
