# squarespace antibot measures and playwright automation

## .what

reference brief on squarespace's bot detection mechanisms and best practices for playwright automation against squarespace domains UI.

## .context

squarespace does not provide a domains API. automation requires playwright/puppeteer to interact with their web UI. this brief documents known antibot measures and mitigation strategies.

---

## squarespace's protection stack

### cloudflare integration

squarespace uses cloudflare for bot protection. key mechanisms:
- **turnstile captcha**: non-interactive challenge analyzing browser environment, mouse movements, clicks
- **AI scraper blocking**: one-click feature to block AI bots (available even on free tier)
- **rate limiting**: advanced rate limiting via cloudflare WAF
- **threat intelligence**: machine learning to block emerging threats

### detection signals

| signal | what it detects | risk level |
|--------|----------------|------------|
| `navigator.webdriver` | automation flag set to `true` | HIGH |
| `HeadlessChrome` user agent | headless browser indicator | HIGH |
| CDP usage | chrome devtools protocol commands | MEDIUM-HIGH |
| WebSocket debugging ports | monitoring port 9222 | MEDIUM |
| behavioral patterns | non-human interaction timing | MEDIUM |
| IP reputation | datacenter/proxy IPs | MEDIUM |

---

## playwright stealth configuration

### required: playwright-extra + stealth plugin

```ts
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const browser = await chromium.launch({ headless: true });
```

### what stealth plugin patches

- sets `navigator.webdriver` to `false`
- removes `HeadlessChrome` from user agent
- spoofs WebGL renderer
- patches plugins and fonts fingerprints
- overrides navigator languages

### .limitation

stealth plugin alone is insufficient against advanced protections. combine with:
- residential proxies (not datacenter IPs)
- user-agent rotation
- realistic interaction delays
- session persistence (cookies/localStorage)

---

## CDP detection concerns

### how sites detect CDP

CDP detection targets the underlying websocket communication:
- monitors `/json`, `/devtools` paths
- detects unusual websocket activity on debugging ports
- serialization timing analysis during CDP commands
- `Runtime.enable` command detection

### mitigation

the `rebrowser-playwright` library applies runtime patches:
- removes navigator webdriver
- cleans user agent
- prefers real Chrome GPU

for critical batches, consider managed browser services that handle antibot bypass.

---

## best practices for squarespace automation

### 1. session persistence

```ts
// save session after login
const storageState = await context.storageState();
fs.writeFileSync('session.json', JSON.stringify(storageState));

// restore on next run
const context = await browser.newContext({
  storageState: JSON.parse(fs.readFileSync('session.json'))
});
```

**why**: minimizes login frequency, reduces bot detection triggers

### 2. human-like timing

```ts
// bad: immediate actions
await page.click('#button');
await page.fill('#input', 'value');

// good: random delays
await page.click('#button');
await page.waitForTimeout(500 + Math.random() * 1000);
await page.fill('#input', 'value');
```

### 3. sequential operations with bottleneck

```ts
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500, // 500ms between operations
});

// wrap operations
await limiter.schedule(() => scrapeOneDomain(page));
```

### 4. realistic viewport and user agent

```ts
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
});
```

### 5. persistent browser for development

```sh
# terminal 1: launch persistent browser
npx playwright launch chromium --port 9222

# terminal 2: connect via wsEndpoint
BROWSER_WS_ENDPOINT=ws://localhost:9222/... npm run test:integration
```

---

## known risks for batch operations

| risk | mitigation |
|------|------------|
| rate limit triggers | sequential with 500ms+ delays |
| session timeout (3+ hours) | auto-refresh via session health check |
| IP blocks | consider residential proxy rotation |
| CAPTCHA challenges | may require manual intervention |
| UI selector changes | centralized selectors, integration tests |

---

## when stealth is not enough

for large batches (100+ domains), consider:

1. **managed browser services**: scrapfly, browserless, zenrows handle antibot
2. **residential proxies**: avoid datacenter IP reputation issues
3. **smaller batch sizes**: process 20-50 domains per session
4. **time distribution**: spread operations across hours/days

---

## sources

- [How to Make Playwright Undetectable - ScrapeOps](https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-make-playwright-undetectable/)
- [Avoid Bot Detection With Playwright Stealth - Scrapeless](https://www.scrapeless.com/en/blog/avoid-bot-detection-with-playwright-stealth)
- [Avoiding Bot Detection with Playwright Stealth - Bright Data](https://brightdata.com/blog/how-tos/avoid-bot-detection-with-playwright-stealth)
- [How New Headless Chrome & CDP Signal Impact Bot Detection - DataDome](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)
- [Analyzing Anti-Detect Browsers: CDP Injection - Castle.io](https://blog.castle.io/how-to-detect-scripts-injected-via-cdp-in-chrome-2/)
- [From Puppeteer Stealth to Nodriver - Castle.io](https://blog.castle.io/from-puppeteer-stealth-to-nodriver-how-anti-detect-frameworks-evolved-to-evade-bot-detection/)
- [How to Bypass Cloudflare with Playwright - BrowserStack](https://www.browserstack.com/guide/playwright-cloudflare)
- [The Browser Automation Landscape in 2025 - Web Scraping Club](https://substack.thewebscraping.club/p/browser-automation-landscape-2025)
- [rebrowser-bot-detector - GitHub](https://github.com/rebrowser/rebrowser-bot-detector)

---

## .note

squarespace-specific antibot experiences are scarce in public sources. the techniques above are general playwright antibot best practices that apply to cloudflare-protected sites. monitor integration tests for selector drift and detection blocks.

