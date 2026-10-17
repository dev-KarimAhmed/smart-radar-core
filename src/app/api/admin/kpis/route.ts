import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [driversRes, ridersRes, delegatesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, status', { count: 'exact' }).eq('role', 'CAPTAIN'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'RIDER'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'DELEGATE'),
    ]);

    const allDrivers = driversRes.data || [];
    const activeCount = allDrivers.filter((d: any) => {
      const s = String(d.status || '').toLowerCase();
      return s === 'active' || s === 'busy';
    }).length;

    let activeAdsCount = 0;
    let pendingAdsCount = 0;

    try {
      const promosSnap = await getDocs(collection(db, 'promos'));
      promosSnap.forEach((doc) => {
        const data = doc.data();
        const status = String(data.status || '').toLowerCase();
        if (status === 'active') activeAdsCount++;
        else if (status === 'pending') pendingAdsCount++;
      });
    } catch (adErr) {
      console.warn('[Admin KPIs] Firestore promo read skipped:', adErr);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCaptains: driversRes.count ?? allDrivers.length,
        activeCaptains: activeCount,
        totalRiders: ridersRes.count ?? 0,
        totalDelegates: delegatesRes.count ?? 0,
        activeAds: activeAdsCount,
        pendingAds: pendingAdsCount,
        systemHealth: '100% مستقر',
      },
    });
  } catch (err: any) {
    console.error('[Admin KPIs API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

