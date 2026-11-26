import { supabaseAdmin } from '@/lib/supabase-admin';
import type { RiderContractData, RiderContractResult } from './rider-pdf-types';
import { generateRiderContractPdf } from './rider-renderer';
import { isValidPdfBuffer } from '../contract-pdf/contract-pdf-validator';

export async function saveRiderContract(data: RiderContractData): Promise<RiderContractResult> {
  const { pdfBuffer, contractHash, contractId, acceptedAt } = await generateRiderContractPdf(data);
  const version = data.contractVersion || 'V1.0-Unified';
  const fileName = `bynkcom_user_privacy_${version.toLowerCase()}_r1.pdf`;
  const storagePath = `${data.userId}/${fileName}`;

  if (isValidPdfBuffer(pdfBuffer)) {
    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from('rider-documents')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[Rider PDF Service] Storage upload warning:', uploadError.message);
      }
    } catch (e) {
      console.warn('[Rider PDF Service] Storage bucket access note:', (e as Error).message);
    }
  }

  try {
    const metaJson = Buffer.from(
      JSON.stringify(
        {
          contractId,
          userId: data.userId,
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
      .from('rider-documents')
      .upload(`${data.userId}/privacy_contract_meta.json`, metaJson, {
        contentType: 'application/json',
        upsert: true,
      });
  } catch (metaErr) {
    console.warn('[Rider PDF Service] Metadata upload note:', (metaErr as Error).message);
  }

  try {
    await supabaseAdmin.from('user_privacy_agreements').upsert(
      {
        user_id: data.userId,
        contract_version: version,
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        governorate: data.governorate || null,
        district: data.district || null,
        accepted_at: acceptedAt,
        contract_hash: contractHash,
        pdf_url: storagePath,
        ip_address: data.ipAddress || null,
        metadata: { version, contractId },
      },
      { onConflict: 'user_id' }
    );
  } catch (dbErr) {
    console.info('[Rider PDF Service] Audit log note:', (dbErr as Error).message);
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
