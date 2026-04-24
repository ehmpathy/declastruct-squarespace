#!/usr/bin/env bash
######################################################################
# .what = extend cache expiration for an account
#
# .why  = avoid re-scrape when cache is still valid but near expiry
#
# usage:
#   rhx cache.extend --for user@example.com
#   rhx cache.extend --for user@example.com --by 30d
#   rhx cache.extend --for user@example.com --by 7d
#
# guarantee:
#   - finds all cache files for account (via email hash)
#   - bumps expiresAtMse forward by duration (default: 30 days)
#   - fail-fast on errors
######################################################################
set -euo pipefail

# defaults (CACHE_DIR overridable via env for tests)
CACHE_DIR="${CACHE_DIR:-.cache/squarespace}"
DEFAULT_DAYS=30

# parse args
EMAIL=""
DAYS="$DEFAULT_DAYS"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --for)
      EMAIL="$2"
      shift 2
      ;;
    --by)
      # parse duration like "30d" or "7d"
      DAYS="${2%d}"
      shift 2
      ;;
    --skill|--repo|--role)
      # ignore rhachet-forwarded args
      shift 2
      ;;
    *)
      echo "unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$EMAIL" ]]; then
  echo "error: --for <email> required" >&2
  exit 1
fi

# hash email (first 12 chars of sha256)
EMAIL_HASH=$(echo -n "$EMAIL" | sha256sum | cut -c1-12)

# find cache files for this account (format: {operation}.{emailHash}..{inputHash}.v1)
shopt -s nullglob
FILES=("$CACHE_DIR"/*."$EMAIL_HASH".*)
shopt -u nullglob

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "no cache files found for $EMAIL (hash: $EMAIL_HASH)"
  exit 0
fi

# compute new expiration (now + days in milliseconds)
NOW_MS=$(date +%s%3N)
EXTEND_MS=$((DAYS * 24 * 60 * 60 * 1000))
NEW_EXPIRES=$((NOW_MS + EXTEND_MS))

echo "extend ${#FILES[@]} cache file(s) by ${DAYS} days"
echo "new expiration: $(date -d "@$((NEW_EXPIRES / 1000))" 2>/dev/null || echo "$NEW_EXPIRES")"
echo ""

# track keys to update in valid keys file
KEYS_EXTENDED=()

for f in "${FILES[@]}"; do
  # update expiresAtMse in JSON
  tmp=$(mktemp)
  jq --argjson exp "$NEW_EXPIRES" '.expiresAtMse = $exp' "$f" > "$tmp"
  mv "$tmp" "$f"
  echo "  extended: $(basename "$f")"
  KEYS_EXTENDED+=("$(basename "$f")")
done

# update valid keys file (simple-on-disk-cache tracks keys here)
VALID_KEYS_FILE="$CACHE_DIR/_.simple_on_disk_cache.valid_keys"
if [[ -f "$VALID_KEYS_FILE" ]]; then
  tmp=$(mktemp)
  # update expiresAtMse for each extended key in the value array
  jq_filter='.value = [.value[] | if '
  for i in "${!KEYS_EXTENDED[@]}"; do
    if [[ $i -gt 0 ]]; then
      jq_filter+=' or '
    fi
    jq_filter+=".key == \"${KEYS_EXTENDED[$i]}\""
  done
  jq_filter+=" then .expiresAtMse = $NEW_EXPIRES else . end]"
  jq "$jq_filter" "$VALID_KEYS_FILE" > "$tmp"
  mv "$tmp" "$VALID_KEYS_FILE"
  echo ""
  echo "  updated valid keys file"
fi

echo ""
echo "done"
