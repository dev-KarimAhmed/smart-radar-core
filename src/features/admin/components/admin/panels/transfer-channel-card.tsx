'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  Check,
  Copy,
  Building,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import type { TransferChannelsCopy } from './transfer-channels-copy';
import { cn } from '@/lib/utils';

interface TransferChannelCardProps {
  channel: PaymentTransferChannel;
  isArabic: boolean;
  t: TransferChannelsCopy;
  isCopied: boolean;
  onCopy: (id: string, text: string) => void;
  onToggleActive: (channel: PaymentTransferChannel) => void;
  onEdit: (channel: PaymentTransferChannel) => void;
  onDeleteRequest: (channel: PaymentTransferChannel) => void;
}

export function TransferChannelCard({
  channel,
  isArabic,
  t,
  isCopied,
  onCopy,
  onToggleActive,
  onEdit,
  onDeleteRequest,
}: TransferChannelCardProps) {
  const displayName = isArabic ? channel.nameAr : (channel.nameEn || channel.nameAr);
  const displayDesc = isArabic ? channel.descriptionAr : (channel.descriptionEn || channel.descriptionAr);

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-200",
        channel.isActive
          ? "border-emerald-500/30 bg-[#0B1120]/80 shadow-lg shadow-emerald-950/20"
          : "border-slate-800 bg-slate-950/40 opacity-70"
      )}
    >
      <div className="p-5 space-y-4">
        {/* Top: Name & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">{displayName}</h3>
              {channel.nameEn && isArabic && (
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                  {channel.nameEn}
                </span>
              )}
            </div>
            {channel.accountHolder && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.beneficiary} <strong className="text-slate-300">{channel.accountHolder}</strong></span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                channel.isActive
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-950 text-slate-500"
              )}
            >
              {channel.isActive ? t.active : t.inactive}
            </Badge>

            {channel.countryId === 1 && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-300">
                {t.jordan}
              </Badge>
            )}
            {channel.countryId === 2 && (
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                {t.egypt}
              </Badge>
            )}
            {!channel.countryId && (
              <Badge variant="outline" className="text-[10px] border-purple-500/30 bg-purple-500/10 text-purple-300">
                {t.allCountries}
              </Badge>
            )}
          </div>
        </div>

        {/* Middle: Account Number Box with Click-to-Copy */}
        <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-bold">{t.accountNumberLabel}</span>
            <strong className="text-base sm:text-lg font-mono font-black text-emerald-400 tracking-wider truncate block select-all">
              {channel.accountNumber}
            </strong>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onCopy(channel.id, channel.accountNumber)}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0",
              isCopied
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            )}
          >
            {isCopied ? (
              <>
                <Check className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1", "text-emerald-400")} />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                <span>{t.copy}</span>
              </>
            )}
          </Button>
        </div>

        {/* Description / Instructions */}
        {displayDesc && (
          <p className="text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 leading-relaxed">
            {displayDesc}
          </p>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Switch
              checked={channel.isActive}
              onCheckedChange={() => void onToggleActive(channel)}
              aria-label={t.toggleAria}
            />
            <span className="text-xs text-slate-400">{channel.isActive ? t.visibleToCaptain : t.hiddenFromCaptain}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(channel)}
              className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <Edit2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
              <span>{t.edit}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRequest(channel)}
              className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg"
            >
              <Trash2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
              <span>{t.delete}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
