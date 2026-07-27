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
