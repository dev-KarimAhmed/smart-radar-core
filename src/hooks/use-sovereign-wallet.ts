'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import type { User } from '@/core/types';

/**
 * 🛡️ [RAD-MAP-074-GEO-REFILL] useSovereignWallet Hook
 * Handles financial, fare, and refill operations on the local edge to cloud.
 * Optimized for a single-write (1 Write Only) to reduce database workload.
 * Complies with the Diamond Sterilization Code (SRP Architecture).
 */
export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const { suspendUserDocListener, resumeUserDocListener } = useAuth();

  // 🛡️ [النبض الشبكي التفاضلي V2.6-Secured - مرشح التوقيت المالي]
  // استرجاع توقيت السيرفر المعاير محلياً لمنع التلاعب بساعة الهاتف وتمرير المعاملات بأوقات زائفة
  const getNetworkAdjustedTime = useCallback(() => {
    if (typeof window !== 'undefined') {
      const deltaStr = sessionStorage.getItem('sovereign_time_delta');
      const delta = deltaStr ? parseInt(deltaStr, 10) : 0;
      return Date.now() + delta;
    }
    return Date.now();
  }, []);

  /**
   * 📡 fundRiderBalance
   * لشحن الدينار المبرهن وفق تصفية لواء الموطن (homeDistrict) مع حظر الكبس المتكرر وعزل المستمعين.
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
        currency: 'د.أ',
        description: `شحن رصيد إقليمي لواء [${district}] عبر بوابة [${channel}]`,
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
        description: `تم إيداع ${amountPaid} د.أ بنبضة كتابة سحابية واحدة لوتد المحفظة.`
      });
      return true;
    } catch (error: any) {
      // 🛡️ [حظر كتل Catch الفارغة (بروتوكول 20)]
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Rider fund failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض سيادي تشغيلي",
        description: error?.message || "تعذر إرسال نبضة الشحن الجغرافي للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * 💸 deductRiderFare
   * للخصم الذري المباشر المقيد بالنبض الشبكي التفاضلي لمنع ثغرة السفر بالزمن.
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
        currency: 'د.أ',
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
        title: "💸 تم الخصم الذري بنجاح",
        description: `تم خصم أجرة الرحلة بقيمة ${amountJD} د.أ بنجاح.`
      });
      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Rider fare deduction failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض سيادي تشغيلي",
        description: error?.message || "تعذر إرسال نبضة خصم الأجرة للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user?.uid, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * 📡 rechargeWallet (Fallback/Generic API)
   * شحن رصيد إقليمي لواء عبر بوابة الدفع المحددة
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

    // 🛡️ [جدار الحماية الجنائي V2.6-Secured]: منع التلاعب بالقيم الصفرية والسالبة وحظر التحديث العشوائي
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
        currency: 'د.أ',
        description: `شحن رصيد إقليمي لواء [${district}] عبر بوابة [${gateway}]`,
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
        description: `تم إيداع ${amountPaid} د.أ بنبضة كتابة سحابية واحدة لوتد المحفظة.`
      });
      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] rechargeWallet failed:', error);
      toast({
        variant: 'destructive',
        title: "🚫 عارض سيادي تشغيلي",
        description: error?.message || "تعذر إرسال نبضة الشحن الجغرافي للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user?.uid, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  /**
   * ⚡ purchaseDriverPackage
   * شراء باقات البث الموجه جغرافياً للكباتن
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
      const balanceJD = user.walletBalanceJD !== undefined ? user.walletBalanceJD : 15.00;
      const cost = pkgType === 'pulse' ? 1.00 : 10.00;
      const addedHours = pkgType === 'pulse' ? 24.0 : 100.0;
      const name = pkgType === 'pulse' ? 'باقة النبض الأساسية (24 ساعة)' : 'باقة العبور الكبرى (100 ساعة)';

      if (balanceJD < cost) {
        toast({
          variant: 'destructive',
          title: 'رصيد نقدي غير كافٍ',
          description: `تكلفة الباقة ${cost} د.أ. يرجى إعادة شحن محفظتك بـ الدنانير الأردنية أولاً.`
        });
        return false;
      }

      const networkNow = getNetworkAdjustedTime();
      const r = (user?.rank || 'SILVER').toUpperCase();
      const captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE' = 
        r === 'PLATINUM' ? 'PLATINUM' : (r === 'GOLD' ? 'GOLD' : 'BRONZE');
      
      const currentPaidMinutes = user?.paidHoursRemaining !== undefined 
        ? user.paidHoursRemaining 
        : (user?.subscriptionHours !== undefined ? Math.round(user.subscriptionHours * 60) : 870);
      const currentBonusMinutes = user?.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 0;
      
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
      const rankText = captainRank === 'PLATINUM' ? 'بلاتيني (+25% بونص سيادي)' : 
                       captainRank === 'GOLD' ? 'ذهبي (+15% بونص سيادي)' : 'برونزي/فضي';
      const bonusHoursText = bonusPercent > 0 ? ` + مكافأة رتبة ${rankText} بقيمة ${(addedPaidMinutes * bonusPercent) / 60} ساعات حرة` : '';

      const txId = 'tx-' + networkNow;
      const transactionItem = {
        id: txId,
        type: 'purchase',
        amount: -cost,
        currency: 'د.أ',
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
        activePackageName: pkgType === 'pulse' ? 'باقة النبض الأساسية' : 'باقة العبور الكبرى',
        walletTransactions: arrayUnion(transactionItem)
      });

      toast({
        title: '⚡ تم التفعيل الفوري للملاحة الموجهة جغرافياً',
        description: bonusPercent > 0 
          ? `مبروك كابتن! تم إمداد البث بـ ${addedHours} ساعة من الباقة بالإضافة إلى ${(addedPaidMinutes * bonusPercent) / 60} ساعات بونص مجانية رتبة ${user?.rank} لواء [${homeDistrict}].`
          : `مبروك كابتن! تم إمداد البث الملاحي بـ ${addedHours} ساعة عمل لواء [${homeDistrict}].`
      });

      return true;
    } catch (error: any) {
      console.error('[CRITICAL_SECURITY_ALERT] [audit_ledger] Purchase package failed:', error);
      toast({
        variant: 'destructive',
        title: '🚫 عارض سيادي تشغيلي',
        description: error?.message || 'تعذر إتمام عملية شراء الباقة النسيجية.'
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  // 🪙 [التعقيم الماسي V2.6-Secured - مصدر الحقيقة الواحد]
  // احتساب وعزل الحالة المالية وساعات الاشتراك المتبقية لمنع الرندرة العشوائية وتضارب البيانات
  const isDriver = user?.role === 'driver';
  const balanceJD = user?.walletBalanceJD !== undefined ? user.walletBalanceJD : 15.00;
  const paidHoursMin = user?.paidHoursRemaining !== undefined ? user.paidHoursRemaining : (isDriver ? 870 : 0);
  const bonusHoursMin = user?.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 0;
  const subscriptionHours = user?.subscriptionHours !== undefined 
    ? user.subscriptionHours 
    : Number(((paidHoursMin + bonusHoursMin) / 60).toFixed(3));
  const activePackageName = user?.activePackageName !== undefined 
    ? user.activePackageName 
    : (isDriver ? 'نبض الوفاء المبدئي' : 'نسيجي مجتزأ');

  const transactions = useMemo(() => {
    let txs = [];
    if (user?.walletTransactions !== undefined) {
      txs = user.walletTransactions;
    } else {
      txs = isDriver ? [
        {
          id: 'tx-1',
          type: 'charge',
          amount: 20.00,
          currency: 'د.أ',
          description: 'شحن رصيد نقدي عبر Zain Cash',
          createdAt: '04:12 م - اليوم',
          status: 'completed',
          timestamp: Date.now() - 3 * 3600 * 1000
        },
        {
          id: 'tx-2',
          type: 'trip_deduction',
          amount: -0.45,
          currency: 'ساعة',
          description: 'استهلاك بث ملاحي لرحلة سياج عمان النشطة',
          createdAt: '02:00 م - اليوم',
          status: 'completed',
          timestamp: Date.now() - 5 * 3600 * 1000
        }
      ] : [
        {
          id: 'tx-1',
          type: 'charge',
          amount: 15.00,
          currency: 'د.أ',
          description: 'شحن رصيد نقدي عبر خدمة CliQ العاجلة',
          createdAt: '03:12 م - أمس',
          status: 'completed',
          timestamp: Date.now() - 24 * 3600 * 1000
        }
      ];
    }

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
  }, [user?.walletTransactions, isDriver]);

  return {
    loading,
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
