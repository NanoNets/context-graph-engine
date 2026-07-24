# src/graph/map.ts

Builds a structured representation of a repository's file and symbol organization based on their relationships, facilitating easier navigation and understanding of the codebase.

- Hub · interface · L27-L33 — Defines the structure of a hub in the repository map, capturing its essential attributes for identification and ranking.
- DirEntry · interface · L35-L47 — Represents a directory entry in the repository map, summarizing its contents and associated hubs for better navigation.
- ScopeGroup · interface · L52-L59 — interface ScopeGroup
- RepoMap · interface · L61-L81 — Encapsulates the entire repository map structure, providing a comprehensive overview of files, symbols, and their relationships.
- BuildRepoMapOptions · interface · L83-L90 — Specifies options for building the repository map, allowing customization of directory and hub limits.
- dirKey · function · L102-L105 — Generates a directory key based on the specified depth, facilitating the grouping of files in the repository map.
- computeInDegree · function · L110-L117 — Calculates the in-degree of nodes in the graph, determining the number of incoming edges for each target, which is crucial for identifying hubs.
- topHubs · function · L122-L128 — Identifies the top hubs based on in-degree, ensuring that only significant nodes are included in the repository map.
- sortedLanguages · function · L130-L137 — Sorts and deduplicates the programming languages used in the repository, enhancing the metadata of the repository map.
- computeDirEntries · function · L150-L220 — function computeDirEntries( nodes: NodeV1[], inDegree: Map<string, number>, maxDirs: number, hubsPerDir: number, stripPrefix: string, ): { dirs: DirEntry[]; dropped: number }
- relPath · function · L160-L161 — relPath = (path: string): string
- depthFor · function · L181-L181 — depthFor = (rp: string): number
- fullPath · function · L197-L198 — fullPath = (relKey: string): string
- buildRepoMap · function · L233-L283 — Constructs the repository map from a given graph, organizing files and symbols into a structured format for easy access.
- basenameOf · function · L287-L290 — Extracts the base name from a file path, simplifying the representation of file names in the output.
- formatDirHub · function · L292-L294 — Formats a hub's information for display, providing a user-friendly representation of its attributes.
- formatDirLine · function · L296-L305 — Formats a directory entry for display, summarizing its contents and associated hubs in a readable format.
- formatHotspot · function · L307-L309 — Formats a hotspot's information for display, detailing its attributes in a clear manner.
- droppedNote · function · L312-L315 — function droppedNote(dropped: number): string | null
- formatRepoMap · function · L323-L348 — Renders the repository map as a human-readable string, summarizing its contents and structure for easy understanding.
