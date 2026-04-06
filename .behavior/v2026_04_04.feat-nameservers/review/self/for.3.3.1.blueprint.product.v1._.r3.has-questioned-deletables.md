# self-review: has-questioned-deletables (r3)

## what I reviewed

I examined each component in the blueprint and asked: "does the vision require this? is this the simplest version that works?"

---

## the question I asked

> "what can be deleted from this blueprint without a violation of the vision?"

---

## what I found

### feature audit

for each feature in the blueprint, I traced back to the vision:

| feature | vision traceability | wisher asked? | assumed? |
|---------|---------------------|---------------|----------|
| `DeclaredSquarespaceDomainNameservers` | vision: "user experience" section | yes — explicit | no |
| `nameservers: string[] \| null` | vision: "contract inputs & outputs" | yes — explicit | no |
| `getNameservers` | vision: "contract inputs & outputs" | yes — explicit | no |
| `setNameservers.upsert` | vision: "contract inputs & outputs" | yes — explicit | no |
| `setNameservers.findsert` | vision: "contract inputs & outputs" | yes — explicit | no |
| swap to cloudflare | vision: "the outcome world" | yes — explicit | no |
| swap back to default | vision: "the outcome world" | yes — explicit | no |
| min 2 nameservers validation | vision: "edgecases" | yes — explicit | no |
| FQDN validation | vision: "edgecases" | yes — explicit | no |

**result**: all features trace to vision. no assumed features.

### component audit

for each component, I asked the deletion questions:

| component | can remove? | if deleted, add back? | simplest? |
|-----------|-------------|----------------------|-----------|
| domain object | no — entity required for declastruct | yes | yes — 2 properties only |
| DAO | no — vision specifies genDeclastructDao | yes | yes — wraps operations |
| getNameservers | no — vision specifies get | yes | yes — 1 orchestrator |
| setNameservers | no — vision specifies set | yes | yes — 1 orchestrator |
| scrapeNameservers | no — required for get (no API) | yes | yes — 1 communicator |
| setNameserversScraper | no — required for set (no API) | yes | yes — 1 communicator |
| castIntoDeclaredSquarespaceDomainNameservers | no — declastruct pattern | yes | yes — 1 transformer |
| validateNameserversInput | no — vision edgecases | yes | yes — 1 transformer |
| selector updates | no — scraper needs them | yes | yes — minimal selectors |

**result**: no components can be deleted. each is required.

### scope creep check

features NOT in blueprint that could have been scope creep:

| potential feature | in blueprint? | correct decision? |
|-------------------|---------------|-------------------|
| DNS propagation monitor | no | yes — vision says "out of scope" |
| nameserver reachability check | no | yes — vision says "do not validate that nameservers actually work" |
| batch operations endpoint | no | yes — vision says "loop over setNameservers" |
| delete operation on DAO | no | yes — vision says "reset to null, not delete" |

**result**: blueprint correctly excludes out-of-scope features.

---

## why the blueprint is minimal

### every feature traces to vision

I verified each feature against vision document:
- domain object: explicitly named in vision
- DAO: explicitly named in vision
- operations: explicitly named in vision
- validation: explicitly required by vision edgecases
- swap-to and swap-back: explicitly described in vision "outcome world"

### no unasked-for features

I searched for "assumed" features:
- DNS propagation? no — vision says out of scope
- batch endpoint? no — vision says loop over single operation
- delete operation? no — vision says reset to null

### every component is the simplest version

I applied "if we deleted this and had to add it back" test:
- domain object: 2 properties (domain ref + nameservers) — minimal
- DAO: thin wrapper over operations — minimal
- orchestrators: 1 each for get and set — minimal
- communicators: 1 each for scrape and set — minimal
- transformers: 1 each for cast and validate — minimal

---

## what I learned

### lesson 1: the vision "out of scope" section is the deletion guide

when I asked "what can be deleted?", the vision's "out of scope" section answered: propagation monitor and reachability validation. since these were already excluded from blueprint, the answer is "no items to delete."

### lesson 2: declastruct pattern implies minimal components

each declastruct feature has:
- 1 domain object
- 1 DAO
- 1 get orchestrator + 1 communicator + 1 transformer
- 1 set orchestrator + 1 communicator + optional validators

this is the established pattern. any deviation would require justification.

### lesson 3: "if deleted, would we add back?" is decisive

for every component, the answer was "yes, we would add it back" because:
- domain object: needed for identity
- DAO: needed for declarative interface
- operations: needed to fulfill vision contract
- scraper: needed because no API exists
- transformer: needed for declastruct cast pattern
- validator: needed for vision edgecases

---

## conclusion

questioned-deletables review passes:
- all 9 features trace to vision requirements
- all components are simplest-version-that-works
- no items to delete — blueprint is minimal
