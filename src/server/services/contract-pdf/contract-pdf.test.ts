import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { generateContractPdfWithPdfLib } from './contract-pdflib-generator';
import { isValidPdfBuffer } from './contract-pdf-validator';

test('isValidPdfBuffer rejects HTML documents saved as .pdf', () => {
  const htmlBuf = Buffer.from('<!DOCTYPE html><html lang="ar"><body>Fake PDF</body></html>', 'utf-8');
  assert.equal(isValidPdfBuffer(htmlBuf), false);
});

test('generateContractPdfWithPdfLib produces a genuine, parseable 2-page Arabic PDF', async () => {
  const pdfBuffer = await generateContractPdfWithPdfLib(
    {
      captainId: '542c4275-54f4-4588-8103-86cbd63c8842',
      fullName: 'أحمد محمد خالد العبدالله',
      phone: '+962790000000',
      email: 'captain@bynkcom.com',
      nationalIdNumber: '9981234567',
      licenseNumber: 'LIC-998877',
      plateNumber: '77-12345',
      vehicleMake: 'تويوتا',
      vehicleModel: 'كورولا 2024',
      governorate: 'عمان',
      district: 'قصبة عمان',
      acceptedAt: '2026-11-17T18:00:00.000Z',
    },
    'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90',
    '542c4275-54f4-4588-8103-86cbd63c8842',
    '2026-11-17T18:00:00.000Z',
  );

  assert.equal(isValidPdfBuffer(pdfBuffer), true, 'Buffer must start with %PDF- and end with %%EOF');

  const loaded = await PDFDocument.load(pdfBuffer);
  assert.equal(loaded.getPageCount(), 2, 'Contract PDF must have 2 pages');
  assert.ok(pdfBuffer.length > 5000, `PDF should embed font and content (got ${pdfBuffer.length} bytes)`);
});
