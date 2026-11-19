import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument } from 'pdf-lib';
import { isValidPdfBuffer } from './contract-pdf-validator';
import { generateContractPdfWithPdfLib } from './contract-pdflib-generator';
import { splitVisualRunsForFontkit, toVisualLtrString } from './contract-pdf-rtl';

test('isValidPdfBuffer rejects HTML documents saved as .pdf', () => {
  const htmlBuf = Buffer.from('<!DOCTYPE html><html><body>contract</body></html>', 'utf-8');
  assert.equal(isValidPdfBuffer(htmlBuf), false);
  assert.equal(isValidPdfBuffer(Buffer.from('')), false);
});

test('splitVisualRunsForFontkit preserves exact visual LTR glyph order across all scripts', () => {
  const fontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'contract-font.ttf'));
  const font = fontkit.create(fontBytes);

  const samples = [
    'شبكة بينكم للإعلان الرقمي',
    'أولا: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)',
    'وثيقة عقد اشتراك الكابتن المعلن - النسخة الموحدة V1.0-Unified',
    '3. صفر عمولة (0%): لا تتقاضى الشبكة أي عمولة',
    'بصمة التشفير الرقمية السيادية للعقد (SHA-256):',
    'English عربي English',
  ];

  for (const sample of samples) {
    const expectedVisual = toVisualLtrString(sample, 'rtl');
    if (sample.includes('(السجل الإلكتروني الرسمي)')) {
      assert.equal(expectedVisual.startsWith('('), true, 'Opening paren must be on the visual left of RTL parenthesized phrase');
    }
    const expectedCodePoints = Array.from(expectedVisual).map((ch) => ch.codePointAt(0));
    const runs = splitVisualRunsForFontkit(sample, 'rtl');

    const actualCodePoints: number[] = [];
    for (const run of runs) {
      const laidOut = font.layout(run.fontkitInput);
      for (const glyph of laidOut.glyphs) {
        if (glyph.codePoints[0] !== undefined) {
          actualCodePoints.push(glyph.codePoints[0]);
        }
      }
    }

    assert.deepEqual(
      actualCodePoints,
      expectedCodePoints,
      `Glyph order mismatch for "${sample}"`,
    );
  }
});

test('generateContractPdfWithPdfLib produces a genuine, parseable 2-page Arabic PDF', async () => {
  const buf = await generateContractPdfWithPdfLib(
    {
      captainId: '542c4275-54f4-4588-8103-86cbd63c8842',
      fullName: 'كابتن تجريبي',
      phone: '+962790000000',
      email: 'captain@example.com',
      licenseNumber: '123456',
      vehicleMake: 'تويوتا',
      vehicleModel: 'بريوس',
      plateNumber: '10-12345',
      governorate: 'عمان',
      district: 'لواء قصبة عمان',
      contractVersion: 'V1.0-Unified',
    },
    'a'.repeat(64),
    'contract-test-id',
    '2026-11-17T20:00:00.000Z',
  );

  assert.equal(isValidPdfBuffer(buf), true, 'Generated PDF must start with %PDF- and end with %%EOF');
  const parsed = await PDFDocument.load(buf);
  assert.equal(parsed.getPageCount(), 2, 'Contract PDF must contain 2 pages');
});
