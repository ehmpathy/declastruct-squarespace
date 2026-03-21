# browser.snapshot specification

## .what

capture diagnostic snapshots of browser tabs.

## .why

- single command captures all debug context
- collocated files with same prefix for easy correlation
- no need to reproduce failure to gather absent info
- enables async debug (snapshot now, analyze later)
- modular: each asset type is its own skill

---

## skill tree

```
browser.snapshot                    # dispatcher: generates prefix, calls all sub-skills
├── browser.snapshot.meta           # captures .meta.json (tab url, title, viewport)
├── browser.snapshot.screenshot     # captures .png
├── browser.snapshot.html           # captures .html
├── browser.snapshot.console        # captures .console.json
├── browser.snapshot.network        # captures .network.json
└── browser.snapshot.storage        # captures .storage.json
```

---

## browser.snapshot (dispatcher)

generates a common prefix and invokes all sub-skills.

### usage

```sh
rhx browser.snapshot --tab 0
rhx browser.snapshot --tab 0 --session test1
rhx browser.snapshot --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (without extension) |
| --session | no | default | session identifier |

### behavior

1. generate prefix: `.cache/browser.$SESSION/snapshot.$ISOTIME.tab$TAB` or `--output` value
2. invoke each sub-skill with `--tab $TAB --session $SESSION --output $PREFIX`
3. print summary of all captured files

### outputs

```
.cache/browser.default/snapshot.20260320T071821Z.tab0/
├── snapshot.meta.json       # tab metadata (url, title, viewport)
├── snapshot.png             # full page screenshot
├── snapshot.html            # page source
├── snapshot.console.json    # console entries
├── snapshot.network.json    # network requests
└── snapshot.storage.json    # localStorage + sessionStorage
```

---

## browser.snapshot.meta

tab metadata for context.

### usage

```sh
rhx browser.snapshot.meta --tab 0
rhx browser.snapshot.meta --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds snapshot.meta.json) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.meta.json`:

```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "viewport": { "width": 1920, "height": 1080 },
  "timestamp": "2026-03-20T07:18:21.000Z",
  "tabIndex": 0,
  "tabCount": 3
}
```

---

## browser.snapshot.screenshot

visual screenshot of the page.

### usage

```sh
rhx browser.snapshot.screenshot --tab 0
rhx browser.snapshot.screenshot --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds .png) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.png` — full page screenshot

---

## browser.snapshot.html

page HTML source.

### usage

```sh
rhx browser.snapshot.html --tab 0
rhx browser.snapshot.html --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds snapshot.html) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.html` — page.content() output

---

## browser.snapshot.console

console log entries.

### usage

```sh
rhx browser.snapshot.console --tab 0
rhx browser.snapshot.console --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds snapshot.console.json) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.console.json`:

```json
{
  "entries": [
    {
      "type": "log",
      "text": "message text",
      "timestamp": "2026-03-20T07:18:21.000Z",
      "location": "https://example.com/app.js:42"
    }
  ]
}
```

types: log, warn, error, info, debug

### limitation

console listener only captures logs after attachment. for tabs already open, only new entries captured.

---

## browser.snapshot.network

network resource entries via performance API.

### usage

```sh
rhx browser.snapshot.network --tab 0
rhx browser.snapshot.network --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds snapshot.network.json) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.network.json` — array of PerformanceResourceTiming entries

### limitation

network listener only captures entries after page load. for tabs already open, only new entries captured.

---

## browser.snapshot.storage

localStorage and sessionStorage contents.

### usage

```sh
rhx browser.snapshot.storage --tab 0
rhx browser.snapshot.storage --tab 0 --output /tmp/debug
```

### args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --tab | yes | - | tab index (0-based, -1 = last) |
| --output | no | auto-generated | output path prefix (adds snapshot.storage.json) |
| --session | no | default | session identifier |

### outputs

`$prefix/snapshot.storage.json`:

```json
{
  "localStorage": {
    "key1": "value1"
  },
  "sessionStorage": {
    "sessionKey": "sessionValue"
  }
}
```

---

## shared guarantees

all sub-skills share these guarantees:

- fail-fast if --tab not supplied
- fail-fast if tab index out of range
- fail-fast if no browser found
- auto-discovers browser from state file

## error cases

| scenario | behavior |
|----------|----------|
| no --tab arg | error: --tab required |
| tab index out of range | error: tab N not found |
| no browser active | error: no browser found |

---

## migration from browser.screenshot

`browser.screenshot` is replaced by `browser.snapshot.screenshot`.

for backwards compat, `browser.screenshot` can remain as alias to `browser.snapshot.screenshot`.

---

## sources

- [HAR 1.2 Spec](http://www.softwareishard.com/blog/har-12-spec/)
- [Playwright CDP Session](https://playwright.dev/docs/api/class-cdpsession)
- [Chrome DevTools Protocol - Network](https://chromedevtools.github.io/devtools-protocol/tot/Network/)
