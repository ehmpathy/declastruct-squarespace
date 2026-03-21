#!/usr/bin/env bash
######################################################################
# .what = shared library for browser skills
#
# .why  = DRY: common session/endpoint/output logic in one place
#
# usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/browser.lib.sh"
#   browser_init_session "mysession"
#   browser_require_endpoint
#   browser_init_output 0
######################################################################

# session cache directory (CACHE_ROOT overridable for tests)
browser_init_session() {
  local session="${1:-default}"
  CACHE_ROOT="${CACHE_ROOT:-.cache}"
  SESSION="$session"
  SESSION_DIR="$CACHE_ROOT/browser.$SESSION"
  WSENDPOINT_FILE="$SESSION_DIR/ws-endpoint"
}

# auto-discover browser ws endpoint from state file
browser_discover_endpoint() {
  if [[ -z "${BROWSER_WS_ENDPOINT:-}" && -f "$WSENDPOINT_FILE" ]]; then
    BROWSER_WS_ENDPOINT=$(cat "$WSENDPOINT_FILE")
  fi
}

# require BROWSER_WS_ENDPOINT or fail
browser_require_endpoint() {
  browser_discover_endpoint
  if [[ -z "${BROWSER_WS_ENDPOINT:-}" ]]; then
    echo "error: no browser found" >&2
    echo "" >&2
    echo "start a browser first:" >&2
    echo "  rhx browser.start --mode HEADFUL" >&2
    exit 1
  fi
}

# generate output prefix with timestamp
browser_init_output() {
  local tab_index="$1"
  if [[ -z "${OUTPUT_PREFIX:-}" ]]; then
    ISOTIME=$(date -u +%Y%m%dT%H%M%SZ)
    OUTPUT_PREFIX="$SESSION_DIR/snapshot.$ISOTIME.tab$tab_index"
    mkdir -p "$OUTPUT_PREFIX"
  fi
}

# validate tab index exists
browser_validate_tab() {
  local tab_index="$1"
  local tab_count
  tab_count=$(NO_COLOR=1 FORCE_COLOR=0 node --no-warnings -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
      const contexts = browser.contexts();
      const pages = contexts.flatMap(c => c.pages());
      process.stdout.write(String(pages.length));
      await browser.close();
    })().catch(() => process.stdout.write('0'));
  " 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g')
  if [[ "$tab_index" -ge "$tab_count" ]]; then
    echo "error: tab $tab_index not found" >&2
    echo "" >&2
    echo "available tabs: 0-$((tab_count - 1))" >&2
    exit 1
  fi
}

# derive CDP port from session name hash (9222-9999 range)
browser_cdp_port() {
  local session="${1:-$SESSION}"
  local hash=$(echo -n "$session" | md5sum | cut -c1-4)
  echo $((9222 + (16#$hash % 778)))
}

# parse common snapshot subcommand args
# sets: TAB_INDEX, OUTPUT_PREFIX, SESSION, STANDALONE_MODE
browser_parse_snapshot_args() {
  STANDALONE_MODE=""
  if [[ -z "${TAB_INDEX:-}" ]]; then
    STANDALONE_MODE="true"
    while [[ $# -gt 0 ]]; do
      case $1 in
        --tab) TAB_INDEX="$2"; shift 2 ;;
        --output) OUTPUT_PREFIX="$2"; shift 2 ;;
        --session) SESSION="$2"; shift 2 ;;
        *) shift ;;
      esac
    done

    # require --tab in standalone mode
    if [[ -z "${TAB_INDEX:-}" ]]; then
      echo "error: --tab required" >&2
      echo "" >&2
      echo "usage:" >&2
      echo "  rhx browser.snapshot --tab 0              # all assets" >&2
      echo "  rhx browser.snapshot screenshot --tab 0   # just screenshot" >&2
      echo "  rhx browser.snapshot html --tab 0         # just html" >&2
      exit 1
    fi

    browser_init_session "${SESSION:-default}"
    browser_require_endpoint
    browser_validate_tab "$TAB_INDEX"
    browser_init_output "$TAB_INDEX"
  fi
}
