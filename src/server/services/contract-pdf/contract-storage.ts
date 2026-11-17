import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CaptainContractData, ContractResult } from './contract-pdf-types';
import { generateCaptainContractPdf } from './contract-renderer';
import { isValidPdfBuffer } from './contract-pdf-validator';

/**
 * Saves the generated contract PDF and metadata into Supabase Storage
 * and the electronic ledger.
 */
export async function saveCaptainContract(data: CaptainContractData): Promise<ContractResult> {
  const { pdfBuffer, contractHash, contractId, acceptedAt } = await generateCaptainContractPdf(data);
  const version = data.contractVersion || 'V1.0-Unified';
  const fileName = `bynkcom_contract_${version.toLowerCase()}_r2.pdf`;
  const storagePath = `${data.captainId}/${fileName}`;

  // 1. Upload to Supabase Storage: captain-documents bucket (only if genuine PDF)
  if (isValidPdfBuffer(pdfBuffer)) {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('captain-documents')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Contract PDF Service] Storage upload warning:', uploadError.message);
    }
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
