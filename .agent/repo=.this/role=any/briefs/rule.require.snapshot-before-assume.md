# rule.require.snapshot-before-assume

## .what

when an interaction fails or produces unexpected results, take a snapshot BEFORE you form a hypothesis about the cause.

## .why

common defect pattern:
1. click/action doesn't produce expected result
2. assume a cause based on code
3. debug the assumed cause for 10+ minutes
4. finally take snapshot
5. discover the actual cause was completely different

real example:
- symptom: unlock toggle click didn't unlock domain
- assumed cause: reauthentication modal password selector broken
- actual cause: different modal ("Unlock domain?" confirmation) needed Confirm click first
- wasted time: fixed password selectors that were never the issue

## .pattern

```sh
# bad: assume and debug
# "the reauthentication modal must be broken, let me fix the password selector..."
# [10 minutes later]
# "wait, let me take a snapshot..."
# [discovers completely different modal]

# good: snapshot first, then diagnose
rhx browser.snapshot html --tab -1 --url '/domains/managed/example.com'
grep -i "dialog\|modal\|confirm" snapshot.html
# immediately see: data-testid="unlock-domain-confirmation" with Confirm button
# fix takes 2 minutes
```

## .detect

symptoms that indicate "debug without snapshot":
- fix code that turns out to be unrelated
- multiple hypothesis changes in debug session
- surprise when you finally view actual page state
- "oh, it's a completely different modal/element"

## .fix

1. interaction fails → take snapshot immediately
2. search snapshot for relevant elements (modal, dialog, button, input)
3. THEN form hypothesis based on actual page state
4. fix based on evidence, not assumption

## .time saved

| approach | typical debug time |
|----------|-------------------|
| assume then debug | 10-30 minutes |
| snapshot then diagnose | 2-5 minutes |

## .see also

- rule.require.snapshot-before-debug
- rule.require.wait-for-target-element

## .enforcement

debug without snapshot first = self-review flag

