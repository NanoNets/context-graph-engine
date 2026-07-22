# bench/tasks.ts · [[benchmarking-framework]] [[task-management]]

This file defines benchmark tasks and their corresponding reference answers for validating code understanding across multiple repositories.

- repoPath · function · L30-L33 — This function determines the file path for sibling repositories, allowing for environment variable overrides.
- Task · interface · L35-L45 — This interface outlines the structure of a benchmark task, including its ID, question, reference answer, and required keywords.
- Corpus · interface · L47-L53 — This interface defines a corpus of benchmark tasks, specifying its ID, type, path, and associated tasks.
