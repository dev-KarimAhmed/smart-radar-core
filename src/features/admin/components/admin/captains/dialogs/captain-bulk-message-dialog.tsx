import React from 'react';
import { Send, Globe, Loader2, CheckCircle2 } from 'lucide-react';
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
import type { CaptainUser } from '../captains-types';

interface CaptainBulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string, params?: Record<string, any>) => string;
  bulkScope: 'all' | 'selected' | 'filtered';
  setBulkScope: (scope: 'all' | 'selected' | 'filtered') => void;
  bulkMsgType: 'admin_message' | 'warning' | 'urgent';
  setBulkMsgType: (type: 'admin_message' | 'warning' | 'urgent') => void;
  bulkMsgTitle: string;
  setBulkMsgTitle: (val: string) => void;
  bulkMsgBody: string;
  setBulkMsgBody: (val: string) => void;
  bulkMsgTitleEn: string;
  setBulkMsgTitleEn: (val: string) => void;
  bulkMsgBodyEn: string;
  setBulkMsgBodyEn: (val: string) => void;
  isTranslatingBulk: boolean;
  handleTranslateBulk: () => Promise<void>;
  submittingBulkMsg: boolean;
  handleBulkSendMessage: () => Promise<void>;
  captains: CaptainUser[];
  filteredCaptains: CaptainUser[];
  selectedCaptainIds: Set<string>;
  getTargetCount: (scope: 'all' | 'selected' | 'filtered') => number;
}

export const CaptainBulkMessageDialog: React.FC<CaptainBulkMessageDialogProps> = ({
  open,
  onOpenChange,
  direction,
  isArabic,
  t,
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
  handleTranslateBulk,
  submittingBulkMsg,
  handleBulkSendMessage,
  captains,
  filteredCaptains,
  selectedCaptainIds,
  getTargetCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('targetScopeMessageLabel')}</label>
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
                <span>{t('scopeAllCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({captains.length})</span>
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
                <span>{t('scopeSelectedCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({selectedCaptainIds.size})</span>
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
                <span>{t('scopeFilteredCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({filteredCaptains.length})</span>
              </button>
            </div>

            {bulkScope === 'selected' && selectedCaptainIds.size === 0 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                {t('noCaptainsSelectedWarning')}
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
            <label className="text-xs font-bold text-slate-300">{t('msgSubjectLabel')}</label>
            <Input
              value={bulkMsgTitle}
              onChange={(e) => setBulkMsgTitle(e.target.value)}
              placeholder={t('msgTitlePlaceholder')}
              className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-indigo-500", isArabic ? "text-right" : "text-left")}
            />
          </div>

          {/* Fast Quick Templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">{t('quickTemplatesLabel')}</label>
            <div className="flex flex-wrap gap-1.5">
              {(isArabic ? [
                "بشرى سارة: تم شحن دقائق إضافية لحسابكم بمناسبة نهاية الأسبوع!",
                "تنبيه هام: يرجى تفعيل وضع الاتصال، الطلبات في منطقتك مرتفعة الآن!",
                "إشعار تشغيلي: يرجى التأكد من استقرار إشارة GPS وتحديث التطبيق لأحدث إصدار.",
                "شكر وتقدير: إدارة المنظومة تشكركم على التزامكم العالي وخدمتكم الممتازة.",
                "تنويه أمني: نذكركم بالالتزام بالتسعيرة الرسمية وعدم إلغاء الرحلات بعد قبولها."
              ] : [
                "Good news: Extra radar minutes have been credited to your account for the weekend!",
                "Important alert: Please go online, order demand in your area is surging right now!",
                "Operational notice: Please ensure high GPS accuracy and update app to the latest version.",
                "Appreciation: System administration thanks you for your outstanding commitment and excellence.",
                "Security notice: Reminder to adhere to official fare formulas and avoid trip cancellations."
              ]).map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBulkMsgBody(tpl)}
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
                disabled={isTranslatingBulk || !bulkMsgBody.trim()}
                onClick={handleTranslateBulk}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                title={isArabic ? 'توليد الترجمة الإنجليزية تلقائياً' : 'Auto-generate English translation'}
              >
                {isTranslatingBulk ? (
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
              placeholder={t('msgBodyPlaceholder')}
              rows={3}
              className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-indigo-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
              required
            />
          </div>

          {/* English Version (Optional / Auto-generated) */}
          <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isArabic ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)' : 'English Version (Delivered if user UI is in English)'}</span>
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

          {/* Broadcast Summary */}
          {(() => {
            const targetList = bulkScope === 'all'
              ? captains
              : bulkScope === 'selected'
                ? captains.filter(c => selectedCaptainIds.has(c.id))
                : filteredCaptains;
            const enCount = targetList.filter(c => (c.preferred_language || 'ar').toLowerCase() === 'en').length;
            const arCount = targetList.length - enCount;

            return (
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
                  {t('broadcastSummaryText', { count: getTargetCount(bulkScope) })}
                </p>
                <p className="text-[10px] text-indigo-200/90 bg-indigo-900/30 p-2 rounded-xl border border-indigo-500/20 leading-relaxed">
                  ℹ️ {isArabic
                    ? 'يتم إرسال الإشعار لكل كابتن وفق لغته المفضلة تلقائياً (النص العربي للكباتن باللغة العربية، والنص الإنجليزي للكباتن باللغة الإنجليزية).'
                    : 'Each captain will receive the broadcast message in their own preferred language automatically.'}
                </p>
              </div>
            );
          })()}

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submittingBulkMsg}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingBulkMsg || getTargetCount(bulkScope) === 0 || !bulkMsgBody.trim()}
              onClick={handleBulkSendMessage}
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
                  {t('confirmBulkBroadcastBtn', { count: getTargetCount(bulkScope) })}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
