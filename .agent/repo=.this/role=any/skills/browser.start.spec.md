# browser.start specification

## .what

launch a persistent browser for test reuse.

## .why

- browser stays open across test crashes
- human can inspect browser state after failure
- tests can reconnect without cold start
- multiple independent sessions support parallel workflows

## usage

```sh
rhx browser.start --mode HEADFUL
rhx browser.start --mode HEADLESS
rhx browser.start --mode HEADFUL --session test1
rhx browser.start --mode HEADFUL --refresh
```

## args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --mode | yes | - | HEADFUL or HEADLESS |
| --session | no | default | session identifier |
| --refresh | no | false | kill extant browser first |

## outputs

- wsEndpoint to `.cache/browser.$session/ws-endpoint`
- user profile to `.cache/browser.$session/profile/`

## guarantees

- browser stays open until killed
- tests auto-discover via state file
- requires explicit --mode

## error cases

| scenario | behavior |
|----------|----------|
| no --mode arg | error: --mode required |
| invalid --mode value | error: must be HEADFUL or HEADLESS |

## session isolation

each session is fully isolated:

| aspect | path |
|--------|------|
| wsEndpoint file | `.cache/browser.$session/ws-endpoint` |
| user profile | `.cache/browser.$session/profile/` |
| CDP port | derived from session hash (9222-9999) |

sessions can run in parallel without interference.

## cdp port derivation

port is deterministically derived from session name:

```sh
SESSION_HASH=$(echo -n "$SESSION" | md5sum | cut -c1-4)
CDP_PORT=$((9222 + (16#$SESSION_HASH % 778)))
```

this ensures:
- same session always gets same port
- different sessions get different ports
- port range 9222-9999 (778 possible ports)

## why CDP

the skill opens ONE browser window. tests connect and reuse that SAME window.

```
browser.start --mode HEADFUL
   └── opens browser window (page visible)

test connects
   └── uses SAME window (not new window)

another test connects
   └── uses SAME window (not new window)
```

| approach | contexts per connection | window behavior | verdict |
|----------|------------------------|-----------------|---------|
| `launchServer()` + `connect()` | isolated | new window per test | REJECTED |
| `launch()` with CDP + `connectOverCDP()` | shared | same window reused | REQUIRED |

`launchServer()` creates isolated contexts per connection — each test gets a fresh window. this defeats the purpose of visual debug.

CDP-based approach shares contexts — tests reuse the skill-opened window.

## implementation

```javascript
// launch browser with CDP endpoint
const browser = await chromium.launch({
  headless: mode === 'HEADLESS',
  args: [`--remote-debugging-port=${CDP_PORT}`]
});

// write CDP endpoint for test discovery
const wsEndpoint = browser.wsEndpoint();
fs.writeFileSync(`.cache/browser.${session}/ws-endpoint`, wsEndpoint);
```

## sources

- [Connect Playwright to Extant Browser | BrowserStack](https://www.browserstack.com/guide/playwright-connect-to-existing-browser)
- [Reuse Browser Sessions for Debug in Playwright | Medium](https://medium.com/@thananjayan1988/reusing-browser-sessions-for-debugging-in-playwright-bac94cd6d999)
- [Share browser context across processes · Issue #1126 | GitHub](https://github.com/microsoft/playwright/issues/1126)
