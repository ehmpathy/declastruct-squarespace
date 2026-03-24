# rule.forbid.unverified-actions

## .what

every action that changes state must verify the change actually happened. never assume success.

## .why

silent failures are the worst kind:
1. action appears to succeed
2. state didn't actually change
3. downstream code operates on stale state
4. defect surfaces far from root cause
5. hours wasted in debug far from actual issue

## .pattern

```ts
// bad: assume success
await page.click(submitButton);
await page.waitForTimeout(2000);
return { success: true };  // did it actually work?

// good: verify the change
await page.click(submitButton);
await page.waitForSelector(modalSelector, { state: 'hidden', timeout: 10000 });

// fail-fast if still present
const modalStillPresent = await page.$(modalSelector);
if (modalStillPresent) {
  throw new Error(
    `action failed: modal still present after submit. url=${page.url()}`,
  );
}
return { success: true };  // verified
```

## .examples

| action | verification |
|--------|--------------|
| click submit button | modal/form disappears |
| toggle checkbox | checkbox state changed |
| fill form field | field value matches input |
| navigate to page | URL contains expected path |
| dismiss modal | modal element gone from DOM |
| login | session cookie present or dashboard visible |

## .detect

symptoms of unverified actions:
- `return { success: true }` without check
- `waitForTimeout` as only verification
- no assertion after mutation
- silent early returns

## .enforcement

action without verification = blocker
