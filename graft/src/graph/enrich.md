# src/graph/enrich.ts

This file implements a mechanism to enrich graph nodes with summaries and cruxes based on their state and prior computations.

- EnrichOptions · interface · L31-L38 — This interface defines options for enriching graph nodes, including whether to compute new summaries and the level of concurrency for processing.
- EnrichStats · interface · L40-L46 — Tracks the statistics of the enrichment process, including counts of cached, computed, stale, and pending nodes.
- enrichGraph · function · L48-L136 — This function processes graph nodes to update their summaries and cruxes based on their state and prior data, potentially invoking an LLM for new computations.
- mapWithConcurrency · function · L139-L154 — This function executes a provided asynchronous function over a list of items with a specified limit on concurrent executions, preserving the order of results.
- collectFileCrux · function · L161-L181 — Collects crux information for nodes in a file, handling potential errors and ensuring partial results are returned.
- buildCrux · function · L188-L203 — Extracts and formats the crux text from a source file based on the model's provided line range.
- spanLines · function · L206-L212 — Parses a line span string into a clamped range of line numbers, ensuring valid boundaries.
