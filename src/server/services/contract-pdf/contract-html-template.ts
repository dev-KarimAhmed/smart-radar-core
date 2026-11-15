import { formatContractDate, type CaptainContractData } from './contract-pdf-types';
import { CONTRACT_HTML_STYLES } from './contract-html-styles';

/**
 * Builds the sovereign, high-fidelity Arabic contract HTML template
 * strictly complying with the Unified Captain Terms & Privacy Document.
 */
export function buildCaptainContractHtml(data: CaptainContractData, contractHash: string): string {
  const serial = 'BYNK-CAP-' + data.captainId.slice(0, 8).toUpperCase();
  const dateFormatted = formatContractDate(data.acceptedAt);
  const version = data.contractVersion || 'V1.0-Unified';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>عقد اشتراك الكابتن المعلن - شبكة بينكم</title>
  <style>
${CONTRACT_HTML_STYLES}
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="contract-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <div class="badge-sovereign">وثيقة رسمية معتمدة · قانون المعاملات الإلكترونية</div>
            <h1 class="brand-title">شبكة بينكم للإعلان الرقمي</h1>
            <div class="sub-title">وثيقة عقد اشتراك الكابتن المعلن - النسخة النهائية الموحدة ${version}</div>
          </td>
          <td style="vertical-align: top; width: 230px;">
            <div class="serial-box">
              <div style="font-size: 11px; color: #94A3B8;">رقم الوثيقة والسجل:</div>
              <span class="serial-code">${serial}</span>
              <div class="status-active">● معتمد وساري المفعول</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Section 1: Captain Information -->
      <div class="section-box">
        <div class="section-title">أولاً: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)</div>
        <table class="info-table">
          <tr>
            <td class="lbl">الاسم الرباعي:</td>
            <td class="val" colspan="3">${data.fullName}</td>
          </tr>
          <tr>
            <td class="lbl">رقم الهاتف:</td>
            <td class="val-ltr">${data.phone}</td>
            <td class="lbl" style="border-right: 1px solid rgba(255, 255, 255, 0.06);">رخصة القيادة:</td>
            <td class="val">${data.licenseNumber || 'تم التحقق'}</td>
          </tr>
          <tr>
            <td class="lbl">البريد الإلكتروني:</td>
            <td class="val-ltr" colspan="3">${data.email}</td>
          </tr>
          <tr>
            <td class="lbl">بيانات المركبة واللوحة:</td>
            <td class="val" colspan="3">${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.plateNumber || 'مرخصة'})</td>
          </tr>
          <tr>
            <td class="lbl">النطاق الجغرافي:</td>
            <td class="val" colspan="3">${data.governorate || 'الأردن'} - ${data.district || 'المركزي'}</td>
          </tr>
        </table>
      </div>

      <!-- Section 2: Articles 1 to 4 -->
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">ثانياً: الضوابط والاشتراطات التأسيسية المعتمدة (المواد الحاكمة من وثيقة الشروط الموحدة)</div>
        
        <div class="clause-item">
          <span class="clause-num">1.</span>
          <span><b>صفة الكابتن:</b> يزاول الكابتن نشاطه كمعلن مستقل لحسابه الخاص، وتعد المركبة وسيلة إعلانية شخصية له، ولا ينشأ أي عقد عمل أو تبعية مع الشبكة بأي شكل.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">2.</span>
          <span><b>طبيعة الشبكة:</b> شبكة بينكم منصة تقنية للإعلانات الرقمية والتسويق، ولا تقدم أي خدمات نقل أو توجيه أو توصيل ركاب إطلاقاً.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">3.</span>
          <span><b>صفر عمولة (0%):</b> لا تتقاضى الشبكة أي عمولة أو نسبة مئوية من أجور الرحلات أو الصفقات المباشرة بين الكابتن والمستخدمين في أي وقت.</span>
        </div>
        <div class="clause-item" style="margin-bottom: 0;">
          <span class="clause-num">4.</span>
          <span><b>مؤشر السوق الاسترشادي:</b> مؤشر إحصائي استرشادي غير إلزامي محسوب محلياً، ولا يعد بأي حال تسعيرة إجبارية على الكابتن.</span>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · عقد اشتراك الكابتن المعلن الموحد</span>
      <span>الصفحة 1 من 2</span>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="contract-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <h2 class="brand-title" style="font-size: 22px;">شبكة بينكم للإعلان الرقمي</h2>
            <div class="sub-title" style="font-size: 13.5px;">تابع: الضوابط التأسيسية والختم الرقمي المعتمد للعقد</div>
          </td>
          <td style="vertical-align: top; width: 230px; text-align: left;">
            <div style="font-size: 12.5px; color: #94A3B8;">رقم الوثيقة: <span style="color: #14F5D5; font-family: monospace; direction: ltr; display: inline-block; font-weight: 900;">${serial}</span></div>
          </td>
        </tr>
      </table>

      <!-- Section 2 Continued: Articles 5 to 9 -->
      <div class="section-box">
        <div class="section-title">تابع ثانياً: المواد والاشتراطات التشغيلية المعتمدة</div>

        <div class="clause-item">
          <span class="clause-num">5.</span>
          <span><b>أذونات موارد الجهاز:</b> يمنح الكابتن إذناً صريحاً ومحدداً للموقع والإنترنت والشاشة بالقدر الضروري لتشغيل التطبيق وبث الإعلانات فقط.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">6.</span>
          <span><b>زر مشاركة التتبع المباشر:</b> ميزة تتبع لحظية طارئة تنتهي فورياً بإغلاق الرحلة، دون حفظ أي مسار أو سجل في خوادم النظام حفاظاً على السرية.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">7.</span>
          <span><b>إسقاط الأجل ومسح السجلات (72 ساعة):</b> تخضع سجلات التحركات لمسح وتطهير آلي دوري كل 72 ساعة حتمية لحماية الخصوصية المطلقة.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">8.</span>
          <span><b>نظام الرتب الخمسة:</b> يخضع الكابتن للتصنيف الآلي المعتمد (برونزي، فضي، ذهبي، بلاتيني، ماسي) حسب ساعات التواجد وجودة الأداء والتقييم.</span>
        </div>
        <div class="clause-item" style="margin-bottom: 0;">
          <span class="clause-num">9.</span>
          <span><b>التدقيق الآلي للإعلانات:</b> تخضع كافة المواد الإعلانية للفرز المسبق بالذكاء الاصطناعي لضمان الامتثال للقوانين والآداب العامة وسيادة القانون.</span>
        </div>
      </div>

      <!-- Section 3: Digital Seal & Signature -->
      <div class="footer-box">
        <div class="section-title" style="margin-bottom: 10px; border-bottom: none; padding-bottom: 0;">
          ثالثاً: الختم والتوقيع الرقمي المعتمد (المادة 5 - قانون المعاملات الإلكترونية)
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
          <span style="color: #CBD5E1; font-size: 13px;"><b>حالة التوثيق:</b> معتمد وسجل رسمي نافذ بموجب القانون</span>
          <span style="color: #94A3B8; font-size: 13px;"><b>تاريخ وساعة التوثيق:</b> <span style="color: #14F5D5; font-weight: 800;">${dateFormatted}</span></span>
        </div>

        <div style="color: #94A3B8; font-size: 12px; font-weight: 600; margin-bottom: 4px;">بصمة التشفير الرقمية السيادية للعقد (SHA-256):</div>
        <span class="hash-code">${contractHash}</span>
        
        <div style="color: #10B981; font-size: 12.5px; margin-top: 12px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">✓</span>
          <span>تم توثيق وقبول الشروط إلكترونياً وحفظ السجل التعاقدي بموجب القوانين والأنظمة المرعية في المملكة.</span>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · عقد اشتراك الكابتن المعلن الموحد</span>
      <span>الصفحة 2 من 2</span>
    </div>
  </div>
</body>
</html>`;
}
