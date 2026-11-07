'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  WalletOverview,
  ReceiptItem,
  VoucherItem,
  LedgerItem,
  CaptainOption,
  WalletSubTab,
} from './wallet-types';
import {
  approveReceiptAction,
  rejectReceiptAction,
  directTopupAction,
  generateVouchersAction,
  toggleSelfTopupAction,
  sendReceiptMessageAction,
} from './wallet-api-actions';

export function useWalletManagement() {
  const t = useTranslations('adminWallet');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<WalletSubTab>('receipts');

  useEffect(() => {
    const handleSubtab = (e: any) => {
      if (e.detail?.subtab) {
        setActiveSubTab(e.detail.subtab);
      }
    };
    window.addEventListener('admin-wallet-subtab', handleSubtab);
    return () => window.removeEventListener('admin-wallet-subtab', handleSubtab);
  }, []);

  // Loading & Data States
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);

  // Search & Filter States
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ReceiptItem | null>(null);
  const [receiptToApprove, setReceiptToApprove] = useState<ReceiptItem | null>(null);
  const [receiptToReject, setReceiptToReject] = useState<ReceiptItem | null>(null);
  const [approveCreditType, setApproveCreditType] = useState<'CASH' | 'MINUTES'>('CASH');
  const [approveCustomMinutes, setApproveCustomMinutes] = useState<number>(60);
  const [approveAdminNote, setApproveAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingModalAction, setSubmittingModalAction] = useState(false);

  // Receipt Message Modal State
  const [messageReceiptItem, setMessageReceiptItem] = useState<ReceiptItem | null>(null);
  const [receiptMessageTitle, setReceiptMessageTitle] = useState(
    isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt'
  );
  const [receiptMessageBody, setReceiptMessageBody] = useState('');
  const [receiptMessageType, setReceiptMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingReceiptMessage, setSubmittingReceiptMessage] = useState(false);

  // Direct Topup State
  const [captainsList, setCaptainsList] = useState<CaptainOption[]>([]);
  const [loadingCaptains, setLoadingCaptains] = useState(false);
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainOption | null>(null);
  const [directCashAmount, setDirectCashAmount] = useState<string>('10');
  const [directMinutes, setDirectMinutes] = useState<string>('0');
  const [directExtendDays, setDirectExtendDays] = useState<number>(30);
  const [directNote, setDirectNote] = useState('');
  const [submittingDirectTopup, setSubmittingDirectTopup] = useState(false);

  // Voucher Generator State
  const [voucherMinutes, setVoucherMinutes] = useState<number>(60);
  const [voucherCount, setVoucherCount] = useState<number>(5);
  const [generatingVouchers, setGeneratingVouchers] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Self Topup toggle
  const [togglingSelfTopup, setTogglingSelfTopup] = useState(false);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await adminFetch('/api/admin/wallet?view=overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('[WalletTab] loadOverview error:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // Load Subtab Data
  const loadSubTabData = useCallback(async (tab: WalletSubTab) => {
    if (tab === 'rates' || tab === 'channels' || tab === 'delegates') return;
    try {
      setLoadingData(true);

      if (tab === 'receipts') {
        const res = await adminFetch('/api/admin/wallet?view=receipts');
        const data = await res.json();
        if (data.success) setReceipts(data.receipts || []);
      } else if (tab === 'vouchers') {
        const res = await adminFetch('/api/admin/wallet?view=vouchers');
        const data = await res.json();
        if (data.success) setVouchers(data.vouchers || []);
      } else if (tab === 'ledger') {
        const res = await adminFetch('/api/admin/wallet?view=ledger');
        const data = await res.json();
        if (data.success) setLedger(data.ledger || []);
      } else if (tab === 'direct') {
        setLoadingCaptains(true);
        const res = await adminFetch('/api/admin/users?role=CAPTAIN');
        const data = await res.json();
        if (data.success) setCaptainsList(data.users || []);
        setLoadingCaptains(false);
      }
    } catch (err) {
      console.error('[WalletTab] loadSubTabData error:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadSubTabData(activeSubTab);
  }, [loadOverview, loadSubTabData, activeSubTab]);

  // Handle Approve Receipt
  const handleApproveReceipt = async () => {
    if (!receiptToApprove) return;
    setSubmittingModalAction(true);
    try {
      const data = await approveReceiptAction({
        transactionId: receiptToApprove.id,
        creditType: approveCreditType,
        minutesToGrant: approveCustomMinutes,
        adminNote: approveAdminNote,
      });

      toast({
        title: isArabic ? 'تم اعتماد الإيصال بنجاح' : 'Receipt Approved Successfully',
        description: data.message,
      });

      setReceiptToApprove(null);
      setApproveAdminNote('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] approve error:', err);
      toast({
        title: isArabic ? 'خطأ في الاعتماد' : 'Approval Error',
        description: err.message || (isArabic ? 'حدث خطأ أثناء اعتماد الإيصال' : 'An error occurred while approving receipt'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  // Handle Reject Receipt
  const handleRejectReceipt = async () => {
    if (!receiptToReject) return;
    setSubmittingModalAction(true);
    try {
      const data = await rejectReceiptAction({
        transactionId: receiptToReject.id,
        reason: rejectReason || (isArabic ? 'الإيصال غير واضح أو لم يتم استلام الحوالة' : 'Receipt is unclear or transfer was not received'),
      });

      toast({
        title: isArabic ? 'تم رفض الإيصال' : 'Receipt Rejected',
        description: data.message,
      });

      setReceiptToReject(null);
      setRejectReason('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] reject error:', err);
      toast({
        title: isArabic ? 'خطأ أثناء الرفض' : 'Rejection Error',
        description: err.message || (isArabic ? 'تعذر رفض الإيصال' : 'Could not reject receipt'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  // Handle Direct Topup Submit
  const handleDirectTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptain) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic ? 'يرجى اختيار الكابتن المعلن المراد شحن حسابه' : 'Please select a captain to recharge',
      });
      return;
    }

    const cashNum = Number(directCashAmount) || 0;
    const minutesNum = Number(directMinutes) || 0;

    if (cashNum <= 0 && minutesNum <= 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'بيانات غير كافية' : 'Insufficient Data',
        description: isArabic ? 'يرجى إدخال مبلغ نقدي أو عدد دقائق للشحن' : 'Please enter a cash amount or minutes to recharge',
      });
      return;
    }

    setSubmittingDirectTopup(true);
    try {
      const data = await directTopupAction({
        captainId: selectedCaptain.id,
        cashAmount: cashNum,
        minutes: minutesNum,
        extendDays: directExtendDays,
        note: directNote,
      });

      toast({
        title: isArabic ? 'تم الشحن بنجاح' : 'Recharge Completed Successfully',
        description: data.message,
      });

      setSelectedCaptain(null);
      setDirectCashAmount('10');
      setDirectMinutes('0');
      setDirectNote('');
      void loadOverview();
      void loadSubTabData('direct');
    } catch (err: any) {
      console.error('[WalletTab] directTopup error:', err);
      toast({
        title: isArabic ? 'خطأ أثناء الشحن' : 'Top-up Error',
        description: err.message || (isArabic ? 'تعذر تنفيذ عملية الشحن المباشر' : 'Could not execute direct top-up'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingDirectTopup(false);
    }
  };

  // Handle Generate Vouchers
  const handleGenerateVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingVouchers(true);
    try {
      const data = await generateVouchersAction({
        count: voucherCount,
        minutesValue: voucherMinutes,
      });

      toast({
        title: isArabic ? 'تم توليد القسائم بنجاح' : 'Vouchers Generated Successfully',
        description: data.message,
      });

      void loadOverview();
      void loadSubTabData('vouchers');
    } catch (err: any) {
      console.error('[WalletTab] generate vouchers error:', err);
      toast({
        title: isArabic ? 'خطأ في التوليد' : 'Generation Error',
        description: err.message || (isArabic ? 'تعذر توليد القسائم' : 'Could not generate vouchers'),
        variant: 'destructive',
      });
    } finally {
      setGeneratingVouchers(false);
    }
  };

  // Handle Toggle Self Topup Flag
  const handleToggleSelfTopup = async () => {
    if (!overview) return;
    setTogglingSelfTopup(true);
    const targetState = !overview.selfTopupEnabled;
    try {
      const data = await toggleSelfTopupAction(targetState);

      setOverview((prev) => (prev ? { ...prev, selfTopupEnabled: targetState } : null));
      toast({
        title: isArabic ? 'تم تحديث الإعدادات' : 'Settings Updated',
        description: data.message,
      });
    } catch (err: any) {
      console.error('[WalletTab] toggle flag error:', err);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: err.message || (isArabic ? 'تعذر تبديل حالة الشحن الذاتي' : 'Could not toggle self top-up state'),
        variant: 'destructive',
      });
    } finally {
      setTogglingSelfTopup(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: isArabic ? 'تم نسخ الكود' : 'Code Copied',
      description: code,
    });
  };

  // Handle Send Receipt Message
  const handleSendReceiptMessage = async () => {
    if (!messageReceiptItem) return;
    setSubmittingReceiptMessage(true);
    try {
      const data = await sendReceiptMessageAction({
        captainId: messageReceiptItem.profileId,
        title: receiptMessageTitle.trim(),
        message: receiptMessageBody.trim(),
        type: receiptMessageType,
      });

      toast({
        title: isArabic ? 'تم إرسال الرسالة بنجاح' : 'Message Sent Successfully',
        description: data.message || (isArabic ? 'تم إرسال الإشعار اللحظي إلى الكابتن المعلن.' : 'Instant notification sent to captain.'),
      });

      setMessageReceiptItem(null);
      setReceiptMessageBody('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ أثناء الإرسال' : 'Error Sending',
        description: err.message || (isArabic ? 'تعذر إرسال الإشعار للكابتن المعلن' : 'Could not send notification to captain'),
      });
    } finally {
      setSubmittingReceiptMessage(false);
    }
  };

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (receiptStatusFilter !== 'ALL' && r.status !== receiptStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.captainName.toLowerCase().includes(q) ||
          r.captainPhone.includes(q) ||
          r.captainSerial.toLowerCase().includes(q) ||
          r.channel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [receipts, receiptStatusFilter, searchQuery]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers;
    const q = searchQuery.toLowerCase().trim();
    return vouchers.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        (v.redeemedBy &&
          (v.redeemedBy.name.toLowerCase().includes(q) || v.redeemedBy.phone.includes(q)))
    );
  }, [vouchers, searchQuery]);

  return {
    t,
    direction,
    isArabic,
    activeSubTab,
    setActiveSubTab,
    loadingOverview,
    loadingData,
    overview,
    receipts,
    vouchers,
    ledger,
    receiptStatusFilter,
    setReceiptStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedReceiptForPreview,
    setSelectedReceiptForPreview,
    receiptToApprove,
    setReceiptToApprove,
    receiptToReject,
    setReceiptToReject,
    approveCreditType,
    setApproveCreditType,
    approveCustomMinutes,
    setApproveCustomMinutes,
    approveAdminNote,
    setApproveAdminNote,
    rejectReason,
    setRejectReason,
    submittingModalAction,
    messageReceiptItem,
    setMessageReceiptItem,
    receiptMessageTitle,
    setReceiptMessageTitle,
    receiptMessageBody,
    setReceiptMessageBody,
    receiptMessageType,
    setReceiptMessageType,
    submittingReceiptMessage,
    captainsList,
    loadingCaptains,
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
    voucherMinutes,
    setVoucherMinutes,
    voucherCount,
    setVoucherCount,
    generatingVouchers,
    copiedCode,
    togglingSelfTopup,
    loadOverview,
    loadSubTabData,
    handleApproveReceipt,
    handleRejectReceipt,
    handleDirectTopupSubmit,
    handleGenerateVouchers,
    handleToggleSelfTopup,
    handleCopyCode,
    handleSendReceiptMessage,
    filteredReceipts,
    filteredVouchers,
  };
}
