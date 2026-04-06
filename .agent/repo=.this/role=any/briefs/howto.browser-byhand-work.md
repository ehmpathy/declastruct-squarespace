# howto do browser work by hand

## .what

use `browser.action` and `browser.snapshot` skills to interact with the browser manually when you need to figure things out, explore UI, or perform one-off operations.

## .why

- **exploration**: discover selectors, URLs, and UI behavior before you write scrapers
- **verification**: confirm what UI state looks like (enabled vs disabled, present vs absent)
- **one-off operations**: toggle settings, click buttons, fill forms without full scrapers
- **debug**: see exactly what the browser sees when tests fail

## .workflow

### 1. start browser (headful for human observation)

```sh
rhx browser.start --mode HEADFUL
```

### 2. see what tabs exist

```sh
rhx browser.describe
```

### 3. take snapshots to see current state

```sh
# screenshot
rhx browser.snapshot screen --tab 0 --url 'account.squarespace.com/domains'

# html (for selector discovery)
rhx browser.snapshot html --tab 0 --url 'account.squarespace.com/domains'

# full snapshot (screen + html + console + network)
rhx browser.snapshot --tab 0 --url 'account.squarespace.com/domains'
```

### 4. write a playbook for manual actions

create a `.play.ts` file in `.play/temporary/` (not committed):

```ts
import type { Page, Browser } from 'playwright';

export const action = async (input: { page: Page; browser: Browser }) => {
  const { page } = input;

  // navigate
  await page.goto('https://account.squarespace.com/domains/managed/example.com');
  await page.waitForTimeout(2000);

  // click a button
  await page.click('button:has-text("Confirm")');
  await page.waitForTimeout(1000);

  // return result
  return { message: 'done', url: page.url() };
};
```

### 5. run the playbook

```sh
rhx browser.action --play .play/temporary/my-action.play.ts --tab 0
```

## .directory structure

```
.play/
├── permanent/           # committed playbooks (reusable navigation)
│   ├── goto-domains-list.play.ts
│   └── goto-dns-settings.play.ts
└── temporary/           # not committed (one-off exploration)
    └── toggle-renewal-off.play.ts
```

## .tips

- use `.play/temporary/` for scratch work (gitignored)
- use `.play/permanent/` for reusable navigation sequences
- always `browser.describe` first to know which `--tab` to use
- use `--tab -1` for the most recent tab
- snapshot `html` output is useful for `grep` to find selectors
- handle confirmation modals by wait + click CONFIRM/OK

## .example: discover UI differences

```sh
# 1. snapshot with feature ON
rhx browser.snapshot screen --tab 0 --url '.../domains'
# → see refresh icon next to expiration date

# 2. toggle feature OFF via playbook
rhx browser.action --play .play/temporary/toggle-off.play.ts --tab 0

# 3. snapshot with feature OFF
rhx browser.snapshot screen --tab 0 --url '.../domains'
# → no refresh icon next to expiration date

# 4. now you know: refresh icon = renewal enabled
```

## .see also

- howto.debug-via-browser.md
- howto.browser-action-playbooks.md
