# test/claude-hooks.test.ts · [[testing-and-validation]]

This file contains tests for the functionality of the graft hooks in the Claude project, ensuring that edits are detected and state is managed correctly.

- runWithStdin · function · L39-L42 — This function sets up the environment to run a given asynchronous function with specified input from stdin, managing the environment variable for the duration of the execution.
- fakeBuild · function · L85-L88 — This function simulates a build process by writing a mock wiring.json file to the specified directory, allowing tests to verify behavior based on the build output.
- writeMultiScopeWiring · function · L127-L146 — function writeMultiScopeWiring(d: string): void
- writeAskArgsStub · function · L248-L259 — function writeAskArgsStub(d: string): { stub: string; argsFile: string }
