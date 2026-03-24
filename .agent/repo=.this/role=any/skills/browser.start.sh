#!/usr/bin/env bash
######################################################################
# .what = start a persistent browser for test reuse
#
# .why  = enables browser to stay open across test crashes so that:
#         - human can inspect browser state after failure
#         - agent can take screenshots via browser.screenshot.sh
#         - tests can reconnect without cold start
#
# usage:
#   rhx browser.start --mode HEADFUL
#   rhx browser.start --mode HEADLESS
#   rhx browser.start --mode HEADFUL --session test1   # named session
#   rhx browser.start --mode HEADFUL --refresh         # kills extant browser first
#
# output:
#   writes wsEndpoint to .cache/browser.$session/ws-endpoint for auto-discovery
#
# guarantee:
#   - browser stays open until killed
#   - tests auto-discover via state file
#   - requires explicit --mode
######################################################################

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"

MODE=""
SESSION="default"
REFRESH=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode) MODE="$2"; shift 2 ;;
    --session) SESSION="$2"; shift 2 ;;
    --refresh) REFRESH="true"; shift ;;
    *) shift ;;
  esac
done

# require explicit mode
if [[ -z "$MODE" ]]; then
  echo "error: --mode required (HEADFUL or HEADLESS)" >&2
  echo "" >&2
  echo "usage:" >&2
  echo "  rhx browser.start --mode HEADFUL" >&2
  echo "  rhx browser.start --mode HEADLESS" >&2
  exit 1
fi

if [[ "$MODE" != "HEADFUL" && "$MODE" != "HEADLESS" ]]; then
  echo "error: --mode must be HEADFUL or HEADLESS, got: $MODE" >&2
  exit 1
fi

browser_init_session "$SESSION"
mkdir -p "$SESSION_DIR"

# user data dir for persistent profile (retains session cookies)
USER_DATA_DIR="$SESSION_DIR/profile"
mkdir -p "$USER_DATA_DIR/Default"

CDP_PORT=$(browser_cdp_port)

# write preferences to disable password prompts (only if not extant)
PREFS_FILE="$USER_DATA_DIR/Default/Preferences"
if [[ ! -f "$PREFS_FILE" ]]; then
  cat > "$PREFS_FILE" << 'PREFS_EOF'
{
  "credentials_enable_service": false,
  "profile": {
    "password_manager_enabled": false
  },
  "session": {
    "restore_on_startup": 4,
    "startup_urls": []
  }
}
PREFS_EOF
fi

# handle --refresh: kill extant browser if state file present
if [[ "$REFRESH" == "true" && -f "$WSENDPOINT_FILE" ]]; then
  EXTANT_ENDPOINT=$(cat "$WSENDPOINT_FILE")
  # extract port from ws://localhost:PORT/...
  EXTANT_PORT=$(echo "$EXTANT_ENDPOINT" | sed 's|ws://localhost:\([0-9]*\)/.*|\1|')
  if [[ -n "$EXTANT_PORT" ]]; then
    # kill process on that port
    fuser -k "$EXTANT_PORT/tcp" > /dev/null 2>&1 || true
  fi
  rm -f "$WSENDPOINT_FILE"
fi

# get playwright's bundled chromium path
CHROMIUM_PATH=$(npx playwright install chromium --dry-run 2>/dev/null | grep -oP 'chromium-\d+' | head -1)
if [[ -z "$CHROMIUM_PATH" ]]; then
  # fallback: find chromium in cache
  CHROMIUM_BIN=$(find ~/.cache/ms-playwright -name "chrome" -type f 2>/dev/null | head -1)
else
  CHROMIUM_BIN=$(find ~/.cache/ms-playwright -path "*$CHROMIUM_PATH*" -name "chrome" -type f 2>/dev/null | head -1)
fi

if [[ -z "$CHROMIUM_BIN" ]]; then
  echo "error: chromium not found. run: npx playwright install chromium" >&2
  exit 1
fi

# common flags to suppress notifications and prompts
CHROME_FLAGS=(
  --remote-debugging-port=$CDP_PORT
  --no-first-run
  --no-default-browser-check
  --user-data-dir="$USER_DATA_DIR"      # clean profile (no crash state)
  --disable-infobars                    # suppress "Google API keys" bar
  --disable-session-crashed-bubble      # suppress "Restore pages?" prompt
  --hide-crash-restore-bubble           # another way to suppress restore prompt
  --disable-features=Translate          # suppress translate prompts
  --disable-save-password-bubble        # suppress "Save password?" prompt
  --password-store=basic                # use basic store (no prompts)
)

# launch chromium directly (not via playwright) so it stays alive after skill exits
if [[ "$MODE" == "HEADLESS" ]]; then
  nohup "$CHROMIUM_BIN" --headless "${CHROME_FLAGS[@]}" > /dev/null 2>&1 &
else
  nohup "$CHROMIUM_BIN" "${CHROME_FLAGS[@]}" > /dev/null 2>&1 &
fi

# wait for CDP to be ready
for i in {1..30}; do
  if curl -s "http://localhost:$CDP_PORT/json/version" > /dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

# fetch ws endpoint
WS_ENDPOINT=$(curl -s "http://localhost:$CDP_PORT/json/version" | grep -oP '"webSocketDebuggerUrl"\s*:\s*"\K[^"]+')

if [[ -z "$WS_ENDPOINT" ]]; then
  echo "error: failed to get ws endpoint from CDP" >&2
  exit 1
fi

# write endpoint to state file
mkdir -p "$(dirname "$WSENDPOINT_FILE")"
echo "$WS_ENDPOINT" > "$WSENDPOINT_FILE"

echo "🐢 surfs up"
echo ""
echo "🐚 browser.start"
echo "   ├─ session: $SESSION"
echo "   ├─ mode: $MODE"
echo "   ├─ port: $CDP_PORT"
echo "   ├─ wsEndpoint: $WS_ENDPOINT"
echo "   ├─ state: $WSENDPOINT_FILE"
echo "   │"
echo "   ├─ tests will auto-discover and reuse this window"
echo "   │"
echo "   └─ to stop: rhx browser.stop --session $SESSION"
