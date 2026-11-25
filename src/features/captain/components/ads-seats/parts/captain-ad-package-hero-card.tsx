import React from 'react';
import { CheckCircle2, Clock, Sparkles, Zap } from 'lucide-react';

interface CaptainAdPackageHeroCardProps {
  isArabic: boolean;
  currency: string;
  formattedRate: string;
  isAlreadyActive: boolean;
  isExpired: boolean;
  hasActivatedBefore: boolean;
  remainingDays: number;
}

/**
 * Clean Hostinger-style pricing hero card for the Captain Launch Package modal.
 * Adapts clearly across NEW, ACTIVE, and EXPIRED states without redundant badges or harsh strikethrough lines.
 */
export function CaptainAdPackageHeroCard({
  isArabic,
  currency,
  formattedRate,
  isAlreadyActive,
  isExpired,
  hasActivatedBefore,
  remainingDays,
}: CaptainAdPackageHeroCardProps) {
  const isPostTrial = !isAlreadyActive && (isExpired || hasActivatedBefore);
  const progressPercent = Math.min(100, Math.max(4, Math.round((remainingDays / 30) * 100)));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#00ffcc]/30 bg-gradient-to-br from-[#0e1c33] via-[#081222] to-[#050b14] p-4 sm:p-5 shadow-[0_0_30px_rgba(0,255,204,0.08)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#00ffcc]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-emerald-500/12 blur-3xl" />

      {/* Top Status Row */}
      <div className="relative flex items-center justify-between gap-2 mb-4">
        {isAlreadyActive ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{isArabic ? 'الباقة مفعلة حالياً' : 'Package Active'}</span>
          </div>
        ) : isPostTrial ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span>{isArabic ? 'انتهت الفترة المجانية (30 يوم)' : 'Free Period Ended'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
            <Zap className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span>{isArabic ? 'عرض التدشين الحصري' : 'Exclusive Launch Offer'}</span>
          </div>
        )}

        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-400 to-[#00ffcc] px-3 py-1 text-[11px] font-black text-slate-950 shadow-sm shrink-0">
          {isAlreadyActive
            ? isArabic
              ? `متبقي ${remainingDays} يوم`
              : `${remainingDays}d Left`
            : isPostTrial
              ? isArabic
                ? 'التعريفة الاعتيادية'
                : 'Standard Rate'
              : isArabic
                ? 'وفر 100%'
                : 'SAVE 100%'}
        </span>
      </div>

      {/* Main Price Block */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 mb-3">
        {isPostTrial ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                {formattedRate}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#00ffcc]">{currency}</span>
              <span className="text-xs text-slate-300 font-sans">
                / {isArabic ? 'ساعة تشغيل' : 'operating hr'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {isArabic ? 'تُخصم أثناء الرحلات فقط' : 'Charged on trips only'}
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
                  0.00
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#00ffcc]">{currency}</span>
                <span className="text-xs sm:text-sm text-slate-300 font-sans">
                  / {isArabic ? 'ساعة تشغيل' : 'operating hr'}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-teal-400/35 bg-teal-500/15 px-2.5 py-1 text-[11px] font-black text-[#00ffcc]">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>{isArabic ? 'أول شهر مجاني' : 'First Month Free'}</span>
              </div>
            </div>

            {/* Clean comparison / post-trial note without harsh red line over Arabic text */}
            <div className="mt-2.5 pt-2.5 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
              <span className="text-slate-400">
                {isAlreadyActive
                  ? isArabic
                    ? 'السعر الاعتيادي بعد انتهاء الفترة المجانية:'
                    : 'Standard rate after free trial:'
                  : isArabic
                    ? 'السعر الاعتيادي بعد الشهر المجاني:'
                    : 'Regular rate after free month:'}
              </span>
              <div className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 font-bold text-slate-200">
                <span
                  dir="ltr"
                  className={
                    isAlreadyActive
                      ? 'font-mono text-slate-200'
                      : 'font-mono text-slate-400 line-through decoration-slate-400/75 decoration-[1.5px]'
                  }
                >
                  {formattedRate} {currency}
                </span>
                <span className="text-slate-400 text-[11px]">/ {isArabic ? 'ساعة' : 'hr'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom State-Specific Summary */}
      {isAlreadyActive ? (
        <div className="relative space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-sans text-slate-300">
            <span>{isArabic ? 'صلاحية الشهر المجاني (30 يوم)' : 'Free Month Validity (30 Days)'}</span>
            <span className="font-mono font-bold text-emerald-300">{remainingDays} / 30</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#00ffcc] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : isPostTrial ? (
        <p className="relative text-center text-[11px] text-slate-300 font-sans">
          {isArabic
            ? 'اشحن رصيد ساعات التشغيل للاستمرار في استقبال الطلبات ونشر إعلاناتك.'
            : 'Recharge operating hours to continue receiving requests and publishing ads.'}
        </p>
      ) : (
        <div className="relative grid grid-cols-2 gap-2 text-[11px] text-slate-200 font-sans">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-[#00ffcc] shrink-0" />
            <span className="truncate">{isArabic ? '30 يوماً بصفر تكلفة' : '30 days at 0 cost'}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{isArabic ? 'تفعيل فوري مجاني' : 'Instant free activation'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
