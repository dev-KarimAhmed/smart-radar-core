import React from 'react';

interface HistoryRiderTripReviewProps {
  review?: any;
  t: (key: string) => string;
}

export function HistoryRiderTripReview({ review, t }: HistoryRiderTripReviewProps) {
  if (!review) return null;

  const stars = review.detailed_stars || {};
  const captainObj = stars.captain || {};
  const activeCaptain = Object.keys(captainObj).filter(k => Number(captainObj[k]) === 1);

  if (activeCaptain.length === 0 && !review.comment) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-3 space-y-1.5 text-xs text-slate-300">
      <div className="font-bold text-slate-400 text-[11px]">
        <span>{t('detailedFeedback')}</span>
      </div>

      {activeCaptain.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeCaptain.map(k => (
            <span key={k} className="inline-flex items-center gap-1 rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 px-2 py-0.5 text-[10px] font-bold text-[#14F5D5]">
              👤 {t(`captainCriteria.${k}`)}
            </span>
          ))}
        </div>
      )}

      {review.comment && (
        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}
    </div>
  );
}
