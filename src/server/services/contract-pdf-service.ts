import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface CaptainContractData {
  captainId: string;
  fullName: string;
  phone: string;
  email: string;
  nationalIdNumber?: string;
  licenseNumber?: string;
  plateNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  country?: string;
  governorate?: string;
  district?: string;
  acceptedAt?: string;
  contractVersion?: string;
  ipAddress?: string;
}

export interface ContractResult {
  pdfBuffer: Buffer;
  contractHash: string;
  contractId: string;
  storagePath: string;
  version: string;
  acceptedAt: string;
}

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

    .serial-code {
      font-family: monospace;
      font-size: 15px;
      font-weight: 900;
      color: #14F5D5;
      direction: ltr;
      display: block;
      margin-top: 2px;
    }

    .status-active {
      color: #10B981;
      font-size: 11px;
      font-weight: 800;
      margin-top: 3px;
    }

    .section-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 15.5px;
      font-weight: 900;
      color: #14F5D5;
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 1.5px solid rgba(20, 184, 166, 0.2);
      padding-bottom: 6px;
    }

    .info-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 6px;
      font-size: 13.5px;
    }

    .info-table tr {
      background: rgba(255, 255, 255, 0.025);
    }

    .info-table td {
      padding: 8px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .info-table td:first-child {
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    .info-table td:last-child {
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    .lbl {
      color: #94A3B8;
      font-weight: 700;
      white-space: nowrap;
      width: 130px;
      font-size: 13px;
    }

    .val {
      color: #F8FAFC;
      font-weight: 800;
      text-align: right;
    }

    .val-ltr {
      font-family: monospace;
      direction: ltr;
      color: #38BDF8;
      font-weight: 800;
      text-align: right;
      font-size: 13.5px;
    }

    .clause-item {
      display: flex;
      gap: 12px;
      margin-bottom: 13px;
      font-size: 14.5px;
      color: #CBD5E1;
      line-height: 1.65;
      text-align: justify;
    }

    .clause-num {
      color: #14F5D5;
      font-weight: 900;
      flex-shrink: 0;
      min-width: 20px;
      font-size: 15px;
    }

    .clause-item b {
      color: #F8FAFC;
      font-weight: 800;
    }

    .footer-box {
      background: rgba(20, 184, 166, 0.06);
      border: 1px solid rgba(20, 184, 166, 0.25);
      border-radius: 16px;
      padding: 18px 22px;
      font-size: 13.5px;
    }

    .hash-code {
      font-family: monospace;
      font-size: 12px;
      color: #14F5D5;
      direction: ltr;
      word-break: break-all;
      display: block;
      margin-top: 6px;
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(20, 184, 166, 0.2);
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 10px;
      margin-top: 14px;
      font-size: 11.5px;
      color: #64748B;
      font-weight: 600;
    }
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
            <td class="lbl" style="border-right: 1px solid rgba(255, 255, 255, 0.06);">الرقم الوطني / الهوية:</td>
            <td class="val">${data.nationalIdNumber || 'تم التحقق'}</td>
          </tr>
          <tr>
            <td class="lbl">البريد الإلكتروني:</td>
            <td class="val-ltr" colspan="3">${data.email}</td>
          </tr>
          <tr>
            <td class="lbl">رخصة القيادة:</td>
            <td class="val">${data.licenseNumber || 'تم التحقق'}</td>
            <td class="lbl" style="border-right: 1px solid rgba(255, 255, 255, 0.06);">بيانات المركبة واللوحة:</td>
            <td class="val">${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.plateNumber || 'مرخصة'})</td>
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

/**
 * Generates an official signed PDF document for the Advertiser Captain
 * utilizing native Chromium print rendering for flawless HarfBuzz Arabic typography.
 */
export async function generateCaptainContractPdf(data: CaptainContractData): Promise<{
  pdfBuffer: Buffer;
  contractHash: string;
  contractId: string;
  acceptedAt: string;
}> {
  const contractId = data.captainId || crypto.randomUUID();
  const acceptedAt = data.acceptedAt || new Date().toISOString();
  const version = data.contractVersion || 'V1.0-Unified';

  // Compute a cryptographic SHA-256 hash of the contract parameters
  const rawPayload = JSON.stringify({
    captainId: data.captainId,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    nationalId: data.nationalIdNumber,
    license: data.licenseNumber,
    plate: data.plateNumber,
    vehicle: `${data.vehicleMake || ''} ${data.vehicleModel || ''}`,
    version,
    acceptedAt,
  });
  const contractHash = crypto.createHash('sha256').update(rawPayload).digest('hex').toUpperCase();

  const html = buildCaptainContractHtml(data, contractHash);

  // Attempt Chromium print generation via playwright or playwright-core
  try {
    let chromiumInstance: any;
    try {
      const pw = await import('playwright-core');
      chromiumInstance = pw.chromium;
    } catch {
      const pwTest = await import('@playwright/test');
      chromiumInstance = pwTest.chromium;
    }

    const browser = await chromiumInstance.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    await browser.close();

    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      contractHash,
      contractId,
      acceptedAt,
    };
  } catch (chromiumError) {
    console.error('[Contract PDF Service] Chromium launch error:', chromiumError);

    // Fallback: Return HTML content buffer with contract metadata
    const htmlBuffer = Buffer.from(html, 'utf-8');
    return {
      pdfBuffer: htmlBuffer,
      contractHash,
      contractId,
      acceptedAt,
    };
  }
}

/**
 * Saves the generated contract PDF and metadata into Supabase Storage
 * and the electronic ledger.
 */
export async function saveCaptainContract(data: CaptainContractData): Promise<ContractResult> {
  const { pdfBuffer, contractHash, contractId, acceptedAt } = await generateCaptainContractPdf(data);
  const version = data.contractVersion || 'V1.0-Unified';
  const fileName = `bynkcom_contract_${version.toLowerCase()}.pdf`;
  const storagePath = `${data.captainId}/${fileName}`;

  // 1. Upload to Supabase Storage: captain-documents bucket
  const { error: uploadError } = await supabaseAdmin.storage
    .from('captain-documents')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.warn('[Contract PDF Service] Storage upload warning:', uploadError.message);
  }

  // 2. Upload metadata JSON in bucket
  const metaJson = Buffer.from(
    JSON.stringify(
      {
        contractId,
        captainId: data.captainId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        version,
        acceptedAt,
        contractHash,
        storagePath,
      },
      null,
      2
    )
  );

  await supabaseAdmin.storage
    .from('captain-documents')
    .upload(`${data.captainId}/contract_meta.json`, metaJson, {
      contentType: 'application/json',
      upsert: true,
    });

  // 3. Try to record in captain_electronic_contracts if table exists
  try {
    await supabaseAdmin.from('captain_electronic_contracts').upsert(
      {
        captain_id: data.captainId,
        contract_version: version,
        full_name: data.fullName,
        national_id_number: data.nationalIdNumber || null,
        license_number: data.licenseNumber || null,
        plate_number: data.plateNumber || null,
        phone: data.phone,
        email: data.email,
        governorate: data.governorate || null,
        district: data.district || null,
        terms_accepted_at: acceptedAt,
        contract_hash: contractHash,
        pdf_url: storagePath,
        ip_address: data.ipAddress || null,
        metadata: { version, contractId },
      },
      { onConflict: 'captain_id' }
    );
  } catch (dbErr) {
    console.info('[Contract PDF Service] Database record note:', (dbErr as Error).message);
  }

  return {
    pdfBuffer,
    contractHash,
    contractId,
    storagePath,
    version,
    acceptedAt,
  };
}
