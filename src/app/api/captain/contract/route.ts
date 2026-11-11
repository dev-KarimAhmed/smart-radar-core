import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';
import { requireAdminAccess } from '@/features/admin/lib/admin-auth-server';
import {
  getSafeAppOrigin,
  getVerifiedUser,
  isValidStorageRelativePath,
} from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveCaptainLocationLabels(profile: Record<string, any>) {
  let governorate = typeof profile.governorate === 'string' ? profile.governorate : '';
  let district = typeof profile.district === 'string' ? profile.district : '';

  if (!governorate && profile.governorate_id) {
    const { data: gov } = await supabaseAdmin
      .from('governorates')
      .select('name_ar')
      .eq('id', profile.governorate_id)
      .maybeSingle();
    if (gov?.name_ar) governorate = String(gov.name_ar);
  }

  if (!district && profile.district_id) {
    const { data: dist } = await supabaseAdmin
      .from('districts')
      .select('name_ar')
      .eq('id', profile.district_id)
      .maybeSingle();
    if (dist?.name_ar) district = String(dist.name_ar);
  }

  return {
    governorate: governorate || 'الأردن',
    district: district || 'المركزي',
  };
}

export async function GET(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const url = new URL(req.url);
    const captainId = (url.searchParams.get('captainId') || caller.id).trim();
    const isDownload = url.searchParams.get('download') === 'true';
    const isRaw = url.searchParams.get('raw') === 'true';
    const isJson = url.searchParams.get('format') === 'json';
    const forceFresh = url.searchParams.get('fresh') === 'true';

    if (!captainId || !UUID_PATTERN.test(captainId)) {
      return NextResponse.json({ success: false, error: 'valid_captain_id_required' }, { status: 400 });
    }

    if (captainId !== caller.id) {
      const adminAuth = await requireAdminAccess(req, { sector: 'captains' });
      if (!adminAuth.ok) {
        return NextResponse.json({ success: false, error: adminAuth.error }, { status: adminAuth.status });
      }
    }

    // Redirect generic previews to the interactive contract page using verified app origin
    if (!isDownload && !isRaw && !isJson) {
      const redirectUrl = new URL('/captain/contract', getSafeAppOrigin(req));
      redirectUrl.searchParams.set('captainId', captainId);
      return NextResponse.redirect(redirectUrl);
    }

    if (isJson) {
      const [{ data: profile }, { data: capProfile }] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', captainId).maybeSingle(),
        supabaseAdmin.from('captain_profiles').select('*').eq('id', captainId).maybeSingle(),
      ]);

      if (!profile) {
        return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 });
      }

      const { governorate, district } = await resolveCaptainLocationLabels(profile);
      const version = 'V1.0-Unified';
      const acceptedAt = String(profile.created_at || new Date().toISOString());

      let storedContractHash = '';
      try {
        const { data: existingContract } = await supabaseAdmin
          .from('captain_electronic_contracts')
          .select('contract_hash, terms_accepted_at')
          .eq('captain_id', captainId)
          .maybeSingle();
        if (existingContract?.contract_hash) {
          storedContractHash = String(existingContract.contract_hash);
        }
      } catch {
        // Optional ledger table
      }

      const fullName = profile.full_name || 'كابتن معلن';
      const phone = profile.phone || '-';
      const email = profile.email || '-';
      const nationalIdNumber = capProfile?.national_id_number || '-';
      const licenseNumber = capProfile?.license_number || '-';
      const plateNumber = capProfile?.plate_number || profile.vehicle_plate || '-';
      const vehicleMake = profile.vehicle_make || capProfile?.vehicle_brand || '';
      const vehicleModel = capProfile?.vehicle_model || '';
      const vehicleYear = String(profile.vehicle_year || capProfile?.vehicle_year || '');

      const contractHash =
        storedContractHash ||
        crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              captainId,
              fullName,
              phone,
              email,
              nationalId: nationalIdNumber,
              license: licenseNumber,
              plate: plateNumber,
              vehicle: `${vehicleMake} ${vehicleModel}`,
              version,
              acceptedAt,
            })
          )
          .digest('hex')
          .toUpperCase();

      return NextResponse.json({
        success: true,
        contract: {
          captainId,
          fullName,
          phone,
          email,
          nationalIdNumber,
          licenseNumber,
          plateNumber,
          vehicleMake,
          vehicleModel,
          vehicleYear,
          governorate,
          district,
          acceptedAt,
          contractHash,
          version,
        },
      });
    }

    const fileName = 'bynkcom_contract_v1.0-unified.pdf';
    const storagePath = `${captainId}/${fileName}`;
    if (!isValidStorageRelativePath(storagePath)) {
      return NextResponse.json({ success: false, error: 'invalid_contract_path' }, { status: 400 });
    }

    let fileBuffer: Buffer | null = null;

    if (!forceFresh) {
      const { data: fileData, error: fileErr } = await supabaseAdmin.storage
        .from('captain-documents')
        .download(storagePath);

      if (!fileErr && fileData) {
        const candidateBuf = Buffer.from(await fileData.arrayBuffer());
        if (candidateBuf.length >= 600000) {
          fileBuffer = candidateBuf;
        }
      }
    }

    if (!fileBuffer) {
      const [{ data: profile }, { data: capProfile }] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', captainId).maybeSingle(),
        supabaseAdmin.from('captain_profiles').select('*').eq('id', captainId).maybeSingle(),
      ]);

      if (!profile) {
        return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 });
      }

      const { governorate, district } = await resolveCaptainLocationLabels(profile);
      const contractRes = await saveCaptainContract({
        captainId,
        fullName: profile.full_name || 'كابتن معلن',
        phone: profile.phone || '',
        email: profile.email || '',
        nationalIdNumber: capProfile?.national_id_number,
        licenseNumber: capProfile?.license_number,
        plateNumber: capProfile?.plate_number || profile.vehicle_plate,
        vehicleMake: profile.vehicle_make || capProfile?.vehicle_brand,
        vehicleModel: capProfile?.vehicle_model,
        vehicleYear: profile.vehicle_year || capProfile?.vehicle_year,
        governorate,
        district,
      });

      fileBuffer = contractRes.pdfBuffer;
    }

    const shortId = captainId.slice(0, 8).toUpperCase();
    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isDownload
          ? `attachment; filename="Bynkcom_Captain_Contract_${shortId}.pdf"`
          : 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err) {
    console.error('[Captain Contract API] Error:', err);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}
