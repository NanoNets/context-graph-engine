# src/claude/state.ts

- Stats · interface · L4-L9 — interface Stats
- SessionState · interface · L10-L16 — interface SessionState
- emptyStats · function · L20-L23 — function emptyStats(): Stats
- emptySession · function · L24-L26 — function emptySession(): SessionState
- cacheDir · function · L28-L28 — function cacheDir(projectDir: string): string
- statsPath · function · L29-L29 — function statsPath(d: string): string
- sessionPath · function · L30-L30 — function sessionPath(d: string, id: string): string
- lockPath · function · L31-L31 — function lockPath(d: string): string
- readJson · function · L33-L35 — function readJson<T>(p: string): T | null
- writeJsonAtomic · function · L36-L41 — function writeJsonAtomic(p: string, value: unknown): void
- readStats · function · L43-L43 — function readStats(d: string): Stats | null
- writeStats · function · L44-L44 — function writeStats(d: string, s: Stats): void
- patchStats · function · L47-L51 — function patchStats(d: string, patch: Partial<Stats>): Stats
- readSession · function · L52-L54 — function readSession(d: string, id: string): SessionState
- writeSession · function · L55-L57 — function writeSession(d: string, id: string, s: SessionState): void
- acquireLock · function · L59-L75 — function acquireLock(d: string): boolean
- releaseLock · function · L76-L76 — function releaseLock(d: string): void
