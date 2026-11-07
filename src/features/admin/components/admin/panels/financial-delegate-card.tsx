'use client';

import React from 'react';
import {
  MapPin,
  Building,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { FinancialDelegate, FinancialDelegatesCopy } from './financial-delegates-copy';
import { cn } from '@/lib/utils';

interface FinancialDelegateCardProps {
  delegate: FinancialDelegate;
  isArabic: boolean;
  t: FinancialDelegatesCopy;
  onToggle: (delegate: FinancialDelegate) => void;
  onEdit: (delegate: FinancialDelegate) => void;
  onDeleteRequest: (delegate: FinancialDelegate) => void;
}

export function FinancialDelegateCard({
  delegate,
  isArabic,
  t,
  onToggle,
  onEdit,
  onDeleteRequest,
}: FinancialDelegateCardProps) {
  const hasSpecificGeo = Boolean(delegate.governorateName || delegate.districtName);

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4",
        delegate.isActive
          ? "border-emerald-500/25 bg-gradient-to-b from-[#0A1120] to-[#050912] shadow-lg shadow-black/40"
          : "border-slate-800/80 bg-black/40 opacity-70"
      )}
    >
      <div>
        {/* Top Row: Delegate Name & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white truncate">{delegate.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {delegate.districtName ? (
                <Badge variant="outline" className="text-[11px] font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{t.districtLabel} {delegate.districtName}</span>
                </Badge>
              ) : null}
              {delegate.governorateName ? (
                <Badge variant="outline" className="text-[11px] font-bold border-cyan-500/30 bg-cyan-950/40 text-cyan-300 flex items-center gap-1">
                  <Building className="w-3 h-3 text-cyan-400" />
                  <span>{t.govLabel} {delegate.governorateName}</span>
                </Badge>
              ) : null}
              {!hasSpecificGeo ? (
                <Badge variant="outline" className="text-[11px] font-bold border-indigo-500/30 bg-indigo-950/40 text-indigo-300">
                  {t.generalDelegate}
                </Badge>
              ) : null}
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0",
              delegate.isActive
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            {delegate.isActive ? t.active : t.inactive}
          </Badge>
        </div>

        {/* Phone & Contact Test Buttons */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-bold">{t.phoneLabel}</span>
            <strong className="font-mono text-sm font-black text-amber-300 block truncate" dir="ltr">
              +{delegate.phone}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${delegate.phone}`}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition"
              title={t.directCall}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.call}</span>
            </a>
            <a
              href={`https://wa.me/${delegate.whatsapp || delegate.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-black text-white transition shadow-sm"
              title={t.whatsappChat}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t.whatsapp}</span>
            </a>
          </div>
        </div>

        {/* Notes / Availability */}
        {delegate.notes && (
          <p className="mt-2.5 text-xs text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            {delegate.notes}
          </p>
        )}
      </div>

      {/* Bottom Row: Actions */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={delegate.isActive}
            onCheckedChange={() => void onToggle(delegate)}
            aria-label={t.toggleAria}
          />
          <span className="text-xs text-slate-400">{delegate.isActive ? t.visibleToCaptain : t.hiddenFromCaptain}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(delegate)}
            className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Edit2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
            <span>{t.edit}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteRequest(delegate)}
            className="h-8 px-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
          >
            <Trash2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
            <span>{t.delete}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
