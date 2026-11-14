import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, getAdminRank } from '@/lib/admin-auth-verifier';
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

  try {
    const body = await req.json();
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
