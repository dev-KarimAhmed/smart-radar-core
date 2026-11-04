import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const captainId = url.searchParams.get('captainId');
    const isDownload = url.searchParams.get('download') === 'true';
    const isRaw = url.searchParams.get('raw') === 'true';
    const forceFresh = url.searchParams.get('fresh') === 'true';

    if (!captainId) {
      return NextResponse.json({ success: false, error: 'captainId is required' }, { status: 400 });
    }

    // Direct browser preview requests to the interactive contract page
    if (!isDownload && !isRaw) {
      const redirectUrl = new URL('/captain/contract', req.url);
      redirectUrl.searchParams.set('captainId', captainId);
      return NextResponse.redirect(redirectUrl);
    }

    const fileName = 'bynkcom_contract_v1.0-unified.pdf';
    const storagePath = `${captainId}/${fileName}`;

    let fileBuffer: Buffer | null = null;

    // Check storage if not forced fresh
    if (!forceFresh) {
      const { data: fileData, error: fileErr } = await supabaseAdmin.storage
        .from('captain-documents')
        .download(storagePath);

      if (!fileErr && fileData) {
        const candidateBuf = Buffer.from(await fileData.arrayBuffer());
        // Ensure file is from the updated 2-page spacious engine with embedded Cairo typography (> 600KB)
        if (candidateBuf.length >= 600000) {
          fileBuffer = candidateBuf;
        }
      }
    }

    // If not found in storage or forced fresh, generate fresh using the high-fidelity engine
    if (!fileBuffer) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', captainId)
        .maybeSingle();

      const { data: capProfile } = await supabaseAdmin
        .from('captain_profiles')
        .select('*')
        .eq('id', captainId)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 });
      }

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
        governorate: profile.governorate,
        district: profile.district,
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('[Captain Contract API] Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
