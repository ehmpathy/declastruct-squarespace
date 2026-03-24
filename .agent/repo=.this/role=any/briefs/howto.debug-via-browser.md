# howto debug via browser

## .what

browser skills enable both robots and humans to observe browser state.

## .why

- humans can watch tests run in headful mode
- robots can take snapshots to see what's on screen
- enables collaborative debug between agent and human

## .skills

### browser.start

start a persistent browser that tests auto-discover and reuse:

```sh
rhx browser.start --mode HEADFUL     # human can watch
rhx browser.start --mode HEADLESS    # background mode
```

### browser.describe

list all open tabs and their URLs:

```sh
rhx browser.describe
```

### browser.snapshot

capture screenshots and page state for robot inspection:

```sh
rhx browser.snapshot --tab -1         # full snapshot of latest tab
rhx browser.snapshot meta --tab -1    # just metadata (url, title)
rhx browser.snapshot screen --tab -1  # just screenshot
```

### browser.stop

stop the persistent browser:

```sh
rhx browser.stop
```

## .pattern

1. human starts browser in headful mode
2. robot runs test against persistent browser
3. if test fails, page stays open for human inspection
4. robot can take snapshot to see what went wrong
5. both can observe same browser state

## .note

- tests auto-discover browser via `.cache/browser.default/ws-endpoint`
- use `--refresh` to kill extant browser and start fresh
- tab indices may shift as tests open/close pages
