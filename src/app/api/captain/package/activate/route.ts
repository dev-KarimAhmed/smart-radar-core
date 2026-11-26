import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';
import { sendCaptainContractEmail } from '@/server/services/email-service';
import { resolveEmailLanguage } from '@/server/services/email-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const captainId = caller.id;

    // 1. Fetch captain profile details
    const [{ data: profile }, { data: capProfile }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', captainId).maybeSingle(),
      supabaseAdmin.from('captain_profiles').select('*').eq('id', captainId).maybeSingle(),
    ]);

    if (!profile) {
      return NextResponse.json({ success: false, error: 'profile_not_found' }, { status: 404 });
    }

    const fullName = profile.full_name || 'كابتن معلن';
    const normalizedPhone = profile.phone || caller.phone || '';
    const rawEmail = profile.email || caller.email || '';
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    const lang = resolveEmailLanguage({
      explicitLang: profile.preferred_language,
      cookieHeader: req.headers.get('cookie'),
      acceptLanguage: req.headers.get('accept-language'),
    });

    // 2. Generate and store official Captain Foundational Contract PDF
    const contractRes = await saveCaptainContract({
      captainId,
      fullName,
      phone: normalizedPhone,
      email: rawEmail,
      licenseNumber: capProfile?.license_number,
      plateNumber: capProfile?.plate_number,
      vehicleMake: capProfile?.make || capProfile?.vehicle_brand || profile?.vehicle_make,
      vehicleModel: capProfile?.model || capProfile?.vehicle_model,
      vehicleYear: capProfile?.year || capProfile?.vehicle_year,
      governorate: capProfile?.governorate || profile?.governorate,
      district: capProfile?.district || profile?.district,
      ipAddress: clientIp,
    });

    // 3. Email the official contract PDF to the captain
    if (rawEmail) {
      void (async () => {
        try {
          await sendCaptainContractEmail({
            to: rawEmail,
            captainName: fullName,
            pdfBuffer: contractRes.pdfBuffer,
            contractHash: contractRes.contractHash,
            acceptedAt: contractRes.acceptedAt,
            lang,
          });
        } catch (emailErr) {
          console.warn('[Package Activation API] Async contract email send note:', emailErr);
        }
      })();
    }

    // 4. Record package activation in database
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      await supabaseAdmin.from('profiles').update({
        ad_package_active: true,
        ad_package_subscribed_at: now.toISOString(),
        ad_package_expires_at: expires.toISOString(),
      }).eq('id', captainId);
    } catch (e) {
      console.warn('[Package Activation API] Profile update note:', (e as Error).message);
    }

    return NextResponse.json({
      success: true,
      contractId: contractRes.contractId,
      contractHash: contractRes.contractHash,
      acceptedAt: contractRes.acceptedAt,
      expiresAt: expires.toISOString(),
    });
  } catch (err: any) {
    console.error('[Package Activation API] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'internal_error' }, { status: 500 });
  }
}
