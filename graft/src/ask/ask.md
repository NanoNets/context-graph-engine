# src/ask/ask.ts

This file implements a query tool that routes natural language queries to relevant code symbols and returns structured context information.

- AskHit · interface · L23-L36 — Represents a hit in the query results, encapsulating details about a code symbol and its context.
- AskResult · interface · L42-L49 — Encapsulates the result of a query, including the query string, mode of operation, and the hits found.
- tokenize · function · L58-L64 — Transforms a string of text into an array of lowercased subword tokens, filtering out common stop words.
- counts · function · L67-L71 — Creates a frequency count map of tokens, allowing for analysis of term occurrences in a document.
- firstProse · function · L74-L81 — Extracts the first meaningful prose line from a body of text, ignoring headings and blank lines.
- Corpus · interface · L83-L86 — Defines the structure for a corpus containing concepts and a graph, used for processing queries.
- loadCorpus · function · L88-L113 — Loads a corpus from a specified directory, extracting concepts and building a graph for query processing.
- score · function · L116-L123 — Calculates a score for a document's token counts against a query, facilitating relevance ranking.
- findSubject · function · L133-L151 — Identifies the most relevant symbols in the graph that match the query, prioritizing exact name matches.
- structural · function · L153-L194 — Processes a structural query to find and return relevant callers or callees from the graph based on the query.
- lexical · function · L198-L242 — Ranks concepts and symbols based on lexical matching with the query, returning the most relevant results.
- AskOptions · interface · L244-L250 — Defines options for customizing the behavior of the ask function, such as context directory and result limits.
- parseSpan · function · L254-L258 — Parses a string pointer into its file path and line range components, facilitating source code navigation.
- sliceSpan · function · L262-L277 — Reads a specified range of lines from a source file, allowing for inlined code snippets in query results.
- inlineSource · function · L280-L287 — Attaches inlined source code to query hits, enhancing the context provided to the user.
- ask · function · L290-L305 — Processes a query against a code graph, returning structured results based on the query type and context.
- formatAsk · function · L308-L331 — Formats the results of a query into a markdown context pack for easy readability and presentation.
