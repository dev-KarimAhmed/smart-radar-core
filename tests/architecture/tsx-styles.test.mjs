import assert from 'node:assert/strict';
import { checkTsxStyles } from '../../scripts/check-tsx-styles.mjs';

const violations = await checkTsxStyles(new URL('../../src', import.meta.url));

assert.deepEqual(
  violations,
  [],
  violations.map((item) => `${item.file}:${item.line} ${item.reason}`).join('\n'),
);
