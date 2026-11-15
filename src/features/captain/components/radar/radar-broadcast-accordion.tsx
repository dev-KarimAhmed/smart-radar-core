import React from 'react';
import { ChevronDown, Clock, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RadarCopyType } from './radar-copy';

interface RadarBroadcastAccordionProps {
  language: 'ar' | 'en';
  copy: RadarCopyType;
  isOpen: boolean;
  onToggle: () => void;
  broadcastSeconds: number;
  onUpdateSeconds: (updater: (prev: number) => number) => void;
}

export function RadarBroadcastAccordion({
  language,
  copy,
  isOpen,
  onToggle,
  broadcastSeconds,
  onUpdateSeconds,
}: RadarBroadcastAccordionProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#070c18]/90 overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-200 hover:bg-white/5 transition cursor-pointer"
      >
        <span className="flex items-center gap-2 text-amber-300">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>{copy.broadcastTimeAccordion || 'تعديل وقت الانتشار'}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
            {broadcastSeconds} {language === 'ar' ? 'ثانية' : 's'} ({Math.ceil(broadcastSeconds / 60)} {language === 'ar' ? 'دقيقة' : 'min'})
          </span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
        </div>
      </button>
      {isOpen && (
        <div className="p-3 pt-0 border-t border-slate-800/60 animate-in fade-in duration-150 space-y-2.5">
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
            {language === 'ar'
              ? 'مدة صلاحية عرضك في المحيط ومهلة انتظار الراكب للرد قبل انتهاء الطلب.'
              : 'Offer broadcast duration and rider response wait window before expiry.'}
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onUpdateSeconds((prev) => Math.max(30, prev - 30))}
              className="flex h-10 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold transition cursor-pointer"
              title="-30s"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-950/20 font-mono font-black text-base text-amber-300">
              {broadcastSeconds} {language === 'ar' ? 'ثانية' : 's'}
            </div>
            <button
              type="button"
              onClick={() => onUpdateSeconds((prev) => Math.min(300, prev + 30))}
              className="flex h-10 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold transition cursor-pointer"
              title="+30s"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

