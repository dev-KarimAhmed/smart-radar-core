import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  formatContractDate,
  buildCaptainContractHtml,
} from './contract-html-template';

export {
  formatContractDate,
  buildCaptainContractHtml,
} from './contract-html-template';

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
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
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
