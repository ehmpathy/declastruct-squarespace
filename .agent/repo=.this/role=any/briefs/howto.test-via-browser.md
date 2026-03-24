# howto test via browser

## .what

use the persistent browser for playwright integration tests.

## .why

- see what the browser sees (headful mode)
- debug selector failures visually
- browser stays open across test crashes

## .how

### 1. start browser

```sh
rhx browser.start --mode HEADFUL
```

### 2. run narrowest test first

always start with the narrowest test to verify browser connection:

```sh
npm run test:integration -- genBrowserAuthSession.integration.test.ts
```

look for matched ws endpoints in output:
```
auto-discovered browser at: ws://localhost:35513/...
genBrowserAuthSession: connect to extant browser at ws://localhost:35513/...
```

if both match, the test uses the skill-started browser.

### 3. debug visually

watch the browser window while the test runs. you'll see:
- navigation to squarespace
- login form interaction
- any selector failures (page state visible)

### 4. take screenshot (optional)

```sh
rhx browser.screenshot
```

## .note

- use `--refresh` to kill extant browser: `rhx browser.start --mode HEADFUL --refresh`
- state file at `.cache/browser-ws-endpoint`
- tests reuse the SAME window (CDP-based context share)
- browser.start opens about:blank; test navigates in that same window
