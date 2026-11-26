import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRiderContractPdf } from '@/server/services/rider-pdf-service';
import { isValidPdfBuffer } from '@/server/services/contract-pdf/contract-pdf-validator';
import {
  getSafeAppOrigin,
  getVerifiedUser,
} from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveUserLocation(profile: Record<string, any>) {
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
    const userId = (url.searchParams.get('userId') || url.searchParams.get('riderId') || caller.id).trim();
    const isDownload = url.searchParams.get('download') === 'true';
    const isRaw = url.searchParams.get('raw') === 'true';
    const isJson = url.searchParams.get('format') === 'json';

    if (!userId || !UUID_PATTERN.test(userId)) {
      return NextResponse.json({ success: false, error: 'valid_user_id_required' }, { status: 400 });
    }

    if (userId !== caller.id && caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'forbidden_access' }, { status: 403 });
    }

    if (!isDownload && !isRaw && !isJson) {
      const redirectUrl = new URL('/rider/contract', getSafeAppOrigin(req));
      redirectUrl.searchParams.set('userId', userId);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    const { governorate, district } = await resolveUserLocation(profile);
    const version = 'V1.0-Unified';
    const acceptedAt = String(profile.created_at || new Date().toISOString());
    const fullName = profile.full_name || 'مستخدم الشبكة';
    const phone = profile.phone || '-';
    const email = profile.email || '-';

    const rawPayload = JSON.stringify({
      userId,
      fullName,
      phone,
      email,
      governorate,
      district,
      version,
      acceptedAt,
    });
    const contractHash = crypto.createHash('sha256').update(rawPayload).digest('hex').toUpperCase();

    if (isJson) {
      return NextResponse.json({
        success: true,
        contract: {
          userId,
          fullName,
          phone,
          email,
          governorate,
          district,
          acceptedAt,
          contractHash,
          version,
        },
      });
    }

    const storagePath = `${userId}/bynkcom_user_privacy_${version.toLowerCase()}_r1.pdf`;
    try {
      const { data: fileData } = await supabaseAdmin.storage.from('rider-documents').download(storagePath);
      if (fileData) {
        const cachedBuf = Buffer.from(await fileData.arrayBuffer());
        if (isValidPdfBuffer(cachedBuf)) {
          return new NextResponse(new Uint8Array(cachedBuf), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="Bynkcom_User_Privacy_${userId.slice(0, 8)}.pdf"`,
              'X-Contract-Hash': contractHash,
            },
          });
        }
      }
    } catch {}

    const { pdfBuffer } = await generateRiderContractPdf({
      userId,
      fullName,
      phone,
      email,
      governorate,
      district,
      acceptedAt,
      contractVersion: version,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="Bynkcom_User_Privacy_${userId.slice(0, 8)}.pdf"`,
        'X-Contract-Hash': contractHash,
      },
    });
  } catch (err: any) {
    console.error('Rider contract API error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'internal_error' }, { status: 500 });
  }
}
