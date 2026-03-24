# rule.require.grep-html-before-selector-guess

## .what

when a selector fails, grep the captured HTML for `data-testid` attributes before you try new text patterns.

## .why

common defect pattern:
1. selector doesn't match element
2. assume text content is wrong ("SEND AUTH CODE" vs "Send auth code")
3. iterate on text patterns for 10+ minutes
4. finally grep HTML
5. discover `data-testid="sendauthcode-button"` was there all along

real example:
- symptom: "Send auth code" button not found after reauth
- assumed cause: text case mismatch in selector
- actual cause: `data-testid="sendauthcode-button"` existed but wasn't in selector
- wasted time: tried multiple text variations before HTML check

## .pattern

```sh
# selector fails? grep the frame HTML first
grep -i 'data-testid' .cache/debug-screenshots/*.html | grep -i "send\|button\|modal" | head -10

# find all data-testid values near your target
grep -o 'data-testid="[^"]*"' .cache/debug-screenshots/latest-frame.html | sort -u
```

## .selector priority

when you write selectors, prefer in this order:

| priority | selector type | example | why |
|----------|---------------|---------|-----|
| 1 | data-testid | `[data-testid="sendauthcode-button"]` | stable, explicit |
| 2 | aria attributes | `[aria-label="Send auth code"]` | accessible, semantic |
| 3 | role + text | `button:has-text("Send auth code")` | fallback only |

## .workflow

1. element not found → take snapshot (or use extant movie frame)
2. grep HTML for `data-testid` near your target
3. if found → use it as primary selector
4. add text-based fallback only if data-testid absent

## .time saved

| approach | typical debug time |
|----------|-------------------|
| iterate on text selectors | 10-20 minutes |
| grep HTML for data-testid first | 1-2 minutes |

## .see also

- rule.require.snapshot-before-assume
- rule.require.snapshot-before-debug

## .enforcement

text-based selector without prior data-testid check = self-review flag
