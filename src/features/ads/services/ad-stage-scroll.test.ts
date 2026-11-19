import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextScrollStep,
  getScrollButtonState,
  getSeamlessManualScrollStart,
  wrapAdScrollPosition,
} from './ad-stage-scroll';

test('getScrollButtonState correctly calculates scroll limits for ltr and rtl', () => {
  const atStart = getScrollButtonState(0, 1000, 300, 'ltr');
  assert.equal(atStart.canScrollLeft, false);
  assert.equal(atStart.canScrollRight, true);

  const inMiddle = getScrollButtonState(300, 1000, 300, 'ltr');
  assert.equal(inMiddle.canScrollLeft, true);
  assert.equal(inMiddle.canScrollRight, true);

  const atEnd = getScrollButtonState(700, 1000, 300, 'ltr');
  assert.equal(atEnd.canScrollLeft, true);
  assert.equal(atEnd.canScrollRight, false);

  const rtlAtStart = getScrollButtonState(0, 1000, 300, 'rtl');
  assert.equal(rtlAtStart.canScrollRight, false);
  assert.equal(rtlAtStart.canScrollLeft, true);
});

test('calculateNextScrollStep advances LTR (left-to-right) and RTL (right-to-left) and wraps cleanly', () => {
  // LTR (English): advances positively from 0 -> singleSetWidth
  assert.equal(calculateNextScrollStep(50, 10, 500, 'ltr'), 60);
  assert.equal(calculateNextScrollStep(500, 10, 500, 'ltr'), 0);
  // Switching from RTL negative position into LTR normalizes cleanly
  assert.equal(calculateNextScrollStep(-120, 10, 500, 'ltr'), 10);

  // RTL (Arabic): advances negatively from 0 -> -singleSetWidth
  assert.equal(calculateNextScrollStep(-50, 10, 500, 'rtl'), -60);
  assert.equal(calculateNextScrollStep(-500, 10, 500, 'rtl'), 0);
  // Switching from LTR positive position into RTL normalizes cleanly
  assert.equal(calculateNextScrollStep(120, 10, 500, 'rtl'), -10);
});

test('getSeamlessManualScrollStart enables infinite manual stepping at edges', () => {
  // LTR clicking left at start jumps forward by one set before scrolling left
  assert.equal(getSeamlessManualScrollStart(0, -300, 600, 1200, 'ltr'), 600);
  // RTL clicking right at start jumps backward by one set before scrolling right
  assert.equal(getSeamlessManualScrollStart(0, 300, 600, 1200, 'rtl'), -600);
  // Mid-track returns null (no jump needed)
  assert.equal(getSeamlessManualScrollStart(300, -200, 600, 1200, 'ltr'), null);
  assert.equal(wrapAdScrollPosition('rtl', -650, 600), -50);
});
