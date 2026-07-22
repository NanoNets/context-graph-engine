# src/ask/ask.ts

This file implements a query tool that routes natural language queries to relevant code symbols and returns structured context information.

- AskHit · interface · L26-L39 — Represents a hit in the query results, encapsulating details about a code symbol and its context.
- AskResult · interface · L45-L62 — Encapsulates the result of a query, including the query string, mode of operation, and the hits found.
- firstProse · function · L65-L72 — Extracts the first meaningful prose line from a body of text, ignoring headings and blank lines.
- Corpus · interface · L74-L81 — Defines the structure for a corpus containing concepts and a graph, used for processing queries.
- loadCorpus · function · L83-L108 — Loads a corpus from a specified directory, extracting concepts and building a graph for query processing.
- score · function · L117-L128 — Calculates a score for a document's token counts against a query, facilitating relevance ranking.
- idfFromDf · function · L134-L138 — function idfFromDf(df: Map<string, number>, n: number): Map<string, number>
- computeIdf · function · L140-L145 — function computeIdf(docBags: Array<Set<string>>): Map<string, number>
- computeIdfFromIndex · function · L154-L159 — function computeIdfFromIndex(index: AskIndex, conceptBags: Array<Set<string>>): Map<string, number>
- bm25 · function · L166-L182 — function bm25( query: Map<string, number>, doc: Map<string, number>, idf: Map<string, number>, dl: number, avgdl: number, ): number
- subjectWords · function · L194-L196 — function subjectWords(query: string): string[]
- findSubjectNodes · function · L206-L213 — function findSubjectNodes(query: string, graph: GraphV1): { nodes: NodeV1[]; tried: string }
- StructuralOutcome · type · L221-L221 — type StructuralOutcome = { result: AskResult } | { fallthroughNote: string } | null;
- fallthroughNoteFor · function · L223-L228 — function fallthroughNoteFor(subject: string): string
- structural · function · L230-L279 — Processes a structural query to find and return relevant callers or callees from the graph based on the query.
- hasTerm · function · L298-L300 — function hasTerm(f: Map<string, number>, t: string): boolean
- matchedIdfShare · function · L309-L323 — function matchedIdfShare( q: Map<string, number>, fields: Array<Map<string, number>>, idf: Map<string, number>, dfltIdf: number, ): number
- lexical · function · L325-L487 — Ranks concepts and symbols based on lexical matching with the query, returning the most relevant results.
- bodyLen · function · L416-L420 — bodyLen = (m: Map<string, number>)
- AskOptions · interface · L489-L505 — Defines options for customizing the behavior of the ask function, such as context directory and result limits.
- parseSpan · function · L509-L513 — Parses a string pointer into its file path and line range components, facilitating source code navigation.
- sliceSpan · function · L517-L532 — Reads a specified range of lines from a source file, allowing for inlined code snippets in query results.
- inlineSource · function · L539-L556 — Attaches inlined source code to query hits, enhancing the context provided to the user.
- hitFiles · function · L560-L569 — function hitFiles(hits: AskHit[]): Set<string>
- baselineFor · function · L574-L589 — function baselineFor(hits: AskHit[], graph: GraphV1 | null): AskResult["saved"] | undefined
- ask · function · L592-L622 — Processes a query against a code graph, returning structured results based on the query type and context.
- SkeletonEntry · interface · L626-L633 — interface SkeletonEntry
- SkeletonResult · interface · L635-L639 — interface SkeletonResult
- skeleton · function · L644-L673 — function skeleton(dir: string, file: string, opts: { contextDir?: string } = {}): SkeletonResult
- startLine · function · L661-L661 — startLine = (span: string)
- formatSkeleton · function · L676-L685 — function formatSkeleton(r: SkeletonResult): string
- toTokens · function · L688-L690 — function toTokens(chars: number): number
- formatAsk · function · L693-L731 — Formats the results of a query into a markdown context pack for easy readability and presentation.
- savingsFooter · function · L736-L748 — function savingsFooter(r: AskResult, body: string): string
