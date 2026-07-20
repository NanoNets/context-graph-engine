# src/ask/ask.ts

This file implements a query tool that routes natural language queries to relevant code symbols and returns structured context information.

- AskHit · interface · L23-L36 — Represents a hit in the query results, encapsulating details about a code symbol and its context.
- AskResult · interface · L42-L53 — Encapsulates the result of a query, including the query string, mode of operation, and the hits found.
- tokenize · function · L62-L68 — Transforms a string of text into an array of lowercased subword tokens, filtering out common stop words.
- counts · function · L71-L75 — Creates a frequency count map of tokens, allowing for analysis of term occurrences in a document.
- firstProse · function · L78-L85 — Extracts the first meaningful prose line from a body of text, ignoring headings and blank lines.
- Corpus · interface · L87-L90 — Defines the structure for a corpus containing concepts and a graph, used for processing queries.
- loadCorpus · function · L92-L117 — Loads a corpus from a specified directory, extracting concepts and building a graph for query processing.
- score · function · L120-L127 — Calculates a score for a document's token counts against a query, facilitating relevance ranking.
- findSubject · function · L137-L155 — Identifies the most relevant symbols in the graph that match the query, prioritizing exact name matches.
- structural · function · L157-L198 — Processes a structural query to find and return relevant callers or callees from the graph based on the query.
- lexical · function · L202-L246 — Ranks concepts and symbols based on lexical matching with the query, returning the most relevant results.
- AskOptions · interface · L248-L254 — Defines options for customizing the behavior of the ask function, such as context directory and result limits.
- parseSpan · function · L258-L262 — Parses a string pointer into its file path and line range components, facilitating source code navigation.
- sliceSpan · function · L266-L281 — Reads a specified range of lines from a source file, allowing for inlined code snippets in query results.
- inlineSource · function · L284-L291 — Attaches inlined source code to query hits, enhancing the context provided to the user.
- hitFiles · function · L295-L304 — function hitFiles(hits: AskHit[]): Set<string>
- baselineFor · function · L309-L324 — function baselineFor(hits: AskHit[], graph: GraphV1 | null): AskResult["saved"] | undefined
- ask · function · L327-L347 — Processes a query against a code graph, returning structured results based on the query type and context.
- toTokens · function · L350-L352 — function toTokens(chars: number): number
- formatAsk · function · L355-L379 — Formats the results of a query into a markdown context pack for easy readability and presentation.
- savingsFooter · function · L384-L396 — function savingsFooter(r: AskResult, body: string): string
