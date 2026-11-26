import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getAdminGeoScope,
  getAdminRank,
  hasAdminPermission,
  isEntityWithinGeoScope,
  isGeoScopeRestricted,
  verifyAdminCaller,
} from '@/lib/admin-auth-verifier';
import {
  getHourlyRatesMatrix,
  saveHourlyRatesMatrix,
  processHourlyRatesAction,
} from './hourly-rates-admin-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }
  if (!hasAdminPermission(admin, 'hourly_rates.view')) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: لا تملك صلاحية عرض تسعير الساعة' },
      { status: 403 }
    );
  }

  try {
    const callerRank = getAdminRank(admin);

    const [
      { data: countries, error: cErr },
      { data: governorates, error: gErr },
      { data: districts, error: dErr },
      customRates,
    ] = await Promise.all([
      supabaseAdmin
        .from('countries')
        .select('id, country_code, name_ar, name_en, currency_ar, currency_en, radar_hour_price')
        .order('id', { ascending: true }),
      supabaseAdmin
        .from('governorates')
        .select('id, name_ar, name_en, country_id')
        .order('id', { ascending: true }),
      supabaseAdmin
        .from('districts')
        .select('id, name_ar, name_en, governorate_id')
        .order('id', { ascending: true }),
      getHourlyRatesMatrix(),
    ]);

    if (cErr) throw cErr;
    if (gErr) throw gErr;
    if (dErr) throw dErr;

    return NextResponse.json({
      success: true,
      callerRank,
      countries: countries || [],
      governorates: governorates || [],
      districts: districts || [],
      customRates,
    });
  } catch (err: any) {
    console.error('[HourlyRates API] GET error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'فشل جلب بيانات أسعار الساعة' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }
  if (!hasAdminPermission(admin, 'hourly_rates.edit')) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: لا تملك صلاحية تعديل تسعير الساعة' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const scope = getAdminGeoScope(admin);
    if (isGeoScopeRestricted(scope)) {
      const targetGovId = body.targetType === 'governorate' ? Number(body.targetId) : Number(body.governorateId);
      const targetDistId = body.targetType === 'district' ? Number(body.targetId) : null;
      let resolvedGovId = Number.isFinite(targetGovId) && targetGovId > 0 ? targetGovId : null;
      let resolvedCountryId: number | null = null;

      if (targetDistId) {
        const { data: distRow } = await supabaseAdmin.from('districts').select('id, governorate_id').eq('id', targetDistId).maybeSingle();
        resolvedGovId = distRow?.governorate_id ?? resolvedGovId;
      }
      if (resolvedGovId) {
        const { data: govRow } = await supabaseAdmin.from('governorates').select('id, country_id').eq('id', resolvedGovId).maybeSingle();
        resolvedCountryId = govRow?.country_id ?? null;
      }
      if (!isEntityWithinGeoScope(scope, { country_id: resolvedCountryId, governorate_id: resolvedGovId, district_id: targetDistId })) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح: المنطقة المحددة خارج نطاق صلاحيتك الجغرافية' },
          { status: 403 }
        );
      }
    }

    const currentMatrix = await getHourlyRatesMatrix();

    const result = await processHourlyRatesAction(body, currentMatrix);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 }
      );
    }

    await saveHourlyRatesMatrix(currentMatrix, admin.id);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ وتحديث سعر الساعة بنجاح',
      customRates: currentMatrix,
    });
  } catch (err: any) {
    console.error('[HourlyRates API] POST error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'فشل تحديث أسعار الساعة' },
      { status: 500 }
    );
  }
}
