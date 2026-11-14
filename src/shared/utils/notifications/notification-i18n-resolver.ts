/**
 * Notification i18n Resolver and Parser Engine.
 */

import {
  DynamicNotificationMatch,
  I18N_TAG_REGEX,
  NotificationI18nPayload,
  ParsedNotificationContent,
  hasArabicScript,
  hasLatinLetters,
  isDominantlyLatinText,
} from './notification-i18n-types';
import { matchDynamicOnboardingNotification } from './notification-dynamic-onboarding';
import { matchDynamicTripNotification } from './notification-dynamic-trips';
import { matchDynamicAdminNotification } from './notification-dynamic-admin';
import { matchDynamicWalletNotification } from './notification-dynamic-wallet';
import { matchDynamicTemplateNotification } from './notification-dynamic-templates';

/**
 * Dynamic rule-based translator for standard backend/admin notifications lacking metadata tags.
 */
export function resolveDynamicNotification(
  rawTitle: string,
  rawDesc: string
): DynamicNotificationMatch {
  const t = rawTitle.trim();
  const d = rawDesc.trim();

  // 1. Welcome, onboarding, referrals, documents & legal logs
  const onboardingMatch = matchDynamicOnboardingNotification(t, d);
  if (onboardingMatch) return onboardingMatch;

  // 2. Active trips & driver offers
  const tripMatch = matchDynamicTripNotification(t, d);
  if (tripMatch) return tripMatch;

  // 3. Admin operations, bans, status, penalties & rehabilitation
  const adminMatch = matchDynamicAdminNotification(t, d);
  if (adminMatch) return adminMatch;

  // 4. Wallet, recharge receipts, direct top-ups & cash deposits
  const walletMatch = matchDynamicWalletNotification(t, d);
  if (walletMatch) return walletMatch;

  // 5. Admin headers and quick templates
  const templateMatch = matchDynamicTemplateNotification(t, d);
  if (templateMatch) return templateMatch;

  return {
    titleAr: t,
    descriptionAr: d,
    titleEn: t,
    descriptionEn: d,
    matched: false,
    titleMatched: false,
    descriptionMatched: false,
  };
}

/**
 * Parses a stored notification item, resolving the appropriate language based on the recipient's UI locale.
 */
export function parseNotificationContent(
  item: { title?: string; description?: string },
  isArabic: boolean
): ParsedNotificationContent {
  const rawTitle = (item.title || '').trim();
  const rawDesc = (item.description || '').trim();

  // 1. Check for embedded metadata tag <!--i18n:...-->
  const match = rawDesc.match(I18N_TAG_REGEX);

  if (match && match[1]) {
    try {
      const payload: NotificationI18nPayload = JSON.parse(match[1]);
      const cleanBody = rawDesc.replace(I18N_TAG_REGEX, '').trim();

      let titleAr = (payload.title_ar || rawTitle).trim();
      let descriptionAr = (payload.body_ar || cleanBody).trim();
      let titleEn = (payload.title_en || '').trim();
      let descriptionEn = (payload.body_en || '').trim();

      const dynamicFromAr = resolveDynamicNotification(titleAr, descriptionAr);
      const dynamicTitleOk = dynamicFromAr.matched && (dynamicFromAr.titleMatched ?? true);
      const dynamicDescOk = dynamicFromAr.matched && (dynamicFromAr.descriptionMatched ?? true);

      // Repair broken legacy <!--i18n--> envelopes where Arabic was duplicated into title_en / body_en
      const titleEnIsMissingOrArabicCopy =
        !titleEn || (titleEn === titleAr && hasArabicScript(titleAr));
      const bodyEnIsMissingOrArabicCopy =
        !descriptionEn || (descriptionEn === descriptionAr && hasArabicScript(descriptionAr));

      if (titleEnIsMissingOrArabicCopy && dynamicTitleOk) {
        titleEn = dynamicFromAr.titleEn;
      }
      if (bodyEnIsMissingOrArabicCopy && dynamicDescOk) {
        descriptionEn = dynamicFromAr.descriptionEn;
      }

      // Repair reverse case: English-authored row duplicated into title_ar / body_ar
      const titleArIsMissingOrEnglishCopy =
        !titleAr || (titleAr === titleEn && !hasArabicScript(titleEn) && hasLatinLetters(titleEn));
      const bodyArIsMissingOrEnglishCopy =
        !descriptionAr || (descriptionAr === descriptionEn && !hasArabicScript(descriptionEn) && hasLatinLetters(descriptionEn));

      if (titleArIsMissingOrEnglishCopy && titleEn) {
        const dynFromEn = resolveDynamicNotification(titleEn, descriptionEn);
        if (dynFromEn.matched && (dynFromEn.titleMatched ?? true)) {
          titleAr = dynFromEn.titleAr;
        }
      }
      if (bodyArIsMissingOrEnglishCopy && descriptionEn) {
        const dynFromEn = resolveDynamicNotification(titleEn, descriptionEn);
        if (dynFromEn.matched && (dynFromEn.descriptionMatched ?? true)) {
          descriptionAr = dynFromEn.descriptionAr;
        }
      }

      if (!titleEn) titleEn = titleAr;
      if (!descriptionEn) descriptionEn = descriptionAr;

      const resolvedTitle = isArabic ? titleAr : (titleEn || titleAr);
      const resolvedDesc = isArabic ? descriptionAr : (descriptionEn || descriptionAr);

      const hasDistinctTitleEn = Boolean(titleEn && titleEn !== titleAr);
      const hasDistinctBodyEn = Boolean(descriptionEn && descriptionEn !== descriptionAr);

      const titleNeedsTranslation = isArabic
        ? (!hasArabicScript(resolvedTitle) && hasLatinLetters(resolvedTitle))
        : (hasArabicScript(resolvedTitle) &&
          !(dynamicTitleOk && hasLatinLetters(resolvedTitle)) &&
          !(hasDistinctTitleEn && isDominantlyLatinText(resolvedTitle)));

      const descriptionNeedsTranslation = isArabic
        ? (!hasArabicScript(resolvedDesc) && hasLatinLetters(resolvedDesc))
        : (hasArabicScript(resolvedDesc) &&
          !(dynamicDescOk && hasLatinLetters(resolvedDesc)) &&
          !(hasDistinctBodyEn && isDominantlyLatinText(resolvedDesc)));

      const hasTranslation = hasDistinctTitleEn || hasDistinctBodyEn;

      return {
        title: resolvedTitle,
        description: resolvedDesc,
        hasTranslation,
        titleAr,
        descriptionAr,
        titleEn,
        descriptionEn,
        titleNeedsTranslation,
        descriptionNeedsTranslation,
      };
    } catch (e) {
      console.warn('[parseNotificationContent] Failed to parse i18n payload:', e);
    }
  }

  // 2. Fallback to dynamic rule-based translation for standard backend notifications
  const cleanDesc = rawDesc.replace(I18N_TAG_REGEX, '').trim();
  const dynamic = resolveDynamicNotification(rawTitle, cleanDesc);

  if (dynamic.matched) {
    const titleMatched = dynamic.titleMatched ?? true;
    const descMatched = dynamic.descriptionMatched ?? true;
    const title = isArabic ? dynamic.titleAr : dynamic.titleEn;
    const description = isArabic ? dynamic.descriptionAr : dynamic.descriptionEn;

    const titleNeedsTranslation = isArabic
      ? (!titleMatched && !hasArabicScript(title) && hasLatinLetters(title))
      : (!titleMatched && hasArabicScript(title));
    const descriptionNeedsTranslation = isArabic
      ? (!descMatched && !hasArabicScript(description) && hasLatinLetters(description))
      : (!descMatched && hasArabicScript(description));

    return {
      title,
      description,
      hasTranslation: titleMatched || descMatched,
      titleAr: dynamic.titleAr,
      descriptionAr: dynamic.descriptionAr,
      titleEn: dynamic.titleEn,
      descriptionEn: dynamic.descriptionEn,
      titleNeedsTranslation,
      descriptionNeedsTranslation,
    };
  }

  // 3. Fallback for custom unmapped notifications
  const titleNeedsTranslation = isArabic
    ? (!hasArabicScript(rawTitle) && hasLatinLetters(rawTitle))
    : hasArabicScript(rawTitle);
  const descriptionNeedsTranslation = isArabic
    ? (!hasArabicScript(cleanDesc) && hasLatinLetters(cleanDesc))
    : hasArabicScript(cleanDesc);

  return {
    title: rawTitle,
    description: cleanDesc,
    hasTranslation: false,
    titleAr: rawTitle,
    descriptionAr: cleanDesc,
    titleEn: rawTitle,
    descriptionEn: cleanDesc,
    titleNeedsTranslation,
    descriptionNeedsTranslation,
  };
}
