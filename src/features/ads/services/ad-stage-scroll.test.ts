import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextScrollStep,
  getScrollButtonState,
  wrapAdScrollPosition,
} from './ad-stage-scroll';

test('getScrollButtonState correctly calculates scroll limits for ltr', () => {
  // At start
  const atStart = getScrollButtonState(0, 1000, 300, 'ltr');
  assert.equal(atStart.canScrollLeft, false);
  assert.equal(atStart.canScrollRight, true);

  // In middle
  const inMiddle = getScrollButtonState(300, 1000, 300, 'ltr');
  assert.equal(inMiddle.canScrollLeft, true);
  assert.equal(inMiddle.canScrollRight, true);

  // At end (700 maxScroll)
  const atEnd = getScrollButtonState(700, 1000, 300, 'ltr');
  assert.equal(atEnd.canScrollLeft, true);
  assert.equal(atEnd.canScrollRight, false);
});

test('calculateNextScrollStep wraps continuously at loop points', () => {
  // LTR: normal step
  const ltrStep = calculateNextScrollStep(50, 10, 500, 'ltr');
  assert.equal(ltrStep, 60);

  // LTR: wrap point reached
  const ltrWrap = calculateNextScrollStep(500, 10, 500, 'ltr');
  assert.equal(ltrWrap, 0);

  // RTL: normal step
  const rtlStep = calculateNextScrollStep(-50, 10, 500, 'rtl');
  assert.equal(rtlStep, -60);
});
