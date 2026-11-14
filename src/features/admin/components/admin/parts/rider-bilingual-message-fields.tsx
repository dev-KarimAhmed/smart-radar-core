'use client';

import React from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RiderBilingualMessageFieldsProps {
  title: string;
  onTitleChange: (v: string) => void;
  titlePlaceholder: string;
  body: string;
  onBodyChange: (v: string) => void;
  bodyPlaceholder: string;
  titleEn: string;
  onTitleEnChange: (v: string) => void;
  bodyEn: string;
  onBodyEnChange: (v: string) => void;
  templates: string[];
  isTranslating: boolean;
  onTranslate: () => void;
  accentColor?: 'teal' | 'indigo';
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RiderBilingualMessageFields({
  title,
  onTitleChange,
  titlePlaceholder,
  body,
  onBodyChange,
  bodyPlaceholder,
  titleEn,
  onTitleEnChange,
  bodyEn,
  onBodyEnChange,
  templates,
  isTranslating,
  onTranslate,
  accentColor = 'teal',
  isArabic,
  t,
}: RiderBilingualMessageFieldsProps) {
  const isTeal = accentColor === 'teal';

  return (
    <>
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">{t('msgTitleLabel')}</label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className={cn(
            "bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl",
            isTeal ? "focus:border-teal-500" : "focus:border-indigo-500",
            isArabic ? "text-right" : "text-left"
          )}
        />
      </div>

      {/* Quick Templates */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onBodyChange(tpl)}
              className={cn(
                "text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                isArabic ? "text-right" : "text-left"
              )}
            >
              {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">{t('msgBodyLabel')}</label>
          <button
            type="button"
            disabled={isTranslating || !body.trim()}
            onClick={onTranslate}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40",
              isTeal
                ? "text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30"
                : "text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
            )}
          >
            {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
            <span>{isArabic ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}</span>
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={bodyPlaceholder}
          rows={3}
          className={cn(
            "w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl outline-none resize-none font-sans leading-relaxed",
            isTeal ? "focus:border-teal-500" : "focus:border-indigo-500",
            isArabic ? "text-right" : "text-left"
          )}
          required
        />
      </div>

      {/* English Version */}
      <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Globe className={cn("w-3.5 h-3.5", isTeal ? "text-[#14B8A6]" : "text-indigo-400")} />
            <span>{isArabic ? 'النسخة الإنجليزية' : 'English Version'}</span>
          </label>
          {bodyEn && (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              {isArabic ? 'مترجم ✓' : 'Ready ✓'}
            </span>
          )}
        </div>
        <Input
          value={titleEn}
          onChange={(e) => onTitleEnChange(e.target.value)}
          placeholder="English Subject (Optional)"
          className={cn(
            "bg-black/60 border-white/10 text-white text-xs h-8 rounded-lg text-left font-sans",
            isTeal ? "focus:border-teal-500" : "focus:border-indigo-500"
          )}
          dir="ltr"
        />
        <textarea
          value={bodyEn}
          onChange={(e) => onBodyEnChange(e.target.value)}
          placeholder="English message content"
          rows={2}
          className={cn(
            "w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg outline-none resize-none font-sans leading-relaxed text-left",
            isTeal ? "focus:border-teal-500" : "focus:border-indigo-500"
          )}
          dir="ltr"
        />
      </div>
    </>
  );
}

