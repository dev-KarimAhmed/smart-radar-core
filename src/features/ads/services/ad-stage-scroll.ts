export type AdStageDirection = 'ltr' | 'rtl';
export type AdStageScrollDirection = 'previous' | 'next';
export type RtlScrollType = 'negative' | 'positive-descending' | 'positive-ascending';

let cachedRtlScrollType: RtlScrollType | null = null;

export function setCachedRtlScrollType(type: RtlScrollType | null) {
  cachedRtlScrollType = type;
}

export function getRtlScrollType(): RtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined' || !document.body) return 'negative';

  const definer = document.createElement('div');
  definer.dir = 'rtl';
  definer.style.fontSize = '14px';
  definer.style.width = '4px';
  definer.style.height = '1px';
  definer.style.position = 'absolute';
  definer.style.top = '-9999px';
  definer.style.overflow = 'scroll';

  const inner = document.createElement('div');
  inner.style.width = '8px';
  inner.style.height = '1px';
  definer.appendChild(inner);

  document.body.appendChild(definer);

  let type: RtlScrollType = 'positive-descending';
  if (definer.scrollLeft > 0) {
    type = 'positive-descending';
  } else {
    definer.scrollLeft = 1;
    if (definer.scrollLeft === 0) {
      type = 'negative';
    } else {
      type = 'positive-ascending';
    }
  }

  document.body.removeChild(definer);
  cachedRtlScrollType = type;
  return type;
}

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
  rtlType: RtlScrollType = getRtlScrollType(),
) {
  if (loopPoint <= 0) return scrollLeft;

  if (direction === 'rtl') {
    if (rtlType === 'negative') {
      if (scrollLeft <= -loopPoint) return scrollLeft + loopPoint;
      if (scrollLeft > 0) return scrollLeft - loopPoint;
      return scrollLeft;
    }
    if (rtlType === 'positive-ascending') {
      if (scrollLeft >= loopPoint) return scrollLeft - loopPoint;
      if (scrollLeft < 0) return scrollLeft + loopPoint;
      return scrollLeft;
    }
    if (scrollLeft <= 0) return scrollLeft + loopPoint;
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
  rtlType: RtlScrollType = getRtlScrollType(),
): { canScrollLeft: boolean; canScrollRight: boolean } {
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= 0) return { canScrollLeft: false, canScrollRight: false };

  if (direction === 'rtl') {
    if (rtlType === 'negative') {
      const isAtRightEdge = scrollLeft >= -tolerance;
      const isAtLeftEdge = scrollLeft <= -(maxScroll - tolerance);
      return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
    }
    if (rtlType === 'positive-ascending') {
      const isAtRightEdge = scrollLeft <= tolerance;
      const isAtLeftEdge = scrollLeft >= maxScroll - tolerance;
      return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
    }
    const isAtRightEdge = scrollLeft >= maxScroll - tolerance;
    const isAtLeftEdge = scrollLeft <= tolerance;
    return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
  }
  const isAtLeftEdge = scrollLeft <= tolerance;
  const isAtRightEdge = scrollLeft >= maxScroll - tolerance;
  return { canScrollLeft: !isAtLeftEdge, canScrollRight: !isAtRightEdge };
}

export function advanceRtlScroll(
  currentScroll: number,
  deltaPixels: number,
  singleSetWidth: number,
  maxScroll: number,
  rtlType: RtlScrollType = getRtlScrollType(),
): number {
  return calculateNextScrollStep(currentScroll, deltaPixels, singleSetWidth, 'rtl', rtlType, maxScroll);
}

export function calculateNextScrollStep(
  currentScroll: number,
  deltaPixels: number,
  singleSetWidth: number,
  direction: AdStageDirection,
  rtlType: RtlScrollType = getRtlScrollType(),
  maxScroll: number = singleSetWidth * 2,
): number {
  if (singleSetWidth <= 0) return currentScroll;

  if (direction === 'rtl') {
    if (rtlType === 'negative') {
      const normalized = currentScroll > 0 ? 0 : currentScroll;
      if (Math.abs(normalized) >= singleSetWidth - 1) {
        return normalized + singleSetWidth;
      }
      return normalized - deltaPixels;
    }
    if (rtlType === 'positive-ascending') {
      const normalized = currentScroll < 0 ? 0 : currentScroll;
      if (normalized >= singleSetWidth - 1) {
        return normalized - singleSetWidth;
      }
      return normalized + deltaPixels;
    }
    // positive-descending
    if (currentScroll <= (maxScroll - singleSetWidth) + 1) {
      return currentScroll + singleSetWidth;
    }
    return currentScroll - deltaPixels;
  }

  const normalized = currentScroll < 0 ? 0 : currentScroll;
  if (normalized >= singleSetWidth - 1) {
    return normalized - singleSetWidth;
  }
  return normalized + deltaPixels;
}

export function getSeamlessManualScrollStart(
  currentScroll: number,
  delta: number,
  singleSetWidth: number,
  maxScroll: number,
  direction: AdStageDirection,
  rtlType: RtlScrollType = getRtlScrollType(),
): number | null {
  if (singleSetWidth <= 0 || maxScroll <= 0) return null;

  if (direction === 'rtl') {
    if (rtlType === 'negative') {
      if (delta > 0 && currentScroll >= -2 && singleSetWidth <= maxScroll) {
        return currentScroll - singleSetWidth;
      }
      if (delta < 0 && Math.abs(currentScroll) >= maxScroll - 2 && singleSetWidth <= maxScroll) {
        return currentScroll + singleSetWidth;
      }
      return null;
    }
    if (rtlType === 'positive-ascending') {
      if (delta < 0 && currentScroll <= 2 && singleSetWidth <= maxScroll) {
        return currentScroll + singleSetWidth;
      }
      if (delta > 0 && currentScroll >= maxScroll - 2 && singleSetWidth <= maxScroll) {
        return currentScroll - singleSetWidth;
      }
      return null;
    }
    if (delta > 0 && currentScroll <= 2 && singleSetWidth <= maxScroll) {
      return currentScroll + singleSetWidth;
    }
    if (delta < 0 && currentScroll >= maxScroll - 2 && singleSetWidth <= maxScroll) {
      return currentScroll - singleSetWidth;
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
