import assert from 'node:assert/strict';
import { checkFeatureBoundaries } from '../../scripts/check-feature-boundaries.mjs';

assert.deepEqual(
  await checkFeatureBoundaries(new URL('../../src', import.meta.url)),
  [],
);
