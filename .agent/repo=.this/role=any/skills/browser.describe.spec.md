# browser.describe specification

## .what

list tabs open in the persistent browser.

## .why

- know which --tab index to use for screenshot
- verify test navigated to correct page
- debug tab state

## usage

```sh
rhx browser.describe
rhx browser.describe --session test1
```

## args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --session | no | default | session identifier |

## outputs

- tab count
- for each tab: index, title, url

## guarantees

- fail-fast if no browser found
- auto-discovers browser from state file

## error cases

| scenario | behavior |
|----------|----------|
| no browser active | error: no browser found |

## auto-discovery

browser is found via:

1. `BROWSER_WS_ENDPOINT` env var (if set)
2. `.cache/browser.$session/ws-endpoint` file

## implementation

```javascript
const browser = await chromium.connectOverCDP(wsEndpoint);
const contexts = browser.contexts();
const pages = contexts[0].pages();

for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  try {
    const title = await page.title();
    const url = page.url();
    console.log(`[${i}] ${title || '(no title)'}`);
    console.log(`    ${url}`);
  } catch {
    console.log(`[${i}] (page unavailable)`);
  }
}
```
