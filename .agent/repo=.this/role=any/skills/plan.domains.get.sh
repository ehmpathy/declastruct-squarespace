#!/usr/bin/env bash
######################################################################
# .what = extract unique domains with expiration dates from plan.json
#
# .why  = enables quick review of domains in transfer-out plan
#
# usage:
#   rhx plan.domains.get
#   rhx plan.domains.get --plan provision/usecase.transferout/plan.json
#
# guarantee:
#   - outputs JSON array sorted by expirationDate
#   - deduplicates domains (each appears once)
#   - fail-fast on errors
######################################################################
set -euo pipefail

# defaults
PLAN_FILE="provision/usecase.transferout/plan.json"

# parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan)
      PLAN_FILE="$2"
      shift 2
      ;;
    --skill|--repo|--role)
      # ignore rhachet-forwarded args
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "error: plan file not found: $PLAN_FILE" >&2
  exit 1
fi

# extract domains from Registration changes only
# grep lines 5-12 after each DeclaredSquarespaceDomainRegistration class marker
# to capture the desired block with expirationDate and name
grep -A 12 '"class": "DeclaredSquarespaceDomainRegistration"' "$PLAN_FILE" \
  | grep -E '"(expirationDate|name)":' \
  | grep -v '"domain":' \
  | paste - - \
  | sed 's/.*"expirationDate": "\([0-9-]*\)".*"name": "\([^"]*\)".*/\1 \2/' \
  | sort -u \
  | sort -k1 \
  | awk '
    BEGIN { print "[" }
    {
      if (NR > 1) print ","
      printf "  { \"name\": \"%s\", \"expirationDate\": \"%s\" }", $2, $1
    }
    END { print "\n]" }
  '
