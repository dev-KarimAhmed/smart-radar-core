import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let captainId = (searchParams.get('captainId') || '').trim();

    // Support optional Bearer token authorization header
    if (!captainId) {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: authData } = await supabaseAdmin.auth.getUser(token);
          if (authData?.user?.id) {
            captainId = authData.user.id;
          }
        } catch {}
      }
    }

    if (!captainId || !isUuid(captainId)) {
      return NextResponse.json({ success: false, error: 'valid_captain_id_required' }, { status: 400 });
    }

    // Query last 5 receipts for this captain
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', captainId)
      .or('type.eq.receipt,transaction_type.eq.receipt,receipt_path.not.is.null')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchErr) {
      console.error('[Captain Receipts API] fetch error:', fetchErr);
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    const receipts = await Promise.all(
      (rows || []).map(async (tx) => {
        const metadata = (tx.metadata as Record<string, any>) || {};

        let signedImageUrl: string | null = null;
        if (tx.receipt_path) {
          try {
            const { data: signData } = await supabaseAdmin.storage
              .from('receipts')
              .createSignedUrl(tx.receipt_path, 3600);
            signedImageUrl = signData?.signedUrl || null;
          } catch (signErr) {
            console.warn('[Captain Receipts API] Failed to sign image URL:', signErr);
          }
        }

        const rawStatus = String(tx.status || 'PENDING').toUpperCase();
        const normalizedStatus =
          rawStatus === 'COMPLETED' || rawStatus === 'APPROVED'
            ? 'COMPLETED'
            : rawStatus === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING';

        const descriptionAr = tx.description_ar || '';
        let rejectReason: string | null = metadata.reject_reason || null;
        if (!rejectReason && normalizedStatus === 'REJECTED' && descriptionAr.includes(':')) {
          rejectReason = descriptionAr.split(':')[1]?.trim() || null;
        }

        return {
          id: tx.id,
          amount: Number(tx.amount) || 0,
          currencyAr: tx.currency_ar || 'د.أ',
          currencyCode: tx.currency_code || 'JOD',
          channel: tx.payment_channel || 'تحويل مباشر',
          status: normalizedStatus,
          createdAt: tx.created_at,
          receiptPath: tx.receipt_path || null,
          signedImageUrl,
          descriptionAr,
          rejectReason,
          adminNote: metadata.admin_note || null,
          creditType: metadata.credit_type || (metadata.minutes_credited ? 'MINUTES' : metadata.amount_credited ? 'CASH' : null),
          minutesCredited: metadata.minutes_credited ? Number(metadata.minutes_credited) : null,
          amountCredited: metadata.amount_credited ? Number(metadata.amount_credited) : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      receipts,
    });
  } catch (err: any) {
    console.error('[Captain Receipts API] unexpected error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'internal_server_error' }, { status: 500 });
  }
}

