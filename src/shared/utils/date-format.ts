export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
] as const;

/**
 * Standard readable date and time formatter.
 * Produces clean, familiar Arabic month names (e.g. أكتوبر) and standard readable digits (e.g. 6:21 م)
 * avoiding obscure Syriac/Levantine month names or confusing Hindi digits.
 */
export function formatReadableDateTime(
  timestamp: number | string | Date,
  isArabic: boolean = true
): { dateText: string; timeText: string; fullText: string } {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return { dateText: '', timeText: '', fullText: '' };
    }
    const now = new Date();

    // Time: "6:21 م" or "6:21 PM"
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = isArabic ? (hours >= 12 ? 'م' : 'ص') : (hours >= 12 ? 'PM' : 'AM');
    hours = hours % 12 || 12;
    const timeText = `${hours}:${minutes} ${period}`;

    // Date
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    let dateText = '';
    if (isToday) {
      dateText = isArabic ? 'اليوم' : 'Today';
    } else if (isYesterday) {
      dateText = isArabic ? 'أمس' : 'Yesterday';
    } else {
      const day = d.getDate();
      const monthIdx = d.getMonth();
      const month = isArabic
        ? ARABIC_MONTHS[monthIdx]
        : d.toLocaleDateString('en-US', { month: 'short' });
      const yearSuffix = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
      dateText = `${day} ${month}${yearSuffix}`;
    }

    const fullText = `${dateText} • ${timeText}`;
    return { dateText, timeText, fullText };
  } catch {
    return { dateText: '', timeText: '', fullText: '' };
  }
}

/**
 * Short notification time for compact badge/list display:
 * Shows "6:21 م" if today, otherwise "أمس" or "30 أكتوبر"
 */
export function formatNotificationShortTime(
  timestamp: number | string | Date,
  isArabic: boolean = true
): string {
  const { dateText, timeText } = formatReadableDateTime(timestamp, isArabic);
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return timeText;
  }
  return dateText;
}
