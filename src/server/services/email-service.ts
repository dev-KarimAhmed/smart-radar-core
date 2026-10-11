import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !apiKey.startsWith('re_')) {
    return null;
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  otpCode?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'Smart Radar <onboarding@resend.dev>';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'إعادة تعيين كلمة المرور | الرادار الذكي BYNK',
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0D1424; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 16px; padding: 12px 24px;">
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">⚡ الرادار الذكي | BYNK</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: right;" dir="rtl">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">طلب إعادة تعيين كلمة المرور</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                مرحباً بك،<br>
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة <strong>الرادار الذكي</strong>. للبدء في تعيين كلمة مرور جديدة، يرجى الضغط على الزر أدناه:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${params.resetUrl}" target="_blank" style="display: inline-block; background-color: #14B8A6; color: #04140F; font-size: 16px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35);">
                  تعيين كلمة مرور جديدة 🔒
                </a>
              </div>
              ${
                params.otpCode
                  ? `
              <div style="background-color: rgba(0, 0, 0, 0.35); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 14px; padding: 16px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B;">رمز التحقق المباشر (OTP):</p>
                <span style="font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #14F5D5; font-family: monospace;">${params.otpCode}</span>
              </div>
              `
                  : ''
              }
              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                ⚠️ إذا لم تكن قد طلبت استعادة كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان ولن يتم إجراء أي تعديل على حسابك.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0, 0, 0, 0.2); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                هذه الرسالة تم إرسالها آلياً لأغراض الأمان من منصة الرادار الذكي &copy; 2026
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error('[resend] Email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Email delivered successfully to ${params.to}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception while sending email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

