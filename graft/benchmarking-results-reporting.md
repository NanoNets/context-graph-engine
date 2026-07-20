---
name: Benchmarking Results Reporting
slug: benchmarking-results-reporting
type: system
sources:
  - path: bench/report.ts
    hash: 775be8c40a8e4172521bba8f6a1f026fa23c4d24b9b5225da3ed5b745077a5b0
sources_digest: f7b46f3036503f43413cb48d25fa6ce54585514fb19e9b4e923c0c5628ce8aed
links:
  - to: benchmarking-framework
    relation: part_of
    description: Integrates with the benchmarking framework to report results.
generator:
  version: 1
covers:
  - symbol: Row
    kind: interface
    at: 'bench/report.ts:L6-L26'
  - symbol: costOf
    kind: function
    at: 'bench/report.ts:L33-L38'
  - symbol: mean
    kind: function
    at: 'bench/report.ts:L40-L42'
  - symbol: ArmAgg
    kind: interface
    at: 'bench/report.ts:L44-L54'
  - symbol: aggregate
    kind: function
    at: 'bench/report.ts:L56-L68'
  - symbol: pctDelta
    kind: function
    at: 'bench/report.ts:L70-L74'
  - symbol: fmt
    kind: function
    at: 'bench/report.ts:L76-L78'
  - symbol: buildMarkdown
    kind: function
    at: 'bench/report.ts:L80-L125'
---
<!-- context:generated:start -->
## Summary

This component aggregates and formats the results of benchmarking trials, providing insights into performance metrics and cost evaluations. It emphasizes clarity in reporting and economic implications.

## Related

- part of [[benchmarking-framework]] — Integrates with the benchmarking framework to report results.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
