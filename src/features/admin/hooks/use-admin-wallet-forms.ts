'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CaptainOption } from '@/features/admin/types/admin-wallet';
import {
  directTopupAction,
  generateVouchersAction,
} from '@/features/admin/services/admin-wallet-service';

interface UseAdminWalletFormsProps {
  isArabic: boolean;
  onRefreshOverview: () => void;
  onRefreshSubTab: (tab: 'direct' | 'vouchers') => void;
}

export function useAdminWalletForms({ isArabic, onRefreshOverview, onRefreshSubTab }: UseAdminWalletFormsProps) {
  const { toast } = useToast();

  // Direct Topup
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainOption | null>(null);
  const [directCashAmount, setDirectCashAmount] = useState<string>('10');
  const [directMinutes, setDirectMinutes] = useState<string>('0');
  const [directExtendDays, setDirectExtendDays] = useState<number>(30);
  const [directNote, setDirectNote] = useState('');
  const [submittingDirectTopup, setSubmittingDirectTopup] = useState(false);

  // Vouchers
  const [voucherMinutes, setVoucherMinutes] = useState<number>(60);
  const [voucherCount, setVoucherCount] = useState<number>(5);
  const [generatingVouchers, setGeneratingVouchers] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleDirectTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptain) {
      toast({ variant: 'destructive', title: isArabic ? 'تنبيه' : 'Notice', description: isArabic ? 'يرجى اختيار الكابتن' : 'Please select a captain' });
      return;
    }
    const cashNum = Number(directCashAmount) || 0;
    const minutesNum = Number(directMinutes) || 0;
    if (cashNum <= 0 && minutesNum <= 0) {
      toast({ variant: 'destructive', title: isArabic ? 'بيانات غير كافية' : 'Insufficient Data', description: isArabic ? 'يرجى إدخال مبلغ أو دقائق' : 'Enter amount or minutes' });
      return;
    }
    setSubmittingDirectTopup(true);
    try {
      const msg = await directTopupAction({
        captainId: selectedCaptain.id,
        cashAmount: cashNum,
        minutes: minutesNum,
        extendDays: directExtendDays,
        note: directNote,
      });
      toast({ title: isArabic ? 'تم الشحن بنجاح' : 'Recharge Completed Successfully', description: msg });
      setSelectedCaptain(null);
      setDirectCashAmount('10');
      setDirectMinutes('0');
      setDirectNote('');
      onRefreshOverview();
      onRefreshSubTab('direct');
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ أثناء الشحن' : 'Top-up Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingDirectTopup(false);
    }
  };

  const handleGenerateVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingVouchers(true);
    try {
      const msg = await generateVouchersAction({ count: voucherCount, minutesValue: voucherMinutes });
      toast({ title: isArabic ? 'تم توليد القسائم بنجاح' : 'Vouchers Generated Successfully', description: msg });
      onRefreshOverview();
      onRefreshSubTab('vouchers');
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ في التوليد' : 'Generation Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingVouchers(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: isArabic ? 'تم نسخ الكود' : 'Code Copied', description: code });
  };

  return {
    selectedCaptain,
    setSelectedCaptain,
    directCashAmount,
    setDirectCashAmount,
    directMinutes,
    setDirectMinutes,
    directExtendDays,
    setDirectExtendDays,
    directNote,
    setDirectNote,
    submittingDirectTopup,
    handleDirectTopupSubmit,
    voucherMinutes,
    setVoucherMinutes,
    voucherCount,
    setVoucherCount,
    generatingVouchers,
    handleGenerateVouchers,
    copiedCode,
    handleCopyCode,
  };
}

