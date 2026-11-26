import { formatContractDate, type CaptainContractData } from './contract-pdf-types';
import { CONTRACT_HTML_STYLES } from './contract-html-styles';

/**
 * Builds the sovereign, high-fidelity Arabic contract HTML template
 * strictly complying with the Foundational Contract & Captain Subscription Document V2.6.
 */
export function buildCaptainContractHtml(data: CaptainContractData, contractHash?: string): string {
  const serial = 'BYNK-CAP-' + data.captainId.slice(0, 8).toUpperCase();
  const dateFormatted = formatContractDate(data.acceptedAt);
  const version = data.contractVersion || 'V2.6-Secured';
  const seal = contractHash ? contractHash.slice(0, 32) : 'BYNKCOM-SECURED-ELECTRONIC-SEAL';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن المعلن - شبكة بينكم</title>
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
            <div class="sub-title">وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن المعلن والخدمات التقنية (${version})</div>
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

      <!-- Foundational Preamble -->
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-title">ثانياً: البند التأسيسي وطبيعة المنصة (بروتوكول إعلاني بحت)</div>
        <div class="clause-item">
          <span class="clause-num">●</span>
          <span><b>البند التأسيسي:</b> تعد مركبة الكابتن وسيلة إعلانية مستقلة لبث المحتوى الإعلاني. وتقتصر شبكة بينكم على توفير البنية التقنية وبوابة البث، ولا تمارس نشاط نقل الركاب أو التوصيل، ولا تمتلك أساطيل، ولا ترتبط مع الكابتن بعقد عمل أو تبعية تشغيلية.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">●</span>
          <span><b>مجانية التعاملات (0.00% عمولة):</b> لا تتقاضى المنصة أي عمولة أو نسبة اقتطاع مالي من أجور النقل أو المعاملات المباشرة بين المستخدمين إطلاقاً، وتقتصر مواردها على بدلات اشتراكات وباقات البث الإعلاني.</span>
        </div>
        <div class="clause-item" style="margin-bottom: 0;">
          <span class="clause-num">●</span>
          <span><b>دلالة مصطلح «الراكب»:</b> يُقصد به الدلالة الوظيفية التفاعلية البحتة للمستخدم عند انتفاعه الفعلي بخدمة يقدمها معلن مستقل، دون منحه صفة قانونية كراكب نقل عام تجاه الشبكة.</span>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن</span>
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
            <div class="sub-title" style="font-size: 13.5px;">تابع: المواد الحاكمة، الرتب، وكتالوج الخدمات التقنية</div>
          </td>
          <td style="vertical-align: top; width: 230px; text-align: left;">
            <div style="font-size: 12.5px; color: #94A3B8;">الختم الرقمي: <span style="color: #14F5D5; font-family: monospace; direction: ltr; display: inline-block; font-weight: 800; font-size: 10px;">${seal}</span></div>
          </td>
        </tr>
      </table>

      <!-- Section 2 Continued: Governing Articles -->
      <div class="section-box">
        <div class="section-title">ثالثاً: المواد التشغيلية والرتب وكتالوج الخدمات الإعلانية المعتمدة</div>

        <div class="clause-item">
          <span class="clause-num">1.</span>
          <span><b>المادة (1) و (2) الاستقلال الإعلاني:</b> يزاول الكابتن نشاطه لحسابه الخاص وباستقلال مهني وإداري ومالي، ويتحمل مسؤولية التراخيص، وتخضع المواد الإعلانية للضوابط الشرعية والقانونية.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">2.</span>
          <span><b>المادة (5) حماية خصوصية المستخدمين:</b> يلتزم الكابتن بحظر استغلال بيانات الركاب أو تسجيل الصوت/الفيديو دون إذن صريح، ويعد أي خرق إخلالاً جسيماً يوجب الحظر الفوري والمسؤولية الكاملة.</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">3.</span>
          <span><b>الباب الثاني - موارد الجهاز والرتب:</b> استخدام موارد الجهاز بالقدر الضروري للبث الإعلاني، وتفعيل الرتب الإعلانية الخمس (البرونزية، الفضية، الذهبية، البلاتينية، والماسية للبث المركزي).</span>
        </div>
        <div class="clause-item">
          <span class="clause-num">4.</span>
          <span><b>الباب الثالث - الخدمة (11) مشاركة التتبع:</b> أداة طمأنينة اختيارية تفعل بطلب المستخدم لمشاركة الرحلة مع الأقارب، وتنتهي وفوراً بانتهاء الرحلة مع مسح بيانات التحركات آلياً خلال 72 ساعة حتمية.</span>
        </div>
        <div class="clause-item" style="margin-bottom: 0;">
          <span class="clause-num">5.</span>
          <span><b>الباب الرابع - التدقيق الآلي والوثيقة المصدرية:</b> تدقيق آلي بالذكاء الاصطناعي، واعتماد هذه الوثيقة كمصدر الحقيقة الواحد وسريان العقد الإلكتروني النافذ بالجزء من الثانية.</span>
        </div>
      </div>

      <!-- Acceptance verification note -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; background: rgba(255,255,255,0.025); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
        <span style="color: #10B981; font-size: 12.5px; font-weight: 800;">✓ تم توثيق وقبول الوثيقة إلكترونياً وسريان العقد رسمياً</span>
        <span style="color: #94A3B8; font-size: 12.5px;"><b>تاريخ وساعة التوثيق:</b> <span style="color: #14F5D5; font-weight: 800;">${dateFormatted}</span></span>
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن</span>
      <span>الصفحة 2 من 2</span>
    </div>
  </div>
</body>
</html>`;
}
