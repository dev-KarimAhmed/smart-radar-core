'use client';

import React from 'react';
import {
  Send,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RiderBulkMessageDialogProps {
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  totalRidersCount: number;
  selectedCount: number;
  filteredCount: number;
  bulkScope: 'all' | 'selected' | 'filtered';
  setBulkScope: (scope: 'all' | 'selected' | 'filtered') => void;
  bulkMsgTitle: string;
  setBulkMsgTitle: (val: string) => void;
  bulkMsgBody: string;
  setBulkMsgBody: (val: string) => void;
  bulkMsgTitleEn: string;
  setBulkMsgTitleEn: (val: string) => void;
  bulkMsgBodyEn: string;
  setBulkMsgBodyEn: (val: string) => void;
  bulkMsgType: 'info' | 'admin_message' | 'warning' | 'urgent';
  setBulkMsgType: (val: 'info' | 'admin_message' | 'warning' | 'urgent') => void;
  isTranslating: boolean;
  onTranslate: () => Promise<void>;
  submittingBulkMessage: boolean;
  onSendBulkMessage: () => Promise<void>;
  t: (key: any, values?: any) => string;
}

export function RiderBulkMessageDialog({
  open,
  onClose,
  isArabic,
  direction,
  totalRidersCount,
  selectedCount,
  filteredCount,
  bulkScope,
  setBulkScope,
  bulkMsgTitle,
  setBulkMsgTitle,
  bulkMsgBody,
  setBulkMsgBody,
  bulkMsgTitleEn,
  setBulkMsgTitleEn,
  bulkMsgBodyEn,
  setBulkMsgBodyEn,
  bulkMsgType,
  setBulkMsgType,
  isTranslating,
  onTranslate,
  submittingBulkMessage,
  onSendBulkMessage,
  t,
}: RiderBulkMessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-400" />
              {t('bulkBroadcastTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('bulkBroadcastSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Target Scope Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('targetScope')}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkScope('all')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'all'
                    ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeAllRiders')}</span>
                <span className="text-[11px] font-mono opacity-80">({totalRidersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkScope('selected')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'selected'
                    ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeSelectedRiders')}</span>
                <span className="text-[11px] font-mono opacity-80">({selectedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkScope('filtered')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'filtered'
                    ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeFilteredRiders')}</span>
                <span className="text-[11px] font-mono opacity-80">({filteredCount})</span>
              </button>
            </div>

            {bulkScope === 'selected' && selectedCount === 0 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                {t('bulkScopeWarning')}
              </p>
            )}
          </div>

          {/* Message Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('msgTypePriority')}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkMsgType('admin_message')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  bulkMsgType === 'admin_message'
                    ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeAdmin')}
              </button>
              <button
                type="button"
                onClick={() => setBulkMsgType('warning')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  bulkMsgType === 'warning'
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeWarning')}
              </button>
              <button
                type="button"
                onClick={() => setBulkMsgType('urgent')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  bulkMsgType === 'urgent'
                    ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeUrgent')}
              </button>
            </div>
          </div>

          {/* Message Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('bulkMsgTitleLabel')}</label>
            <Input
              value={bulkMsgTitle}
              onChange={(e) => setBulkMsgTitle(e.target.value)}
              placeholder={t('bulkMsgTitlePlaceholder')}
              className={cn(
                "bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-indigo-500",
                isArabic ? "text-right" : "text-left"
              )}
            />
          </div>

          {/* Fast Quick Templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                t('tplRiderUpdateReady'),
                t('tplRiderPromos'),
                t('tplRiderGpsAccuracy'),
                t('tplRiderThankYou'),
                t('tplRiderHaveGoodWeek'),
              ].map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBulkMsgBody(tpl)}
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

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">{t('bulkMsgBodyLabel')}</label>
              <button
                type="button"
                disabled={isTranslating || !bulkMsgBody.trim()}
                onClick={onTranslate}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                title={isArabic ? 'توليد الترجمة الإنجليزية تلقائياً' : 'Auto-generate English translation'}
              >
                {isTranslating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                <span>{isArabic ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}</span>
              </button>
            </div>
            <textarea
              value={bulkMsgBody}
              onChange={(e) => setBulkMsgBody(e.target.value)}
              placeholder={t('bulkMsgBodyPlaceholder')}
              rows={3}
              className={cn(
                "w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-indigo-500 outline-none resize-none font-sans leading-relaxed",
                isArabic ? "text-right" : "text-left"
              )}
              required
            />
          </div>

          {/* English Version (Optional / Auto-generated) */}
          <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {isArabic
                    ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)'
                    : 'English Version (Delivered if user UI is in English)'}
                </span>
              </label>
              {bulkMsgBodyEn && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  {isArabic ? 'مترجم ✓' : 'Ready ✓'}
                </span>
              )}
            </div>
            <Input
              value={bulkMsgTitleEn}
              onChange={(e) => setBulkMsgTitleEn(e.target.value)}
              placeholder="English Broadcast Subject (Optional, auto-generated)"
              className="bg-black/60 border-white/10 text-white text-xs h-8 rounded-lg focus:border-indigo-500 text-left font-sans"
              dir="ltr"
            />
            <textarea
              value={bulkMsgBodyEn}
              onChange={(e) => setBulkMsgBodyEn(e.target.value)}
              placeholder="English broadcast message (Auto-fills when clicking 'Auto-Translate to English')"
              rows={2}
              className="w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg focus:border-indigo-500 outline-none resize-none font-sans leading-relaxed text-left"
              dir="ltr"
            />
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submittingBulkMessage}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={
                submittingBulkMessage ||
                !bulkMsgBody.trim() ||
                (bulkScope === 'selected' && selectedCount === 0)
              }
              onClick={onSendBulkMessage}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {submittingBulkMessage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t('confirmBulkBroadcastNow')}</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
