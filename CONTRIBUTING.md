# Contributing to jsonshape

jsonshape welcomes focused improvements to structural comparison, CLI ergonomics, and contract reporting.

## Local checks

```bash
npm test
npm run check
```

Add a fixture-driven test for every new comparison rule. Include both the baseline and candidate payload in the test so reviewers can understand the contract change without reconstructing it mentally. Preserve the distinction between breaking and additive changes, and keep the runtime free of third-party dependencies.

Pull requests should describe whether compatible mode, exact mode, or both are affected and document any exit-code changes.
