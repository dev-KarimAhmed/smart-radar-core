export type AdStageDirection = 'ltr' | 'rtl';
export type AdStageScrollDirection = 'previous' | 'next';

export function getAdScrollDelta(direction: AdStageDirection, distance: number) {
  return direction === 'rtl' ? -distance : distance;
}

export function getAdManualScrollDelta(
  direction: AdStageDirection,
  scrollDirection: AdStageScrollDirection,
  distance: number,
) {
  const nextDelta = getAdScrollDelta(direction, distance);
  return scrollDirection === 'next' ? nextDelta : -nextDelta;
}

export function wrapAdScrollPosition(
  direction: AdStageDirection,
  scrollLeft: number,
  loopPoint: number,
) {
  if (loopPoint <= 0) return scrollLeft;

  if (direction === 'rtl') {
    if (scrollLeft <= -loopPoint) return scrollLeft + loopPoint;
    if (scrollLeft > 0) return scrollLeft - loopPoint;
    return scrollLeft;
  }

  if (scrollLeft >= loopPoint) return scrollLeft - loopPoint;
  if (scrollLeft < 0) return scrollLeft + loopPoint;
  return scrollLeft;
}

export function getScrollButtonState(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  direction: AdStageDirection,
  tolerance = 2,
): { canScrollLeft: boolean; canScrollRight: boolean } {
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= 0) {
    return { canScrollLeft: false, canScrollRight: false };
  }
  if (direction === 'rtl') {
    const isAtRightEdge = scrollLeft >= -tolerance;
    const isAtLeftEdge = scrollLeft <= -(maxScroll - tolerance);
    return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
  }
  const isAtLeftEdge = scrollLeft <= tolerance;
  const isAtRightEdge = scrollLeft >= maxScroll - tolerance;
  return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
}

/**
 * Advances continuous auto-scroll in the active dashboard reading direction:
 * - Arabic ('rtl'): scrolls from right to left (0 -> -loopWidth, then wraps to 0)
 * - English ('ltr'): scrolls from left to right (0 -> +loopWidth, then wraps to 0)
 */
export function calculateNextScrollStep(
  currentScroll: number,
  deltaPixels: number,
  singleSetWidth: number,
  direction: AdStageDirection,
): number {
  if (singleSetWidth <= 0) return currentScroll;

  if (direction === 'rtl') {
    const normalized = currentScroll > 0 ? 0 : currentScroll;
    if (Math.abs(normalized) >= singleSetWidth - 1) {
      return normalized + singleSetWidth;
    }
    return normalized - deltaPixels;
  }

  const normalized = currentScroll < 0 ? 0 : currentScroll;
  if (normalized >= singleSetWidth - 1) {
    return normalized - singleSetWidth;
  }
  return normalized + deltaPixels;
}

/**
 * Calculates the starting scrollLeft before a manual scrollBy(delta) so users
 * can seamlessly loop past either boundary without hitting a dead end.
 */
export function getSeamlessManualScrollStart(
  currentScroll: number,
  delta: number,
  singleSetWidth: number,
  maxScroll: number,
  direction: AdStageDirection,
): number | null {
  if (singleSetWidth <= 0 || maxScroll <= 0) return null;

  if (direction === 'rtl') {
    if (delta > 0 && currentScroll >= -2 && singleSetWidth <= maxScroll) {
      return currentScroll - singleSetWidth;
    }
    if (delta < 0 && Math.abs(currentScroll) >= maxScroll - 2 && singleSetWidth <= maxScroll) {
      return currentScroll + singleSetWidth;
    }
    return null;
  }

  if (delta < 0 && currentScroll <= 2 && singleSetWidth <= maxScroll) {
    return currentScroll + singleSetWidth;
  }
  if (delta > 0 && currentScroll >= maxScroll - 2 && singleSetWidth <= maxScroll) {
    return currentScroll - singleSetWidth;
  }
  return null;
}
