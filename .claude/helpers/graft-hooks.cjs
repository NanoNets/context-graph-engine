#!/usr/bin/env node
const path = require('path');
const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
function entry(name) {
  try {
    const pkg = require.resolve('@nanonets/graft/package.json', { paths: [dir] });
    return path.join(path.dirname(pkg), 'dist', 'claude', name);
  } catch {
    return path.join(dir, 'dist', 'claude', name);
  }
}
import(entry("hooks.js")).then((m) => m.main(process.argv[2])).catch(() => { /* graft unavailable — no-op */ });
