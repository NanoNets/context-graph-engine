# src/graph/resolve.ts

This file resolves raw edge intents into concrete edges by matching names against a node index, ensuring accurate relationships between nodes.

- GoModule · interface · L23-L26 — interface GoModule
- ResolveOptions · interface · L28-L33 — interface ResolveOptions
- resolveEdges · function · L35-L90 — This function processes raw edges and establishes relationships between nodes based on their types and specified relations.
- add · function · L62-L67 — This function adds a new edge to the output if it hasn't been seen before, preventing duplicate edges in the result.
- push · function · L92-L96 — This function adds a value to an array in a map, creating the array if it doesn't exist, facilitating grouped storage of nodes.
- resolveName · function · L102-L114 — This function resolves a symbol name to its corresponding node ID, prioritizing local matches and handling ambiguities appropriately.
- resolveImport · function · L120-L132 — This function resolves a module specifier to a file node ID if it points within the repository, ensuring correct imports.
- resolveGoImport · function · L144-L159 — function resolveGoImport(spec: string, modules: GoModule[], filesByDir: Map<string, string[]>): string
