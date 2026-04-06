# self-review: role-standards-adherance (r7)

## rule directories checked

| directory | rules examined | scope |
|-----------|----------------|-------|
| lang.terms/ | noun_adj order, treestruct, ubiqlang, gerunds, forbid terms | all names |
| lang.tones/ | lowercase, seaturtle identity, chill emojis | comments, docs |
| code.prod/evolvable.procedures/ | arrow functions, input-context, single responsibility, hook wrapper | all procedures |
| code.prod/evolvable.domain.objects/ | domain object patterns, ref requirements | domain objects |
| code.prod/pitofsuccess.errors/ | failfast, failloud, forbid failhide | error paths |
| code.prod/readable.narrative/ | no else branches, code paragraphs, narrative flow | control flow |
| code.prod/readable.comments/ | .what/.why headers | JSDoc |
| code.test/frames.behavior/ | given/when/then BDD pattern | test files |

---

## file-by-file analysis

### DeclaredSquarespaceDomainNameservers.ts

**why it adheres:**

1. **extends DomainEntity** (line 24): required by rule.require.domain-driven-design. DomainEntity provides identity comparison, serialization, and change detection.

2. **RefByUnique for domain** (line 14): required by rule.forbid.dobj.bagrefs. the domain reference uses `RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` which provides:
   - intellisense shows exactly `{ name: string }` as the required shape
   - type safety — cannot pass wrong properties
   - consistent with how squarespace identifies domains (by name, not ID)

3. **null semantics documented** (lines 17-21): required by rule.require.what-why-headers. the JSDoc explains:
   - `.note` — null = squarespace default, [...] = custom
   - this prevents ambiguity between "no config" and "default config"

4. **unique key is [domain]** (line 27): enforces one nameserver config per domain. this is correct because DNS allows only one NS record set per domain.

---

### getNameservers.ts

**why it adheres:**

1. **(input, context) pattern** (lines 14-21): required by rule.require.input-context-pattern. input contains the query, context contains the injectable dependencies.

2. **arrow functions throughout**: required by rule.require.arrow-only. every function uses `const fn = async (...)` syntax.

3. **RefByUnique.as usage** (lines 35-37): required by rule.forbid.dobj.bagrefs. domain object is constructed with typed ref:
   ```typescript
   domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
     name: input.by.unique.domain.name,
   }),
   ```

4. **hook wrapper pattern** (line 46): required by rule.require.hook-wrapper-pattern. `withNewLoggedInBrowserPage` wraps the core function. this:
   - minimizes diff when hooks change
   - keeps core logic clean
   - enables reuse of browser session

5. **code paragraph comments** (lines 24, 27, 33): required by rule.require.narrative-flow. each logical block has a one-line summary.

---

### setNameservers.ts

**why it adheres:**

1. **(input, context) pattern** (lines 24-27, 80-83): both core and outer functions follow the pattern.

2. **arrow functions**: `const setNameserversCore = async (...)` and `const setNameserversWithPage = async (...)`.

3. **failfast** (line 88-91): required by rule.require.failfast. invalid input throws immediately:
   ```typescript
   if (!desired?.domain?.name)
     UnexpectedCodePathError.throw('no domain name in input', { input });
   ```

4. **RefByUnique.as for domain ref** (lines 70-72): the fix applied in r6. domain object construction uses typed ref, not bag ref.

5. **hook wrapper pattern** (lines 109-117): `withNewLoggedInBrowserPage` wraps core to provide browser page.

6. **no else branches**: all conditionals use early returns or separate if guards.

---

### setNameserversScraper.ts

**why it adheres:**

1. **separate if guards** (lines 44, 91): the fix applied in r6. instead of if/else:
   ```typescript
   if (nameservers === null) { /* reset logic */ }
   if (nameservers !== null) { /* custom NS logic */ }
   ```
   this satisfies rule.forbid.else-branches.

2. **code paragraph comments**: every logical block has a comment:
   - line 27: "navigate to nameservers page if not already there"
   - line 33: "wait for React to fully hydrate"
   - line 43: "handle reset to squarespace default"
   - line 91: "handle custom nameservers"
   - line 174: "verify result by read of nameservers from page"

3. **verification after mutation** (lines 174-223): required by rule.require.action-verification. after set operation, page reloads and reads back the current state to confirm the change succeeded.

---

### validateNameserversInput.ts

**why it adheres:**

1. **failfast validation**: required by rule.require.failfast. each invalid state throws immediately with context:
   - line 31: `BadRequestError` for < 2 nameservers
   - line 39: `BadRequestError` for > 13 nameservers
   - line 48: `BadRequestError` for invalid FQDN

2. **no else branches**: uses early returns:
   - line 24: `if (input.nameservers === null) return null;`
   - line 27: `if (input.nameservers.length === 0) return null;`

3. **lowercase comments**: all comments use lowercase per rule.prefer.lowercase.

---

### test files

| file | BDD pattern | coverage |
|------|-------------|----------|
| DeclaredSquarespaceDomainNameservers.test.ts | given/when/then | domain object instantiation |
| validateNameserversInput.test.ts | given/when/then | all validation cases |
| setNameservers.play.integration.test.ts | given/when/then + useBeforeAll | full journey |

all test files use test-fns BDD pattern per rule.require.given-when-then.

---

## issues found and fixed

| issue | file | line | fix |
|-------|------|------|-----|
| bag ref | setNameservers.ts | 69-72 | RefByUnique.as<...> |
| else branch | setNameserversScraper.ts | 88 | separate if guards |

both fixes applied in r6. typescript compilation verified.

---

## standards verified

1. **lang.terms/noun_adj**: variable names follow [noun][adj] order (e.g., `nameserversValidated`, `currentNameservers`)
2. **lang.tones/lowercase**: all comments lowercase
3. **code.prod/arrow-only**: no `function` keyword
4. **code.prod/input-context**: all procedures use (input, context) pattern
5. **code.prod/single-responsibility**: one operation per file
6. **code.prod/hook-wrapper**: browser page via withNewLoggedInBrowserPage
7. **code.prod/forbid-bagrefs**: RefByUnique.as for domain refs
8. **code.prod/failfast**: BadRequestError and UnexpectedCodePathError for invalid states
9. **code.prod/no-else**: separate if guards, early returns
10. **code.test/given-when-then**: BDD pattern in all test files

---

## conclusion

all mechanic standards satisfied after r6 fixes. no further blockers.
