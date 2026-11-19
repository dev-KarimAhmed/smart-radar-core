import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { formatContractDate, type CaptainContractData } from './contract-pdf-types';
import {
  drawRightAlignedText,
  drawWrappedRtl,
  hasArabicChars,
} from './contract-pdf-rtl';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 40;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2;

const COLORS = {
  bg: rgb(0.043, 0.059, 0.098),
  cardBg: rgb(0.067, 0.094, 0.153),
  accent: rgb(0.078, 0.961, 0.835),
  tealBorder: rgb(0.078, 0.722, 0.651),
  white: rgb(0.97, 0.98, 0.99),
  slate: rgb(0.75, 0.8, 0.87),
  muted: rgb(0.55, 0.62, 0.71),
  emerald: rgb(0.063, 0.725, 0.506),
};

const PAGE1_CLAUSES = [
  '1. صفة الكابتن: يزاول الكابتن نشاطه كمعلن مستقل لحسابه الخاص، وتعد المركبة وسيلة إعلانية شخصية له، ولا ينشأ أي عقد عمل أو تبعية مع الشبكة بأي شكل.',
  '2. طبيعة الشبكة: شبكة بينكم منصة تقنية للإعلانات الرقمية والتسويق، ولا تقدم أي خدمات نقل أو توجيه أو توصيل ركاب إطلاقا.',
  '3. صفر عمولة (0%): لا تتقاضى الشبكة أي عمولة أو نسبة مئوية من أجور الرحلات أو الصفقات المباشرة بين الكابتن والمستخدمين في أي وقت.',
  '4. مؤشر السوق الاسترشادي: مؤشر إحصائي استرشادي غير إلزامي محسوب محليا، ولا يعد بأي حال تسعيرة إجبارية على الكابتن.',
];

const PAGE2_CLAUSES = [
  '5. أذونات موارد الجهاز: يمنح الكابتن إذنا صريحا ومحددا للموقع والإنترنت والشاشة بالقدر الضروري لتشغيل التطبيق وبث الإعلانات فقط.',
  '6. زر مشاركة التتبع المباشر: ميزة تتبع لحظية طارئة تنتهي فوريا بإغلاق الرحلة، دون حفظ أي مسار أو سجل في خوادم النظام حفاظا على السرية.',
  '7. إسقاط الأجل ومسح السجلات (72 ساعة): تخضع سجلات التحركات لمسح وتطهير آلي دوري كل 72 ساعة حتمية لحماية الخصوصية المطلقة.',
  '8. نظام الرتب الخمسة: يخضع الكابتن للتصنيف الآلي المعتمد (برونزي، فضي، ذهبي، بلاتيني، ماسي) حسب ساعات التواجد وجودة الأداء والتقييم.',
  '9. التدقيق الآلي للإعلانات: تخضع كافة المواد الإعلانية للفرز المسبق بالذكاء الاصطناعي لضمان الامتثال للقوانين والآداب العامة وسيادة القانون.',
];

let cachedFontBytes: Uint8Array | null = null;

async function loadArabicFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'contract-font.ttf'),
    path.resolve(process.cwd(), 'public/fonts/contract-font.ttf'),
  ];
  for (const fontPath of candidates) {
    try {
      const buf = await fs.readFile(fontPath);
      if (buf.length > 1000) {
        cachedFontBytes = new Uint8Array(buf);
        return cachedFontBytes;
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function drawPageFrame(page: PDFPage, font: PDFFont, pageNum: number) {
  page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: COLORS.bg });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: A4_WIDTH - 48,
    height: A4_HEIGHT - 48,
    borderColor: COLORS.tealBorder,
    borderWidth: 1,
    opacity: 0.45,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: 52 },
    end: { x: A4_WIDTH - MARGIN_X, y: 52 },
    thickness: 0.6,
    color: COLORS.tealBorder,
    opacity: 0.4,
  });
  drawRightAlignedText(
    page,
    'شبكة بينكم للإعلان الرقمي · عقد اشتراك الكابتن المعلن الموحد',
    A4_WIDTH - MARGIN_X,
    MARGIN_X,
    36,
    font,
    9,
    COLORS.muted,
  );
  drawRightAlignedText(page, `الصفحة ${pageNum} من 2`, MARGIN_X + 75, MARGIN_X, 36, font, 9, COLORS.accent);
}

function drawKeyValueRow(
  page: PDFPage,
  label: string,
  value: string,
  rightX: number,
  y: number,
  font: PDFFont,
  valueColor = COLORS.white,
) {
  const labelWidth = drawRightAlignedText(page, label, rightX, MARGIN_X + 14, y, font, 10.5, COLORS.slate, 'rtl');
  const valueDir: 'rtl' | 'ltr' = hasArabicChars(value) ? 'rtl' : 'ltr';
  drawRightAlignedText(page, value, rightX - labelWidth - 8, MARGIN_X + 14, y, font, 10.5, valueColor, valueDir);
}

export async function generateContractPdfWithPdfLib(
  data: CaptainContractData,
  contractHash: string,
  contractId: string,
  acceptedAt: string,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  pdfDoc.setTitle('Bynkcom Captain Advertiser Contract');
  pdfDoc.setAuthor('Bynkcom Digital Ad Network');
  pdfDoc.setSubject(`Contract ${contractId}`);

  const fontBytes = await loadArabicFontBytes();
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: true })
    : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const monoFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const serial = 'BYNK-CAP-' + data.captainId.slice(0, 8).toUpperCase();
  const version = data.contractVersion || 'V1.0-Unified';
  const dateFormatted = formatContractDate(acceptedAt);
  const rightX = A4_WIDTH - MARGIN_X;

  // --- PAGE 1 ---
  const page1 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawPageFrame(page1, font, 1);

  let y = A4_HEIGHT - 64;
  drawRightAlignedText(page1, 'وثيقة رسمية معتمدة · قانون المعاملات الإلكترونية', rightX, MARGIN_X, y, font, 10, COLORS.accent);
  page1.drawText(serial, { x: MARGIN_X, y: y - 4, size: 11, font: monoFont, color: COLORS.accent });
  y -= 26;
  drawRightAlignedText(page1, 'شبكة بينكم للإعلان الرقمي', rightX, MARGIN_X, y, font, 20, COLORS.white);
  y -= 20;
  drawRightAlignedText(page1, `وثيقة عقد اشتراك الكابتن المعلن - النسخة الموحدة ${version}`, rightX, MARGIN_X, y, font, 11, COLORS.slate);
  y -= 18;
  page1.drawLine({ start: { x: MARGIN_X, y }, end: { x: rightX, y }, thickness: 1, color: COLORS.tealBorder });

  // Section 1: Captain Identity Box
  y -= 26;
  page1.drawRectangle({
    x: MARGIN_X,
    y: y - 165,
    width: CONTENT_WIDTH,
    height: 185,
    color: COLORS.cardBg,
    borderColor: COLORS.tealBorder,
    borderWidth: 0.7,
  });
  drawRightAlignedText(page1, 'أولا: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)', rightX - 14, MARGIN_X + 14, y - 4, font, 12, COLORS.accent);
  y -= 28;

  const vehicleInfo = `${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.plateNumber || 'مرخصة'})`.trim();
  const locationInfo = `${data.governorate || 'الأردن'} - ${data.district || 'المركزي'}`;
  const rows: Array<[string, string]> = [
    ['الاسم الرباعي:', data.fullName || 'كابتن معلن'],
    ['رقم الهاتف:', data.phone || '-'],
    ['البريد الإلكتروني:', data.email || '-'],
    ['رقم رخصة القيادة:', data.licenseNumber || 'تم التحقق'],
    ['بيانات المركبة واللوحة:', vehicleInfo],
    ['النطاق الجغرافي:', locationInfo],
  ];

  for (const [label, val] of rows) {
    drawKeyValueRow(page1, label, val, rightX - 14, y, font);
    y -= 22;
  }

  // Section 2: Articles 1-4
  y -= 28;
  drawRightAlignedText(page1, 'ثانيا: الضوابط والاشتراطات التأسيسية المعتمدة', rightX, MARGIN_X, y, font, 12.5, COLORS.accent);
  y -= 24;
  for (const clause of PAGE1_CLAUSES) {
    y = drawWrappedRtl(page1, clause, rightX, MARGIN_X, y, font, 10.5, CONTENT_WIDTH - 8, 18, COLORS.slate) - 10;
  }

  // --- PAGE 2 ---
  const page2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawPageFrame(page2, font, 2);

  let y2 = A4_HEIGHT - 64;
  drawRightAlignedText(page2, 'شبكة بينكم للإعلان الرقمي - تابع بنود العقد والختم الرقمي', rightX, MARGIN_X, y2, font, 15, COLORS.white);
  page2.drawText(serial, { x: MARGIN_X, y: y2 + 2, size: 10.5, font: monoFont, color: COLORS.accent });
  y2 -= 18;
  page2.drawLine({ start: { x: MARGIN_X, y: y2 }, end: { x: rightX, y: y2 }, thickness: 1, color: COLORS.tealBorder });

  y2 -= 28;
  drawRightAlignedText(page2, 'تابع ثانيا: المواد والاشتراطات التشغيلية المعتمدة', rightX, MARGIN_X, y2, font, 12.5, COLORS.accent);
  y2 -= 24;
  for (const clause of PAGE2_CLAUSES) {
    y2 = drawWrappedRtl(page2, clause, rightX, MARGIN_X, y2, font, 10.5, CONTENT_WIDTH - 8, 18, COLORS.slate) - 10;
  }

  // Section 3: Sovereign Digital Seal Box
  y2 -= 18;
  page2.drawRectangle({
    x: MARGIN_X,
    y: y2 - 145,
    width: CONTENT_WIDTH,
    height: 165,
    color: COLORS.cardBg,
    borderColor: COLORS.emerald,
    borderWidth: 1,
  });
  drawRightAlignedText(page2, 'ثالثا: الختم والتوقيع الرقمي المعتمد (المادة 5 - قانون المعاملات الإلكترونية)', rightX - 14, MARGIN_X + 14, y2 - 6, font, 11.5, COLORS.accent);
  y2 -= 30;
  drawKeyValueRow(page2, 'حالة التوثيق:', 'معتمد وسجل رسمي نافذ بموجب القانون', rightX - 14, y2, font, COLORS.white);
  y2 -= 22;
  drawKeyValueRow(page2, 'تاريخ وساعة التوثيق:', dateFormatted, rightX - 14, y2, font, COLORS.accent);
  y2 -= 24;
  drawRightAlignedText(page2, 'بصمة التشفير الرقمية السيادية للعقد (SHA-256):', rightX - 14, MARGIN_X + 14, y2, font, 10, COLORS.slate);
  y2 -= 18;
  page2.drawText(contractHash, { x: MARGIN_X + 14, y: y2, size: 8.5, font: monoFont, color: COLORS.accent });
  y2 -= 26;
  drawRightAlignedText(page2, 'تم توثيق وقبول الشروط إلكترونيا وحفظ السجل التعاقدي بموجب القوانين المرعية.', rightX - 14, MARGIN_X + 14, y2, font, 10, COLORS.emerald);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
