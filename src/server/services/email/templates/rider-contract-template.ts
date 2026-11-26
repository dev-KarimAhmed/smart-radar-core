import { formatRiderContractDate } from '../../rider-pdf-service';
import { EmailLanguage } from '../email-config';

export function buildRiderContractEmail(params: {
  userName: string;
  contractHash: string;
  acceptedAt: string;
  lang?: EmailLanguage;
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';
  const formattedDate = formatRiderContractDate(params.acceptedAt, isEn ? 'en' : 'ar');

  const subject = isEn
    ? 'Certified User Privacy Policy & Platform Terms | Bynkcom Ad-Tech Network'
    : 'وثيقة سياسة خصوصية المستخدم والإعلانات الرقمية المعتمدة | شبكة بينكم للإعلان الرقمي';

  const brandName = isEn ? '⚡ Bynkcom Ad-Tech Network' : '⚡ شبكة بينكم للإعلان الرقمي';
  const heading = isEn
    ? 'Certified User Privacy Policy & Advertising Terms'
    : 'وثيقة سياسة خصوصية المستخدم والإعلانات المعتمدة';

  const greeting = isEn
    ? `Welcome <strong style="color: #F8FAFC;">${params.userName || "User"}</strong>,<br>We are pleased to inform you that your registration in Bynkcom Ad-Tech Network has been completed successfully, certifying your acceptance of the <strong style="color: #14F5D5;">"User Privacy Policy & Central and Independent Advertising Agreement"</strong>.`
    : `مرحباً بك <strong style="color: #F8FAFC;">${params.userName || "المستخدم"}</strong>،<br>نحيطك علماً بأنه قد تم توثيق تسجيلك في شبكة بينكم للإعلان الرقمي بنجاح، وتأكيد اعتمادك وموافقتك على <strong style="color: #14F5D5;">«سياسة خصوصية المستخدم والإعلانات المركزية والمستقلة»</strong>.`;

  const dateLabel = isEn ? 'Effective & Certified Date:' : 'تاريخ الاعتماد والسريان:';

  const pdfNote = isEn
    ? `📄 <strong>Your official certified copy in PDF format is attached to this email.</strong><br>A permanent identical copy has also been archived in your personal profile on the platform, allowing you to view, download, or print it at any time pursuant to the Electronic Transactions Law.`
    : `📄 <strong>نسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذا البريد الإلكتروني.</strong><br>كما تم حفظ نسخة مطابقة دائمة في ملفك الشخصي داخل المنصة لتمكينك من الاطلاع عليها أو تنزيلها أو طباعتها في أي وقت وفق أحكام الوثيقة وسجل المعاملات الإلكترونية.`;

  const legalReminder = isEn
    ? 'Legal Reminder: Bynkcom operates strictly as an ad-tech network under Jordanian Law and applies end-to-end edge privacy encryption.'
    : 'تذكير قانوني: منصة بينكم هي بروتوكول وشبكة إعلانية بحتة تخضع لأحكام قانون المعاملات الإلكترونية وقوانين المملكة الأردنية الهاشمية، وتطبق معايير التشفير والخصوصية النسيجية.';

  const footerText = isEn
    ? 'Official Electronic Registry | Bynkcom Ad-Tech Network &copy; 2026'
    : 'السجل الإلكتروني الرسمي | شبكة بينكم للإعلان الرقمي &copy; 2026';

  const dir = isEn ? 'ltr' : 'rtl';
  const langAttr = isEn ? 'en' : 'ar';
  const textAlign = isEn ? 'left' : 'right';

  const plainText = isEn
    ? `Welcome ${params.userName || "User"}\n\nYour agreement to the User Privacy Policy & Central and Independent Advertising has been certified on Bynkcom Ad-Tech Network.\nEffective Date: ${formattedDate}\n\nYour certified PDF document is attached.\n\nBynkcom Ad-Tech Network © 2026`
    : `مرحباً بك ${params.userName || "المستخدم"}\n\nتم توثيق موافقتك على سياسة خصوصية المستخدم والإعلانات المركزية والمستقلة في شبكة بينكم للإعلان الرقمي بنجاح.\nتاريخ السريان: ${formattedDate}\n\nنسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذه الرسالة.\n\nشبكة بينكم للإعلان الرقمي © 2026`;

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
              
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #94A3B8;">${dateLabel} <strong style="color: #14F5D5;">${formattedDate}</strong></p>

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
