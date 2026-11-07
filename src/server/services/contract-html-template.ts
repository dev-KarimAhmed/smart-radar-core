import type { CaptainContractData } from './contract-pdf-service';

/**
 * Standard, universal Arabic date and time formatter using Western Arabic digits
 * and pan-Arab Gregorian month names (avoiding confusing Eastern numerals or regional Syriac names).
 */
export function formatContractDate(dateInput?: string | Date | number): string {
  const dt = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(dt.getTime())) return '-';
  const day = String(dt.getDate()).padStart(2, '0');
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthName = months[dt.getMonth()];
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  return `${day} ${monthName} ${year} - الساعة ${hours}:${mins} ${period}`;
}

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
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #070B14;
      color: #F8FAFC;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    .contract-page {
      background: #0B0F19;
      border: 1.5px solid rgba(20, 184, 166, 0.45);
      border-radius: 18px;
      padding: 22px 26px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      page-break-after: always;
      min-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .contract-page:last-child {
      page-break-after: avoid;
    }

    .header-table {
      width: 100%;
      border-bottom: 1.5px solid rgba(20, 184, 166, 0.25);
      padding-bottom: 14px;
      margin-bottom: 16px;
    }

    .badge-sovereign {
      display: inline-block;
      background: rgba(20, 184, 166, 0.15);
      border: 1px solid rgba(20, 184, 166, 0.35);
      color: #14F5D5;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .brand-title {
      color: #14F5D5;
      font-size: 26px;
      font-weight: 900;
      margin: 0;
      letter-spacing: -0.5px;
      line-height: 1.25;
    }

    .sub-title {
      color: #CBD5E1;
      font-size: 14px;
      font-weight: 700;
      margin-top: 4px;
    }

    .serial-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 14px;
      text-align: left;
    }

    .serial-label {
      font-size: 10.5px;
      color: #94A3B8;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .serial-value {
      font-family: monospace;
      font-size: 15px;
      color: #14F5D5;
      font-weight: 900;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .section-title {
      color: #14F5D5;
      font-size: 14.5px;
      font-weight: 900;
      border-right: 4px solid #14F5D5;
      padding-right: 10px;
      margin: 14px 0 10px 0;
      letter-spacing: -0.2px;
    }

    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .party-card {
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 12.5px;
    }

    .party-card h4 {
      margin: 0 0 8px 0;
      color: #38BDF8;
      font-size: 13px;
      font-weight: 800;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }

    .info-label {
      color: #94A3B8;
      font-weight: 600;
    }

    .info-value {
      color: #F8FAFC;
      font-weight: 700;
    }

    .clause {
      background: rgba(255, 255, 255, 0.015);
      border-right: 2px solid rgba(20, 184, 166, 0.4);
      padding: 8px 12px;
      margin-bottom: 8px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #E2E8F0;
      text-align: justify;
    }

    .clause-title {
      color: #F1F5F9;
      font-weight: 800;
      margin-bottom: 3px;
      display: block;
    }

    .hash-badge {
      font-family: monospace;
      font-size: 10px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px dashed rgba(20, 184, 166, 0.35);
      color: #14F5D5;
      padding: 6px 10px;
      border-radius: 8px;
      word-break: break-all;
      margin: 8px 0;
    }

    .page-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #64748B;
      font-weight: 600;
    }

    .stamp-box {
      border: 2px dashed rgba(20, 184, 166, 0.4);
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      background: rgba(20, 184, 166, 0.03);
      margin-top: 10px;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="contract-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <div class="badge-sovereign">عقد اشتراك وبث إعلاني إلكتروني ملزم</div>
            <h1 class="brand-title">شبكة بينكم للإعلان الرقمي</h1>
            <div class="sub-title">وثيقة الشروط والأحكام الموحدة للناقل المعلن (الكابتن)</div>
          </td>
          <td style="vertical-align: top; text-align: left; width: 220px;">
            <div class="serial-box">
              <div class="serial-label">الرقم التسلسلي للعقد</div>
              <div class="serial-value">${serial}</div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">الإصدار: ${version}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- أطراف العقد -->
      <div class="section-title">أولاً: أطراف العقد والمصادقة الرقمية</div>
      <div class="parties-grid">
        <div class="party-card">
          <h4>الطرف الأول: شبكة بينكم للإعلان والوساطة التقنية</h4>
          <div class="info-row"><span class="info-label">طبيعة المنصة:</span><span class="info-value">وسيط إعلاني وتقني مستقل (PWA)</span></div>
          <div class="info-row"><span class="info-label">النطاق والسيادة:</span><span class="info-value">المملكة الأردنية الهاشمية وكافة الأقاليم المعتمدة</span></div>
          <div class="info-row"><span class="info-label">المعمارية:</span><span class="info-value">معالجة نسيجية حافة بصفر تخزين سحابي وسيط</span></div>
          <div class="info-row"><span class="info-label">المحكم الملاحي:</span><span class="info-value">خادم التوجيه السيادي OSRM الحر</span></div>
        </div>

        <div class="party-card">
          <h4>الطرف الثاني: الكابتن المعلن (المشترك الموثق)</h4>
          <div class="info-row"><span class="info-label">الاسم الكامل:</span><span class="info-value">${data.fullName || '-'}</span></div>
          <div class="info-row"><span class="info-label">رقم الهاتف:</span><span class="info-value" dir="ltr">${data.phone || '-'}</span></div>
          <div class="info-row"><span class="info-label">الرقم الوطني / الهوية:</span><span class="info-value">${data.nationalIdNumber || 'مسجل إلكترونياً'}</span></div>
          <div class="info-row"><span class="info-label">رقم لوحة المركبة:</span><span class="info-value">${data.plateNumber || 'مركبة مستقلة معتمدة'}</span></div>
          <div class="info-row"><span class="info-label">طراز ولون المركبة:</span><span class="info-value">${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.vehicleYear || '-'})</span></div>
        </div>
      </div>

      <!-- البنود الجوهرية 1 -->
      <div class="section-title">ثانياً: البنود الجوهرية وطبيعة العلاقة التعاقدية</div>

      <div class="clause">
        <span class="clause-title">1. التوصيف القانوني للعلاقة والصفة المستقلة:</span>
        يقر الطرف الثاني إقراراً صريحاً وقاطعاً بأنه يعمل بصفة "كابتن معلن ومستقل" تماماً، ولا تربطه بالمنصة أي علاقة عمل أو تبعية أو توكيل أو وكالة تجارية. وتقتصر خدمة المنصة على تمكينه من بث موقعه الجغرافي الإعلاني وعرض خدمات النقل وتأجير مساحاته الإعلانية للركاب.
      </div>

      <div class="clause">
        <span class="clause-title">2. آلية التحكيم الملاحي وحساب المسافات القطعية:</span>
        تعتمد المنصة خادم التوجيه السيادي OSRM المستقل كمحكم وحيد لاحتساب المسافات الحقيقية عبر شبكة الطرق وزمن الرحلة التقديري. يلتزم الكابتن بالمسافات والأوقات المحسوبة تقنياً ولا يحق له النزاع أو التلاعب بالإحداثيات الملاحية.
      </div>

      <div class="clause">
        <span class="clause-title">3. مؤشر التوازن السعري وكوابح السوق (نطاق 15%):</span>
        يخضع تسعير الرحلات لكوابح السوق القطعية لحماية التوازن العادل: أي انحراف سعري بين 10% إلى 14.9% يطلق وميض التحذير البرتقالي ويخفض ترتيب العرض، في حين أن أي انحراف بنسبة 15% فما فوق يفعل بروتوكول الإغلاق القرمزي ويجمد إرسال العرض فورياً لمنع حرق الأسعار أو استغلال المستخدمين.
      </div>

      <div class="clause">
        <span class="clause-title">4. الرصيد الزمني، باقات الرادار، وحصانة الشحن المباشر:</span>
        يعمل الكابتن بنظام "ساعات الرادار النشطة". يتم شحن الرصيد مباشرة عبر القنوات السيادية المعتمدة (CliQ، المحافظ الإلكترونية، القنوات البنكية المحلية). لا تتقاضى المنصة أي عمولة مقتطعة من أجر الرحلة النقدي المدفوع من الراكب؛ كامل قيمة الرحلة ملك خالص للكابتن.
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · عقد اشتراك الكابتن المعلن الموحد</span>
      <span>الصفحة 1 من 2</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="contract-page">
    <div>
      <div class="section-title">ثالثاً: سياسة الخصوصية، الذوبان النسيجي، وأمان البيانات</div>

      <div class="clause">
        <span class="clause-title">5. بروتوكول الخصوصية المطلقة والذوبان النسيجي (H3 Resolution 9):</span>
        تطبق المنصة تقنية التعتيم النسيجي الحافة؛ لا يتم تخزين مسارات GPS المستمرة على خوادم المنصة. فور إتمام الرحلة، يذوب حساب الكابتن وموقعه جغرافياً في خلية H3 بدقة ريزولوشن 9. يتم إعدام وحذف كافة سجلات وتفاصيل الرحلات المحفوظة تلقائياً كل 72 ساعة حتمية دون استبقاء أي أثر جنائي أو ملاحي.
      </div>

      <div class="clause">
        <span class="clause-title">6. الالتزامات القانونية، الترخيص، والسلامة المرورية:</span>
        يتحمل الكابتن كامل المسؤولية المدنية والجزائية عن سلامة المركبة، صلاحية رخصة القيادة والتأمين الإلزامي، وصحة كافة الوثائق المرفوعة. تخلي المنصة مسؤوليتها القانونية عن أي حوادث مرورية، مخالفات سير، أو نزاعات مالية بين الكابتن والركاب خارج إطار المنظومة التقنية.
      </div>

      <div class="clause">
        <span class="clause-title">7. بروتوكول مكافحة الغش وتطهير الحسابات (Anti-Cheat Kernel):</span>
        يحظر حظراً باتاً استخدام برامج التلاعب بالمواقع (Fake GPS)، أو استنساخ التطبيق، أو التلاعب بفارق التوقيت الشبكي (Time Delta). أي محاولة تلاعب تؤدي فوراً إلى تجميد المحفظة، إسقاط رصيد المناعة السلوكية، وتفعيل التطهير التلقائي للحساب مع الحظر الدائم من الشبكة.
      </div>

      <div class="clause">
        <span class="clause-title">8. البث الإعلاني وحقوق المساحات الإعلانية الملحقة:</span>
        يقر الكابتن بحق المنصة في بث المواد الإعلانية التجارية المصرح بها على شاشة التطبيق أثناء وضع الانتظار أو تتبع الرحلة، بما لا يعيق الوظائف التشغيلية أو إرشادات السلامة على الطريق.
      </div>

      <!-- بصمة التوثيق الرقمي والختم المشفر -->
      <div class="section-title">رابعاً: البصمة الرقمية والختم الإلكتروني للمصادقة</div>
      
      <div class="stamp-box">
        <div style="font-weight: 800; color: #14F5D5; font-size: 13.5px; margin-bottom: 4px;">
          الختم المشفر والمصادقة الرقمية الرسمية (SHA-256 Sovereign Seal)
        </div>
        <div style="font-size: 11.5px; color: #94A3B8; margin-bottom: 8px;">
          تم توقيع هذا العقد إلكترونياً عبر مفتاح التحقق المشفر وخوارزمية التجزئة الآمنة SHA-256
        </div>
        <div class="hash-badge">
          ${contractHash}
        </div>
        <div style="display: flex; justify-content: space-around; margin-top: 10px; font-size: 11.5px; color: #CBD5E1;">
          <div><strong style="color: #94A3B8;">تاريخ ووقت القبول:</strong> ${dateFormatted}</div>
          <div><strong style="color: #94A3B8;">عنوان النبض الرقمي:</strong> ${data.ipAddress || 'شبكة آمنة معتمدة'}</div>
          <div><strong style="color: #94A3B8;">حالة الاعتماد:</strong> <span style="color: #10B981; font-weight: 800;">ساري وموثق قانونياً</span></div>
        </div>
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
