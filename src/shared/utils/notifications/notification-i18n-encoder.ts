/**
 * Notification i18n Encoder.
 * Encodes dual-language notification payloads into backwards-compatible Markdown HTML comments.
 */

import { NotificationI18nPayload } from './notification-i18n-types';

export function encodeNotificationPayload(
  titleAr: string,
  bodyAr: string,
  titleEn?: string,
  bodyEn?: string
): { title: string; description: string } {
  const cleanTitleAr = (titleAr || '').trim();
  const cleanBodyAr = (bodyAr || '').trim();
  const cleanTitleEn = (titleEn || '').trim();
  const cleanBodyEn = (bodyEn || '').trim();

  // If only one language is provided, store standard clean text
  if (!cleanTitleEn && !cleanBodyEn) {
    return {
      title: cleanTitleAr,
      description: cleanBodyAr,
    };
  }

  if (!cleanTitleAr && !cleanBodyAr) {
    return {
      title: cleanTitleEn,
      description: cleanBodyEn,
    };
  }

  // Dual-language package
  const meta: NotificationI18nPayload = {
    title_ar: cleanTitleAr || cleanTitleEn,
    body_ar: cleanBodyAr || cleanBodyEn,
    title_en: cleanTitleEn || cleanTitleAr,
    body_en: cleanBodyEn || cleanBodyAr,
  };

  const primaryTitle = cleanTitleAr || cleanTitleEn;
  const primaryBody = cleanBodyAr || cleanBodyEn;

  return {
    title: primaryTitle,
    description: `${primaryBody}\n\n<!--i18n:${JSON.stringify(meta)}-->`,
  };
}
