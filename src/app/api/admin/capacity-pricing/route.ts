import { NextResponse } from 'next/server';
import { getServerSupabaseAdmin } from '@/shared/server/api-auth-guard';
import { requireAdminAccess } from '@/features/admin/lib/admin-auth-server';

export const dynamic = 'force-dynamic';

const FLAG_KEY = 'capacity_pricing_config';

export async function GET(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'hourly_rates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const supabaseAdmin = getServerSupabaseAdmin();
    const [{ data: country, error }, { data: flagRow }] = await Promise.all([
      supabaseAdmin
        .from('countries')
        .select('radar_hour_price, tariff_per_km, tariff_per_min')
        .eq('id', 1)
        .maybeSingle(),
      supabaseAdmin
        .from('app_flags')
        .select('note')
        .eq('flag', FLAG_KEY)
        .maybeSingle(),
    ]);

    if (error) throw error;

    let extraConfig: Record<string, unknown> = {};
    if (flagRow?.note) {
      try {
        const parsed = JSON.parse(flagRow.note);
        if (parsed && typeof parsed === 'object') extraConfig = parsed;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      radar_hour_price: country?.radar_hour_price ?? null,
      tariff_per_km: country?.tariff_per_km ?? null,
      tariff_per_min: country?.tariff_per_min ?? null,
      config: extraConfig,
    });
  } catch (err: any) {
    console.error('[capacity-pricing] GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load capacity pricing' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'hourly_rates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const radarHourPrice = Number(body?.radar_hour_price);
    const tariffPerMin = Number(body?.tariff_per_min);

    if (!Number.isFinite(radarHourPrice) || radarHourPrice <= 0 || radarHourPrice > 10_000) {
      return NextResponse.json({ success: false, error: 'سعر ساعة الرادار غير صالح' }, { status: 400 });
    }
    if (!Number.isFinite(tariffPerMin) || tariffPerMin <= 0 || tariffPerMin > 1_000) {
      return NextResponse.json({ success: false, error: 'تعرفة الدقيقة غير صالحة' }, { status: 400 });
    }

    const supabaseAdmin = getServerSupabaseAdmin();
    const { error: updateErr } = await supabaseAdmin
      .from('countries')
      .update({
        radar_hour_price: radarHourPrice,
        tariff_per_min: tariffPerMin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (updateErr) throw updateErr;

    const notePayload = {
      impressionPrice: Number.isFinite(Number(body?.impressionPrice)) ? Number(body.impressionPrice) : undefined,
      videoSurcharge: Number.isFinite(Number(body?.videoSurcharge)) ? Number(body.videoSurcharge) : undefined,
      capacities: body?.capacities && typeof body.capacities === 'object' ? {
        amman: Math.max(0, Math.round(Number(body.capacities.amman) || 0)),
        zarqa: Math.max(0, Math.round(Number(body.capacities.zarqa) || 0)),
        irbid: Math.max(0, Math.round(Number(body.capacities.irbid) || 0)),
        aqaba: Math.max(0, Math.round(Number(body.capacities.aqaba) || 0)),
      } : undefined,
      updated_by: access.admin.id,
      updated_at: new Date().toISOString(),
    };

    const { error: flagErr } = await supabaseAdmin.from('app_flags').upsert(
      {
        flag: FLAG_KEY,
        enabled: true,
        note: JSON.stringify(notePayload),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'flag' }
    );

    if (flagErr) throw flagErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[capacity-pricing] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save capacity pricing' },
      { status: 500 }
    );
  }
}