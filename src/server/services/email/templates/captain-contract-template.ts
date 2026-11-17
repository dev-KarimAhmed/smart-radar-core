import { formatContractDate } from '../../contract-pdf-service';
import { EmailLanguage } from '../email-config';

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
    ? `Welcome Captain ${params.captainName || "Advertiser"}\n\nYour subscription as an "Independent Captain Advertiser" has been certified on Bynkcom Digital Ad Network.\nEffective Date: ${formattedDate}\n\nYour certified PDF contract is attached.\n\nBynkcom Digital Ad Network © 2026`
    : `مرحباً بك كابتن ${params.captainName || "المعلن"}\n\nتم اعتماد صفتك التعاقدية كـ «كابتن معلن مستقل» في شبكة بينكم للإعلان الرقمي بنجاح.\nتاريخ السريان: ${formattedDate}\n\nنسختك الرسمية المعتمدة بصيغة PDF مرفقة مع هذه الرسالة.\n\nشبكة بينكم للإعلان الرقمي © 2026`;

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
