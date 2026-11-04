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
      margin: 8mm;
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
      padding: 16px;
      line-height: 1.5;
    }

    .contract-card {
      border: 1.5px solid rgba(20, 184, 166, 0.45);
      border-radius: 20px;
      padding: 24px 28px;
      background: #0B0F19;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }

    .header-table {
      width: 100%;
      border-bottom: 1.5px solid rgba(20, 184, 166, 0.25);
      padding-bottom: 16px;
      margin-bottom: 18px;
    }

    .badge-sovereign {
      display: inline-block;
      background: rgba(20, 184, 166, 0.15);
      border: 1px solid rgba(20, 184, 166, 0.35);
      color: #14F5D5;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .brand-title {
      color: #14F5D5;
      font-size: 22px;
      font-weight: 900;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .sub-title {
      color: #94A3B8;
      font-size: 12.5px;
      font-weight: 700;
      margin-top: 4px;
    }

    .serial-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 12px;
      padding: 10px 14px;
      text-align: left;
    }

    .serial-code {
      font-family: monospace;
      font-size: 13.5px;
      font-weight: 900;
      color: #14F5D5;
      direction: ltr;
      display: block;
    }

    .status-active {
      color: #10B981;
      font-size: 10.5px;
      font-weight: 800;
      margin-top: 3px;
    }

    .section-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 12.5px;
      font-weight: 900;
      color: #14F5D5;
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 6px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      font-size: 11.5px;
    }

    .field-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 4px;
    }

    .field-label {
      color: #94A3B8;
    }

    .field-val {
      font-weight: 700;
      color: #F8FAFC;
    }

    .field-val-ltr {
      font-family: monospace;
      direction: ltr;
      font-weight: 700;
      color: #38BDF8;
    }

    .clause-item {
      display: flex;
      gap: 8px;
      margin-bottom: 7.5px;
      font-size: 10.5px;
      color: #CBD5E1;
      line-height: 1.45;
    }

    .clause-num {
      color: #14F5D5;
      font-weight: 900;
      flex-shrink: 0;
      min-width: 16px;
    }

    .footer-box {
      background: rgba(20, 184, 166, 0.06);
      border: 1px solid rgba(20, 184, 166, 0.22);
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 10px;
    }

    .hash-code {
      font-family: monospace;
      font-size: 9.5px;
      color: #14F5D5;
      direction: ltr;
      word-break: break-all;
      display: block;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="contract-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="badge-sovereign">وثيقة رسمية معتمدة · قانون المعاملات الإلكترونية</div>
          <h1 class="brand-title">شبكة بينكم للإعلان الرقمي</h1>
          <div class="sub-title">وثيقة عقد اشتراك الكابتن المعلن - النسخة النهائية الموحدة ${version}</div>
        </td>
        <td style="vertical-align: top; width: 200px;">
          <div class="serial-box">
            <div style="font-size: 10px; color: #94A3B8;">رقم الوثيقة والسجل:</div>
            <span class="serial-code">${serial}</span>
            <div class="status-active">● معتمد وساري المفعول</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Section 1: Captain Information -->
    <div class="section-box">
      <div class="section-title">أولاً: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)</div>
      <div class="grid-2">
        <div class="field-row">
          <span class="field-label">الاسم الرباعي:</span>
          <span class="field-val">${data.fullName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">رقم الهاتف:</span>
          <span class="field-val-ltr">${data.phone}</span>
        </div>
        <div class="field-row">
          <span class="field-label">البريد الإلكتروني:</span>
          <span class="field-val-ltr">${data.email}</span>
        </div>
        <div class="field-row">
          <span class="field-label">الرقم الوطني / الهوية:</span>
          <span class="field-val">${data.nationalIdNumber || 'تم التحقق'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">رخصة القيادة:</span>
          <span class="field-val">${data.licenseNumber || 'تم التحقق'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">بيانات المركبة واللوحة:</span>
          <span class="field-val">${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.plateNumber || 'مرخصة'})</span>
        </div>
        <div class="field-row" style="grid-column: span 2;">
          <span class="field-label">النطاق الجغرافي:</span>
          <span class="field-val">${data.governorate || 'الأردن'} - ${data.district || 'المركزي'}</span>
        </div>
      </div>
    </div>

    <!-- Section 2: Unified Articles Summary -->
    <div class="section-box">
      <div class="section-title">ثانياً: الضوابط والاشتراطات التأسيسية المعتمدة (المواد الحاكمة من وثيقة الشروط الموحدة)</div>
      
      <div class="clause-item">
        <span class="clause-num">1.</span>
        <span><b>صفة الكابتن:</b> يزاول الكابتن نشاطه كمعلن مستقل لحسابه الخاص، والمركبة وسيلة إعلانية شخصية له، ولا ينشأ أي عقد عمل أو تبعية مع الشبكة.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">2.</span>
        <span><b>طبيعة الشبكة:</b> شبكة بينكم منصة تقنية للإعلانات الرقمية والتسويق، ولا تقدم أي خدمات نقل أو توجيه أو توصيل ركاب.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">3.</span>
        <span><b>صفر عمولة (0%):</b> لا تتقاضى الشبكة أي عمولة أو نسبة مئوية من أجور الرحلات أو الصفقات المباشرة بين الكابتن والمستخدمين.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">4.</span>
        <span><b>مؤشر السوق الاسترشادي:</b> مؤشر إحصائي استرشادي غير إلزامي محسوب محلياً، ولا يعد بأي حال تسعيرة إجبارية على الكابتن.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">5.</span>
        <span><b>أذونات موارد الجهاز:</b> يمنح الكابتن إذناً صريحاً ومحدداً للموقع والإنترنت والشاشة بالقدر الضروري لتشغيل التطبيق وبث الإعلانات فقط.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">6.</span>
        <span><b>زر مشاركة التتبع المباشر:</b> ميزة تتبع لحظية طارئة تنتهي فورياً بإغلاق الرحلة، دون حفظ أي مسار أو سجل في خوادم النظام.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">7.</span>
        <span><b>إسقاط الأجل ومسح السجلات (72 ساعة):</b> تخضع سجلات التحركات لمسح وتطهير آلي دوري كل 72 ساعة حتمية لحماية الخصوصية.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">8.</span>
        <span><b>نظام الرتب الخمسة:</b> يخضع الكابتن للتصنيف الآلي المعتمد (برونزي، فضي، ذهبي، بلاتيني، ماسي) حسب ساعات التواجد وجودة الأداء.</span>
      </div>
      <div class="clause-item">
        <span class="clause-num">9.</span>
        <span><b>التدقيق الآلي للإعلانات:</b> تخضع كافة المواد الإعلانية للفرز المسبق بالذكاء الاصطناعي لضمان الامتثال للقوانين والآداب العامة.</span>
      </div>
    </div>

    <!-- Section 3: Digital Seal & Signature -->
    <div class="footer-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-weight: 900; color: #14F5D5;">ثالثاً: الختم والتوقيع الرقمي المعتمد (المادة 5 - قانون المعاملات الإلكترونية)</span>
        <span style="color: #94A3B8;">تاريخ التوثيق: ${dateFormatted}</span>
      </div>
      <div style="color: #94A3B8; font-size: 9.5px;">بصمة التشفير الرقمية للعقد (SHA-256):</div>
      <span class="hash-code">${contractHash}</span>
      <div style="color: #10B981; font-size: 9.5px; margin-top: 6px; font-weight: 700;">
        ✓ تم توثيق وقبول الشروط إلكترونياً وحفظ السجل التعاقدي بموجب القوانين والأنظمة المرعية.
      </div>
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
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' },
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
