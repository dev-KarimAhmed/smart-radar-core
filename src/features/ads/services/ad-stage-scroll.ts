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
    return scrollLeft <= -loopPoint ? scrollLeft + loopPoint : scrollLeft;
  }

  return scrollLeft >= loopPoint ? scrollLeft - loopPoint : scrollLeft;
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

export function calculateNextScrollStep(
  currentScroll: number,
  deltaPixels: number,
  singleSetWidth: number,
  direction: AdStageDirection,
): number {
  if (direction === 'rtl') {
    const currentAbs = Math.abs(currentScroll);
    if (currentAbs >= singleSetWidth - 1 && singleSetWidth > 0) {
      return currentScroll < 0 ? currentScroll + singleSetWidth : currentScroll - singleSetWidth;
    }
    return currentScroll <= 0 ? currentScroll - deltaPixels : currentScroll + deltaPixels;
  }
  if (currentScroll >= singleSetWidth - 1 && singleSetWidth > 0) {
    return currentScroll - singleSetWidth;
  }
  return currentScroll + deltaPixels;
}
