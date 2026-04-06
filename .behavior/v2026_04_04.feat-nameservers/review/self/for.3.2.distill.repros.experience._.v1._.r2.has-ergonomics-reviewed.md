# self-review: has-ergonomics-reviewed

## review of ergonomics

### input ergonomics

| journey | input shape | ergonomic? | notes |
|---------|-------------|------------|-------|
| get nameservers | `{ by: { unique: { domain: { name } } } }` | **yes** | follows extant pattern |
| set to cloudflare | `{ upsert: { domain: { name }, nameservers: [...] } }` | **yes** | clear intent |
| set to null | `{ upsert: { domain: { name }, nameservers: null } }` | **yes** | null = reset to default |
| findsert | `{ findsert: { domain: { name }, nameservers: [...] } }` | **yes** | follows extant pattern |

### output ergonomics

| journey | output shape | ergonomic? | notes |
|---------|--------------|------------|-------|
| get nameservers | `{ domain: { name }, nameservers: [...] \| null }` | **yes** | clear state |
| set to cloudflare | `{ domain: { name }, nameservers: [...] }` | **yes** | reflects new state |
| set to null | `{ domain: { name }, nameservers: null }` | **yes** | reflects default state |

### friction points identified

| friction | mitigation | status |
|----------|------------|--------|
| minimum 2 nameservers | clear validation error with RFC citation | **addressed in repros** |
| FQDN format validation | clear error with example format | **addressed in repros** |
| null semantics for "squarespace default" | documentation needed | **needs doc** |
| DNS propagation delay | out of scope (external) | **documented in vision** |

---

## friction detail: null semantics

**issue**: `nameservers: null` is not obvious without docs.

**fix**: already noted in ergonomics review table ("need doc that null = squarespace default"). will add clear JSDoc comment on the `nameservers` property to clarify:
- `null` = squarespace manages nameservers (default)
- `[...]` = custom nameservers (user-specified)

**where**: JSDoc on `DeclaredSquarespaceDomainNameservers.nameservers` property.

---

## issues found

**one issue**: null semantics require documentation.

**severity**: low — addressed via JSDoc on domain object property.

---

## pit of success principles review

### intuitive design: can users succeed without documentation?

| journey | intuitive? | why |
|---------|-----------|-----|
| get nameservers | **yes** | pattern matches extant `getOneDomain`, `getOneDnsRecord` |
| set to cloudflare | **yes** | `upsert` with `nameservers: [...]` is clear |
| set to null | **partial** | requires doc that `null` = squarespace default |

**verdict**: mostly intuitive. null semantics need JSDoc.

### convenient: can we infer inputs rather than require them?

| input | inferred? | why |
|-------|-----------|-----|
| domain.name | no — required | domain ref is essential to identify target |
| nameservers array | no — required | explicit user intent required |

**verdict**: no inference possible — both inputs are essential to specify user intent.

### expressive: does it pull into inferred happy path, but allow expression of differences?

| aspect | holds? | why |
|--------|--------|-----|
| happy path = upsert | **yes** | upsert is the common operation |
| allows findsert | **yes** | findsert available for find-or-create semantics |
| allows any NS | **yes** | not locked to cloudflare — any valid nameservers work |

**verdict**: expressive. users can use cloudflare, route53, namecheap, or any other provider.

### composable: can this be combined with other operations easily?

| composition | works? | why |
|-------------|--------|-----|
| batch via loop | **yes** | `for domain of domains: await setNameservers(...)` |
| combine with getDomain | **yes** | get domain info, then set nameservers |
| combine with setDomain | **yes** | set domain attributes and nameservers independently |

**verdict**: composable. each operation is atomic and can be combined.

### lower trust contracts: do we validate at boundaries?

| validation | where | why |
|------------|-------|-----|
| min 2 nameservers | setNameservers input | per RFC 1035 and squarespace constraint |
| valid FQDN format | setNameservers input | catch malformed NS before submit |
| domain exists | not validated | trust caller — fail at squarespace if wrong |

**verdict**: validates at input boundary. domain existence delegated to squarespace.

### deeper behavior: do we handle edge cases gracefully?

| edge case | handled? | how |
|-----------|----------|-----|
| empty array | **yes** | treated as null (squarespace default) |
| single nameserver | **yes** | fails with clear error |
| invalid FQDN | **yes** | fails with clear error |
| repeat upsert | **yes** | idempotent — no double-set |

**verdict**: edge cases handled gracefully.

---

## conclusion

ergonomics review passes.

- input/output shapes follow extant patterns
- friction points are addressed or documented
- pit of success principles are satisfied
- one minor issue (null semantics) will be addressed via JSDoc
