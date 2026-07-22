# src/claude/state.ts

- Stats · interface · L4-L9 — interface Stats
- SessionState · interface · L10-L20 — interface SessionState
- emptyStats · function · L24-L27 — function emptyStats(): Stats
- emptySession · function · L28-L30 — function emptySession(): SessionState
- cacheDir · function · L32-L32 — function cacheDir(projectDir: string): string
- statsPath · function · L33-L33 — function statsPath(d: string): string
- sessionPath · function · L34-L34 — function sessionPath(d: string, id: string): string
- lockPath · function · L35-L35 — function lockPath(d: string): string
- readJson · function · L37-L39 — function readJson<T>(p: string): T | null
- writeJsonAtomic · function · L40-L45 — function writeJsonAtomic(p: string, value: unknown): void
- readStats · function · L47-L47 — function readStats(d: string): Stats | null
- writeStats · function · L48-L48 — function writeStats(d: string, s: Stats): void
- patchStats · function · L51-L55 — function patchStats(d: string, patch: Partial<Stats>): Stats
- readSession · function · L56-L58 — function readSession(d: string, id: string): SessionState
- writeSession · function · L59-L61 — function writeSession(d: string, id: string, s: SessionState): void
- acquireLock · function · L63-L79 — function acquireLock(d: string): boolean
- releaseLock · function · L80-L80 — function releaseLock(d: string): void
