/**
 * Notification Internationalization (i18n) Engine.
 * Enables zero-cost dual-language storage and automatic language delivery for notifications and admin directives.
 *
 * Modularized under SC55 & 250-line ceiling rules:
 * - Types, script checkers: notifications/notification-i18n-types.ts
 * - Payload encoding: notifications/notification-i18n-encoder.ts
 * - Welcome & onboarding matchers: notifications/notification-dynamic-onboarding.ts
 * - Trips & driver offer matchers: notifications/notification-dynamic-trips.ts
 * - Admin operational matchers: notifications/notification-dynamic-admin.ts
 * - Wallet & receipts matchers: notifications/notification-dynamic-wallet.ts
 * - Templates & headers matchers: notifications/notification-dynamic-templates.ts
 * - Resolver & parser: notifications/notification-i18n-resolver.ts
 * - Client runtime cache: notifications/notification-i18n-cache.ts
 * - Client translation requester: notifications/notification-i18n-client.ts
 */

export type {
  NotificationI18nPayload,
  ParsedNotificationContent,
  DynamicNotificationMatch,
} from './notifications/notification-i18n-types';

export {
  hasArabicScript,
  hasLatinLetters,
  isDominantlyLatinText,
  isTranslationErrorBanner,
  isValidClientTranslation,
  normalizeCurrency,
  translateKnownReceiptRejectionReason,
} from './notifications/notification-i18n-types';

export { encodeNotificationPayload } from './notifications/notification-i18n-encoder';

export {
  resolveDynamicNotification,
  parseNotificationContent,
} from './notifications/notification-i18n-resolver';

export {
  getCachedNotificationTranslation,
  resolveNotificationForDisplay,
} from './notifications/notification-i18n-cache';

export {
  requestBatchTranslation,
  requestTranslation,
} from './notifications/notification-i18n-client';
