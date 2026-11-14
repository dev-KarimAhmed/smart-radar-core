import { EmailLanguage } from '../email-config';

/**
 * Builds localized Account Confirmation email payload (Subject, HTML, Plaintext)
 */
export function buildAccountConfirmationEmail(params: {
  userName?: string;
  confirmUrl: string;
  otpCode?: string | null;
  lang?: EmailLanguage;
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';

  const subject = isEn
    ? (params.otpCode ? `Your Verification Code: ${params.otpCode} | Bynkcom` : 'Confirm and Activate Your Account | Bynkcom')
    : (params.otpCode ? `كود تفعيل حسابك: ${params.otpCode} | بينكم - bynkcom` : 'تأكيد الحساب وتفعيل البريد الإلكتروني | بينكم - bynkcom');

  const brandName = isEn ? '⚡ Bynkcom' : '⚡ بينكم - bynkcom';
  const heading = isEn ? 'Confirm & Activate Your Account' : 'تأكيد وتفعيل الحساب';

  const greeting = isEn
    ? `Hello <strong>${params.userName || 'there'}</strong>,<br>Welcome to Bynkcom! Please enter the 6-digit verification code in the app or click the button below to confirm your email address and get started:`
    : `مرحباً <strong>${params.userName || 'بك'}</strong>،<br>سعداء بانضمامك إلى منصة بينكم (bynkcom). يرجى إدخال رمز التفعيل المكون من 6 أرقام في التطبيق أو الضغط على زر التفعيل لتأكيد بريدك الإلكتروني والبدء في الاستخدام:`;

  const otpSection = params.otpCode
    ? isEn
      ? `
              <div style="margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #94A3B8;">
                  Your Account Verification Code:
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, rgba(20, 245, 213, 0.12), rgba(20, 184, 166, 0.2)); border: 2px dashed #14F5D5; border-radius: 18px; padding: 14px 32px; letter-spacing: 10px; font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 900; color: #14F5D5; text-shadow: 0 0 15px rgba(20, 245, 213, 0.45);">
                  ${params.otpCode}
                </div>
                <div style="margin-top: 12px; font-size: 13px; font-weight: 700; color: #F59E0B;">
                  ⏱️ This code is valid for 15 minutes only from the time of issue.
                </div>
              </div>
      `
      : `
              <div style="margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #94A3B8;">
                  رمز تفعيل الحساب الخاص بك:
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

  const oneClickIntro = isEn ? 'Or activate directly with one click:' : 'أو يمكنك التفعيل بضغطة واحدة مباشرة:';
  const buttonText = isEn ? 'Confirm & Activate Account 🚀' : 'تأكيد وتفعيل الحساب مباشرة 🚀';
  const copyLinkIntro = isEn ? 'Or copy and paste the following link into your browser:' : 'أو يمكنك نسخ الرابط التالي ولصقه في المتصفح:';
  const ignoreDisclaimer = isEn
    ? '⚠️ If you did not create this account, please safely ignore this email. No account will be activated.'
    : '⚠️ إذا لم تكن أنت من قام بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة بأمان ولن يتم تفعيل الحساب.';
  const footerText = isEn
    ? 'This email was sent automatically for verification and security from Bynkcom &copy; 2026'
    : 'هذه الرسالة تم إرسالها آلياً لأغراض التحقق والأمان من منصة بينكم - bynkcom &copy; 2026';

  const dir = isEn ? 'ltr' : 'rtl';
  const langAttr = isEn ? 'en' : 'ar';
  const textAlign = isEn ? 'left' : 'right';

  const plainText = isEn
    ? `Hello ${params.userName || 'there'}\n\n${params.otpCode ? `Your verification code is: ${params.otpCode}\nThis code is valid for 15 minutes only.\n\n` : ''}Or activate your account directly via the link:\n${params.confirmUrl}\n\nIf you did not create this account, please ignore this email.`
    : `مرحباً ${params.userName || 'بك'}\n\n${params.otpCode ? `كود تفعيل حسابك هو: ${params.otpCode}\nهذا الكود صالح لمدة 15 دقيقة فقط من وقت إرساله.\n\n` : ''}أو يمكنك تفعيل حسابك مباشرة عبر الرابط:\n${params.confirmUrl}\n\nإذا لم تكن أنت من قام بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة بأمان.`;

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
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                ${greeting}
              </p>

              ${otpSection}

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #94A3B8;">${oneClickIntro}</p>
                <a href="${params.confirmUrl}" target="_blank" style="display: inline-block; background-color: #14B8A6; color: #04140F; font-size: 15px; font-weight: 900; text-decoration: none; padding: 15px 36px; border-radius: 14px; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35);">
                  ${buttonText}
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                ${copyLinkIntro}<br>
                <a href="${params.confirmUrl}" target="_blank" style="color: #14F5D5; word-break: break-all; font-size: 12px;">${params.confirmUrl}</a>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: #F59E0B;">
                ${ignoreDisclaimer}
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
