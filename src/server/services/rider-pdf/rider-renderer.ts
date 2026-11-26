import crypto from 'crypto';
import type { RiderContractData } from './rider-pdf-types';
import { buildRiderContractHtml } from './rider-html-template';
import { isValidPdfBuffer } from '../contract-pdf/contract-pdf-validator';
import { generateRiderContractPdfWithPdfLib } from './rider-pdflib-generator';

export async function generateRiderContractPdf(data: RiderContractData): Promise<{
  pdfBuffer: Buffer;
  contractHash: string;
  contractId: string;
  acceptedAt: string;
}> {
  const contractId = data.userId || crypto.randomUUID();
  const acceptedAt = data.acceptedAt || new Date().toISOString();
  const version = data.contractVersion || 'V1.0-Unified';

  const rawPayload = JSON.stringify({
    userId: data.userId,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    governorate: data.governorate || '',
    district: data.district || '',
    version,
    acceptedAt,
  });
  const contractHash = crypto.createHash('sha256').update(rawPayload).digest('hex').toUpperCase();

  const html = buildRiderContractHtml(data, contractHash);

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
    await page.evaluate(() => (document as any).fonts.ready);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    await browser.close();

    const chromiumPdf = Buffer.from(pdfBuffer);
    if (isValidPdfBuffer(chromiumPdf)) {
      return {
        pdfBuffer: chromiumPdf,
        contractHash,
        contractId,
        acceptedAt,
      };
    }
    throw new Error('Chromium returned invalid PDF buffer');
  } catch (chromiumError) {
    console.warn(
      '[Rider PDF Service] Chromium unavailable, using pure pdf-lib generator:',
      (chromiumError as Error)?.message || chromiumError
    );

    const purePdfBuffer = await generateRiderContractPdfWithPdfLib(data, contractHash, contractId, acceptedAt);
    return {
      pdfBuffer: purePdfBuffer,
      contractHash,
      contractId,
      acceptedAt,
    };
  }
}
