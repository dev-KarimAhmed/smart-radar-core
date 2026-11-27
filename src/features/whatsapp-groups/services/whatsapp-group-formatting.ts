export interface DurationUnitLabels {
  hoursUnit: string;
  minutesUnit: string;
  secondsUnit: string;
}

export function formatOperationalDuration(totalSeconds: number, labels: DurationUnitLabels): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours} ${labels.hoursUnit} ${minutes} ${labels.minutesUnit} ${seconds} ${labels.secondsUnit}`
    : `${minutes} ${labels.minutesUnit} ${seconds} ${labels.secondsUnit}`;
}

export function buildWhatsAppGroupShareUrl(groupCode: string, origin?: string): string {
  const cleanOrigin =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return cleanOrigin
    ? `${cleanOrigin}/?wg=${encodeURIComponent(groupCode)}`
    : `/?wg=${encodeURIComponent(groupCode)}`;
}
