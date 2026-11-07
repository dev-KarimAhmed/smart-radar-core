import React from 'react';
import { Zap, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaptainSelectedFloatingBarProps {
  selectedCount: number;
  onOpenBulkTopup: () => void;
  onOpenBulkMessage: () => void;
  onClearSelection: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const CaptainSelectedFloatingBar: React.FC<CaptainSelectedFloatingBarProps> = ({
  selectedCount,
  onOpenBulkTopup,
  onOpenBulkMessage,
  onClearSelection,
  t,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#14B8A6]/20 via-[#0B0F19]/95 to-indigo-950/40 border border-[#14B8A6]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14B8A6]"></span>
        </span>
        <div className="text-xs font-bold text-white">
          {t('selectedCaptainAlert', { count: selectedCount })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onOpenBulkTopup}
          className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{t('bulkTopupSelected', { count: selectedCount })}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onOpenBulkMessage}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('bulkMessageSelected', { count: selectedCount })}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClearSelection}
          className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8 px-3 rounded-xl transition-all cursor-pointer"
        >
          <span>{t('clearSelection')}</span>
        </Button>
      </div>
    </div>
  );
};
