function shim(entryFile: string, call: string): string {
  return `#!/usr/bin/env node
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
import(entry(${JSON.stringify(entryFile)})).then((m) => ${call}).catch(() => { /* graft unavailable — no-op */ });
`;
}

export function statuslineShim(): string { return shim('statusline.js', 'm.main()'); }
export function hooksShim(): string { return shim('hooks.js', 'm.main(process.argv[2])'); }
