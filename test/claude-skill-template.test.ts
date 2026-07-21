import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skillTemplate } from '../src/claude/skill-template.js';

test('skill template is a well-formed SKILL.md', () => {
  const src = skillTemplate();
  assert.ok(src.startsWith('---\n'), 'starts with YAML frontmatter');
  assert.match(src, /^name: graft$/m, 'declares name: graft');
  assert.match(src, /^description:/m, 'has a description');
  const body = src.split(/\n---\n/)[1] ?? '';
  assert.ok(body.trim().length > 0, 'has a non-empty body');
  assert.match(body, /graft ask/, 'body tells the agent to use `graft ask`');
});
