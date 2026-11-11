import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { formatContractDate } from './contract-pdf-service';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpHref(rawUrl: string): string {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return escapeHtml(parsed.toString());
    }
  } catch {
    // fallback below
  }
  return '#';
}

export const DEFAULT_RESEND_FROM_EMAIL = 'بينكم - bynkcom <noreply@bynkcom.com>';

export function getSenderFromEmail(): string {
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

  return DEFAULT_RESEND_FROM_EMAIL;
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

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  otpCode?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const fromEmail = getSenderFromEmail();
  const safeResetHref = safeHttpHref(params.resetUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'إعادة تعيين كلمة المرور | بينكم - bynkcom',
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
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">⚡ بينكم - bynkcom</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: right;" dir="rtl">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">طلب إعادة تعيين كلمة المرور</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                مرحباً بك،<br>
                ⚠️ إذا لم تكن قد طلبت استعادة كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان ولن يتم إجراء أي تعديل على حسابك.
              </p>
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${safeResetHref}" target="_blank" style="display: inline-block; background-color: #14B8A6; color: #04140F; font-size: 16px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35);">
                  تعيين كلمة مرور جديدة 🔒
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0, 0, 0, 0.2); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                هذه الرسالة تم إرسالها آلياً لأغراض الأمان من منصة بينكم - bynkcom &copy; 2026
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



export async function sendAccountConfirmationEmail(params: {
  to: string;
  userName?: string;
  confirmUrl: string;
  otpCode?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const fromEmail = getSenderFromEmail();
  const safeOtp = params.otpCode ? escapeHtml(params.otpCode) : '';
  const safeUserName = escapeHtml(params.userName || 'بك');
  const safeConfirmHref = safeHttpHref(params.confirmUrl);
  const safeConfirmDisplay = escapeHtml(params.confirmUrl);
  const subject = params.otpCode
    ? `كود تفعيل حسابك: ${String(params.otpCode).replace(/[\r\n]/g, '')} | بينكم - bynkcom`
    : 'تأكيد الحساب وتفعيل البريد الإلكتروني | بينكم - bynkcom';

  const otpSection = params.otpCode
    ? `
              <!-- 6-digit OTP Code Box -->
              <div style="margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #94A3B8;">
                  رمز تفعيل الحساب الخاص بك:
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, rgba(20, 245, 213, 0.12), rgba(20, 184, 166, 0.2)); border: 2px dashed #14F5D5; border-radius: 18px; padding: 14px 32px; letter-spacing: 10px; font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 900; color: #14F5D5; text-shadow: 0 0 15px rgba(20, 245, 213, 0.45);">
                  ${safeOtp}
                </div>
                <div style="margin-top: 12px; font-size: 13px; font-weight: 700; color: #F59E0B;">
                  ⏱️ هذا الكود صالح لمدة 15 دقيقة فقط من وقت إرساله.
                </div>
              </div>
    `
    : '';

  const plainText = params.otpCode
    ? `مرحباً ${params.userName || 'بك'}\n\nكود تفعيل حسابك هو: ${params.otpCode}\n\nهذا الكود صالح لمدة 15 دقيقة فقط من وقت إرساله.\n\nأو يمكنك تفعيل حسابك مباشرة عبر الرابط:\n${params.confirmUrl}`
    : `مرحباً ${params.userName || 'بك'}\n\nلتأكيد وتفعيل حسابك، يرجى فتح الرابط التالي:\n${params.confirmUrl}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      text: plainText,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0D1424; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 16px; padding: 12px 24px;">
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">⚡ بينكم - bynkcom</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: right;" dir="rtl">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">تأكيد وتفعيل الحساب</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                مرحباً <strong>${safeUserName}</strong>،<br>
                سعداء بانضمامك إلى منصة بينكم (bynkcom). يرجى إدخال رمز التفعيل المكون من 6 أرقام في التطبيق أو الضغط على زر التفعيل لتأكيد بريدك الإلكتروني والبدء في الاستخدام:
              </p>

              ${otpSection}

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #94A3B8;">أو يمكنك التفعيل بضغطة واحدة مباشرة:</p>
                <a href="${safeConfirmHref}" target="_blank" style="display: inline-block; background-color: #14B8A6; color: #04140F; font-size: 15px; font-weight: 900; text-decoration: none; padding: 15px 36px; border-radius: 14px; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35);">
                  تأكيد وتفعيل الحساب مباشرة 🚀
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                أو يمكنك نسخ الرابط التالي ولصقه في المتصفح:<br>
                <a href="${safeConfirmHref}" target="_blank" style="color: #14F5D5; word-break: break-all; font-size: 12px;">${safeConfirmDisplay}</a>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: #F59E0B;">
                ⚠️ إذا لم تكن أنت من قام بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة بأمان ولن يتم تفعيل الحساب.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0, 0, 0, 0.2); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                هذه الرسالة تم إرسالها آلياً لأغراض التحقق والأمان من منصة بينكم - bynkcom &copy; 2026
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
      console.error('[resend] Account confirmation email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Account confirmation email delivered to ${params.to}, ID: ${data?.id}`);
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
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured or invalid' };
  }

  const fromEmail = getSenderFromEmail();
  const formattedDate = escapeHtml(formatContractDate(params.acceptedAt));
  const safeCaptainName = escapeHtml(params.captainName || 'المعلن');
  const safeContractHash = escapeHtml(params.contractHash);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'وثيقة عقد اشتراك الكابتن المعلن المعتمدة | شبكة بينكم للإعلان الرقمي',
      attachments: [
        {
          filename: 'Bynkcom_Captain_Advertiser_Contract.pdf',
          content: params.pdfBuffer,
        },
      ],
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>وثيقة عقد اشتراك الكابتن المعلن المعتمدة</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0D1424; border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: linear-gradient(180deg, rgba(20, 184, 166, 0.12) 0%, rgba(13, 20, 36, 0) 100%);">
              <div style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.35); border-radius: 16px; padding: 12px 28px;">
                <span style="font-size: 20px; font-weight: 900; color: #14F5D5; letter-spacing: 0.5px;">⚡ شبكة بينكم للإعلان الرقمي</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: right;" dir="rtl">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">وثيقة عقد اشتراك الكابتن المعلن المعتمدة</h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.8; color: #94A3B8;">
                مرحباً بك كابتن <strong style="color: #F8FAFC;">${safeCaptainName}</strong>،<br>
                نحيطك علماً بأنه قد تم توثيق اشتراكك واعتماد صفتك التعاقدية كـ <strong style="color: #14F5D5;">«كابتن معلن مستقل»</strong> في شبكة بينكم للإعلان الرقمي بنجاح، وتأكيد موافقتك على وثيقة الشروط والخصوصية الموحدة.
              </p>
              
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">الختم الرقمي المشفر للوثيقة (SHA-256):</p>
                <code style="display: block; font-size: 11px; color: #14F5D5; word-break: break-all; font-family: monospace;">${safeContractHash}</code>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #94A3B8;">تاريخ الاعتماد والسريان: ${formattedDate}</p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; color: #CBD5E1;">
                📄 <strong>نسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذا البريد الإلكتروني.</strong><br>
                كما تم حفظ نسخة مطابقة دائمة في ملفك الشخصي داخل المنصة لتمكينك من الاطلاع عليها أو تنزيلها أو طباعتها في أي وقت وفق أحكام المادة (5) من الوثيقة.
              </p>

              <div style="background: rgba(20, 184, 166, 0.08); border-left: 3px solid #14B8A6; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #2DD4BF; line-height: 1.6;">
                  تذكير قانوني: منصة بينكم هي شبكة إعلانات رقمية تفاعلية ولا تتقاضى أي نسبة أو عمولة (0%) من أجور المعاملات المستقلة.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0, 0, 0, 0.2); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                السجل الإلكتروني الرسمي | شبكة بينكم للإعلان الرقمي &copy; 2026
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
      console.error('[resend] Captain contract email send error:', error);
      return { success: false, error: error.message };
    }

    console.info(`[resend] Captain contract email delivered to ${params.to}, ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[resend] Exception sending contract email:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
