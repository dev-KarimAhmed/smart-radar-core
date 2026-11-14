import { EmailLanguage } from '../email-config';

/**
 * Builds localized Password Reset email payload (Subject, HTML, Plaintext)
 */
export function buildPasswordResetEmail(params: {
  resetUrl: string;
  otpCode?: string | null;
  lang?: EmailLanguage;
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';

  const subject = isEn
    ? (params.otpCode ? `Password Reset Code: ${params.otpCode} | Bynkcom` : 'Reset Your Password | Bynkcom')
    : (params.otpCode ? `كود إعادة تعيين كلمة المرور: ${params.otpCode} | بينكم - bynkcom` : 'إعادة تعيين كلمة المرور | بينكم - bynkcom');

  const brandName = isEn ? '⚡ Bynkcom' : '⚡ بينكم - bynkcom';
  const heading = isEn ? 'Password Reset Request' : 'طلب إعادة تعيين كلمة المرور';

  const greeting = isEn
    ? `Hello,<br>We received a request to reset your password.<br>⚠️ If you did not make this request, you can safely ignore this email and no changes will be made to your account.`
    : `مرحباً بك،<br>تم استلام طلب لإعادة تعيين كلمة المرور الخاصة بحسابك.<br>⚠️ إذا لم تكن قد طلبت استعادة كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان ولن يتم إجراء أي تعديل على حسابك.`;

  const otpSection = params.otpCode
    ? isEn
      ? `
              <div style="margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #94A3B8;">
                  Your Verification Code:
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, rgba(20, 245, 213, 0.12), rgba(20, 184, 166, 0.2)); border: 2px dashed #14F5D5; border-radius: 18px; padding: 14px 32px; letter-spacing: 10px; font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 900; color: #14F5D5; text-shadow: 0 0 15px rgba(20, 245, 213, 0.45);">
                  ${params.otpCode}
                </div>
                <div style="margin-top: 12px; font-size: 13px; font-weight: 700; color: #F59E0B;">
                  ⏱️ This code is valid for 15 minutes only.
                </div>
              </div>
      `
      : `
              <div style="margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #94A3B8;">
                  رمز التحقق الخاص بك:
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, rgba(20, 245, 213, 0.12), rgba(20, 184, 166, 0.2)); border: 2px dashed #14F5D5; border-radius: 18px; padding: 14px 32px; letter-spacing: 10px; font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 900; color: #14F5D5; text-shadow: 0 0 15px rgba(20, 245, 213, 0.45);">
                  ${params.otpCode}
                </div>
                <div style="margin-top: 12px; font-size: 13px; font-weight: 700; color: #F59E0B;">
                  ⏱️ هذا الكود صالح لمدة 15 دقيقة فقط من وقت إرساله.
                </div>
              </div>
      `
    : '';

  const buttonText = isEn ? 'Set New Password 🔒' : 'تعيين كلمة مرور جديدة 🔒';
  const copyLinkIntro = isEn ? 'Or copy and paste this link into your browser:' : 'أو يمكنك نسخ الرابط التالي ولصقه في المتصفح:';
  const footerText = isEn
    ? 'This email was sent automatically for security purposes from Bynkcom &copy; 2026'
    : 'هذه الرسالة تم إرسالها آلياً لأغراض الأمان من منصة بينكم - bynkcom &copy; 2026';

  const dir = isEn ? 'ltr' : 'rtl';
  const langAttr = isEn ? 'en' : 'ar';
  const textAlign = isEn ? 'left' : 'right';

  const plainText = isEn
    ? `Hello,\n\nWe received a request to reset your password.${params.otpCode ? `\n\nYour reset verification code is: ${params.otpCode} (valid for 15 minutes).` : ''}\n\nReset your password using the link below:\n${params.resetUrl}\n\nIf you did not request this, please safely ignore this email.`
    : `مرحباً بك،\n\nتم استلام طلب لإعادة تعيين كلمة المرور الخاصة بحسابك.${params.otpCode ? `\n\nكود إعادة تعيين كلمة المرور: ${params.otpCode} (صالح لمدة 15 دقيقة).` : ''}\n\nيمكنك تعيين كلمة مرور جديدة عبر الرابط التالي:\n${params.resetUrl}\n\nإذا لم تكن قد طلبت ذلك، يرجى تجاهل هذه الرسالة.`;

  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${langAttr}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0D1424; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 16px; padding: 12px 24px;">
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">${brandName}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: ${textAlign};" dir="${dir}">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">${heading}</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                ${greeting}
              </p>

              ${otpSection}

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${params.resetUrl}" target="_blank" style="display: inline-block; background-color: #14B8A6; color: #04140F; font-size: 16px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35);">
                  ${buttonText}
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                ${copyLinkIntro}<br>
                <a href="${params.resetUrl}" target="_blank" style="color: #14F5D5; word-break: break-all; font-size: 12px;">${params.resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0, 0, 0, 0.2); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html, text: plainText };
}
