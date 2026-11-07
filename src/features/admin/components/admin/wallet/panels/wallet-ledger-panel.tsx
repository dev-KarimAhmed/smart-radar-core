'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LedgerItem } from '../wallet-types';

interface WalletLedgerPanelProps {
  ledger: LedgerItem[];
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function WalletLedgerPanel({ ledger, isArabic, t }: WalletLedgerPanelProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
      <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
            <th className="py-3.5 px-4 font-bold">{t('colUser')}</th>
            <th className="py-3.5 px-4 font-bold">{t('colTransactionType')}</th>
            <th className="py-3.5 px-4 font-bold">{t('colLedgerAmount')}</th>
            <th className="py-3.5 px-4 font-bold">{t('colLedgerStatus')}</th>
            <th className="py-3.5 px-4 font-bold">{t('colLedgerDescription')}</th>
            <th className="py-3.5 px-4 font-bold">{t('colLedgerTime')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {ledger.map((item) => (
            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-4">
                <p className="font-bold text-white">{item.userName}</p>
                <p className="font-mono text-[10px] text-slate-400" dir="ltr">{item.userPhone || item.userSerial}</p>
              </td>
              <td className="py-3 px-4 font-mono text-[11px] text-slate-300 capitalize">
                {item.type}
              </td>
              <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm">
                {item.amount > 0 ? `+${item.amount.toFixed(2)}` : item.amount.toFixed(2)} {item.currency}
              </td>
              <td className="py-3 px-4">
                <Badge className={cn(
                  "text-[10px] font-bold",
                  item.status === 'COMPLETED' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-white/5 text-slate-400"
                )}>
                  {item.status}
                </Badge>
              </td>
              <td className="py-3 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                {item.description}
              </td>
              <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                {new Date(item.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
