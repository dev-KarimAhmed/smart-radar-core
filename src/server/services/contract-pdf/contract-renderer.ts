import crypto from 'crypto';
import type { CaptainContractData } from './contract-pdf-types';
import { buildCaptainContractHtml } from './contract-html-template';
import { isValidPdfBuffer } from './contract-pdf-validator';
import { generateContractPdfWithPdfLib } from './contract-pdflib-generator';

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
    console.warn('[Contract PDF Service] Chromium unavailable, using pure pdf-lib generator:', (chromiumError as Error)?.message || chromiumError);

    const purePdfBuffer = await generateContractPdfWithPdfLib(data, contractHash, contractId, acceptedAt);
    return {
      pdfBuffer: purePdfBuffer,
      contractHash,
      contractId,
      acceptedAt,
    };
  }
}
