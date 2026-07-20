---
name: graft
description: This repo is indexed by graft/. For ANY task here — understanding
  how something works, finding where code lives, or scoping a change — get your
  context from graft before grepping or reading source files.
---

# graft

This repo's code is summarised in `graft/` — small markdown nodes, each
explaining one part in plain prose and naming the exact files and line-spans it
covers. Reading a node costs a few hundred tokens; reading source to rebuild the
same understanding costs thousands.

**Get context from graft first — two ways, both land here:**

- Ask: `graft ask "<your task, in plain words>"` — returns the relevant nodes,
  ranked, with file:line pointers. Add `--source` to inline the actual code at
  each span, so the result IS the code you need — no separate file read.
- Or explore as usual: grep / ls / cat inside `graft/`. A grep for any concept,
  symbol, or filename hits the node that covers it; `graft/INDEX.md` lists them
  all.

**Then STOP at the node. It is the answer, not a lookup toward the answer.**

- **Explaining / tracing / understanding** (no code change): the node's prose
  IS your deliverable. Cite files and functions straight from its `covers:`
  list — `covers:` gives you the exact `file:line` for every symbol, so you can
  cite precisely **without opening the source at all.** Do NOT open source to
  "verify," "confirm," or "see the real code" — the node was generated from that
  source and the spans are authoritative. Opening it costs thousands of tokens
  and changes nothing in your answer.
- **Editing:** run `graft ask "<symbol>" --source` to pull the exact span's
  code inline, and edit straight from that. Only touch the file to apply the
  change at the named `file:line` — never read the whole file, never open
  neighbouring files to "get oriented"; the pack already oriented you.

If a node genuinely lacks a detail you need, `graft ask` for a more specific
node before falling back to source. Reading whole source files to build
understanding is the thing graft exists to replace — it already did that work.
