'use client';

import React from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaptainUser, BulkScope } from '@/features/admin/types/driver-management';
import { DriversBulkScopeSelector } from './drivers-bulk-scope-selector';
import { DriversBulkMessageFields } from './drivers-bulk-message-fields';

interface DriversBulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkScope: BulkScope;
  setBulkScope: (scope: BulkScope) => void;
  bulkMsgType: 'info' | 'admin_message' | 'warning' | 'urgent';
  setBulkMsgType: (type: 'info' | 'admin_message' | 'warning' | 'urgent') => void;
  bulkMsgTitle: string;
  setBulkMsgTitle: (title: string) => void;
  bulkMsgBody: string;
  setBulkMsgBody: (body: string) => void;
  bulkMsgTitleEn: string;
  setBulkMsgTitleEn: (title: string) => void;
  bulkMsgBodyEn: string;
  setBulkMsgBodyEn: (body: string) => void;
  isTranslatingBulk: boolean;
  onTranslateBulk: () => void;
  totalCaptainsCount: number;
  selectedCount: number;
  filteredCount: number;
  targetCount: number;
  targetList: CaptainUser[];
  submittingBulkMsg: boolean;
  onSend: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversBulkMessageModal({
  isOpen,
  onClose,
  bulkScope,
  setBulkScope,
  bulkMsgType,
  setBulkMsgType,
  bulkMsgTitle,
  setBulkMsgTitle,
  bulkMsgBody,
  setBulkMsgBody,
  bulkMsgTitleEn,
  setBulkMsgTitleEn,
  bulkMsgBodyEn,
  setBulkMsgBodyEn,
  isTranslatingBulk,
  onTranslateBulk,
  totalCaptainsCount,
  selectedCount,
  filteredCount,
  targetCount,
  targetList,
  submittingBulkMsg,
  onSend,
  isArabic,
  direction,
  t,
}: DriversBulkMessageModalProps) {
  const quickTemplates = isArabic ? [
    "بشرى سارة: تم إيداع رصيد دقائق إضافي في محفظتك للاستفادة منها في عطلة نهاية الأسبوع!",
    "تنبيه مهم: يرجى التواجد الآن في الخدمة، الطلبات في منطقتك تشهد زيادة ملحوظة!",
    "إشعار تشغيلي: يرجى التأكد من تشغيل محدد المواقع بدقة عالية وتحديث التطبيق لأحدث إصدار.",
    "شكر وتقدير: إدارة بينكم تثمن التزامكم العالي وأداءكم المتميز في خدمة الركاب.",
    "تنويه أمني: نذكركم بالالتزام بالتسعيرة الرسمية وعدم إلغاء الرحلات بعد قبولها."
  ] : [
    "Good news: Extra flight minutes have been credited to your account for the weekend!",
    "Important alert: Please go online, order demand in your area is surging right now!",
    "Operational notice: Please ensure high GPS accuracy and update app to the latest version.",
    "Appreciation: System administration thanks you for your outstanding commitment and excellence.",
    "Security notice: Reminder to adhere to official fare formulas and avoid trip cancellations."
  ];

  const enCount = targetList.filter(c => (c.preferred_language || 'ar').toLowerCase() === 'en').length;
  const arCount = targetList.length - enCount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-400" />
              {t('bulkBroadcastHeader')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('bulkBroadcastSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Target Scope Selection */}
          <DriversBulkScopeSelector
            bulkScope={bulkScope}
            setBulkScope={setBulkScope}
            totalCaptainsCount={totalCaptainsCount}
            selectedCount={selectedCount}
            filteredCount={filteredCount}
            themeColor="cyan"
            t={t}
          />

          {bulkScope === 'selected' && selectedCount === 0 && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
              {t('noCaptainsSelectedWarning')}
            </p>
          )}

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

          {/* Input Fields & Bilingual Translations */}
          <DriversBulkMessageFields
            bulkMsgTitle={bulkMsgTitle}
            setBulkMsgTitle={setBulkMsgTitle}
            bulkMsgBody={bulkMsgBody}
            setBulkMsgBody={setBulkMsgBody}
            bulkMsgTitleEn={bulkMsgTitleEn}
            setBulkMsgTitleEn={setBulkMsgTitleEn}
            bulkMsgBodyEn={bulkMsgBodyEn}
            setBulkMsgBodyEn={setBulkMsgBodyEn}
            isTranslatingBulk={isTranslatingBulk}
            onTranslateBulk={onTranslateBulk}
            quickTemplates={quickTemplates}
            isArabic={isArabic}
            t={t}
          />

          {/* Broadcast Summary */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>{t('broadcastSummaryHeader')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-lg font-bold">
                  🇸🇦 {arCount} {isArabic ? 'عربية' : 'AR'}
                </span>
                <span className="bg-blue-950/70 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-lg font-bold">
                  🇬🇧 {enCount} {isArabic ? 'إنجليزية' : 'EN'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300">
              {t('broadcastSummaryText', { count: targetCount })}
            </p>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submittingBulkMsg}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingBulkMsg || targetCount === 0 || !bulkMsgBody.trim()}
              onClick={onSend}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {submittingBulkMsg ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-1" />
                  {t('confirmBulkBroadcastBtn', { count: targetCount })}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
