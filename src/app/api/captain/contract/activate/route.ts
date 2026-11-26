import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';
import { sendCaptainContractEmail } from '@/server/services/email-service';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const captainId = caller.id;

    // Fetch caller profile and captain vehicle details
    const [{ data: profile }, { data: capProfile }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', captainId).maybeSingle(),
      supabaseAdmin.from('captain_profiles').select('*').eq('id', captainId).maybeSingle(),
    ]);

    if (!profile) {
      return NextResponse.json({ success: false, error: 'profile_not_found' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const fullName = profile.full_name || 'كابتن معلن';
    const phone = profile.phone || '';
    const email = profile.email || caller.email || '';
    const licenseNumber = capProfile?.license_number;
    const plateNumber = capProfile?.plate_number || profile.vehicle_plate;
    const vehicleMake = profile.vehicle_make || capProfile?.vehicle_brand;
    const vehicleModel = capProfile?.vehicle_model;
    const vehicleYear = profile.vehicle_year || capProfile?.vehicle_year;

    // 1. Generate certified contract & persist to sovereign storage
    const contractRes = await saveCaptainContract({
      captainId,
      fullName,
      phone,
      email,
      licenseNumber,
      plateNumber,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      governorate: profile.governorate,
      district: profile.district,
      ipAddress: clientIp,
      contractVersion: 'V2.6-Secured',
    });

    // 2. Asynchronously send the Captain Contract email with PDF attached
    if (email) {
      void sendCaptainContractEmail({
        to: email,
        captainName: fullName,
        pdfBuffer: contractRes.pdfBuffer,
        contractHash: contractRes.contractHash,
        acceptedAt: contractRes.acceptedAt,
        lang: (profile.preferred_language as any) || 'ar',
      }).catch((emailErr) => {
        console.warn('[Contract Activate API] Email delivery warning:', emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      contractHash: contractRes.contractHash,
      acceptedAt: contractRes.acceptedAt,
      version: 'V2.6-Secured',
    });
  } catch (err: any) {
    console.error('[Captain Contract Activate API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'internal_activation_error' },
      { status: 500 }
    );
  }
}
