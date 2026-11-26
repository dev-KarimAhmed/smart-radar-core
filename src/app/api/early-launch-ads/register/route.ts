import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type CardType = 'COMMERCIAL' | 'CRAFTS';

function generateShareCode(cardType: CardType): string {
  const prefix = cardType === 'COMMERCIAL' ? 'BNK-C' : 'BNK-M';
  const token = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${token}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ success: false, error: 'invalid_payload' }, { status: 400 });
    }

    const cardType = String(body.cardType || '').toUpperCase() as CardType;
    const entityOrCategory = String(body.entityOrCategory || '').trim();
    const specialty = String(body.specialty || '').trim();
    const phone = String(body.phone || '').trim();
    const country = String(body.country || '').trim();
    const governorate = String(body.governorate || '').trim();
    const district = String(body.district || '').trim();

    if (cardType !== 'COMMERCIAL' && cardType !== 'CRAFTS') {
      return NextResponse.json({ success: false, error: 'invalid_card_type' }, { status: 400 });
    }
    if (!entityOrCategory || !specialty || !phone || !country || !governorate || !district) {
      return NextResponse.json({ success: false, error: 'missing_required_fields' }, { status: 400 });
    }
    if (phone.replace(/\D/g, '').length < 7) {
      return NextResponse.json({ success: false, error: 'invalid_phone' }, { status: 400 });
    }

    const shareCode = generateShareCode(cardType);

    const { data, error } = await supabaseAdmin
      .from('early_launch_ad_leads')
      .insert({
        card_type: cardType,
        entity_or_category: entityOrCategory,
        specialty,
        phone,
        country,
        governorate,
        district,
        share_code: shareCode,
        visitor_count: 0,
      })
      .select('id, card_type, share_code, visitor_count, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'save_failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: data.id,
        cardType: data.card_type,
        shareCode: data.share_code,
        visitorCount: data.visitor_count,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'unexpected_error' },
      { status: 500 },
    );
  }
}
