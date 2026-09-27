# jsonshape

A zero-dependency CLI that compares the structure of two JSON payloads and
detects breaking API changes.

Unlike a text diff, `jsonshape` ignores changing values and focuses on what
consumers depend on: field presence, primitive types, nested objects, and array
item shapes.

## Quick start

```bash
npm link
jsonshape fixtures/before.json fixtures/after.json
```

Example:

```text
breaking $.user.email — field was removed
breaking $.items[].price — type changed from number to string
additive $.meta.traceId — field was added
```

## CI-friendly modes

```bash
# Additive fields are allowed; removed fields and type changes fail.
jsonshape baseline.json response.json --mode compatible

# Every structural change fails.
jsonshape baseline.json response.json --mode exact

# Structured output for another tool to consume.
jsonshape baseline.json response.json --json
```

Exit codes are `0` for a passing comparison, `1` for detected changes that
violate the selected mode, and `2` for invalid input or usage.

## What it understands

- Objects and deeply nested fields
- Arrays with heterogeneous sample objects
- Optional object fields inferred from array samples
- Primitive and union type changes
- Additive versus breaking changes

The tool deliberately stays smaller than JSON Schema. It is intended for quick
contract checks against fixtures, snapshots, and real API responses.

## Development

```bash
npm test
npm run check
```

## License

MIT
