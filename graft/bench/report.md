# bench/report.ts · [[benchmarking-framework]] [[benchmarking-results-reporting]] [[caching-mechanism]]

This file provides functionality for aggregating and reporting benchmark results for different agent configurations.

- Arm · type · L6-L6 — type Arm = "cold" | "graph" | "pull";
- Row · interface · L8-L30 — Defines the structure of a benchmark trial row, capturing various metrics related to agent performance.
- costOf · function · L37-L42 — Calculates the approximate cost of running an agent based on input and output tokens and cache operations.
- mean · function · L44-L46 — Computes the mean of an array of numbers, returning zero for an empty array.
- ArmAgg · interface · L48-L58 — Represents aggregated metrics for a specific arm of the benchmark, including totals and averages.
- aggregate · function · L60-L72 — Aggregates multiple benchmark rows into a single ArmAgg object, calculating averages for various metrics.
- pctDelta · function · L74-L78 — Calculates the percentage delta between two values, handling the case where the first value is zero.
- fmt · function · L80-L82 — Formats a number for display, adjusting for thousands and decimal precision.
- metricTable · function · L88-L114 — function metricTable(rows: Row[], arms: Arm[]): string[]
- cells · function · L93-L102 — cells = (label: string, value: (a: ArmAgg) => number, render: (v: number) => string, delta?: (c: number, x: number) => string)
- verdictFor · function · L117-L127 — function verdictFor(label: string, c: ArmAgg, g: ArmAgg): string
- buildMarkdown · function · L129-L175 — Generates a markdown report summarizing benchmark results across different corpora and arms.
