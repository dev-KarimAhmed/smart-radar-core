import { sendPasswordResetEmail } from '../../services/email-service';
import { ServiceConfig, serviceHeaders } from './password-reset-config';

export interface RecoveryLinkResult {
  actionLink: string | null;
  emailOtp: string | null;
}

export async function generateRecoveryLink(
  config: ServiceConfig,
  targetEmail: string,
  redirectTo: string,
): Promise<RecoveryLinkResult> {
  let actionLink: string | null = null;
  let emailOtp: string | null = null;

  try {
    const genRes = await fetch(`${config.url}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: serviceHeaders(config.serviceKey),
      body: JSON.stringify({
        type: 'recovery',
        email: targetEmail,
        redirect_to: redirectTo,
        options: { redirectTo },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (genRes.ok) {
      const genData = (await genRes.json()) as {
        action_link?: string;
        properties?: { action_link?: string; email_otp?: string };
        email_otp?: string;
      };
      actionLink = genData.action_link || genData.properties?.action_link || null;
      emailOtp = genData.email_otp || genData.properties?.email_otp || null;
    }
  } catch (genErr) {
    console.warn('[password-reset] generate_link failed:', genErr);
  }

  if (actionLink) {
    console.info(`[password-reset] Recovery action link for ${targetEmail}: ${actionLink}`);
  }

  return { actionLink, emailOtp };
}

export async function dispatchRecoveryEmail(
  config: ServiceConfig,
  targetEmail: string,
  redirectTo: string,
  actionLink: string | null,
  emailOtp: string | null,
  lang: 'ar' | 'en',
): Promise<boolean> {
  // 1. Dispatch email directly via Resend SDK if API key is configured
  let emailSentViaResend = false;
  if (actionLink) {
    try {
      const resendRes = await sendPasswordResetEmail({
        to: targetEmail,
        resetUrl: actionLink,
        otpCode: emailOtp,
        lang,
      });
      emailSentViaResend = resendRes.success;
      if (resendRes.success) {
        console.info(`[password-reset] Email sent via Resend successfully to ${targetEmail}, ID: ${resendRes.id}`);
      } else {
        console.error(`[password-reset] Resend failed to send to ${targetEmail}:`, resendRes.error);
      }
    } catch (resendErr) {
      console.warn('[password-reset] Resend direct dispatch attempt:', resendErr);
    }
  }

  // 2. Fallback: Fire Supabase native recover email if Resend was not used
  let nativeRecoverDispatched = false;
  if (!emailSentViaResend) {
    try {
      const recoverRes = await fetch(`${config.url}/auth/v1/recover`, {
        method: 'POST',
        headers: serviceHeaders(config.serviceKey),
        body: JSON.stringify({ email: targetEmail, redirect_to: redirectTo }),
        signal: AbortSignal.timeout(4_000),
      });
      nativeRecoverDispatched = recoverRes.ok;
      if (!recoverRes.ok) {
        const recErr = await recoverRes.text().catch(() => '');
        console.warn(`[password-reset] Supabase recover returned status ${recoverRes.status}:`, recErr);
      } else {
        console.info(`[password-reset] Native Supabase recover dispatched for ${targetEmail}`);
      }
    } catch (e) {
      console.warn('[password-reset] Supabase recover fetch error:', e);
    }
  }

  return emailSentViaResend || nativeRecoverDispatched;
}
