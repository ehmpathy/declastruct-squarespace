# rule.require.action-verification

## .what

after every action, verify it actively succeeded. not just "didn't fail" — actively confirm the expected outcome.

## .why

"didn't throw" is not success. the browser can:
- click a button with no effect (React not hydrated)
- submit a form that silently fails
- dismiss a modal that reappears immediately
- navigate to a page that redirects elsewhere

only positive confirmation proves the action worked.

## .pattern

```ts
// bad: no verification
await toggleLabel.click();
await page.waitForTimeout(2000);
// hope it worked?

// good: positive verification
await toggleLabel.click();

// wait for expected state change
await page.waitForSelector(domainDetailSelectors.unlockConfirmModal, {
  timeout: 5000,
});

// verify the expected element appeared
const modalAppeared = await page.$(domainDetailSelectors.unlockConfirmModal);
if (!modalAppeared) {
  throw new Error('toggle click did not open confirm modal');
}
```

## .verification checklist

after each action, answer: "how do I KNOW it worked?"

| action type | positive verification |
|-------------|----------------------|
| click button | expected modal/state appears |
| fill input | input.value === expected (strip spaces if auto-formatted) |
| toggle checkbox | checkbox.checked === expected |
| submit form | success indicator visible OR form gone |
| dismiss modal | modal element removed from DOM |
| navigate | URL matches AND content rendered |
| login | dashboard visible OR auth cookie present |

## .thorough verification for mutations

for any action that mutates state, verify ALL of:

1. **input accepted**: value was written (e.g., `inputValue() === expected`)
2. **action triggered**: button click caused expected response (e.g., modal appeared)
3. **result confirmed**: final state matches intent (e.g., modal dismissed, overlay gone)

```ts
// thorough verification example for reauth fill + submit
await totpInput.fill(totpCode);

// 1. verify input accepted (strip whitespace for auto-format)
const filledValue = await totpInput.inputValue();
if (filledValue.replace(/\s/g, '') !== totpCode) {
  throw new Error(`fill failed: expected=${totpCode}, got=${filledValue}`);
}

// 2. verify action triggered (click submit)
await submitButton.click();

// 3. verify result confirmed (modal gone)
await page.waitForSelector(modalSelector, { state: 'hidden', timeout: 10000 });
const modalStillPresent = await page.$(modalSelector);
if (modalStillPresent) {
  throw new Error('modal still present after submit');
}
```

## .antipattern

```ts
// antipattern: timeout as verification
await button.click();
await page.waitForTimeout(3000);
return { success: true };  // WRONG: timeout proves none

// antipattern: catch-all success
try {
  await action();
  return { success: true };  // WRONG: no error != success
} catch {
  return { success: false };
}
```

## .enforcement

action without positive verification = blocker
