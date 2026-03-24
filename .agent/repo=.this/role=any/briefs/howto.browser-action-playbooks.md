# howto use browser.action playbooks

## .what

browser playbooks are TypeScript files that execute browser automation sequences via playwright.

## .why

- **reusable**: save common navigation sequences for repeated use
- **versionable**: permanent playbooks are committed to git
- **debuggable**: full playwright API access for complex interactions
- **explorable**: manually explore UIs to find selectors and URLs

## .when

use playbooks when:
- you need to explore squarespace UI to find correct URLs or selectors
- you need to perform multi-step navigation sequences
- you want to save a sequence for reuse

## .how

### run a playbook

```sh
rhx browser.action --play .play/permanent/goto-domains-list.play.ts
rhx browser.action --play .play/permanent/goto-dns-settings.play.ts --tab 2
```

### playbook format

```ts
import type { Page, Browser } from 'playwright';

/**
 * .what = navigate to squarespace domains list
 * .why = start point for domain exploration
 */
export const action = async (input: { page: Page; browser: Browser }) => {
  const { page } = input;

  await page.goto('https://account.squarespace.com/domains', {
    waitUntil: 'load',
  });

  // wait for content to render
  await page.waitForSelector('table', { timeout: 10000 });

  return { url: page.url() };
};
```

### directory structure

```
.play/
├── .gitignore           # ignores temporary/
├── permanent/           # committed playbooks
│   ├── goto-domains-list.play.ts
│   ├── click-first-domain.play.ts
│   └── goto-dns-settings.play.ts
└── temporary/           # not committed (for ad-hoc exploration)
    └── (your scratch playbooks)
```

## .workflow

1. **start browser**: `rhx browser.start --mode HEADFUL`
2. **see tabs**: `rhx browser.describe`
3. **run playbook**: `rhx browser.action --play .play/permanent/foo.play.ts --tab -1`
4. **snapshot result**: `rhx browser.snapshot html --tab -1 --url 'example.com/path'`

## .note

- playbooks run via `npx tsx` so full TypeScript support is available
- playbooks get `{ page, browser }` as input
- return value is logged as JSON
- use `.play/temporary/` for scratch exploration (not committed)
