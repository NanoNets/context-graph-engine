# bench/agent.ts · [[benchmarking-framework]] [[caching-mechanism]]

This file implements a benchmark agent that processes questions about a codebase using filesystem tools and a language model.

- AgentResult · interface · L20-L28 — Defines the structure of the result returned by the agent, encapsulating the answer and various metrics.
- RunAgentOptions · interface · L30-L42 — Specifies the options for running the agent, including the root directory and the question to be answered.
- safePath · function · L51-L65 — Ensures that a given path is safely resolved within a specified root directory, preventing directory traversal attacks.
- listFiles · function · L67-L94 — Recursively lists all files in a directory while respecting size limits and skipping specified directories.
- walk · function · L69-L91 — A helper function that traverses a directory to collect file paths, avoiding hidden files and skipped directories.
- globToRegExp · function · L97-L111 — Converts a glob pattern into a regular expression for matching file paths.
- runTool · function · L207-L277 — Executes a specified tool (like reading a file or listing a directory) based on the provided input parameters.
- runAgent · function · L279-L376 — Manages the execution of the agent's logic, including handling user questions and tool interactions.
- slideCacheBreakpoint · function · L308-L314 — Maintains the cache state by updating the cache control for the most recent tool result in the message history.
