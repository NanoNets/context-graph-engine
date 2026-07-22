# src/ai/synthesize.ts · [[code-summarization-and-synthesis]]

This file defines the architecture for synthesizing a graph of nodes from file summaries, enabling a structured representation of a codebase.

- SynthLink · interface · L12-L16 — Defines the structure of a directed edge between nodes, specifying relationships in the synthesized graph.
- SynthNode · interface · L19-L27 — Represents a node in the synthesized graph, encapsulating its name, type, summary, sources, and links to other nodes.
- FileSummary · interface · L30-L33 — Holds the summary information for a single file, including its path and a descriptive summary.
- Synthesizer · interface · L35-L37 — Defines the interface for synthesizers that convert file summaries into structured nodes.
- userContent · function · L93-L98 — Constructs a formatted string from an array of file summaries, ensuring it does not exceed a specified character limit.
- clean · function · L101-L123 — Normalizes and cleans a raw model response into a structured array of SynthNode objects.
- OpenRouterSynthesizer · class · L135-L164 — Implements the Synthesizer interface using OpenRouter's API to generate nodes from file summaries.
- constructor · method · L139-L142 — Initializes the OpenRouterSynthesizer with API key, model, and optional base URL for the OpenAI client.
- synthesize · method · L144-L163 — Processes an array of file summaries to produce a structured array of SynthNode objects by interacting with the OpenAI API.
