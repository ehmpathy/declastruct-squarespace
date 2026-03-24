# rule.require.snapshot-latest-tab

## .what

always use `--tab -1` (latest/most recent tab) when snapshot after a test run.

## .why

tests create new pages. the page you care about is the one the test just used, which is the most recently created tab.

`--tab 0` refers to the first tab ever opened, which is often stale or irrelevant.

negative indices count from end: `-1` = last tab, `-2` = second to last, etc.

## .pattern

```sh
# bad: stale first tab
rhx browser.snapshot html --tab 0 --url '...'

# good: latest tab
rhx browser.snapshot html --tab -1 --url '...'

# good: second most recent (if test uses multiple tabs)
rhx browser.snapshot html --tab -2 --url '...'
```

## .when

after a test run completes or fails, snapshot the latest tab to see what the test left behind.

## .exception

use specific positive index only after `rhx browser.describe` confirms which tab contains what you need.

## .enforcement

snapshot with `--tab 0` without prior `browser.describe` = blocker

