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
  ranked, with file:line pointers.
- Or explore as usual: grep / ls / cat inside `graft/`. A grep for any concept,
  symbol, or filename hits the node that covers it; `graft/INDEX.md` lists them
  all.

**Then work from the node.** Its summary is the answer; its `covers:` list gives
the exact file:line. Open a source file only to edit those lines.

Don't grep or read whole source files to build understanding — graft already
did.
