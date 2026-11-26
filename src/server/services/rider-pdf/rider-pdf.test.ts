import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { isValidPdfBuffer } from '../contract-pdf/contract-pdf-validator';
import { generateRiderContractPdfWithPdfLib } from './rider-pdflib-generator';

test('generateRiderContractPdfWithPdfLib produces a genuine, parseable 2-page Arabic PDF', async () => {
  const buf = await generateRiderContractPdfWithPdfLib(
    {
      userId: '742c4275-54f4-4588-8103-86cbd63c8899',
      fullName: 'مستخدم تجريبي',
      phone: '+962791111111',
      email: 'user@example.com',
      governorate: 'عمان',
      district: 'لواء قصبة عمان',
      contractVersion: 'V1.0-Unified',
    },
    'b'.repeat(64),
    'rider-test-id',
    '2026-11-25T20:00:00.000Z',
  );

  assert.equal(isValidPdfBuffer(buf), true, 'Generated Rider PDF must start with %PDF- and end with %%EOF');
  const parsed = await PDFDocument.load(buf);
  assert.equal(parsed.getPageCount(), 2, 'Rider Contract PDF must contain 2 pages');
});
