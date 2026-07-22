---
name: Caching Mechanism
slug: caching-mechanism
type: concept
sources:
  - path: bench/agent.ts
    hash: e10d64f913c9517cef84cce58ea042d71bed3e94182c791245170eca54060e31
  - path: bench/report.ts
    hash: 775be8c40a8e4172521bba8f6a1f026fa23c4d24b9b5225da3ed5b745077a5b0
  - path: src/context/build.ts
    hash: 8c614e5dc6b1ef2d6949016ce7480099f95f021ea6b0882f2919397f97a68ce7
sources_digest: 0393dee6bf242715500eeac001ca94cd9c7ff05d644d8e36d58e9c7fd2e0eab9
links:
  - to: benchmarking-framework
    relation: validates
    description: Ensures that caching is effectively utilized in benchmarking.
generator:
  version: 1
covers:
  - symbol: AgentResult
    kind: interface
    at: 'bench/agent.ts:L20-L28'
  - symbol: RunAgentOptions
    kind: interface
    at: 'bench/agent.ts:L30-L42'
  - symbol: safePath
    kind: function
    at: 'bench/agent.ts:L51-L65'
  - symbol: listFiles
    kind: function
    at: 'bench/agent.ts:L67-L94'
  - symbol: walk
    kind: function
    at: 'bench/agent.ts:L69-L91'
  - symbol: globToRegExp
    kind: function
    at: 'bench/agent.ts:L97-L111'
  - symbol: runTool
    kind: function
    at: 'bench/agent.ts:L207-L277'
  - symbol: runAgent
    kind: function
    at: 'bench/agent.ts:L279-L376'
  - symbol: slideCacheBreakpoint
    kind: function
    at: 'bench/agent.ts:L308-L314'
  - symbol: Arm
    kind: type
    at: 'bench/report.ts:L6-L6'
  - symbol: Row
    kind: interface
    at: 'bench/report.ts:L8-L30'
  - symbol: costOf
    kind: function
    at: 'bench/report.ts:L37-L42'
  - symbol: mean
    kind: function
    at: 'bench/report.ts:L44-L46'
  - symbol: ArmAgg
    kind: interface
    at: 'bench/report.ts:L48-L58'
  - symbol: aggregate
    kind: function
    at: 'bench/report.ts:L60-L72'
  - symbol: pctDelta
    kind: function
    at: 'bench/report.ts:L74-L78'
  - symbol: fmt
    kind: function
    at: 'bench/report.ts:L80-L82'
  - symbol: metricTable
    kind: function
    at: 'bench/report.ts:L88-L114'
  - symbol: cells
    kind: function
    at: 'bench/report.ts:L93-L102'
  - symbol: verdictFor
    kind: function
    at: 'bench/report.ts:L117-L127'
  - symbol: buildMarkdown
    kind: function
    at: 'bench/report.ts:L129-L175'
  - symbol: BuildProgress
    kind: interface
    at: 'src/context/build.ts:L47-L52'
  - symbol: BuildOptions
    kind: interface
    at: 'src/context/build.ts:L54-L64'
  - symbol: BuildResult
    kind: interface
    at: 'src/context/build.ts:L66-L75'
  - symbol: BuildCache
    kind: interface
    at: 'src/context/build.ts:L78-L81'
  - symbol: FileWork
    kind: interface
    at: 'src/context/build.ts:L83-L87'
  - symbol: NodeDraft
    kind: interface
    at: 'src/context/build.ts:L90-L97'
  - symbol: buildContext
    kind: function
    at: 'src/context/build.ts:L99-L266'
  - symbol: batchBySize
    kind: function
    at: 'src/context/build.ts:L269-L285'
  - symbol: batchKey
    kind: function
    at: 'src/context/build.ts:L288-L295'
  - symbol: registerName
    kind: function
    at: 'src/context/build.ts:L297-L300'
  - symbol: resolveSlug
    kind: function
    at: 'src/context/build.ts:L302-L304'
  - symbol: errMsg
    kind: function
    at: 'src/context/build.ts:L306-L308'
  - symbol: cachePath
    kind: function
    at: 'src/context/build.ts:L310-L312'
  - symbol: loadCache
    kind: function
    at: 'src/context/build.ts:L314-L325'
  - symbol: saveCache
    kind: function
    at: 'src/context/build.ts:L327-L331'
  - symbol: mapWithConcurrency
    kind: function
    at: 'src/context/build.ts:L334-L349'
---
<!-- context:generated:start -->
## Summary

This concept involves the use of caching to optimize performance and reduce costs associated with repeated prompts in the benchmarking process.

## Related

- validates [[benchmarking-framework]] — Ensures that caching is effectively utilized in benchmarking.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
