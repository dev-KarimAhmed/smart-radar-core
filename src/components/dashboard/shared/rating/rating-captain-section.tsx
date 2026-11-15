import React from 'react';
import { Heart, CheckCircle2, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/shared/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { AdComplianceVerdict, CaptainRatings } from './rating-types';

interface RatingCaptainSectionProps {
  captain: CaptainRatings;
  onSetAdCompliance: (verdict: AdComplianceVerdict) => void;
  onSetCommunication: (stars: number) => void;
  saveFavorite: boolean;
  onToggleFavorite: () => void;
  isAlreadyFavorite: boolean;
  captainName?: string;
  tAuto: (key: string, values?: any) => string;
}

export function RatingCaptainSection({
  captain,
  onSetAdCompliance,
  onSetCommunication,
  saveFavorite,
  onToggleFavorite,
  isAlreadyFavorite,
  captainName,
  tAuto,
}: RatingCaptainSectionProps) {
  const isFavActive = saveFavorite || isAlreadyFavorite;

  return (
    <div className="space-y-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <Label className="text-sm font-black text-white flex items-center gap-2">
          <span>👤</span>
          <span>{tAuto('ratingModal_captainSectionTitle')}</span>
        </Label>
        <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
          {captainName || tAuto('ratingModal_defaultCaptainName')}
        </span>
      </div>

      {/* 1. Ad Compliance (مصداقية الإعلان) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">{tAuto('ratingModal_adComplianceLabel')}</span>
          <span className="text-[10px] text-slate-500">{tAuto('ratingModal_adComplianceHint')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetAdCompliance(captain.adCompliance === 'compliant' ? null : 'compliant')}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-bold transition-all active:scale-95",
              captain.adCompliance === 'compliant'
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{tAuto('ratingModal_adCompliant')}</span>
          </button>

          <button
            type="button"
            onClick={() => onSetAdCompliance(captain.adCompliance === 'non_compliant' ? null : 'non_compliant')}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-bold transition-all active:scale-95",
              captain.adCompliance === 'non_compliant'
                ? "border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>{tAuto('ratingModal_adNonCompliant')}</span>
          </button>
        </div>
      </div>

      {/* 2. Communication & Politeness (اللباقة وحسن التواصل) */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-300">{tAuto('ratingModal_communicationLabel')}</span>
        <StarRating
          rating={captain.communication}
          setRating={onSetCommunication}
          size="sm"
          color="gold"
        />
      </div>

      {/* 3. Unique Favorite (زر المفضلة - القلب الأخضر) */}
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={isAlreadyFavorite}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-start transition-all active:scale-[0.99]",
          isFavActive
            ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            : "border-white/10 bg-black/20 hover:border-emerald-500/30 hover:bg-emerald-500/5",
          isAlreadyFavorite && "cursor-default border-emerald-500/40 bg-emerald-500/10"
        )}
      >
        <div className="flex flex-col min-w-0">
          <span className={cn("text-xs font-black", isFavActive ? "text-emerald-300" : "text-white")}>
            {isAlreadyFavorite
              ? tAuto('ratingModal_favoriteAlreadySaved')
              : saveFavorite
                ? tAuto('ratingModal_favoriteWillSave')
                : tAuto('ratingModal_favoriteSave')}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            {isAlreadyFavorite
              ? tAuto('ratingModal_favoriteAlreadySavedDesc')
              : captainName
                ? tAuto('ratingModal_favoriteDescription', { name: captainName })
                : tAuto('ratingModal_favoriteFallbackDescription')}
          </span>
        </div>
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
          isFavActive ? "border-emerald-500 bg-emerald-500 text-[#0A0F1D]" : "border-white/10 bg-black/40 text-slate-400"
        )}>
          <Heart className={cn("w-4 h-4", isFavActive ? "fill-current text-white" : "")} />
        </div>
      </button>
    </div>
  );
}
