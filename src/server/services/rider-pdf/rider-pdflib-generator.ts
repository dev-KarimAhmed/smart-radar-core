import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { formatRiderContractDate, type RiderContractData } from './rider-pdf-types';
import {
  A4_WIDTH,
  A4_HEIGHT,
  MARGIN_X,
  CONTENT_WIDTH,
  RIDER_PDF_COLORS as COLORS,
  RIDER_PAGE1_CLAUSES,
  RIDER_PAGE2_CLAUSES,
} from './rider-pdf-constants';
import {
  drawRightAlignedText,
  drawWrappedRtl,
  hasArabicChars,
} from '../contract-pdf/contract-pdf-rtl';

let cachedFontBytes: Uint8Array | null = null;

async function loadArabicFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'contract-font.ttf'),
    path.resolve(process.cwd(), 'public/fonts/contract-font.ttf'),
  ];
  for (const c of candidates) {
    try {
      const data = await fs.readFile(c);
      cachedFontBytes = new Uint8Array(data);
      return cachedFontBytes;
    } catch {}
  }
  return null;
}

function drawBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: COLORS.bg });
}

function drawHeader(page: PDFPage, font: PDFFont, serial: string, isPage1 = true) {
  page.drawRectangle({
    x: MARGIN_X,
    y: A4_HEIGHT - 65,
    width: CONTENT_WIDTH,
    height: 38,
    color: COLORS.cardBg,
    borderColor: COLORS.tealBorder,
    borderWidth: 1,
  });

  drawRightAlignedText(
    page,
    'شبكة بينكم للإعلان الرقمي - سياسة خصوصية المستخدم والإعلانات V1.0',
    MARGIN_X + CONTENT_WIDTH - 12,
    MARGIN_X + 12,
    A4_HEIGHT - 45,
    font,
    11,
    COLORS.accent,
  );

  page.drawText(`Serial: ${serial} | Page ${isPage1 ? '1/2' : '2/2'}`, {
    x: MARGIN_X + 12,
    y: A4_HEIGHT - 46,
    size: 7.5,
    font,
    color: COLORS.muted,
  });
}

function drawFooter(page: PDFPage, font: PDFFont, hash: string) {
  page.drawLine({
    start: { x: MARGIN_X, y: 48 },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: 48 },
    color: COLORS.tealBorder,
    thickness: 0.8,
  });

  page.drawText(`SHA-256 Hash: ${hash}`, {
    x: MARGIN_X,
    y: 35,
    size: 6.5,
    font,
    color: COLORS.muted,
  });

  drawRightAlignedText(
    page,
    'وثيقة خصوصية رقمية معتمدة بالسجل الإلكتروني - شبكة بينكم © 2026',
    MARGIN_X + CONTENT_WIDTH,
    MARGIN_X,
    22,
    font,
    7.5,
    COLORS.slate,
  );
}

export async function generateRiderContractPdfWithPdfLib(
  data: RiderContractData,
  contractHash: string,
  contractId: string,
  acceptedAt: string,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadArabicFontBytes();
  let font: PDFFont;
  if (fontBytes) {
    font = await pdfDoc.embedFont(fontBytes, { subset: false });
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const serial = `BYNK-USR-${contractId.slice(0, 8).toUpperCase()}`;

  // PAGE 1
  const page1 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawBackground(page1);
  drawHeader(page1, font, serial, true);

  // User Identity Card
  const idBoxY = A4_HEIGHT - 215;
  page1.drawRectangle({
    x: MARGIN_X,
    y: idBoxY,
    width: CONTENT_WIDTH,
    height: 135,
    color: COLORS.cardBg,
    borderColor: COLORS.tealBorder,
    borderWidth: 1,
  });

  drawRightAlignedText(
    page1,
    'بيانات المستخدم المسجل (السجل الإلكتروني الرسمي)',
    MARGIN_X + CONTENT_WIDTH - 15,
    MARGIN_X + 15,
    idBoxY + 115,
    font,
    11,
    COLORS.accent,
  );

  const fields = [
    `الاسم الكامل: ${data.fullName || 'مستخدم مسجل'}`,
    `رقم الهاتف: ${data.phone || '-'}`,
    `البريد الإلكتروني: ${data.email || '-'}`,
    `النطاق الجغرافي: ${data.governorate || 'الأردن'} - ${data.district || 'المركزي'}`,
    `تاريخ السريان والاعتماد: ${formatRiderContractDate(acceptedAt, 'ar')}`,
  ];

  let lineY = idBoxY + 90;
  for (const f of fields) {
    drawRightAlignedText(page1, f, MARGIN_X + CONTENT_WIDTH - 15, MARGIN_X + 15, lineY, font, 8.5, COLORS.slate);
    lineY -= 17;
  }

  // Section 1 Clauses
  let curY = idBoxY - 25;
  drawRightAlignedText(
    page1,
    'أولا: نطاق السياسة والأذونات وحماية البيانات',
    MARGIN_X + CONTENT_WIDTH,
    MARGIN_X,
    curY,
    font,
    12,
    COLORS.accent,
  );
  curY -= 20;

  for (const clause of RIDER_PAGE1_CLAUSES) {
    curY = drawWrappedRtl(
      page1,
      clause,
      MARGIN_X + CONTENT_WIDTH,
      MARGIN_X,
      curY,
      font,
      8.5,
      CONTENT_WIDTH,
      13,
      COLORS.slate,
    );
    curY -= 12;
  }

  drawFooter(page1, font, contractHash);

  // PAGE 2
  const page2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawBackground(page2);
  drawHeader(page2, font, serial, false);

  curY = A4_HEIGHT - 95;
  drawRightAlignedText(
    page2,
    'ثانيا: استقلالية الكباتن والضوابط الإعلانية والقانون الحاكم',
    MARGIN_X + CONTENT_WIDTH,
    MARGIN_X,
    curY,
    font,
    12,
    COLORS.accent,
  );
  curY -= 22;

  for (const clause of RIDER_PAGE2_CLAUSES) {
    curY = drawWrappedRtl(
      page2,
      clause,
      MARGIN_X + CONTENT_WIDTH,
      MARGIN_X,
      curY,
      font,
      8.5,
      CONTENT_WIDTH,
      13,
      COLORS.slate,
    );
    curY -= 12;
  }

  drawFooter(page2, font, contractHash);

  const uint8 = await pdfDoc.save();
  return Buffer.from(uint8);
}
