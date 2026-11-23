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

  // Negative RTL (Blink / Gecko)
  const rtlAtStart = getScrollButtonState(0, 1000, 300, 'rtl', 2, 'negative');
  assert.equal(rtlAtStart.canScrollRight, false);
  assert.equal(rtlAtStart.canScrollLeft, true);

  // Positive-ascending RTL (iOS Safari / WebKit)
  const iOSAtStart = getScrollButtonState(0, 1000, 300, 'rtl', 2, 'positive-ascending');
  assert.equal(iOSAtStart.canScrollRight, false);
  assert.equal(iOSAtStart.canScrollLeft, true);
});

test('calculateNextScrollStep advances LTR and RTL negative/positive smoothly and wraps cleanly', () => {
  // LTR (English): advances positively from 0 -> singleSetWidth
  assert.equal(calculateNextScrollStep(50, 10, 500, 'ltr'), 60);
  assert.equal(calculateNextScrollStep(500, 10, 500, 'ltr'), 0);
  assert.equal(calculateNextScrollStep(-120, 10, 500, 'ltr'), 10);

  // RTL Negative (Chromium): advances negatively from 0 -> -singleSetWidth
  assert.equal(calculateNextScrollStep(-50, 10, 500, 'rtl', 'negative'), -60);
  assert.equal(calculateNextScrollStep(-500, 10, 500, 'rtl', 'negative'), 0);
  assert.equal(calculateNextScrollStep(120, 10, 500, 'rtl', 'negative'), -10);

  // RTL Positive-Ascending (iOS Safari / iPhone): advances positively without negative clamping
  assert.equal(calculateNextScrollStep(50, 10, 500, 'rtl', 'positive-ascending'), 60);
  assert.equal(calculateNextScrollStep(500, 10, 500, 'rtl', 'positive-ascending'), 0);
  assert.equal(calculateNextScrollStep(-20, 10, 500, 'rtl', 'positive-ascending'), 10);
});

test('getSeamlessManualScrollStart enables infinite manual stepping at edges for both RTL modes', () => {
  // LTR clicking left at start jumps forward by one set before scrolling left
  assert.equal(getSeamlessManualScrollStart(0, -300, 600, 1200, 'ltr'), 600);
  // RTL negative mode
  assert.equal(getSeamlessManualScrollStart(0, 300, 600, 1200, 'rtl', 'negative'), -600);
  // RTL positive-ascending mode (iPhone)
  assert.equal(getSeamlessManualScrollStart(0, -300, 600, 1200, 'rtl', 'positive-ascending'), 600);

  // Mid-track returns null (no jump needed)
  assert.equal(getSeamlessManualScrollStart(300, -200, 600, 1200, 'ltr'), null);
  assert.equal(wrapAdScrollPosition('rtl', -650, 600, 'negative'), -50);
  assert.equal(wrapAdScrollPosition('rtl', 650, 600, 'positive-ascending'), 50);
});
