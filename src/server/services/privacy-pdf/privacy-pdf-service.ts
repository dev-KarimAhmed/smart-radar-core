import { buildPrivacyPolicyHtml } from './privacy-html-template';
import { generatePrivacyPolicyPdfWithPdfLib } from './privacy-pdflib-generator';
import { isValidPdfBuffer } from '../contract-pdf/contract-pdf-validator';

let cachedPrivacyBuffer: Buffer | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in-memory cache

export interface GeneratePrivacyPdfOptions {
  userSerial?: string;
  acceptedAt?: string;
  version?: string;
  fresh?: boolean;
}

export async function generatePrivacyPolicyPdf(options?: GeneratePrivacyPdfOptions): Promise<Buffer> {
  if (!options?.fresh && cachedPrivacyBuffer && Date.now() - lastCacheTime < CACHE_TTL_MS) {
    return cachedPrivacyBuffer;
  }

  const html = buildPrivacyPolicyHtml(options);

  // Attempt Chromium print generation via playwright
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
      cachedPrivacyBuffer = chromiumPdf;
      lastCacheTime = Date.now();
      return chromiumPdf;
    }
    throw new Error('Chromium returned invalid PDF buffer');
  } catch (chromiumError) {
    console.warn('[Privacy PDF Service] Chromium unavailable, using pure pdf-lib fallback:', (chromiumError as Error)?.message || chromiumError);
    const fallbackBuffer = await generatePrivacyPolicyPdfWithPdfLib(options);
    cachedPrivacyBuffer = fallbackBuffer;
    lastCacheTime = Date.now();
    return fallbackBuffer;
  }
}
