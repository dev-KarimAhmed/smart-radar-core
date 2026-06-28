'use client';

import { useState, useCallback, useRef } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import type { User } from '@/core/types';

/**
 * 🛡️ [RAD-MAP-074-GEO-REFILL] useSovereignWallet Hook
 * Handles financial and refill operations on the local edge to cloud.
 * Optimized for a single-write (1 Write Only) to reduce database workload.
 */
export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const { suspendUserDocListener, resumeUserDocListener } = useAuth();

  // 🛡️ [النبض الشبكي التفاضلي V2.6-Secured - مرشح التوقيت المالي المالي]
  // استرجاع توقيت السيرفر المعاير محلياً لمنع التلاعب بساعة الهاتف وتمرير المعاملات بأوقات زائفة
  const getNetworkAdjustedTime = useCallback(() => {
    if (typeof window !== 'undefined') {
      const deltaStr = sessionStorage.getItem('sovereign_time_delta');
      const delta = deltaStr ? parseInt(deltaStr, 10) : 0;
      return Date.now() + delta;
    }
    return Date.now();
  }, []);

  const rechargeWallet = useCallback(async (amountPaid: number, district: string, gateway: string) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على قائد أو مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);

    // 🛡️ [حارس قفل الكتابة التفاعلي المانع لتراجع الحالة V2.6-Secured]
    // نغلق قناة استقبال لقطات مستند المستخدم لمنع الفرز التنازلي الارتدادي للمحفظة أثناء الشحن النشط
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
      toast({
        variant: 'destructive',
        title: "🚫 عارض سيادي تشغيلي",
        description: error?.message || "تعذر إرسال نبضة الشحن الجغرافي للسيرفر الموحد."
      });
      return false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      // فك قفل تجميد اللقطات بعد مهلة كافية لانتشار الكتابة واستقرار الخادم
      setTimeout(() => {
        resumeUserDocListener();
      }, 3000);
    }
  }, [user?.uid, toast, getNetworkAdjustedTime, suspendUserDocListener, resumeUserDocListener]);

  return {
    loading,
    rechargeWallet
  };
}
