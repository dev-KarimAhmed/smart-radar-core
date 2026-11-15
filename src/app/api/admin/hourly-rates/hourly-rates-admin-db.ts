import { supabaseAdmin } from '@/lib/supabase-admin';

export interface HourlyRatesMatrix {
  governorates: Record<string, number>;
  districts: Record<string, number>;
}

export async function getHourlyRatesMatrix(): Promise<HourlyRatesMatrix> {
  const { data: flagRow } = await supabaseAdmin
    .from('app_flags')
    .select('*')
    .eq('flag', 'hourly_rates_matrix')
    .maybeSingle();

  let matrix: HourlyRatesMatrix = {
    governorates: {},
    districts: {},
  };

  if (flagRow?.note) {
    try {
      const parsed = JSON.parse(flagRow.note);
      if (parsed && typeof parsed === 'object') {
        matrix = {
          governorates: parsed.governorates || {},
          districts: parsed.districts || {},
        };
      }
    } catch (parseErr) {
      console.warn('[HourlyRates Admin DB] Could not parse hourly_rates_matrix:', parseErr);
    }
  }

  return matrix;
}

export async function saveHourlyRatesMatrix(
  matrix: HourlyRatesMatrix,
  adminId: string
): Promise<void> {
  const { error: upsertErr } = await supabaseAdmin
    .from('app_flags')
    .upsert({
      flag: 'hourly_rates_matrix',
      enabled: true,
      note: JSON.stringify({
        ...matrix,
        updated_at: new Date().toISOString(),
        updated_by: adminId || 'admin',
      }),
      updated_at: new Date().toISOString(),
    });

  if (upsertErr) throw upsertErr;
}

export async function processHourlyRatesAction(
  body: any,
  matrix: HourlyRatesMatrix
): Promise<{ success: boolean; error?: string; status?: number }> {
  const { action } = body;

  if (action === 'update_single_rate') {
    const { targetType, targetId, hourPrice } = body;
    const strId = String(targetId);

    if (!targetType || !targetId) {
      return { success: false, error: 'الهدف المحدد غير صالح', status: 400 };
    }

    const numPrice = hourPrice !== null && hourPrice !== undefined && hourPrice !== ''
      ? Number(hourPrice)
      : null;

    if (numPrice !== null && (isNaN(numPrice) || numPrice <= 0)) {
      return { success: false, error: 'يرجى إدخال سعر ساعة صحيح أكبر من صفر', status: 400 };
    }

    if (targetType === 'governorate') {
      if (numPrice === null) {
        delete matrix.governorates[strId];
      } else {
        matrix.governorates[strId] = numPrice;
      }
    } else if (targetType === 'district') {
      if (numPrice === null) {
        delete matrix.districts[strId];
      } else {
        matrix.districts[strId] = numPrice;
      }
    }
  } else if (action === 'apply_to_governorate_districts') {
    const { governorateId, hourPrice } = body;
    const strGovId = String(governorateId);
    const numPrice = Number(hourPrice);

    if (!governorateId || isNaN(numPrice) || numPrice <= 0) {
      return { success: false, error: 'يرجى إدخال سعر ساعة صحيح للمحافظة', status: 400 };
    }

    matrix.governorates[strGovId] = numPrice;

    const { data: relatedDistricts } = await supabaseAdmin
      .from('districts')
      .select('id')
      .eq('governorate_id', governorateId);

    if (Array.isArray(relatedDistricts)) {
      for (const dist of relatedDistricts) {
        matrix.districts[String(dist.id)] = numPrice;
      }
    }
  } else if (action === 'reset_governorate') {
    const { governorateId, resetDistricts } = body;
    const strGovId = String(governorateId);

    delete matrix.governorates[strGovId];

    if (resetDistricts) {
      const { data: relatedDistricts } = await supabaseAdmin
        .from('districts')
        .select('id')
        .eq('governorate_id', governorateId);

      if (Array.isArray(relatedDistricts)) {
        for (const dist of relatedDistricts) {
          delete matrix.districts[String(dist.id)];
        }
      }
    }
  } else if (action === 'bulk_save') {
    const { governorateRates, districtRates } = body;
    if (governorateRates && typeof governorateRates === 'object') {
      matrix.governorates = { ...governorateRates };
    }
    if (districtRates && typeof districtRates === 'object') {
      matrix.districts = { ...districtRates };
    }
  } else {
    return { success: false, error: 'إجراء غير معروف', status: 400 };
  }

  return { success: true };
}
