'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

interface ServerWalletSnapshot {
  balance: number;
  paidHoursMin: number;
  bonusHoursMin: number;
  subscriptionHours: number;
  activePackageName: string;
  transactions: any[];
}

function mapWalletTransactionRow(row: Record<string, any>) {
  const timestamp = parseTimestamp(row.created_at ?? row.createdAt ?? row.timestamp);
  return {
    id: String(row.id),
    type: row.type || row.transaction_type || 'charge',
    amount: firstNumber(row.amount, 0),
    currency: firstString(row.currency_ar, row.currency, row.currency_code, ''),
    description: firstString(row.description_ar, row.description, row.memo, 'عملية على الرصيد'),
    createdAt: timestamp ? new Date(timestamp).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '',
    status: row.status || 'completed',
    timestamp: timestamp || Date.now(),
  };
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseTimestamp(value: unknown) {
  if (typeof value === 'number') return value;
  if ((value as any)?.seconds) return (value as any).seconds * 1000;
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 🛡️ [RAD-MAP-074-GEO-REFILL] useSovereignWallet Hook
 * Handles financial, fare, and refill operations on the local edge to cloud.
 * Optimized for a single-write (1 Write Only) to reduce database workload.
 * Complies with the Diamond Sterilization Code (SRP Architecture).
 */
export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serverWallet, setServerWallet] = useState<ServerWalletSnapshot | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const loadingRef = useRef(false);
  const { suspendUserDocListener, resumeUserDocListener } = useAuth();

  // 🛡️ [النشاط الشبكي التفاضلي V2.6-Secured - مرشح التوقيت المالي]
  // استرجاع توقيت السيرفر المعاير محلياً لمنع التلاعب بساعة الهاتف وتمرير المعاملات بأوقات زائفة
  const getNetworkAdjustedTime = useCallback(() => {
    if (typeof window !== 'undefined') {
      const deltaStr = sessionStorage.getItem('sovereign_time_delta');
      const delta = deltaStr ? parseInt(deltaStr, 10) : 0;
      return Date.now() + delta;
    }
    return Date.now();
  }, []);
  const walletCurrency = user?.currencyAr || user?.currencyEn || '';

  useEffect(() => {
    if (!user?.uid) {
      setServerWallet(null);
      setWalletLoaded(true);
      return;
    }

    let active = true;

    async function fetchWalletFromServer() {
      setWalletLoaded(false);
      try {
        const [{ data: walletData, error: walletError }, { data: txData, error: txError }] = await Promise.all([
          supabase
            .from('wallet_accounts')
            .select('*')
            .eq('user_id', user!.uid)
            .maybeSingle(),
          supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user!.uid)
            .order('created_at', { ascending: false }),
        ]);

        if (walletError) throw walletError;
        if (txError) throw txError;

        if (!active) return;

        if (!walletData) {
          setServerWallet(null);
          return;
        }

        setServerWallet({
          balance: firstNumber(walletData.balance, walletData.balance_jd, walletData.wallet_balance, 0),
          paidHoursMin: firstNumber(walletData.paid_hours_remaining, walletData.paid_minutes_remaining, 0),
          bonusHoursMin: firstNumber(walletData.bonus_hours_remaining, walletData.bonus_minutes_remaining, 0),
          subscriptionHours: firstNumber(walletData.subscription_hours, 0),
          activePackageName: firstString(walletData.active_package_name, walletData.package_name, ''),
          transactions: Array.isArray(txData) ? txData.map(mapWalletTransactionRow) : [],
        });
      } catch (error) {
        if (!active) return;
        setServerWallet(null);
        toast({
          variant: 'destructive',
          title: 'تعذر تحميل الرصيد',
          description: 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت.',
        });
      } finally {
        if (active) setWalletLoaded(true);
      }
    }

    void fetchWalletFromServer();

    return () => {
      active = false;
    };
  }, [toast, user?.uid]);

  /**
   * 📡 fundRiderBalance
   * لشحن الدينار المبرهن وفق تصفية منطقة الموطن (homeDistrict) مع حظر الكبس المتكرر وعزل المستمعين.
   */
  const fundRiderBalance = useCallback(async (amountPaid: number, channel: string) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);

    // 🛡️ [حارس قفل الكتابة التفاعلي المانع لتراجع الحالة V2.6-Secured]
    suspendUserDocListener();

    try {
      const networkNow = getNetworkAdjustedTime();
      const txId = 'tx-' + networkNow;
      const district = user.district || 'وادي السير';
      const transactionItem = {
        id: txId,
        type: 'charge',
        amount: amountPaid,
        currency: walletCurrency,
        description: `شحن رصيد إقليمي منطقة [${district}] عبر بوابة [${channel}]`,
        createdAt: new Date(networkNow).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        status: 'completed'
      };

      // Atomic Single Write Update
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalanceJD: increment(amountPaid),
        walletTransactions: arrayUnion(transactionItem)
      });

      toast({
        title: "📡 تم الشحن اللامركزي بنجاح",
        description: `تم إيداع ${amountPaid} ${walletCurrency} في الرصيد.`
      });
      return true;
    } catch (error: any) {
      // 🛡️ [حظر كتل Catch الفارغة (بروتوكول 20)]
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Rider fund failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض  تشغيلي",
        description: error?.message || "تعذر إرسال نشاطة الشحن الجغرافي للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;

      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user, walletCurrency, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * 💸 deductRiderFare
   * للخصم المباشر المباشر المقيد بالنشاط الشبكي التفاضلي لمنع ثغرة السفر بالزمن.
   */
  const deductRiderFare = useCallback(async (tripId: string, amountJD: number) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);

    suspendUserDocListener();

    try {
      const networkNow = getNetworkAdjustedTime();
      const txId = 'tx-' + networkNow;

      const transactionItem = {
        id: txId,
        type: 'trip_deduction',
        amount: -amountJD,
        currency: walletCurrency,
        description: `خصم أجرة رحلة رقم [${tripId}]`,
        createdAt: new Date(networkNow).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        status: 'completed'
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalanceJD: increment(-amountJD),
        walletTransactions: arrayUnion(transactionItem)
      });

      toast({
        title: "💸 تم الخصم المباشر بنجاح",
        description: `تم خصم أجرة الرحلة بقيمة ${amountJD} ${walletCurrency} بنجاح.`
      });
      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Rider fare deduction failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض  تشغيلي",
        description: error?.message || "تعذر إرسال نشاطة خصم الأجرة للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;

      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user?.uid, walletCurrency, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * 📡 rechargeWallet (Fallback/Generic API)
   * شحن رصيد إقليمي منطقة عبر بوابة الدفع المحددة
   */
  const rechargeWallet = useCallback(async (amountPaid: number, district: string, gateway: string) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على قائد أو مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    // 🛡️ [جدار الحماية الأمني V2.6-Secured]: منع التلاعب بالقيم الصفرية والسالبة وحظر التحديث العشوائي
    if (amountPaid <= 0 || isNaN(amountPaid)) {
      console.error('[CRITICAL_SECURITY_ALERT] [Exploit Attempt]: Negative or zero top-up value detected:', amountPaid);
      toast({
        variant: 'destructive',
        title: 'خرق أمني كاشف',
        description: 'يرجى إدخال قيمة شحن صحيحة وقانونية، تم حظر المعاملة وتسجيل المحاولة في سجلات النزاهة.'
      });
      return false;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);

    suspendUserDocListener();

    try {
      const networkNow = getNetworkAdjustedTime();
      const txId = 'tx-' + networkNow;
      const transactionItem = {
        id: txId,
        type: 'charge',
        amount: amountPaid,
        currency: walletCurrency,
        description: `شحن رصيد إقليمي منطقة [${district}] عبر بوابة [${gateway}]`,
        createdAt: new Date(networkNow).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        status: 'completed'
      };

      // Atomic Single Write Update
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalanceJD: increment(amountPaid),
        walletTransactions: arrayUnion(transactionItem)
      });

      toast({
        title: "📡 تم الشحن اللامركزي بنجاح",
        description: `تم إيداع ${amountPaid} ${walletCurrency} في الرصيد.`
      });
      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] rechargeWallet failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض  تشغيلي",
        description: error?.message || "تعذر إرسال نشاطة الشحن الجغرافي للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;

      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user?.uid, walletCurrency, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * ⚡ purchaseDriverPackage
   * شراء باقات العرض الموجه جغرافياً للسائقين
   */
  const purchaseDriverPackage = useCallback(async (pkgType: 'pulse' | 'transit') => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);

    suspendUserDocListener();

    try {
      const balanceJD = serverWallet?.balance ?? 0;
      const cost = pkgType === 'pulse' ? 1.00 : 10.00;
      const addedHours = pkgType === 'pulse' ? 24.0 : 100.0;
      const name = pkgType === 'pulse' ? 'باقة النشاط الأساسية (24 ساعة)' : 'باقة العبور الكبرى (100 ساعة)';

      if (balanceJD < cost) {
        toast({
          variant: 'destructive',
          title: 'رصيد نقدي غير كافٍ',
          description: `تكلفة الباقة ${cost} ${walletCurrency}. يرجى تعبئة الرصيد أولاً.`
        });
        return false;
      }

      const networkNow = getNetworkAdjustedTime();
      const r = (user?.rank || 'SILVER').toUpperCase();
      const captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE' =
        r === 'PLATINUM' ? 'PLATINUM' : (r === 'GOLD' ? 'GOLD' : 'BRONZE');

      const currentPaidMinutes = serverWallet?.paidHoursMin ?? 0;
      const currentBonusMinutes = serverWallet?.bonusHoursMin ?? 0;

      const homeDistrict = user?.district || 'وادي السير';

      const { RadarGeoRefillKernel } = await import('@/lib/refill-kernel');

      const geoWalletInput = {
        captainId: user.uid,
        homeDistrict,
        paidMinutesRemaining: currentPaidMinutes,
        bonusMinutesRemaining: currentBonusMinutes,
        captainRank
      };

      const gatewayNode = {
        districtName: homeDistrict,
        localWalletMerchantId: `CLIQCASH-#SOV-${homeDistrict.toUpperCase()}-99`
      };

      const refillResult = RadarGeoRefillKernel.executeSovereignRefillByDistrict(
        geoWalletInput,
        pkgType === 'pulse' ? 1 : 10,
        gatewayNode
      );

      if (!refillResult.success) {
        toast({
          variant: 'destructive',
          title: 'فشل بروتوكول الشحن الجغرافي',
          description: refillResult.logMessage
        });
        return false;
      }

      const nextPaidMinutes = refillResult.updatedWallet.paidMinutesRemaining;
      const nextBonusMinutes = refillResult.updatedWallet.bonusMinutesRemaining;
      const totalHoursFraction = (nextPaidMinutes + nextBonusMinutes) / 60;

      const addedPaidMinutes = nextPaidMinutes - currentPaidMinutes;
      const bonusPercent = captainRank === 'PLATINUM' ? 0.25 : (captainRank === 'GOLD' ? 0.15 : 0);
      const rankText = captainRank === 'PLATINUM' ? 'بلاتيني (+25% بونص )' :
                       captainRank === 'GOLD' ? 'ذهبي (+15% بونص )' : 'برونزي/فضي';
      const bonusHoursText = bonusPercent > 0 ? ` + مكافأة رتبة ${rankText} بقيمة ${(addedPaidMinutes * bonusPercent) / 60} ساعات حرة` : '';

      const txId = 'tx-' + networkNow;
      const transactionItem = {
        id: txId,
        type: 'purchase',
        amount: -cost,
        currency: walletCurrency,
        description: `تفعيل ذي توجيه جغرافي: ${name}${bonusHoursText}`,
        createdAt: new Date(networkNow).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - الآن',
        status: 'completed'
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalanceJD: Number((balanceJD - cost).toFixed(2)),
        paidHoursRemaining: nextPaidMinutes,
        bonusHoursRemaining: nextBonusMinutes,
        subscriptionHours: Number(totalHoursFraction.toFixed(3)),
        activePackageName: pkgType === 'pulse' ? 'باقة النشاط الأساسية' : 'باقة العبور الكبرى',
        walletTransactions: arrayUnion(transactionItem)
      });

      toast({
        title: '⚡ تم التفعيل الفوري للملاحة الموجهة جغرافياً',
        description: bonusPercent > 0
          ? `مبروك سائق! تم إمداد العرض بـ ${addedHours} ساعة من الباقة بالإضافة إلى ${(addedPaidMinutes * bonusPercent) / 60} ساعات بونص مجانية رتبة ${user?.rank} منطقة [${homeDistrict}].`
          : `مبروك سائق! تم إمداد ساعات العمل بـ ${addedHours} ساعة عمل منطقة [${homeDistrict}].`
      });

      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Purchase package failed:', error);
      toast({
        variant: 'destructive',
        title: '🚫 عارض  تشغيلي',
        description: error?.message || 'تعذر إتمام عملية شراء الباقة المحلية.'
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;

      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user, serverWallet, walletCurrency, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  // 🪙 [التعقيم الماسي V2.6-Secured - مصدر الحقيقة الواحد]
  // احتساب وعزل الحالة المالية وساعات الاشتراك المتبقية لمنع الرندرة العشوائية وتضارب البيانات
  const isDriver = user?.role === 'driver';
  const balanceJD = serverWallet?.balance ?? 0;
  const paidHoursMin = serverWallet?.paidHoursMin ?? 0;
  const bonusHoursMin = serverWallet?.bonusHoursMin ?? 0;
  const subscriptionHours = serverWallet?.subscriptionHours ?? Number(((paidHoursMin + bonusHoursMin) / 60).toFixed(3));
  const activePackageName = serverWallet?.activePackageName || '';

  const transactions = useMemo(() => {
    const txs = serverWallet?.transactions ?? [];

    return txs.map((tx: any) => {
      let ts = tx.timestamp;
      if (!ts && tx.id && tx.id.startsWith('tx-')) {
        const idNum = parseInt(tx.id.replace('tx-', ''), 10);
        if (!isNaN(idNum)) {
          ts = idNum;
        }
      }
      if (!ts) {
        ts = Date.now();
      }
      return {
        ...tx,
        timestamp: ts
      };
    });
  }, [serverWallet?.transactions]);

  return {
    loading,
    walletLoaded,
    rechargeWallet,
    fundRiderBalance,
    deductRiderFare,
    purchaseDriverPackage,
    // Returned State Properties (No UI logic allowed)
    isDriver,
    balanceJD,
    paidHoursMin,
    bonusHoursMin,
    subscriptionHours,
    activePackageName,
    transactions
  };
}
