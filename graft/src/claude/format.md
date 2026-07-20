# src/claude/format.ts

- enrichedSegment · function · L13-L17 — function enrichedSegment(s: Stats): string | null
- freshnessSegment · function · L19-L24 — function freshnessSegment(s: Stats): string
- renderStatusline · function · L26-L48 — function renderStatusline( stats: Stats | null, session: SessionState | null, ctx: { ctxPct: number | null }, ): string[]
- nodeIdsInFile · function · L50-L56 — function nodeIdsInFile(w: GraphV1, filePath: string): Set<string>
- incomingEdges · function · L58-L62 — function incomingEdges(w: GraphV1, filePath: string): EdgeV1[]
- formatBlastRadius · function · L64-L75 — function formatBlastRadius(w: GraphV1, filePath: string, cap = 8): string | null
- AskJson · interface · L77-L82 — interface AskJson
- tokensOf · function · L84-L84 — function tokensOf(chars: number): number
- retrievalBody · function · L89-L99 — function retrievalBody(hits: AskJson['hits']): string
- retrievalTokensSaved · function · L102-L108 — function retrievalTokensSaved(ask: AskJson, cap = 5): number
- formatRetrieval · function · L110-L123 — function formatRetrieval(ask: AskJson, cap = 5): string | null
- formatOrientation · function · L125-L127 — function formatOrientation(indexMd: string, budgetBytes = 1500): string
- renderSubagent · function · L129-L133 — function renderSubagent(agentName: string, session: SessionState | null): string
