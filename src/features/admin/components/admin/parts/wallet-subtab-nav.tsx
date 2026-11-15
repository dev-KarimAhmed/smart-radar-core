'use client';

import React from 'react';
import { Receipt, Zap, Ticket, Layers, Clock, CreditCard, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WalletSubTab } from '@/features/admin/types/admin-wallet';

interface WalletSubtabNavProps {
  activeSubTab: WalletSubTab;
  onSelectSubTab: (tab: WalletSubTab) => void;
  pendingReceiptsCount: number;
  loading: boolean;
  onRefresh: () => void;
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletSubtabNav({
  activeSubTab,
  onSelectSubTab,
  pendingReceiptsCount,
  loading,
  onRefresh,
  t,
}: WalletSubtabNavProps) {
  const tabs: Array<{ id: WalletSubTab; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'receipts',
      label: t('subtabReceipts'),
      icon: <Receipt className="w-4 h-4" />,
      badge: pendingReceiptsCount > 0 ? pendingReceiptsCount : undefined,
    },
    { id: 'direct', label: t('subtabDirectTopup'), icon: <Zap className="w-4 h-4" /> },
    { id: 'vouchers', label: t('subtabVouchers'), icon: <Ticket className="w-4 h-4" /> },
    { id: 'ledger', label: t('subtabTransactions'), icon: <Layers className="w-4 h-4" /> },
    { id: 'rates', label: t('subtabHourlyRates'), icon: <Clock className="w-4 h-4" /> },
    { id: 'channels', label: 'أرقام التحويل', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'delegates', label: 'المناديب المالية', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#050A0F]/90 border border-white/10 p-2 rounded-2xl">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              onClick={() => onSelectSubTab(tab.id)}
              className={cn(
                "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                isActive
                  ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {tab.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-3 rounded-xl text-xs flex items-center gap-1.5"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-teal-400")} />
        <span>{t('refresh')}</span>
      </Button>
    </div>
  );
}

