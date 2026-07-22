# src/graph/traverse.ts

- SymbolMatch · interface · L18-L20 — interface SymbolMatch
- ResolveSymbolOptions · interface · L22-L25 — interface ResolveSymbolOptions
- resolveSymbol · function · L59-L84 — function resolveSymbol(graph: GraphV1, query: string, opts: ResolveSymbolOptions = {}): NodeV1[]
- symbolMatches · function · L86-L95 — function symbolMatches(nodes: NodeV1[], lowerQuery: string): NodeV1[]
- EdgeHit · interface · L100-L105 — interface EdgeHit
- callersOf · function · L108-L116 — function callersOf(graph: GraphV1, symbol: NodeV1): EdgeHit[]
- calleesOf · function · L119-L127 — function calleesOf(graph: GraphV1, symbol: NodeV1): EdgeHit[]
- impactOf · function · L135-L137 — function impactOf(graph: GraphV1, symbol: NodeV1, maxDepth = 2): EdgeHit[]
- impactOfMany · function · L153-L184 — function impactOfMany(graph: GraphV1, seeds: NodeV1[], maxDepth = 2): EdgeHit[]
- symbolsInFile · function · L188-L190 — function symbolsInFile(graph: GraphV1, fileNode: NodeV1): NodeV1[]
- impactOfFile · function · L201-L203 — function impactOfFile(graph: GraphV1, fileNode: NodeV1, maxDepth = 2): EdgeHit[]
