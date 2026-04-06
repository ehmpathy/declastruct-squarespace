# self-review: has-zero-deferrals (r2)

## what I reviewed

I re-read the vision document requirements and cross-referenced each against the blueprint. I searched the blueprint for deferral language and traced any deferrals back to their source.

---

## the question I asked

> "is any requirement from the vision deferred in the blueprint?"

---

## what I found

### deferrals in blueprint itself

I searched the blueprint (`3.3.1.blueprint.product.v1.i1.md`) for:
- "deferred"
- "future"
- "out of scope"
- "todo"
- "later"
- "not implemented"

**result**: zero matches. the blueprint contains no deferral language.

### deferrals in prior reviews

the research traceability review (r1) deferred two items. I traced each:

**deferral 1: propagation delay documentation**

- is this a vision requirement?
- I checked the vision: "propagation status: out of scope. 'change submitted' is sufficient."
- **verdict**: the vision explicitly excludes this. deferral is acceptable.

**deferral 2: error states discovery**

- is this a vision requirement?
- I checked the vision: no mention of error state discovery as a requirement.
- the vision mentions "edgecases" but those are about validation (min 2 NS, invalid FQDN), which ARE in the blueprint.
- **verdict**: this is an implementation detail, not a vision requirement. deferral is acceptable.

---

## why the blueprint is complete

### method

I listed each vision requirement and found its blueprint location:

| # | vision requirement | blueprint location |
|---|-------------------|-------------------|
| 1 | DeclaredSquarespaceDomainNameservers | filediff: `DeclaredSquarespaceDomainNameservers.ts` |
| 2 | DeclaredSquarespaceDomainNameserversDao | filediff: `DeclaredSquarespaceDomainNameserversDao.ts` |
| 3 | getNameservers operation | filediff: `getNameservers.ts` |
| 4 | setNameservers with upsert | codepath tree: setNameservers operation |
| 5 | setNameservers with findsert | codepath tree: setNameservers operation |
| 6 | swap to custom NS (cloudflare) | journey test t1-t2, codepath tree |
| 7 | swap back to default (null) | journey test t3-t4, codepath tree |
| 8 | nameservers: string[] or null | codepath tree: domain object declaration |
| 9 | full test coverage | test tree: 8 test files across all layers |

all 9 requirements have blueprint locations. none are deferred.

---

## why acceptable deferrals are acceptable

### propagation documentation

the vision says:
> "propagation status: out of scope. 'change submitted' is sufficient. DNS propagation monitor is expensive and external DNS tools can verify if needed."

this is not just "we chose not to do it" — the vision explicitly marks it as out of scope. the wisher decided this was not part of the feature.

### error state discovery

the vision mentions edgecases like "domain locked" and "invalid nameserver format" — these ARE in the blueprint as validation rules. what's NOT in the vision is "discover squarespace's error message text" — that's an implementation detail the scraper will handle.

---

## what I learned

### lesson 1: vision is the contract

the vision is not a wishlist — it's a contract. if the vision says "out of scope", that's the wisher's decision. I cannot unilaterally add it back. similarly, I cannot defer what the vision includes.

### lesson 2: trace deferrals to source

when I see a deferral, the question is: "is this in the vision?" if yes, blocker. if no, acceptable. this makes the review mechanical rather than subjective.

---

## conclusion

zero-deferrals review passes:
- the blueprint contains no deferrals
- the two deferrals in r1 are for items explicitly outside vision scope
- all 9 vision requirements are present in the blueprint
