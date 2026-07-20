import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readWiring, computeStats } from './stats.js';
import { patchStats, releaseLock } from './state.js';

/** MONEY GUARD: plain `graft build` only — structural, $0, offline. Never --deep. */
function realBuild(dir: string): void {
  execFileSync(process.execPath, [join(dir, 'dist', 'cli.js'), 'build', '.'],
    { cwd: dir, stdio: 'ignore', timeout: 120000 });
}

export function runSync(dir: string, build: (d: string) => void = realBuild): void {
  try {
    build(dir);
    const w = readWiring(dir);
    const patch: Record<string, unknown> = { dirty: false, staleCount: 0, syncing: false, syncedAt: new Date().toISOString() };
    if (w) Object.assign(patch, computeStats(w));
    patchStats(dir, patch);
  } catch {
    patchStats(dir, { syncing: false }); // leave dirty=true; retry next turn
  } finally {
    releaseLock(dir);
  }
}

export function main(): void {
  const dir = process.argv[2];
  if (dir) runSync(dir);
}
main();
