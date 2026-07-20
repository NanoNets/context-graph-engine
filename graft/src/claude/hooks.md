# src/claude/hooks.ts

- readStdin · function · L8-L12 — function readStdin(): any
- safeReadFd0 · function · L13-L13 — function safeReadFd0(): string
- projectDir · function · L15-L17 — function projectDir(input: any): string
- underGraft · function · L18-L21 — function underGraft(dir: string, file: string): boolean
- graftCli · function · L24-L27 — function graftCli(dir: string): { cmd: string; pre: string[] }
- graftJson · function · L28-L42 — function graftJson(dir: string, args: string[]): any | null
- checkStaleCount · function · L43-L47 — function checkStaleCount(dir: string): number
- emit · function · L48-L50 — function emit(eventName: string, additionalContext: string): void
- main · function · L52-L110 — async function main(event: string): Promise<void>
