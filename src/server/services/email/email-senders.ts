import {
  EmailLanguage,
  getResendClient,
  getSenderFromEmail,
} from './email-config';
import { buildPasswordResetEmail } from './templates/password-reset-template';
import { buildAccountConfirmationEmail } from './templates/account-confirmation-template';
import { buildCaptainContractEmail } from './templates/captain-contract-template';
import { generatePrivacyPolicyPdf } from '../privacy-pdf/privacy-pdf-service';
import { buildRiderContractEmail } from './templates/rider-contract-template';

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  otpCode?: string | null;
  lang?: EmailLanguage;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const lang = params.lang || 'ar';
  const fromEmail = getSenderFromEmail(lang);
  const emailPayload = buildPasswordResetEmail({
    resetUrl: params.resetUrl,
    otpCode: params.otpCode,
    lang,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    if (error) {
      console.error('[resend] Email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Email delivered successfully to ${params.to}, lang: ${lang}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception while sending email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendAccountConfirmationEmail(params: {
  to: string;
  userName?: string;
  confirmUrl: string;
  otpCode?: string | null;
  lang?: EmailLanguage;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const lang = params.lang || 'ar';
  const fromEmail = getSenderFromEmail(lang);
  const emailPayload = buildAccountConfirmationEmail({
    userName: params.userName,
    confirmUrl: params.confirmUrl,
    otpCode: params.otpCode,
    lang,
  });

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  try {
    const pdfBuffer = await generatePrivacyPolicyPdf();
    if (pdfBuffer) {
      attachments.push({
        filename: 'Bynkcom_Privacy_Policy.pdf',
        content: pdfBuffer,
      });
    }
  } catch (pdfErr) {
    console.warn('[resend] Privacy PDF generation error:', pdfErr);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: emailPayload.subject,
      text: emailPayload.text,
      attachments: attachments.length ? attachments : undefined,
      html: emailPayload.html,
    });

    if (error) {
      console.error('[resend] Account confirmation email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Account confirmation email delivered to ${params.to}, lang: ${lang}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception sending confirmation email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendCaptainContractEmail(params: {
  to: string;
  captainName: string;
  pdfBuffer: Buffer;
  contractHash: string;
  acceptedAt: string;
  lang?: EmailLanguage;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const lang = params.lang || 'ar';
  const fromEmail = getSenderFromEmail(lang);
  const emailPayload = buildCaptainContractEmail({
    captainName: params.captainName,
    contractHash: params.contractHash,
    acceptedAt: params.acceptedAt,
    lang,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: emailPayload.subject,
      text: emailPayload.text,
      attachments: [
        {
          filename: 'Bynkcom_Captain_Advertiser_Contract.pdf',
          content: params.pdfBuffer,
        },
      ],
      html: emailPayload.html,
    });

    if (error) {
      console.error('[resend] Captain contract email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Captain contract email delivered to ${params.to}, lang: ${lang}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception sending contract email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendRiderContractEmail(params: {
  to: string;
  userName: string;
  pdfBuffer: Buffer;
  contractHash: string;
  acceptedAt: string;
  lang?: EmailLanguage;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const lang = params.lang || 'ar';
  const fromEmail = getSenderFromEmail(lang);
  const emailPayload = buildRiderContractEmail({
    userName: params.userName,
    contractHash: params.contractHash,
    acceptedAt: params.acceptedAt,
    lang,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: emailPayload.subject,
      text: emailPayload.text,
      attachments: [
        {
          filename: 'Bynkcom_User_Privacy_Policy.pdf',
          content: params.pdfBuffer,
        },
      ],
      html: emailPayload.html,
    });

    if (error) {
      console.error('[resend] Rider contract email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Rider contract email delivered to ${params.to}, lang: ${lang}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception sending rider contract email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
