/**
 * Unified Email Service
 * Re-exports modularized email configuration, templates, and delivery services.
 */

export {
  type EmailLanguage,
  DEFAULT_RESEND_FROM_EMAIL_AR,
  DEFAULT_RESEND_FROM_EMAIL_EN,
  DEFAULT_RESEND_FROM_EMAIL,
  resolveEmailLanguage,
  getSenderFromEmail,
} from './email/email-config';

export { buildPasswordResetEmail } from './email/templates/password-reset-template';
export { buildAccountConfirmationEmail } from './email/templates/account-confirmation-template';
export { buildCaptainContractEmail } from './email/templates/captain-contract-template';

export {
  sendPasswordResetEmail,
  sendAccountConfirmationEmail,
  sendCaptainContractEmail,
} from './email/email-senders';
