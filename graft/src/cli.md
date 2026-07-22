# src/cli.ts

This file implements the `graft` CLI tool for building and maintaining a context graph from code, ensuring it stays in sync with the repository.

- engineFrom · function · L41-L44 — Creates an instance of the Graft engine configured with the specified context directory.
- fmt · function · L80-L84 — Formats a record of counts into a human-readable string for console output.
- traverseAction · function · L254-L260 — function traverseAction(kind: import("./graph/traverse-cli.js").TraverseKind)
