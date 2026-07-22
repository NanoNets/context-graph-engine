# src/graph/extract.ts

This module extracts structured data from source files into a normalized format for further processing.

- Language · type · L17-L17 — Defines the supported programming languages for extraction.
- languageOf · function · L20-L27 — Determines the programming language of a given file path.
- RawEdge · interface · L33-L41 — Represents an unresolved edge in the extraction process, linking nodes in the graph.
- ExtractResult · interface · L43-L46 — Holds the result of the extraction process, containing nodes and raw edges.
- searchBody · function · L63-L66 — function searchBody(text: string, max = MAX_BODY_CHARS): string
- fileResidual · function · L74-L85 — function fileResidual(source: string, symbols: NodeV1[]): string
- WalkCtx · interface · L132-L140 — Context for walking through the syntax tree during extraction, maintaining state and scope.
- DefDescriptor · interface · L143-L149 — Describes a definition in the syntax tree, including its name and type.
- parseSource · function · L157-L159 — function parseSource(source: string): Parser.SyntaxNode
- extractFile · function · L161-L198 — Extracts nodes and edges from a source file based on its syntax tree.
- walk · function · L200-L261 — Recursively traverses the syntax tree to collect definitions and their relationships.
- describe · function · L265-L296 — Identifies and describes definitions in the syntax tree based on their node types.
- describeGo · function · L301-L339 — function describeGo(node: Parser.SyntaxNode, _ctx: WalkCtx): DefDescriptor | null
- goReceiverType · function · L343-L349 — function goReceiverType(node: Parser.SyntaxNode): string | null
- goExported · function · L353-L357 — function goExported(name: string): boolean
- heritageEdges · function · L359-L386 — Generates edges representing class inheritance and implementation relationships.
- calleeName · function · L388-L409 — Extracts the name of a function or method being called in the syntax tree.
- isImport · function · L411-L416 — Determines if a node represents an import statement in the syntax tree.
- importSpecifier · function · L418-L434 — Extracts the module name from an import statement in the syntax tree.
- clean · function · L437-L444 — Cleans and normalizes a function signature by removing unnecessary whitespace and punctuation.
- tsExported · function · L447-L454 — Checks if a node is exported based on its ancestor nodes in the syntax tree.
