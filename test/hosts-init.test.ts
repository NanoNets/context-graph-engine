import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runHostsInit } from '../src/hosts/init.js';

function fresh(): string { return mkdtempSync(join(tmpdir(), 'graft-hostsinit-')); }

test('writes only detected hosts by default', () => {
  const home = fresh(); const repo = fresh();
  mkdirSync(join(home, '.cursor'));
  const r = runHostsInit(repo, { home });
  assert.deepEqual(r.written.map((w) => w.id), ['cursor']);
  const mdc = readFileSync(join(repo, '.cursor', 'rules', 'graft.mdc'), 'utf8');
  assert.match(mdc, /alwaysApply: true/);
  assert.ok(!existsSync(join(repo, 'AGENTS.md')));
});

test('explicit agents list overrides detection and flags unknown ids', () => {
  const home = fresh(); const repo = fresh();
  const r = runHostsInit(repo, { home, agents: ['gemini', 'nope'] });
  assert.deepEqual(r.written.map((w) => w.id), ['gemini']);
  assert.deepEqual(r.unknown, ['nope']);
  assert.ok(readFileSync(join(repo, 'GEMINI.md'), 'utf8').includes('graft ask'));
});

test('all writes every host and re-run converges (idempotent)', () => {
  const home = fresh(); const repo = fresh();
  const first = runHostsInit(repo, { home, all: true });
  assert.equal(first.written.length, 6);
  const second = runHostsInit(repo, { home, all: true });
  assert.ok(second.written.every((w) => w.action === 'unchanged'));
  const agents = readFileSync(join(repo, 'AGENTS.md'), 'utf8');
  assert.equal(agents.match(/graft:start/g)!.length, 1);
});

test('preserves user content around the fenced section', () => {
  const home = fresh(); const repo = fresh();
  const target = join(repo, '.github', 'copilot-instructions.md');
  mkdirSync(join(repo, '.github'), { recursive: true });
  writeFileSync(target, '# House rules\n');
  const r = runHostsInit(repo, { home });
  assert.deepEqual(r.written.map((w) => w.id), ['copilot']);
  const text = readFileSync(target, 'utf8');
  assert.ok(text.startsWith('# House rules'));
  assert.ok(text.includes('graft ask'));
});

test('CLI: graft init --agents gemini writes GEMINI.md and exits 0', () => {
  const repo = fresh();
  execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'init', repo, '--no-build', '--agents', 'gemini'], {
    encoding: 'utf8',
  });
  assert.ok(readFileSync(join(repo, 'GEMINI.md'), 'utf8').includes('graft ask'));
});

test('CLI: unknown agent id exits non-zero', () => {
  const repo = fresh();
  assert.throws(() =>
    execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'init', repo, '--no-build', '--agents', 'nope'], {
      encoding: 'utf8', stdio: 'pipe',
    }),
  );
});
