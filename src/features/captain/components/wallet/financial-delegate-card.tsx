'use client';

import React from 'react';
import { MessageCircle, Phone, UserCheck } from 'lucide-react';
import type { FinancialDelegate } from '@/features/admin/types/wallet-directory';

interface FinancialDelegateCardProps {
  delegate: FinancialDelegate;
  t: (key: string) => string;
}

export function FinancialDelegateCard({ delegate, t }: FinancialDelegateCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#070c18] via-slate-900/70 to-[#070c18] p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">{t('delegateTitle')}</h3>
              {delegate.areaBadge && (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {delegate.areaBadge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              <span className="text-slate-200 font-bold">{delegate.name}</span>
              {delegate.hint ? ` · ${delegate.hint}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {delegate.phone && (
            <a
              href={`tel:${delegate.phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t('delegateCall')}</span>
            </a>
          )}
          {delegate.whatsapp && (
            <a
              href={`https://wa.me/${delegate.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-900/30 transition hover:brightness-105 active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{t('delegateWhatsapp')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
