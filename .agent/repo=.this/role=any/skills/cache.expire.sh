#!/usr/bin/env bash
######################################################################
# .what = expire cache for an account (force fresh scrape on next query)
#
# .why  = trigger re-scrape when remote state has changed
#
# usage:
#   rhx cache.expire --for user@example.com
#
# guarantee:
#   - finds all cache files for account (via email hash)
#   - deletes cache files (next query triggers fresh scrape)
#   - fail-fast on errors
######################################################################
set -euo pipefail

# defaults (CACHE_DIR overridable via env for tests)
CACHE_DIR="${CACHE_DIR:-.cache/squarespace}"

# parse args
EMAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --for)
      EMAIL="$2"
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

echo "expire ${#FILES[@]} cache file(s)"
echo ""

for f in "${FILES[@]}"; do
  rm "$f"
  echo "  deleted: $(basename "$f")"
done

echo ""
echo "done"
