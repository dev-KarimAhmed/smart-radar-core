import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAccess } from '@/lib/admin-auth-verifier';

export const dynamic = 'force-dynamic';

const FORBIDDEN_RECORD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeRatesMap(input: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (!key || FORBIDDEN_RECORD_KEYS.has(key) || !/^[0-9a-zA-Z_-]{1,32}$/.test(key)) continue;
    const num = Number(val);
    if (Number.isFinite(num) && num > 0 && num <= 10_000) {
      out[key] = num;
    }
  }
  return out;
}

export async function GET(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'hourly_rates' });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }
  const { rank: callerRank } = access;

  try {

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
      { success: false, error: 'فشل جلب بيانات أسعار الساعة' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'hourly_rates' });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }
  const { admin } = access;

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

      if (!targetType || !targetId || FORBIDDEN_RECORD_KEYS.has(strId) || !/^[0-9a-zA-Z_-]{1,32}$/.test(strId)) {
        return NextResponse.json(
          { success: false, error: 'الهدف المحدد غير صالح' },
          { status: 400 }
        );
      }

      const numPrice = hourPrice !== null && hourPrice !== undefined && hourPrice !== ''
        ? Number(hourPrice)
        : null;

      if (numPrice !== null && (!Number.isFinite(numPrice) || numPrice <= 0 || numPrice > 10_000)) {
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

      if (
        !governorateId ||
        FORBIDDEN_RECORD_KEYS.has(strGovId) ||
        !/^[0-9a-zA-Z_-]{1,32}$/.test(strGovId) ||
        !Number.isFinite(numPrice) ||
        numPrice <= 0 ||
        numPrice > 10_000
      ) {
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
      if (
        !governorateId ||
        FORBIDDEN_RECORD_KEYS.has(strGovId) ||
        !/^[0-9a-zA-Z_-]{1,32}$/.test(strGovId)
      ) {
        return NextResponse.json(
          { success: false, error: 'معرف المحافظة غير صالح' },
          { status: 400 }
        );
      }

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
        currentMatrix.governorates = sanitizeRatesMap(governorateRates);
      }
      if (districtRates && typeof districtRates === 'object') {
        currentMatrix.districts = sanitizeRatesMap(districtRates);
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
      { success: false, error: 'فشل تحديث أسعار الساعة' },
      { status: 500 }
    );
  }
}

