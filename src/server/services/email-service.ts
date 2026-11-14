import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { formatContractDate } from './contract-pdf-service';

export type EmailLanguage = 'ar' | 'en';

export const DEFAULT_RESEND_FROM_EMAIL_AR = 'بينكم - bynkcom <noreply@bynkcom.com>';
export const DEFAULT_RESEND_FROM_EMAIL_EN = 'Bynkcom <noreply@bynkcom.com>';
export const DEFAULT_RESEND_FROM_EMAIL = DEFAULT_RESEND_FROM_EMAIL_AR;

export function resolveEmailLanguage(params: {
  explicitLang?: string | null;
  profileLang?: string | null;
  cookieHeader?: string | null;
  customHeader?: string | null;
  acceptLanguage?: string | null;
}): EmailLanguage {
  // 1. Explicit language requested
  if (params.explicitLang) {
    const l = params.explicitLang.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 2. Profile or user record language
  if (params.profileLang) {
    const l = params.profileLang.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 3. NEXT_LOCALE cookie from client session
  if (params.cookieHeader) {
    const match = params.cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (match) {
      const val = decodeURIComponent(match[1]).trim().toLowerCase();
      if (val === 'en' || val === 'ar') return val;
    }
  }

  // 4. Custom dashboard language header
  if (params.customHeader) {
    const l = params.customHeader.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 5. Accept-Language header
  if (params.acceptLanguage) {
    const l = params.acceptLanguage.trim().toLowerCase();
    if (l.startsWith('en')) return 'en';
  }

  return 'ar';
}

export function getSenderFromEmail(lang: EmailLanguage = 'ar'): string {
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'));
      if (parsed.RESEND_FROM_EMAIL?.trim()) {
        const candidate = parsed.RESEND_FROM_EMAIL.trim();
        if (!candidate.includes('الرادار') && !candidate.includes('Radar')) {
          return candidate;
        }
      }
    }
  } catch {
    // ignore
  }

  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (envFrom && !envFrom.includes('الرادار') && !envFrom.includes('Radar')) {
    return envFrom;
  }

  return lang === 'en' ? DEFAULT_RESEND_FROM_EMAIL_EN : DEFAULT_RESEND_FROM_EMAIL_AR;
}

function getResendClient(): Resend | null {
  let apiKey = '';
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'));
      if (parsed.RESEND_API_KEY?.trim()) {
        apiKey = parsed.RESEND_API_KEY.trim();
        process.env.RESEND_API_KEY = apiKey;
      }
      if (parsed.RESEND_FROM_EMAIL?.trim()) {
        const candidate = parsed.RESEND_FROM_EMAIL.trim();
        if (!candidate.includes('الرادار') && !candidate.includes('Radar')) {
          process.env.RESEND_FROM_EMAIL = candidate;
        } else {
          process.env.RESEND_FROM_EMAIL = DEFAULT_RESEND_FROM_EMAIL;
        }
      }
    }
  } catch {
    // ignore
  }

  if (!apiKey) {
    apiKey = process.env.RESEND_API_KEY?.trim() || '';
  }

  if (!apiKey || !apiKey.startsWith('re_')) {
    return null;
  }
  return new Resend(apiKey);
}

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

/**
 * Builds localized Captain Contract email payload (Subject, HTML, Plaintext)
 */
export function buildCaptainContractEmail(params: {
  captainName: string;
  contractHash: string;
  acceptedAt: string;
  lang?: EmailLanguage;
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';
  const formattedDate = formatContractDate(params.acceptedAt, isEn ? 'en' : 'ar');

  const subject = isEn
    ? 'Certified Captain Advertiser Agreement | Bynkcom Digital Ad Network'
    : 'وثيقة عقد اشتراك الكابتن المعلن المعتمدة | شبكة بينكم للإعلان الرقمي';

  const brandName = isEn ? '⚡ Bynkcom Digital Ad Network' : '⚡ شبكة بينكم للإعلان الرقمي';
  const heading = isEn ? 'Certified Captain Advertiser Agreement' : 'وثيقة عقد اشتراك الكابتن المعلن المعتمدة';

  const greeting = isEn
    ? `Welcome Captain <strong style="color: #F8FAFC;">${params.captainName || "Advertiser"}</strong>,<br>We are pleased to inform you that your subscription and contractual capacity as an <strong style="color: #14F5D5;">"Independent Captain Advertiser"</strong> in Bynkcom Digital Ad Network have been officially certified, confirming your agreement to the Unified Terms and Privacy Policy.`
    : `مرحباً بك كابتن <strong style="color: #F8FAFC;">${params.captainName || "المعلن"}</strong>،<br>نحيطك علماً بأنه قد تم توثيق اشتراكك واعتماد صفتك التعاقدية كـ <strong style="color: #14F5D5;">«كابتن معلن مستقل»</strong> في شبكة بينكم للإعلان الرقمي بنجاح، وتأكيد موافقتك على وثيقة الشروط والخصوصية الموحدة.`;

  const stampLabel = isEn ? 'Encrypted Document Digital Stamp (SHA-256):' : 'الختم الرقمي المشفر للوثيقة (SHA-256):';
  const dateLabel = isEn ? 'Effective & Certified Date:' : 'تاريخ الاعتماد والسريان:';

  const pdfNote = isEn
    ? `📄 <strong>Your official certified copy in PDF format is attached to this email.</strong><br>A permanent identical copy has also been archived in your personal profile on the platform, allowing you to view, download, or print it at any time pursuant to Article (5) of the Agreement.`
    : `📄 <strong>نسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذا البريد الإلكتروني.</strong><br>كما تم حفظ نسخة مطابقة دائمة في ملفك الشخصي داخل المنصة لتمكينك من الاطلاع عليها أو تنزيلها أو طباعتها في أي وقت وفق أحكام المادة (5) من الوثيقة.`;

  const legalReminder = isEn
    ? 'Legal Reminder: Bynkcom is an interactive digital advertising network and charges zero commission (0%) on independent transactions.'
    : 'تذكير قانوني: منصة بينكم هي شبكة إعلانات رقمية تفاعلية ولا تتقاضى أي نسبة أو عمولة (0%) من أجور المعاملات المستقلة.';

  const footerText = isEn
    ? 'Official Electronic Registry | Bynkcom Digital Ad Network &copy; 2026'
    : 'السجل الإلكتروني الرسمي | شبكة بينكم للإعلان الرقمي &copy; 2026';

  const dir = isEn ? 'ltr' : 'rtl';
  const langAttr = isEn ? 'en' : 'ar';
  const textAlign = isEn ? 'left' : 'right';

  const plainText = isEn
    ? `Welcome Captain ${params.captainName || "Advertiser"}\n\nYour subscription as an "Independent Captain Advertiser" has been certified on Bynkcom Digital Ad Network.\nDigital Stamp (SHA-256): ${params.contractHash}\nEffective Date: ${formattedDate}\n\nYour certified PDF contract is attached.\n\nBynkcom Digital Ad Network © 2026`
    : `مرحباً بك كابتن ${params.captainName || "المعلن"}\n\nتم اعتماد صفتك التعاقدية كـ «كابتن معلن مستقل» في شبكة بينكم للإعلان الرقمي بنجاح.\nالختم الرقمي (SHA-256): ${params.contractHash}\nتاريخ السريان: ${formattedDate}\n\nنسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذه الرسالة.\n\nشبكة بينكم للإعلان الرقمي © 2026`;

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
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0D1424; border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: linear-gradient(180deg, rgba(20, 184, 166, 0.12) 0%, rgba(13, 20, 36, 0) 100%);">
              <div style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.35); border-radius: 16px; padding: 12px 28px;">
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">${brandName}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: ${textAlign};" dir="${dir}">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">${heading}</h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                ${greeting}
              </p>
              
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">${stampLabel}</p>
                <code style="display: block; font-size: 11px; color: #14F5D5; word-break: break-all; font-family: monospace;">${params.contractHash}</code>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #94A3B8;">${dateLabel} ${formattedDate}</p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; color: #CBD5E1;">
                ${pdfNote}
              </p>

              <div style="background: rgba(20, 184, 166, 0.08); border-left: 3px solid #14B8A6; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #2DD4BF; line-height: 1.6;">
                  ${legalReminder}
                </p>
              </div>
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

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: emailPayload.subject,
      text: emailPayload.text,
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
