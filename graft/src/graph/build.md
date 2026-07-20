# src/graph/build.ts · [[error-handling-and-reporting]] [[graph-construction]]

This file defines the logic to build a graph representation from source code files in a repository.

- GraphBuildOptions · interface · L22-L35 — This interface specifies options for customizing the graph build process, including output directory and summarization settings.
- GraphBuildResult · interface · L37-L50 — This interface outlines the structure of the result returned from the graph build process, detailing the generated graph's metadata and statistics.
- listSourceFiles · function · L53-L55 — This function retrieves a list of source files from a given directory, excluding the output directory and unsupported languages.
- buildGraph · function · L57-L146 — This function orchestrates the process of reading source files, extracting nodes and edges, and writing the resulting graph to a file.
