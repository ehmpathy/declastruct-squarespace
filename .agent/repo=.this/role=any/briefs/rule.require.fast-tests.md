# rule.require.fast-tests

## .what

all tests must complete within 90 seconds. no exceptions, including acceptance tests.

## .why

- slow tests indicate a fundamental defect
- slow tests block developer flow
- slow tests mask real issues (timeouts hide root cause)
- if automation takes 10 minutes, batch of 300 domains takes 50+ hours

## .pattern

```ts
// jest config
testTimeout: 90000,  // 90 seconds max
```

## .when tests exceed 90 seconds

this indicates a defect that must be fixed:

1. **track down root cause** — do not increase timeout
2. **investigate open handles** — use `--detectOpenHandles`
3. **check browser cleanup** — ensure playwright closes properly
4. **check async operations** — ensure all promises complete
5. **fix the defect** — do not work around it

## .common causes

| symptom | likely cause |
|---------|--------------|
| jest says "Force exiting" | open handles not closed |
| ETIMEDOUT on completed command | execSync stream handling issue |
| test hangs after operation | browser not closing |
| inconsistent timing | race condition or polling |

## .enforcement

test exceeding 90 seconds = blocker

do not:
- increase timeout
- add `--forceExit` as solution
- ignore the delay

do:
- create task to track root cause
- bisect to find slow operation
- fix underlying defect
