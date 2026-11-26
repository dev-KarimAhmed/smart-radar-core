'use client';

import React from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

interface EarlyLaunchAdShareViewProps {
  isArabic: boolean;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
}

export function EarlyLaunchAdShareView({
  isArabic,
  shareUrl,
  copied,
  onCopy,
  onShare,
}: EarlyLaunchAdShareViewProps) {
  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
        <Check className="h-5 w-5" />
        <span>
          {isArabic
            ? 'تم تسجيل بياناتك وحجز الـ 30 يوماً بنجاح!'
            : 'Your details are saved and 30 days reserved!'}
        </span>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-slate-300">
          {isArabic ? 'رابط المشاركة الخاص بك:' : 'Your unique share link:'}
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2">
          <input
            readOnly
            dir="ltr"
            value={shareUrl}
            className="w-full bg-transparent text-xs font-mono text-teal-300 outline-none"
          />
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-white cursor-pointer"
            title={isArabic ? 'نسخ' : 'Copy'}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onShare}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] py-3 text-sm font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
      >
        <Share2 className="h-4 w-4" />
        <span>
          {copied
            ? (isArabic ? 'تم نسخ الرابط!' : 'Link Copied!')
            : (isArabic ? 'مشاركة الرابط' : 'Share Link')}
        </span>
      </button>
    </div>
  );
}
