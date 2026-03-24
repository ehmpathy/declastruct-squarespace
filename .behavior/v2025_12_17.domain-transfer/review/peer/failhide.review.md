# peer review: failhide patterns

**date:** 2026-03-23
**reviewer:** mechanic
**scope:** all `.ts` files in repo

---

## blockers

### 1. scrapeDomainsList.ts:56-58 — silent swallow of timeout error

```ts
// wait for page content (domain table or empty state)
await Promise.race([
  page.waitForSelector(domainsListSelectors.domainRow, { timeout: 15000 }),
  page.waitForSelector(domainsListSelectors.emptyState, { timeout: 15000 }),
]).catch(() => {
  // if neither appears, continue anyway — page may have different structure
});
```

**problem:** silently swallows timeout errors. if neither selector appears within 15 seconds, the code continues and may return incorrect results (empty array or stale data).

**fix:** fail-fast if timeout occurs. if the page truly has "different structure", that's a selector drift bug that should surface immediately.

```ts
// fix: fail-fast on timeout
await Promise.race([
  page.waitForSelector(domainsListSelectors.domainRow, { timeout: 15000 }),
  page.waitForSelector(domainsListSelectors.emptyState, { timeout: 15000 }),
]);
// if neither found, Promise.race will reject → caller sees the error
```

---

### 2. requestTransferCode.ts:80 — .catch(() => false) hides playwright errors

```ts
const hasEmailMessage = await page
  .locator(emailSentSelector)
  .first()
  .isVisible()
  .catch(() => false);
```

**problem:** `.catch(() => false)` swallows all errors, not just "element not found". a real playwright error (page crashed, navigation failed, etc.) would be hidden and treated as "no email message".

**fix:** check for specific expected failure or let unexpected errors propagate.

```ts
// fix: only handle expected case
const emailElement = page.locator(emailSentSelector).first();
const hasEmailMessage = (await emailElement.count()) > 0 && (await emailElement.isVisible());
```

---

### 3. requestTransferCode.ts:104 — .catch(() => false) hides playwright errors

```ts
const hasError = await page
  .locator(errorSelector)
  .first()
  .isVisible()
  .catch(() => false);
```

**problem:** same issue as #2. real playwright errors hidden.

---

### 4. requestTransferCode.ts:114-119 — fallback assumes success without confirmation

```ts
// fallback: assume success if we got this far without error
return {
  success: true,
  transferCode: null,
  emailSent: true,
};
```

**problem:** returns `success: true` when unable to confirm any success or error indicator. this is a semantic failhide — operation outcome is unknown but reported as success.

**fix:** either fail-fast or return explicit `{ success: 'unknown' }` state.

```ts
// fix: fail-fast on ambiguous state
throw new Error(
  `requestTransferCode: could not determine operation outcome. no success or error indicators found. URL=${page.url()}`,
);
```

---

## nitpicks

### 1. withNewLoggedInBrowserPage.ts:101 — acceptable (best-effort debug capture)

```ts
await capturePageStateOnError({ page, error }).catch(() => {});
```

**reason acceptable:** this is a best-effort debug capture. the real error is rethrown on line 116. debug capture failure should not mask the original error.

---

### 2. scrapeDnsRecords.ts:97 — acceptable (debug log only)

```ts
const mainContent = await page
  .$eval('main', (el) => el.innerHTML.slice(0, 3000))
  .catch(() => 'no main found');
```

**reason acceptable:** this is debug log output. failure to capture debug info should not fail the operation. the real fail-fast is on lines 101-108.

---

### 3. detectCaptchaChallenge.ts:18, 25 — acceptable (safe default)

```ts
const turnstileCount = await page
  .locator(CAPTCHA_SELECTORS.turnstileIframe)
  .count()
  .catch(() => 0);
```

**reason acceptable:** if locator count fails, "no captcha detected" is safe. worst case: captcha blocks and operation retries. better than a crash on a transient playwright error for the whole batch.

---

### 4. capturePageStateOnError.ts:36, 45, 64 — acceptable (entire function is best-effort)

**reason acceptable:** this function exists specifically for best-effort debug capture. its contract is "capture what you can, don't crash". the caller already has the original error.

---

### 5. checkSessionHealth.ts:46-55 — acceptable (explicit invalid-on-failure semantics)

```ts
} catch (error) {
  // Navigation failure might indicate session issues
  if (error instanceof Error) {
    return {
      valid: false,
      reason: `session health check failed: ${error.message}`,
    };
  }
  return { valid: false, reason: 'session health check failed: unknown' };
}
```

**reason acceptable:** the function's purpose is to check if session is valid. navigation failure → session is invalid. the error message is preserved in `reason`. this is not a failhide; it's intentional error-to-state translation.

---

## test files — not reviewed for blockers

test file cleanup patterns like `.catch(() => {})` on `page.close()` in `afterAll` are acceptable. test cleanup should not fail the test after assertions have already run.

**exception noted:** `requestTransferCode.integration.test.ts:93` swallows the re-lock failure, which could leave the test domain in unexpected state. this is a test hygiene issue, not a prod failhide.

---

## summary

| severity | count | files affected |
|----------|-------|----------------|
| blocker | 4 | scrapeDomainsList.ts, requestTransferCode.ts (3 issues) |
| nitpick | 5 | withNewLoggedInBrowserPage.ts, scrapeDnsRecords.ts, detectCaptchaChallenge.ts, capturePageStateOnError.ts, checkSessionHealth.ts |

**recommendation:** fix 4 blockers before production batch use. nitpicks are acceptable per rule.forbid.failhide allowlist (best-effort, debug, explicit state translation).
