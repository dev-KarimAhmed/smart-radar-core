import { Router } from 'express';
import { handlePasswordResetRequest } from './password-reset/password-reset-request-handler';
import {
  handleGetPasswordResetRequests,
  handleRejectPasswordResetRequest,
  handleIssuePasswordResetToken,
} from './password-reset/password-reset-admin-handlers';
import {
  handleCompletePasswordReset,
  handleRescuePasswordResetWithToken,
  handleTestResend,
} from './password-reset/password-reset-complete-handlers';

/**
 * Password recovery for a phone-only login.
 *
 * Two routes, both free, decided per account:
 *   1. The account has a recovery email -> Supabase mails a link. No human involved.
 *   2. It does not                      -> a request is queued for an admin, who verifies
 *                                          identity out of band and issues a one-time token.
 *
 * Everything here runs with the service_role key, which bypasses RLS on every table. That
 * key is read from the environment and never leaves this process.
 */
export const passwordResetRouter = Router();

// 1. The locked-out person asks for help. Public, rate-limited by the caller.
passwordResetRouter.post('/password-reset/request', handlePasswordResetRequest);

// 2. The admin queue: list and reject.
passwordResetRouter.get('/password-reset/requests', handleGetPasswordResetRequests);
passwordResetRouter.post('/password-reset/reject', handleRejectPasswordResetRequest);

// 3. An admin approves a queued request and gets a one-time token to hand over.
passwordResetRouter.post('/password-reset/issue', handleIssuePasswordResetToken);

// 4. The account owner redeems the token and sets a new password.
passwordResetRouter.post('/password-reset/complete', handleCompletePasswordReset);

// 5. Rescue route: Updates password directly via Admin API when client-side session is dropped.
passwordResetRouter.post('/password-reset/rescue-with-token', handleRescuePasswordResetWithToken);

// 6. Test route for Resend API validation.
passwordResetRouter.post('/password-reset/test-resend', handleTestResend);

export * from './password-reset/password-reset-config';
export * from './password-reset/password-reset-lookup';
export * from './password-reset/password-reset-request-handler';
export * from './password-reset/password-reset-admin-handlers';
export * from './password-reset/password-reset-complete-handlers';
