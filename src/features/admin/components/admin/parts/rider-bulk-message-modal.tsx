'use client';

import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { RiderMessageType, RiderBulkScope } from '@/features/admin/types/rider-management';
import { RiderBilingualMessageFields } from './rider-bilingual-message-fields';

interface RiderBulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRidersCount: number;
  selectedRidersCount: number;
  filteredRidersCount: number;
  bulkScope: RiderBulkScope;
  onBulkScopeChange: (scope: RiderBulkScope) => void;
  bulkMsgTitle: string;
  onBulkMsgTitleChange: (v: string) => void;
  bulkMsgBody: string;
  onBulkMsgBodyChange: (v: string) => void;
  bulkMsgTitleEn: string;
  onBulkMsgTitleEnChange: (v: string) => void;
  bulkMsgBodyEn: string;
  onBulkMsgBodyEnChange: (v: string) => void;
  bulkMsgType: RiderMessageType;
  onBulkMsgTypeChange: (t: RiderMessageType) => void;
  isTranslating: boolean;
  onTranslate: () => void;
  submitting: boolean;
  onSend: () => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RiderBulkMessageModal({
  isOpen,
  onClose,
  totalRidersCount,
  selectedRidersCount,
  filteredRidersCount,
  bulkScope,
  onBulkScopeChange,
  bulkMsgTitle,
  onBulkMsgTitleChange,
  bulkMsgBody,
  onBulkMsgBodyChange,
  bulkMsgTitleEn,
  onBulkMsgTitleEnChange,
  bulkMsgBodyEn,
  onBulkMsgBodyEnChange,
  bulkMsgType,
  onBulkMsgTypeChange,
  isTranslating,
  onTranslate,
  submitting,
  onSend,
  direction,
  isArabic,
  t,
}: RiderBulkMessageModalProps) {
  const quickTemplates = [
    t('tplRiderUpdateReady'),
    t('tplRiderPromos'),
    t('tplRiderGpsAccuracy'),
    t('tplRiderThankYou'),
    t('tplRiderHaveGoodWeek'),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              <span>{t('bulkBroadcastTitle')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('bulkBroadcastSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Target Scope Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('targetScope')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { scope: 'all' as const, label: t('scopeAllRiders'), count: totalRidersCount },
                { scope: 'selected' as const, label: t('scopeSelectedRiders'), count: selectedRidersCount },
                { scope: 'filtered' as const, label: t('scopeFilteredRiders'), count: filteredRidersCount },
              ].map((item) => (
                <button
                  key={item.scope}
                  type="button"
                  onClick={() => onBulkScopeChange(item.scope)}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === item.scope
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] font-mono opacity-80">({item.count})</span>
                </button>
              ))}
            </div>

            {bulkScope === 'selected' && selectedRidersCount === 0 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                {t('bulkScopeWarning')}
              </p>
            )}
          </div>

          {/* Message Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('msgTypePriority')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin_message', 'warning', 'urgent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onBulkMsgTypeChange(type)}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === type
                      ? type === 'urgent'
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm"
                        : type === 'warning'
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                        : "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {type === 'urgent' ? t('msgTypeUrgent') : type === 'warning' ? t('msgTypeWarning') : t('msgTypeAdmin')}
                </button>
              ))}
            </div>
          </div>

          {/* Bilingual Message Inputs */}
          <RiderBilingualMessageFields
            title={bulkMsgTitle}
            onTitleChange={onBulkMsgTitleChange}
            titlePlaceholder={t('bulkMsgTitlePlaceholder')}
            body={bulkMsgBody}
            onBodyChange={onBulkMsgBodyChange}
            bodyPlaceholder={t('bulkMsgBodyPlaceholder')}
            titleEn={bulkMsgTitleEn}
            onTitleEnChange={onBulkMsgTitleEnChange}
            bodyEn={bulkMsgBodyEn}
            onBodyEnChange={onBulkMsgBodyEnChange}
            templates={quickTemplates}
            isTranslating={isTranslating}
            onTranslate={onTranslate}
            accentColor="indigo"
            isArabic={isArabic}
            t={t}
          />

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submitting || !bulkMsgBody.trim() || (bulkScope === 'selected' && selectedRidersCount === 0)}
              onClick={onSend}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{t('confirmBulkBroadcastNow')}</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
