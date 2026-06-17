'use client';

import { useState, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { User } from '@/core/types';

/**
 * 🛡️ [RAD-MAP-074-GEO-REFILL] useSovereignWallet Hook
 * Handles financial and refill operations on the local edge to cloud.
 * Optimized for a single-write (1 Write Only) to reduce database workload.
 */
export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const rechargeWallet = useCallback(async (amountPaid: number, district: string, gateway: string) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'فشل المعاملة',
        description: 'لم يتم العثور على قائد أو مستخدم نشط للتحقق من هويته.'
      });
      return false;
    }

    setLoading(true);
    try {
      const txId = 'tx-' + Date.now();
      const transactionItem = {
        id: txId,
        type: 'charge',
        amount: amountPaid,
        currency: 'د.أ',
        description: `شحن رصيد إقليمي لواء [${district}] عبر بوابة [${gateway}]`,
        createdAt: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
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
    }
  }, [user?.uid, toast]);

  return {
    loading,
    rechargeWallet
  };
}
