# antibot escalation best practices

## .what

tiered approach to handle bot detection and captcha challenges in playwright automation.

## .tiers

| tier | trigger | handle | human? |
|------|---------|--------|--------|
| 1 | prevention | stealth plugin masks automation signals | no |
| 2 | managed checkbox | headful pivot + robot click | no |
| 3 | interactive puzzle | headful pivot + human solve | yes |

## .tier 1: stealth (prevention)

reduce captcha trigger rate via stealth patches:

```ts
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());
const browser = await chromium.launch({ headless: true });
```

patches applied:
- `navigator.webdriver` = false
- removes `HeadlessChrome` from user agent
- spoofs WebGL, plugins, fonts fingerprints

## .tier 2: headful checkbox click

**why headless fails:** cloudflare detects headless via window focus events, canvas render differences, frame rate signals. stealth patches fix most signals but not display-related ones.

**why headful works:** real window = real display signals. checkbox validates browser environment, not human behavior.

```ts
// detect captcha
const hasCaptcha = await page.locator('iframe[src*="challenges.cloudflare.com"]').count() > 0;
if (!hasCaptcha) return; // no captcha, continue

// pivot to headful
await context.storageState({ path: sessionPath });
await browser.close();

const headfulBrowser = await chromium.launch({ headless: false });
const headfulContext = await headfulBrowser.newContext({ storageState: sessionPath });
const headfulPage = await headfulContext.newPage();
await headfulPage.goto(url);

// robot clicks checkbox
const frame = headfulPage.frameLocator('iframe[src*="challenges.cloudflare.com"]');
await frame.locator('input[type="checkbox"], .cb-lb').click();
await headfulPage.waitForTimeout(3000);

// save session and close
await headfulContext.storageState({ path: sessionPath });
await headfulBrowser.close();

// resume headless with fresh session
```

## .tier 3: human fallback (puzzle)

only needed when cloudflare escalates to interactive puzzle (rare):

```ts
// already in headful from tier 2
console.log('captcha puzzle detected — solve in browser window');
console.log('press ENTER after solve...');

await waitForEnter();

await headfulContext.storageState({ path: sessionPath });
await headfulBrowser.close();
```

**when puzzles appear:**
- suspicious IP (datacenter, VPN, proxy)
- repeated captcha failures
- high-risk session behavior
- cloudflare threat score threshold

## .session persistence

critical for pivot pattern — preserves auth across browser instances:

```ts
// save before close
await context.storageState({ path: '.cache/session.json' });

// restore on launch
const context = await browser.newContext({
  storageState: '.cache/session.json',
});
```

## .detection signals

| signal | headless | headful | stealth fix? |
|--------|----------|---------|--------------|
| `navigator.webdriver` | true | false | yes |
| user agent | HeadlessChrome | Chrome | yes |
| window focus | fake events | real events | no |
| canvas render | software | GPU | no |
| frame rate | no display | 60fps | no |

headful mode is required because display-related signals cannot be patched.

## .packages

| package | purpose |
|---------|---------|
| playwright-extra | stealth plugin framework |
| puppeteer-extra-plugin-stealth | bot detection evasion patches |

```sh
npm install playwright-extra puppeteer-extra-plugin-stealth
```

## .see also

- `.behavior/v2025_12_17.domain-transfer/3.1.2.research.external.factory.captcha._.v1.i1.md` — full research (42 sources)
- `.behavior/v2025_12_17.domain-transfer/3.3.0.blueprint.factory.v1.i1.md` — implementation blueprint
