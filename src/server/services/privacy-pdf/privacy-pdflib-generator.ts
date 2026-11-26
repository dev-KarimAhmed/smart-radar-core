import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { drawRightAlignedText, drawWrappedRtl } from '../contract-pdf/contract-pdf-rtl';

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

const PRIVACY_CORE_POINTS = [
  '1. الغرض الأساسي: تصفح الإعلانات الرقمية والترويجية والاستفادة من عروض المعلنين المستقلين دون عمولة.',
  '2. حماية البيانات الشخصية: تلتزم المنظومة بعدم مشاركة رقم الهاتف أو الموقع الدقيق إلا بإذن صريح.',
  '3. رمي العوامة الصامتة: يطلب المستخدم عروض المعلنين دون كشف رقم هاتفه أو وجهته الدقيقة في مرحلة الاستدراج.',
  '4. كبح التتبع وإسقاط الأجل (72 ساعة): مسح وتطهير آلي دوري لسجلات التحركات كل 72 ساعة حتمية من السيرفرات.',
  '5. مشاركة التتبع الاختيارية: ميزة لحظية لطمأنة الأقارب تنتهي فوراً كلياً بإغلاق الرحلة دون حفظ أي مسار.',
  '6. الحق في النسيان: للمستخدم الحق الكامل في حذف حسابه ومحو بياناته الشخصية في أي وقت عبر التطبيق.',
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
      // Try next
    }
  }
  return null;
}

export async function generatePrivacyPolicyPdfWithPdfLib(options?: {
  userSerial?: string;
  version?: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let font: PDFFont;
  const fontBytes = await loadArabicFontBytes();
  if (fontBytes) {
    try {
      font = await pdfDoc.embedFont(fontBytes, { subset: false });
    } catch {
      font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  } else {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
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

  drawRightAlignedText(page, 'شبكة بينكم للإعلان الرقمي · سياسة الخصوصية والأمان الرقمي', A4_WIDTH - MARGIN_X, MARGIN_X, A4_HEIGHT - 60, font, 16, COLORS.accent);
  drawRightAlignedText(page, 'وثيقة معتمدة للمستخدم والإعلانات المركزية والمستقلة', A4_WIDTH - MARGIN_X, MARGIN_X, A4_HEIGHT - 85, font, 11, COLORS.slate);

  let curY = A4_HEIGHT - 130;
  for (const item of PRIVACY_CORE_POINTS) {
    page.drawRectangle({
      x: MARGIN_X,
      y: curY - 32,
      width: CONTENT_WIDTH,
      height: 40,
      color: COLORS.cardBg,
      borderColor: COLORS.tealBorder,
      borderWidth: 0.5,
    });
    drawRightAlignedText(page, item, A4_WIDTH - MARGIN_X - 12, MARGIN_X + 12, curY - 14, font, 9.5, COLORS.white);
    curY -= 52;
  }

  drawRightAlignedText(page, '✓ معتمد رسمياً وموثق بالسجل الإلكتروني الدائم', A4_WIDTH - MARGIN_X, MARGIN_X, 60, font, 9, COLORS.emerald);
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
