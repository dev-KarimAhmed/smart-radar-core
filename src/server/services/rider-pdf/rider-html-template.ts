import type { RiderContractData } from './rider-pdf-types';
import { formatRiderContractDate } from './rider-pdf-types';

export function buildRiderContractHtml(data: RiderContractData, contractHash: string): string {
  const version = data.contractVersion || 'V1.0-Unified';
  const acceptedAtFormatted = formatRiderContractDate(data.acceptedAt, 'ar');
  const contractSerial = `BYNK-USR-${(data.userId || 'GEN').slice(0, 8).toUpperCase()}`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title>وثيقة سياسة خصوصية المستخدم والإعلانات - ${contractSerial}</title>
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif; background: #0B0F19; color: #E2E8F0; margin: 0; padding: 20px; font-size: 11pt; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #14F5D5; padding-bottom: 12px; margin-bottom: 16px; }
    .badge { display: inline-block; background: rgba(20, 245, 213, 0.1); border: 1px solid #14F5D5; color: #14F5D5; padding: 4px 12px; border-radius: 9999px; font-size: 9pt; font-weight: bold; margin-bottom: 8px; }
    h1 { color: #FFFFFF; font-size: 16pt; margin: 6px 0; font-weight: 900; }
    .subtitle { color: #94A3B8; font-size: 9.5pt; margin: 0; }
    .meta-box { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9.5pt; }
    .meta-item { display: flex; justify-content: space-between; }
    .meta-label { color: #94A3B8; }
    .meta-val { color: #FFFFFF; font-weight: bold; }
    .section-title { color: #14F5D5; font-size: 12pt; font-weight: bold; border-right: 3px solid #14F5D5; padding-right: 8px; margin: 14px 0 8px 0; }
    .clause { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
    .clause-title { color: #F8FAFC; font-weight: bold; font-size: 10pt; margin-bottom: 4px; }
    .clause-text { color: #CBD5E1; font-size: 9pt; margin: 0; text-align: justify; }
    .footer { text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px; margin-top: 20px; font-size: 8pt; color: #64748B; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">وثيقة خصوصية معتمدة ومسجلة إلكترونياً</div>
    <h1>سياسة خصوصية المستخدم والإعلانات المركزية والمستقلة</h1>
    <p class="subtitle">شبكة بينكم للإعلان الرقمي (Bynkcom Ad-Tech Network) · المملكة الأردنية الهاشمية</p>
  </div>

  <div class="meta-box">
    <div class="meta-item"><span class="meta-label">الاسم الكامل:</span><span class="meta-val">${data.fullName || 'مستخدم مسجل'}</span></div>
    <div class="meta-item"><span class="meta-label">رقم الهاتف:</span><span class="meta-val" dir="ltr">${data.phone || '-'}</span></div>
    <div class="meta-item"><span class="meta-label">البريد الإلكتروني:</span><span class="meta-val" dir="ltr">${data.email || '-'}</span></div>
    <div class="meta-item"><span class="meta-label">رقم الاعتماد الرقمي:</span><span class="meta-val" dir="ltr">${contractSerial}</span></div>
    <div class="meta-item"><span class="meta-label">النطاق الجغرافي:</span><span class="meta-val">${data.governorate || 'الأردن'} - ${data.district || 'المركزي'}</span></div>
    <div class="meta-item"><span class="meta-label">تاريخ الاعتماد:</span><span class="meta-val">${acceptedAtFormatted}</span></div>
  </div>

  <div class="section-title">بنود سياسة الخصوصية واستخدام الإعلانات المعتمدة</div>

  <div class="clause">
    <div class="clause-title">1. التمهيد والأساس القانوني والتوصيف التقني</div>
    <p class="clause-text">شبكة بينكم للإعلان الرقمي بروتوكول برمجي مستقل وبوابة بث إعلاني تفاعلي تربط بين الكباتن المعلنين المستقلين والمستخدمين. لا تقدم المنصة خدمات نقل مباشر أو أسطولاً، وتخضع لأحكام قانون المعاملات الإلكترونية وقوانين المملكة الأردنية الهاشمية.</p>
  </div>

  <div class="clause">
    <div class="clause-title">2. حماية الموقع الجغرافي ومعالجة الحافة (Edge-First)</div>
    <p class="clause-text">تتم معالجة إحداثيات الموقع (GPS) حصرياً وبصيغة مشفرة داخل معالج هاتف المستخدم لتحويلها لخلايا سداسية H3 (Resolution 9) ومسافات OSRM. لا يتم تتبع أو تخزين سجل تحركات المستخدم التاريخية في خوادم مركزية دائمة.</p>
  </div>

  <div class="clause">
    <div class="clause-title">3. أذونات التخزين والذاكرة المؤقتة (Offline-First)</div>
    <p class="clause-text">تستخدم المنصة التخزين المحلي (IndexedDB) لحفظ المواد الإعلانية مؤقتاً لتصفح سريع دون اتصال، وتخضع المحتويات المحفوظة لمسح وتطهير ميكانيكي آلي بعد 30 يوماً حتمية لحماية ذاكرة الجهاز.</p>
  </div>

  <div class="clause">
    <div class="clause-title">4. استقلالية الكباتن وصفر عمولة (0.00% Comm)</div>
    <p class="clause-text">يقر المستخدم بعلمه بأن الكباتن المعلنين هم متعاقدون مستقلون تماماً يعملون لحسابهم الخاص. تطبق المنصة مبدأ صفر عمولة على تعاملاتهم المستقلة، وتقتصر مسؤوليتها على الوساطة الإعلانية والتقنية.</p>
  </div>

  <div class="clause">
    <div class="clause-title">5. سرية وأمن البيانات والقانون الحاكم</div>
    <p class="clause-text">تخضع كافة الاتصالات للتشفير السيادي (TLS/HTTPS و AES-256). ولا يتم بيع أو مشاركة بيانات المستخدم مع أي طرف ثالث لأغراض تسويقية. وتختص محاكم عمان (قصر العدل) حصرياً بالفصل في أي نزاع.</p>
  </div>

  <div class="footer">
    بصمة التشفير الرقمية السيادية (SHA-256): ${contractHash}<br />
    سجل المعاملات الإلكترونية الرسمي · شبكة بينكم للإعلان الرقمي © ${new Date().getFullYear()} · النسخة الموحدة ${version}
  </div>
</body>
</html>`;
}
