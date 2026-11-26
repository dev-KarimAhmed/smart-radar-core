import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const shareCode = String(body?.shareCode || '').trim();

    if (!shareCode || shareCode.length > 40) {
      return NextResponse.json({ success: false, error: 'invalid_share_code' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('increment_early_launch_lead_visit', {
      p_share_code: shareCode,
    });

    if (error) {
      const { data: existing } = await supabaseAdmin
        .from('early_launch_ad_leads')
        .select('id, visitor_count')
        .eq('share_code', shareCode)
        .maybeSingle();

      if (existing) {
        const nextCount = Number(existing.visitor_count || 0) + 1;
        await supabaseAdmin
          .from('early_launch_ad_leads')
          .update({ visitor_count: nextCount, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        return NextResponse.json({ success: true, visitorCount: nextCount });
      }

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, visitorCount: Number(data ?? 0) });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'unexpected_error' },
      { status: 500 },
    );
  }
}
