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
# .note - --tab is ABSOLUTE position in pages array
# .note - --url is VERIFICATION only (not a filter to find tabs)
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

  # compute absolute index (handle negative indices)
  local abs_index="$tab_index"
  if [[ "$tab_index" -lt 0 ]]; then
    abs_index=$((tab_count + tab_index))
  fi

  # validate absolute index is in bounds
  if [[ "$abs_index" -lt 0 || "$abs_index" -ge "$tab_count" ]]; then
    echo "error: tab $tab_index out of bounds (computed absolute index: $abs_index)" >&2
    echo "" >&2
    echo "available tabs: 0 to $((tab_count - 1)) (or -1 to -$tab_count)" >&2
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
# sets: TAB_INDEX, OUTPUT_PREFIX, SESSION, STANDALONE_MODE, AWAIT_STATE, EXPECTED_URL, USE_FOCUSED_TAB
browser_parse_snapshot_args() {
  STANDALONE_MODE=""
  AWAIT_STATE=""
  EXPECTED_URL=""
  USE_FOCUSED_TAB=""
  if [[ -z "${TAB_INDEX:-}" ]]; then
    STANDALONE_MODE="true"
    while [[ $# -gt 0 ]]; do
      case $1 in
        --tab) TAB_INDEX="$2"; shift 2 ;;
        --focused) USE_FOCUSED_TAB="true"; shift ;;
        --output) OUTPUT_PREFIX="$2"; shift 2 ;;
        --session) SESSION="$2"; shift 2 ;;
        --await) AWAIT_STATE="$2"; shift 2 ;;
        --url) EXPECTED_URL="$2"; shift 2 ;;
        *) shift ;;
      esac
    done

    # require --tab+--url OR --focused
    if [[ -z "${TAB_INDEX:-}" && -z "${USE_FOCUSED_TAB:-}" ]]; then
      echo "error: --focused OR (--tab + --url) required" >&2
      echo "" >&2
      echo "usage:" >&2
      echo "  rhx browser.snapshot --focused                     # snapshot focused tab" >&2
      echo "  rhx browser.snapshot --tab 0 --url 'example.com'   # snapshot by index" >&2
      exit 1
    fi

    browser_init_session "${SESSION:-default}"
    browser_require_endpoint

    # if --focused, find the focused tab
    if [[ -n "${USE_FOCUSED_TAB:-}" ]]; then
      TAB_INDEX=$(browser_find_focused_tab)
      if [[ -z "$TAB_INDEX" || "$TAB_INDEX" == "-1" ]]; then
        echo "error: no focused tab found" >&2
        exit 1
      fi
      # get the URL of the focused tab for output
      EXPECTED_URL=$(browser_get_tab_url "$TAB_INDEX")
    else
      # require --url with --tab (pit-of-success)
      if [[ -z "${EXPECTED_URL:-}" ]]; then
        echo "error: --url required with --tab" >&2
        echo "" >&2
        echo "run browser.describe to find the tab:" >&2
        echo "  rhx browser.describe" >&2
        echo "" >&2
        echo "or use --focused to snapshot the focused tab:" >&2
        echo "  rhx browser.snapshot --focused" >&2
        exit 1
      fi
      browser_validate_tab "$TAB_INDEX"
      browser_verify_tab_url "$TAB_INDEX" "$EXPECTED_URL"
    fi

    browser_init_output "$TAB_INDEX"
  fi
}

# find the focused tab index
browser_find_focused_tab() {
  node --no-warnings -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
      const contexts = browser.contexts();
      const pages = contexts.flatMap(c => c.pages());

      // find the page with focus
      for (let i = 0; i < pages.length; i++) {
        try {
          const hasFocus = await pages[i].evaluate(() => document.hasFocus());
          if (hasFocus) {
            process.stdout.write(String(i));
            await browser.close();
            return;
          }
        } catch {}
      }

      // fallback: return last page
      process.stdout.write(String(pages.length - 1));
      await browser.close();
    })().catch(() => process.stdout.write('-1'));
  " 2>/dev/null
}

# get URL of a specific tab
browser_get_tab_url() {
  local tab_index="$1"
  node --no-warnings -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
      const contexts = browser.contexts();
      const pages = contexts.flatMap(c => c.pages());
      const tabIndex = parseInt('$tab_index', 10);
      const pageIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;
      const page = pages[pageIndex];
      process.stdout.write(page ? page.url().replace('https://', '') : '');
      await browser.close();
    })().catch(() => {});
  " 2>/dev/null
}

# verify tab URL matches expected (VERIFICATION, not filter)
# .note - --url is a VERIFICATION KEY to confirm you have the right tab
# .note - --url does NOT search/filter tabs; --tab is the ABSOLUTE index
browser_verify_tab_url() {
  local tab_index="$1"
  local expected_url="$2"
  local actual_url
  actual_url=$(NO_COLOR=1 FORCE_COLOR=0 node --no-warnings -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.connectOverCDP('$BROWSER_WS_ENDPOINT');
      const contexts = browser.contexts();
      const pages = contexts.flatMap(c => c.pages());
      const tabIndex = parseInt('$tab_index', 10);
      const pageIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;
      const page = pages[pageIndex];
      process.stdout.write(page ? page.url() : '');
      await browser.close();
    })().catch(() => {});
  " 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g')

  # strip https:// prefix from both URLs for comparison
  local actual_url_normalized="${actual_url#https://}"
  local expected_url_normalized="${expected_url#https://}"

  # exact match required (--url is verification, not filter)
  if [[ "$actual_url_normalized" != "$expected_url_normalized" ]]; then
    echo "error: URL verification failed for tab $tab_index" >&2
    echo "" >&2
    echo "  --tab $tab_index is ABSOLUTE (not filtered by URL)" >&2
    echo "  --url is VERIFICATION only (confirms correct tab)" >&2
    echo "" >&2
    echo "tab $tab_index actual URL: $actual_url_normalized" >&2
    echo "expected URL:              $expected_url_normalized" >&2
    echo "" >&2
    echo "run browser.describe to see all tabs:" >&2
    echo "  rhx browser.describe" >&2
    exit 1
  fi
}
