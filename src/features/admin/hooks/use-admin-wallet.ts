'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type {
  WalletOverview,
  ReceiptItem,
  VoucherItem,
  LedgerItem,
  CaptainOption,
  WalletSubTab,
} from '@/features/admin/types/admin-wallet';
import {
  fetchWalletOverview,
  fetchWalletReceipts,
  fetchWalletVouchers,
  fetchWalletLedger,
  fetchCaptainsForTopup,
  toggleSelfTopupAction,
} from '@/features/admin/services/admin-wallet-service';
import { useAdminWalletModals } from './use-admin-wallet-modals';
import { useAdminWalletForms } from './use-admin-wallet-forms';

export function useAdminWallet() {
  const t = useTranslations('adminWallet');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<WalletSubTab>('receipts');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [overview, setOverview] = useState<WalletOverview | null>(null);

  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [captainsList, setCaptainsList] = useState<CaptainOption[]>([]);
  const [loadingCaptains, setLoadingCaptains] = useState(false);

  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingSelfTopup, setTogglingSelfTopup] = useState(false);

  useEffect(() => {
    const handleSubtab = (e: any) => {
      if (e.detail?.subtab) setActiveSubTab(e.detail.subtab);
    };
    window.addEventListener('admin-wallet-subtab', handleSubtab);
    return () => window.removeEventListener('admin-wallet-subtab', handleSubtab);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const data = await fetchWalletOverview();
      setOverview(data);
    } catch (err) {
      console.error('[WalletTab] loadOverview error:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadSubTabData = useCallback(async (tab: WalletSubTab) => {
    if (tab === 'rates' || tab === 'channels' || tab === 'delegates') return;
    try {
      setLoadingData(true);
      if (tab === 'receipts') {
        const data = await fetchWalletReceipts();
        setReceipts(data);
      } else if (tab === 'vouchers') {
        const data = await fetchWalletVouchers();
        setVouchers(data);
      } else if (tab === 'ledger') {
        const data = await fetchWalletLedger();
        setLedger(data);
      } else if (tab === 'direct') {
        setLoadingCaptains(true);
        const data = await fetchCaptainsForTopup();
        setCaptainsList(data);
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

  const modals = useAdminWalletModals({
    isArabic,
    onReceiptActionSuccess: () => {
      void loadOverview();
      void loadSubTabData('receipts');
    },
  });

  const forms = useAdminWalletForms({
    isArabic,
    onRefreshOverview: () => void loadOverview(),
    onRefreshSubTab: (tab) => void loadSubTabData(tab),
  });

  const handleToggleSelfTopup = async () => {
    if (!overview) return;
    setTogglingSelfTopup(true);
    const targetState = !overview.selfTopupEnabled;
    try {
      const msg = await toggleSelfTopupAction(targetState);
      setOverview((prev) => (prev ? { ...prev, selfTopupEnabled: targetState } : null));
      toast({ title: isArabic ? 'تم تحديث الإعدادات' : 'Settings Updated', description: msg });
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setTogglingSelfTopup(false);
    }
  };

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

  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers;
    const q = searchQuery.toLowerCase().trim();
    return vouchers.filter((v) =>
      v.code.toLowerCase().includes(q) ||
      (v.redeemedBy && (v.redeemedBy.name.toLowerCase().includes(q) || v.redeemedBy.phone.includes(q)))
    );
  }, [vouchers, searchQuery]);

  return {
    t,
    isArabic,
    direction,
    activeSubTab,
    setActiveSubTab,
    loadingOverview,
    loadingData,
    overview,
    receipts,
    vouchers,
    ledger,
    captainsList,
    loadingCaptains,
    receiptStatusFilter,
    setReceiptStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredReceipts,
    filteredVouchers,
    togglingSelfTopup,
    loadOverview,
    loadSubTabData,
    handleToggleSelfTopup,
    ...forms,
    ...modals,
  };
}
