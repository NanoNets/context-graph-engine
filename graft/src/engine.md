# src/engine.ts

The Context Graph Engine builds and checks a code context graph from a repository without a database.

- InitOptions · interface · L26-L31 — Defines options for initializing the context graph build, including code extensions and a progress callback.
- CheckRunOptions · interface · L33-L35 — Specifies options for checking the context graph, allowing for code extensions to be included.
- GraphRunOptions · interface · L37-L43 — Defines options for running the graph building process, including LLM usage and concurrency settings.
- Graft · class · L45-L128 — Encapsulates methods for building and checking a context graph from a code repository.
- constructor · method · L48-L50 — Initializes the Graft class with a configuration, resolving the necessary settings for the context graph.
- init · method · L53-L62 — Builds the context graph from the specified directory, utilizing various options and configurations.
- check · method · L65-L67 — Checks if the committed context graph is in sync with the code in the specified directory.
- checkGraph · method · L70-L72 — Verifies if the committed graph.json file is in sync with the code, focusing on the Tier-1 differences.
- graph · method · L79-L86 — Builds a per-symbol code graph from the repository, optionally using a meaning layer with LLM.
- ask · method · L93-L95 — Processes a query against the committed graph to return relevant information based on structural and lexical ranking.
- requireKey · method · L98-L106 — Ensures that a valid OpenRouter API key is available, throwing an error if it is not set.
- synthesizer · method · L108-L111 — Retrieves the synthesizer instance, creating one if it is not already configured.
- cruxSummarizer · method · L114-L116 — Creates a crux summarizer for the code graph's Tier-2 pass, ensuring it is properly configured.
- summarizer · method · L118-L121 — Obtains the summarizer instance, initializing it if no custom summarizer is provided.
- modelLabel · method · L124-L127 — Determines the human-readable label for the active model used in the context graph.
