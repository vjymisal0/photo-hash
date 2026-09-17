import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('CommonJS entry point exposes the public API', () => {
  const api = require('../src/index.cjs');
  assert.equal(typeof api, 'object');
});
