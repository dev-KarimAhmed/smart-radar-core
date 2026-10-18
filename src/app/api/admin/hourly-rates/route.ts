import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, getAdminRank } from '@/lib/admin-auth-verifier';

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

    // 1. Fetch countries
    const { data: countries, error: cErr } = await supabaseAdmin
      .from('countries')
      .select('id, country_code, name_ar, name_en, currency_ar, currency_en, radar_hour_price')
      .order('id', { ascending: true });

    if (cErr) throw cErr;

    // 2. Fetch governorates
    const { data: governorates, error: gErr } = await supabaseAdmin
      .from('governorates')
      .select('id, name_ar, name_en, country_id')
      .order('id', { ascending: true });

    if (gErr) throw gErr;

    // 3. Fetch districts
    const { data: districts, error: dErr } = await supabaseAdmin
      .from('districts')
      .select('id, name_ar, name_en, governorate_id')
      .order('id', { ascending: true });

    if (dErr) throw dErr;

    // 4. Fetch custom pricing matrix from app_flags
    const { data: flagRow } = await supabaseAdmin
      .from('app_flags')
      .select('*')
      .eq('flag', 'hourly_rates_matrix')
      .maybeSingle();

    let customRates: {
      governorates: Record<string, number>;
      districts: Record<string, number>;
    } = {
      governorates: {},
      districts: {},
    };

    if (flagRow?.note) {
      try {
        const parsed = JSON.parse(flagRow.note);
        if (parsed && typeof parsed === 'object') {
          customRates = {
            governorates: parsed.governorates || {},
            districts: parsed.districts || {},
          };
        }
      } catch (parseErr) {
        console.warn('[HourlyRates API] Could not parse hourly_rates_matrix:', parseErr);
      }
    }

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
    const { action } = body;

    // 1. Fetch current matrix
    const { data: flagRow } = await supabaseAdmin
      .from('app_flags')
      .select('*')
      .eq('flag', 'hourly_rates_matrix')
      .maybeSingle();

    let currentMatrix: {
      governorates: Record<string, number>;
      districts: Record<string, number>;
    } = {
      governorates: {},
      districts: {},
    };

    if (flagRow?.note) {
      try {
        const parsed = JSON.parse(flagRow.note);
        if (parsed && typeof parsed === 'object') {
          currentMatrix = {
            governorates: parsed.governorates || {},
            districts: parsed.districts || {},
          };
        }
      } catch {}
    }

    // 2. Process Actions
    if (action === 'update_single_rate') {
      const { targetType, targetId, hourPrice } = body;
      const strId = String(targetId);

      if (!targetType || !targetId) {
        return NextResponse.json(
          { success: false, error: 'الهدف المحدد غير صالح' },
          { status: 400 }
        );
      }

      const numPrice = hourPrice !== null && hourPrice !== undefined && hourPrice !== ''
        ? Number(hourPrice)
        : null;

      if (numPrice !== null && (isNaN(numPrice) || numPrice <= 0)) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال سعر ساعة صحيح أكبر من صفر' },
          { status: 400 }
        );
      }

      if (targetType === 'governorate') {
        if (numPrice === null) {
          delete currentMatrix.governorates[strId];
        } else {
          currentMatrix.governorates[strId] = numPrice;
        }
      } else if (targetType === 'district') {
        if (numPrice === null) {
          delete currentMatrix.districts[strId];
        } else {
          currentMatrix.districts[strId] = numPrice;
        }
      }
    } else if (action === 'apply_to_governorate_districts') {
      const { governorateId, hourPrice } = body;
      const strGovId = String(governorateId);
      const numPrice = Number(hourPrice);

      if (!governorateId || isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال سعر ساعة صحيح للمحافظة' },
          { status: 400 }
        );
      }

      // Set governorate price
      currentMatrix.governorates[strGovId] = numPrice;

      // Fetch all districts belonging to this governorate
      const { data: relatedDistricts } = await supabaseAdmin
        .from('districts')
        .select('id')
        .eq('governorate_id', governorateId);

      // Apply price to all its districts
      if (Array.isArray(relatedDistricts)) {
        for (const dist of relatedDistricts) {
          currentMatrix.districts[String(dist.id)] = numPrice;
        }
      }
    } else if (action === 'reset_governorate') {
      const { governorateId, resetDistricts } = body;
      const strGovId = String(governorateId);

      delete currentMatrix.governorates[strGovId];

      if (resetDistricts) {
        const { data: relatedDistricts } = await supabaseAdmin
          .from('districts')
          .select('id')
          .eq('governorate_id', governorateId);

        if (Array.isArray(relatedDistricts)) {
          for (const dist of relatedDistricts) {
            delete currentMatrix.districts[String(dist.id)];
          }
        }
      }
    } else if (action === 'bulk_save') {
      const { governorateRates, districtRates } = body;
      if (governorateRates && typeof governorateRates === 'object') {
        currentMatrix.governorates = { ...governorateRates };
      }
      if (districtRates && typeof districtRates === 'object') {
        currentMatrix.districts = { ...districtRates };
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'إجراء غير معروف' },
        { status: 400 }
      );
    }

    // 3. Save matrix back into app_flags
    const { error: upsertErr } = await supabaseAdmin
      .from('app_flags')
      .upsert({
        flag: 'hourly_rates_matrix',
        enabled: true,
        note: JSON.stringify({
          ...currentMatrix,
          updated_at: new Date().toISOString(),
          updated_by: admin.id || 'admin',
        }),
        updated_at: new Date().toISOString(),
      });

    if (upsertErr) throw upsertErr;

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

