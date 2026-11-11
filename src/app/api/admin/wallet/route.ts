import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAccess } from '@/lib/admin-auth-verifier';
import { isValidStorageRelativePath, isValidUuid } from '@/shared/server/api-auth-guard';
import {
  generateVoucherCode,
  sendCaptainNotification,
  handleApproveReceipt,
  handleRejectReceipt,
  handleDirectTopup,
} from './wallet-mutations';

export {
  generateVoucherCode,
  sendCaptainNotification,
  handleApproveReceipt,
  handleRejectReceipt,
  handleDirectTopup,
} from './wallet-mutations';

export async function GET(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'overview';

  try {
    switch (view) {
      // 1. General Overview KPIs
      case 'overview': {
        const [walletsRes, pendingReceiptsRes, vouchersRes, flagRes] = await Promise.all([
          supabaseAdmin.from('wallet_accounts').select('profile_id, balance, paid_minutes_remaining, currency_code'),
          supabaseAdmin.from('wallet_transactions').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
          supabaseAdmin.from('wallet_vouchers').select('status'),
          supabaseAdmin.from('app_flags').select('enabled').eq('flag', 'captain_self_topup').maybeSingle(),
        ]);

        const wallets = walletsRes.data || [];
        const profileIds = Array.from(new Set(wallets.map(w => w.profile_id).filter(Boolean)));
        let profilesMap = new Map();

        if (profileIds.length > 0) {
          const { data: profs } = await supabaseAdmin.from('profiles').select('id, country_id, phone').in('id', profileIds);
          profilesMap = new Map((profs || []).map(p => [p.id, p]));
        }

        let totalCashBalance = 0;
        let totalPaidMinutes = 0;
        let jodBalance = 0;
        let egpBalance = 0;

        wallets.forEach(w => {
          const bal = Number(w.balance || 0);
          totalCashBalance += bal;
          totalPaidMinutes += Number(w.paid_minutes_remaining || 0);

          const prof = profilesMap.get(w.profile_id);
          const isEgypt = prof?.country_id === 2 || String(prof?.phone || '').startsWith('+20') || w.currency_code === 'EGP';
          if (isEgypt) {
            egpBalance += bal;
          } else {
            jodBalance += bal;
          }
        });

        const unusedVouchersCount = (vouchersRes.data || []).filter(v => v.status === 'UNUSED').length;
        const totalVouchersCount = vouchersRes.data?.length || 0;

        return NextResponse.json({
          success: true,
          overview: {
            totalCashBalance: Number(totalCashBalance.toFixed(2)),
            jodBalance: Number(jodBalance.toFixed(2)),
            egpBalance: Number(egpBalance.toFixed(2)),
            totalPaidMinutes,
            totalFlightHours: Number((totalPaidMinutes / 60).toFixed(1)),
            pendingReceiptsCount: pendingReceiptsRes.count || 0,
            unusedVouchersCount,
            totalVouchersCount,
            selfTopupEnabled: Boolean(flagRes.data?.enabled),
          },
        });
      }

      // 2. Receipts List (Pending & History)
      case 'receipts': {
        const { data: rawTransactions, error: txErr } = await supabaseAdmin
          .from('wallet_transactions')
          .select('*')
          .or('type.eq.receipt,transaction_type.eq.receipt,receipt_path.not.is.null')
          .order('created_at', { ascending: false })
          .limit(100);

        if (txErr) throw txErr;

        const transactions = rawTransactions || [];
        const profileIds = Array.from(new Set(transactions.map(t => t.profile_id).filter(Boolean)));

        // Fetch captain details, captain_profiles, countries, and governorates/districts lookup
        let profilesMap = new Map();
        let captainProfilesMap = new Map();
        let govMap = new Map();
        let distMap = new Map();
        let countriesMap = new Map();

        if (profileIds.length > 0) {
          const [profilesRes, capRes, govRes, distRes, countriesRes] = await Promise.all([
            supabaseAdmin
              .from('profiles')
              .select('id, full_name, phone, serial_id, governorate_id, district_id, country_id')
              .in('id', profileIds),
            supabaseAdmin
              .from('captain_profiles')
              .select('id, nickname, plate_number, vehicle_brand, vehicle_model')
              .in('id', profileIds),
            supabaseAdmin.from('governorates').select('id, name_ar'),
            supabaseAdmin.from('districts').select('id, name_ar'),
            supabaseAdmin.from('countries').select('id, currency_ar, currency_en, name_ar'),
          ]);

          profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
          captainProfilesMap = new Map((capRes.data || []).map(c => [c.id, c]));
          govMap = new Map((govRes.data || []).map(g => [g.id, g.name_ar]));
          distMap = new Map((distRes.data || []).map(d => [d.id, d.name_ar]));
          countriesMap = new Map((countriesRes.data || []).map(c => [c.id, c]));
        }

        // Build signed URLs for receipt images
        const receiptsWithDetails = await Promise.all(
          transactions.map(async (tx) => {
            const profile = profilesMap.get(tx.profile_id) || {};
            const cap = captainProfilesMap.get(tx.profile_id) || {};
            const country = profile.country_id ? countriesMap.get(profile.country_id) : null;
            const isEgypt = profile.country_id === 2 || String(profile.phone || '').startsWith('+20');
            const fallbackCurrencyAr = country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');

            let signedImageUrl = null;

            if (tx.receipt_path && isValidStorageRelativePath(tx.receipt_path)) {
              try {
                const { data: signData } = await supabaseAdmin.storage
                  .from('receipts')
                  .createSignedUrl(tx.receipt_path, 3600);
                signedImageUrl = signData?.signedUrl || null;
              } catch (signErr) {
                console.warn('[Admin Wallet] Failed to sign receipt image:', signErr);
              }
            }

            const govName = profile.governorate_id ? govMap.get(profile.governorate_id) : 'عمّان';
            const distName = profile.district_id ? distMap.get(profile.district_id) : 'المركز';
            const captainName = profile.full_name || cap.nickname || 'كابتن معلن غير مسمّى';
            const captainSerial = profile.serial_id || `C-${String(tx.profile_id).slice(0, 4)}`;

            return {
              id: tx.id,
              profileId: tx.profile_id,
              captainName,
              captainPhone: profile.phone || '',
              captainSerial,
              governorate: govName || 'عمّان',
              district: distName || 'المركز',
              plateNumber: cap.plate_number || '',
              amount: Number(tx.amount || 0),
              currency: tx.currency_ar || tx.currency_code || fallbackCurrencyAr,
              channel: tx.payment_channel || 'تحويل مباشر',
              receiptPath: tx.receipt_path,
              receiptImageUrl: signedImageUrl,
              status: (tx.status || 'PENDING').toUpperCase(),
              description: tx.description_ar || tx.description || '',
              metadata: tx.metadata || {},
              createdAt: tx.created_at,
            };
          })
        );

        return NextResponse.json({ success: true, receipts: receiptsWithDetails });
      }

      // 3. Vouchers List
      case 'vouchers': {
        const { data: vouchers, error: vErr } = await supabaseAdmin
          .from('wallet_vouchers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(150);

        if (vErr) throw vErr;

        const redeemedIds = Array.from(new Set((vouchers || []).map(v => v.redeemed_by).filter(Boolean)));
        let profilesMap = new Map();

        if (redeemedIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, phone, serial_id')
            .in('id', redeemedIds);

          profilesMap = new Map((profiles || []).map(p => [p.id, p]));
        }

        const mappedVouchers = (vouchers || []).map(v => {
          const redeemer = v.redeemed_by ? profilesMap.get(v.redeemed_by) : null;
          return {
            code: v.code,
            minutesValue: v.minutes_value,
            hoursValue: Number((v.minutes_value / 60).toFixed(1)),
            status: v.status,
            redeemedBy: redeemer ? {
              name: redeemer.full_name,
              phone: redeemer.phone,
              serial: redeemer.serial_id,
            } : null,
            redeemedAt: v.redeemed_at,
            createdAt: v.created_at,
          };
        });

        return NextResponse.json({ success: true, vouchers: mappedVouchers });
      }

      // 4. Financial Ledger (Recent Transactions)
      case 'ledger': {
        const { data: transactions, error: lErr } = await supabaseAdmin
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (lErr) throw lErr;

        const profileIds = Array.from(new Set((transactions || []).map(t => t.profile_id).filter(Boolean)));
        let profilesMap = new Map();
        let countriesMap = new Map();

        if (profileIds.length > 0) {
          const [profilesRes, countriesRes] = await Promise.all([
            supabaseAdmin
              .from('profiles')
              .select('id, full_name, phone, serial_id, role, country_id')
              .in('id', profileIds),
            supabaseAdmin.from('countries').select('id, currency_ar, currency_en'),
          ]);

          profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
          countriesMap = new Map((countriesRes.data || []).map(c => [c.id, c]));
        }

        const ledger = (transactions || []).map(t => {
          const user = profilesMap.get(t.profile_id);
          const country = user?.country_id ? countriesMap.get(user.country_id) : null;
          const isEgypt = user?.country_id === 2 || String(user?.phone || '').startsWith('+20');
          const fallbackCurrencyAr = country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');

          return {
            id: t.id,
            profileId: t.profile_id,
            userName: user?.full_name || 'مستخدم',
            userPhone: user?.phone || '',
            userSerial: user?.serial_id || '',
            userRole: user?.role || 'CAPTAIN',
            type: t.type || t.transaction_type || 'transaction',
            amount: Number(t.amount || 0),
            currency: t.currency_ar || t.currency_code || fallbackCurrencyAr,
            status: t.status || 'COMPLETED',
            description: t.description_ar || t.description || '',
            createdAt: t.created_at,
          };
        });

        return NextResponse.json({ success: true, ledger });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown view' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Wallet API] GET error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحميل بيانات المحفظة' }, { status: 500 });
  }
}


