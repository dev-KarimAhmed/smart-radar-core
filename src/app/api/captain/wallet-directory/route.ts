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

    // Resolve best match delegate
    let matchedDelegate: FinancialDelegate | null = null;

    if (district) {
      const cleanDist = district.toLowerCase();
      matchedDelegate = activeDelegates.find(
        (d) => d.districtName && (d.districtName.toLowerCase().includes(cleanDist) || cleanDist.includes(d.districtName.toLowerCase()))
      ) || null;
    }

    if (!matchedDelegate && governorate) {
      const cleanGov = governorate.toLowerCase();
      matchedDelegate = activeDelegates.find(
        (d) => d.governorateName && (d.governorateName.toLowerCase().includes(cleanGov) || cleanGov.includes(d.governorateName.toLowerCase()))
      ) || null;
    }

    if (!matchedDelegate) {
      // General or fallback delegate
      matchedDelegate = activeDelegates.find((d) => !d.districtName && !d.governorateName)
        || activeDelegates.find((d) => d.name.includes('العام'))
        || activeDelegates[0]
        || null;
    }

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

