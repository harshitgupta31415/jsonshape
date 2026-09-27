# Security policy

Security fixes target the latest version on the default branch.

Report vulnerabilities through GitHub's private vulnerability reporting. Relevant concerns include unsafe path handling, unexpected code execution while reading JSON, denial-of-service inputs, and leakage of payload contents. Share the smallest synthetic JSON documents that reproduce the issue; do not submit private API responses.

jsonshape reads local JSON and never needs network access. A report should identify any behaviour that violates that boundary.
