import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  DEFAULT_TRANSFER_CHANNELS,
  DEFAULT_FINANCIAL_DELEGATES,
  type PaymentTransferChannel,
  type FinancialDelegate,
} from '@/features/admin/types/wallet-directory';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryIdParam = searchParams.get('countryId');
    const governorate = (searchParams.get('governorate') || '').trim();
    const district = (searchParams.get('district') || '').trim();

    const countryId = countryIdParam ? Number(countryIdParam) : 1;

    // 1. Fetch Transfer Channels
    let channels: PaymentTransferChannel[] = DEFAULT_TRANSFER_CHANNELS;
    try {
      const { data } = await supabaseAdmin
        .from('app_flags')
        .select('note')
        .eq('flag', 'captain_transfer_channels')
        .maybeSingle();

      if (data?.note) {
        const parsed = JSON.parse(data.note);
        if (Array.isArray(parsed) && parsed.length > 0) {
          channels = parsed;
        }
      }
    } catch {}

    // Filter active channels for captain's country (or global channels with null country)
    const activeChannels = channels
      .filter((c) => c.isActive && (!c.countryId || c.countryId === countryId))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // 2. Fetch Financial Delegates
    let delegates: FinancialDelegate[] = DEFAULT_FINANCIAL_DELEGATES;
    try {
      const { data } = await supabaseAdmin
        .from('app_flags')
        .select('note')
        .eq('flag', 'financial_delegates_directory')
        .maybeSingle();

      if (data?.note) {
        const parsed = JSON.parse(data.note);
        if (Array.isArray(parsed) && parsed.length > 0) {
          delegates = parsed;
        }
      }
    } catch {}

    const activeDelegates = delegates.filter((d) => d.isActive && (!d.countryId || d.countryId === countryId));

    // Resolve best match delegate ONLY if matching the captain's district or governorate
    let matchedDelegate: FinancialDelegate | null = null;

    // 2a. Match by District (by ID or by Name)
    if (district) {
      const isNumericDist = /^\d+$/.test(district);
      const distId = isNumericDist ? Number(district) : null;
      const districtNames: string[] = [];

      if (isNumericDist && distId) {
        try {
          const { data: distRow } = await supabaseAdmin
            .from('districts')
            .select('name_ar, name_en')
            .eq('id', distId)
            .maybeSingle();
          if (distRow) {
            if (distRow.name_ar) districtNames.push(distRow.name_ar.trim().toLowerCase());
            if (distRow.name_en) districtNames.push(distRow.name_en.trim().toLowerCase());
          }
        } catch {}
      } else {
        districtNames.push(district.toLowerCase());
      }

      matchedDelegate = activeDelegates.find((d) => {
        // Direct ID match
        if (distId && d.districtId === distId) return true;
        // Name match
        if (d.districtName) {
          const dName = d.districtName.trim().toLowerCase();
          return districtNames.some((n) => dName.includes(n) || n.includes(dName));
        }
        return false;
      }) || null;
    }

    // 2b. If no district match, match by Governorate (by ID or by Name)
    if (!matchedDelegate && governorate) {
      const isNumericGov = /^\d+$/.test(governorate);
      const govId = isNumericGov ? Number(governorate) : null;
      const govNames: string[] = [];

      if (isNumericGov && govId) {
        try {
          const { data: govRow } = await supabaseAdmin
            .from('governorates')
            .select('name_ar, name_en')
            .eq('id', govId)
            .maybeSingle();
          if (govRow) {
            if (govRow.name_ar) govNames.push(govRow.name_ar.trim().toLowerCase());
            if (govRow.name_en) govNames.push(govRow.name_en.trim().toLowerCase());
          }
        } catch {}
      } else {
        govNames.push(governorate.toLowerCase());
      }

      matchedDelegate = activeDelegates.find((d) => {
        // Direct ID match
        if (govId && d.governorateId === govId) return true;
        // Name match
        if (d.governorateName) {
          const gName = d.governorateName.trim().toLowerCase();
          return govNames.some((n) => gName.includes(n) || n.includes(gName));
        }
        return false;
      }) || null;
    }

    // If no match was found for captain's district or governorate, matchedDelegate remains null!
    // No fallback to general or random delegates.

    return NextResponse.json({
      success: true,
      channels: activeChannels,
      delegate: matchedDelegate,
      allDelegates: activeDelegates,
    });
  } catch (error) {
    console.error('[captain/wallet-directory] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet directory' },
      { status: 500 }
    );
  }
}

