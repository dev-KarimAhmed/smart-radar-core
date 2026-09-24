import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, MapPin, Phone, ShieldCheck, Star, User } from 'lucide-react';

interface ProfileHeaderCardProps {
  isArabic: boolean;
  t: any;
  toggleLanguage: () => void;
  displayName: string;
  displayRole: string;
  serialId?: string | null;
  rating: number;
  ratingCount: number;
  locationLabel: string;
  displayPhone: string;
  currency?: string | null;
}

export function ProfileHeaderCard({
  isArabic,
  t,
  toggleLanguage,
  displayName,
  displayRole,
  serialId,
  rating,
  ratingCount,
  locationLabel,
  displayPhone,
  currency,
}: ProfileHeaderCardProps) {
  const formattedScore = rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Top glowing ambient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Top utility bar: Badges + Language Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className="border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm"
            >
              {displayRole}
            </Badge>

            {serialId ? (
              <Badge 
                variant="outline" 
                className="border-white/10 bg-black/40 font-mono text-[10px] text-slate-300 px-2.5 py-0.5 rounded-lg"
              >
                🧬 {t('accountNumber')}: {String(serialId)}
              </Badge>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={toggleLanguage}
            className="h-8 gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-slate-300 hover:border-[#14B8A6]/30 hover:bg-[#14B8A6]/10 hover:text-[#14F5D5] transition-all cursor-pointer"
          >
            <Languages className="h-3.5 w-3.5 text-[#14F5D5]" />
            <span>{isArabic ? 'English' : 'العربية'}</span>
          </Button>
        </div>

        {/* Hero User Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/40 bg-gradient-to-br from-[#14B8A6]/20 to-[#14F5D5]/5 text-2xl font-black text-[#14F5D5] shadow-lg shadow-[#14B8A6]/10">
              {displayName ? displayName.substring(0, 1).toUpperCase() : <User className="h-7 w-7" />}
              <span className="absolute -bottom-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {displayPhone || t('phoneUnavailable')}
              </p>
            </div>
          </div>

          {/* Rating Badge — Compact, Modern & Luxury */}
          {ratingCount > 0 ? (
            <div className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-3.5 py-2 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-400">
                <Star className="h-4 w-4 fill-amber-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-mono text-sm font-black text-white leading-none" dir="ltr">
                  <span>{formattedScore}</span>
                  <span className="text-slate-400 font-normal">/</span>
                  <span>5</span>
                </div>
                <span className="text-[10px] font-bold text-amber-300/80 mt-1 leading-none">
                  {isArabic ? `${ratingCount} تقييم` : `${ratingCount} ratings`}
                </span>
              </div>
            </div>
          ) : (
            <div className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3.5 py-2 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/15 text-[#14F5D5]">
                <Star className="h-4 w-4 text-[#14F5D5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#14F5D5] leading-none">
                  {isArabic ? 'راكب جديد' : 'New Rider'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-1 leading-none">
                  {isArabic ? 'بدون تقييم' : 'No ratings'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Location & Account Meta Grid */}
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 text-[#14F5D5]">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-slate-400">
                {t('location')}
              </span>
              <strong className="block text-xs font-bold text-white truncate mt-0.5">
                {locationLabel}
              </strong>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 text-[#14F5D5]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-slate-400">
                {t('accountData')}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <strong className="text-xs font-bold text-white font-mono">
                  {displayPhone || t('phoneUnavailable')}
                </strong>
                {currency ? (
                  <span className="rounded-md border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#14F5D5]">
                    {currency}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
