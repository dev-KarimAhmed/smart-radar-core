'use client';

import React from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DriverMessageInputsProps {
  messageTitle: string;
  setMessageTitle: (t: string) => void;
  messageBody: string;
  setMessageBody: (b: string) => void;
  messageTitleEn: string;
  setMessageTitleEn: (t: string) => void;
  messageBodyEn: string;
  setMessageBodyEn: (b: string) => void;
  isTranslatingDirect: boolean;
  onTranslateDirect: () => void;
  quickTemplates: string[];
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriverMessageInputs({
  messageTitle,
  setMessageTitle,
  messageBody,
  setMessageBody,
  messageTitleEn,
  setMessageTitleEn,
  messageBodyEn,
  setMessageBodyEn,
  isTranslatingDirect,
  onTranslateDirect,
  quickTemplates,
  isArabic,
  t,
}: DriverMessageInputsProps) {
  return (
    <div className="space-y-3">
      {/* Message Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">{t('msgSubjectLabel')}</label>
        <Input
          value={messageTitle}
          onChange={(e) => setMessageTitle(e.target.value)}
          placeholder={t('msgTitlePlaceholder')}
          className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500", isArabic ? "text-right" : "text-left")}
        />
      </div>

      {/* Quick Templates */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400">{t('quickTemplatesLabel')}</label>
        <div className="flex flex-wrap gap-1.5">
          {quickTemplates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMessageBody(tpl)}
              className={cn("text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer", isArabic ? "text-right" : "text-left")}
            >
              {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
            </button>
          ))}
        </div>
      </div>

      {/* Message Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">{t('msgContentLabel')}</label>
          <button
            type="button"
            disabled={isTranslatingDirect || !messageBody.trim()}
            onClick={onTranslateDirect}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
            title={isArabic ? 'توليد الترجمة الإنجليزية تلقائياً' : 'Auto-generate English translation'}
          >
            {isTranslatingDirect ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
            <span>{isArabic ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}</span>
          </button>
        </div>
        <textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          placeholder={t('msgBodyPlaceholder')}
          rows={3}
          className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
          required
        />
      </div>

      {/* English Version */}
      <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>{isArabic ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)' : 'English Version (Delivered if user UI is in English)'}</span>
          </label>
          {messageBodyEn && (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              {isArabic ? 'مترجم ✓' : 'Ready ✓'}
            </span>
          )}
        </div>
        <Input
          value={messageTitleEn}
          onChange={(e) => setMessageTitleEn(e.target.value)}
          placeholder="English Subject (Optional, auto-generated)"
          className="bg-black/60 border-white/10 text-white text-xs h-8 rounded-lg focus:border-teal-500 text-left font-sans"
          dir="ltr"
        />
        <textarea
          value={messageBodyEn}
          onChange={(e) => setMessageBodyEn(e.target.value)}
          placeholder="English message body (Auto-fills when clicking 'Auto-Translate to English')"
          rows={2}
          className="w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg focus:border-teal-500 outline-none resize-none font-sans leading-relaxed text-left"
          dir="ltr"
        />
      </div>
    </div>
  );
}

