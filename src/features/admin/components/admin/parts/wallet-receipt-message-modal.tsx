'use client';

import React from 'react';
import { MessageSquare, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReceiptItem } from '@/features/admin/types/admin-wallet';

interface WalletReceiptMessageModalProps {
  receiptItem: ReceiptItem | null;
  onClose: () => void;
  title: string;
  setTitle: (t: string) => void;
  body: string;
  setBody: (b: string) => void;
  submitting: boolean;
  onSend: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletReceiptMessageModal({
  receiptItem,
  onClose,
  title,
  setTitle,
  body,
  setBody,
  submitting,
  onSend,
  isArabic,
  direction,
  t,
}: WalletReceiptMessageModalProps) {
  const whatsappUrl = receiptItem?.captainPhone
    ? `https://wa.me/${receiptItem.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        isArabic
          ? `مرحباً كابتن معلن ${receiptItem.captainName}، بخصوص إيصال الشحن المرسل بقيمة ${receiptItem.amount} ${receiptItem.currency}...`
          : `Hello Captain ${receiptItem.captainName}, regarding the recharge receipt for ${receiptItem.amount} ${receiptItem.currency}...`
      )}`
    : null;

  const quickTemplates = [
    t('tplReuploadClearer'),
    t('tplProvideRefNumber'),
    t('tplReceiptUnderReview'),
    t('tplConfirmWalletNumber'),
  ];

  return (
    <Dialog open={!!receiptItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl", isArabic ? "text-right" : "text-left")} dir={direction}>
        {receiptItem && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                </div>
                <span>{t('msgCaptainTitle')}</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1">
                {t('msgCaptainSubtitle')}
              </DialogDescription>
            </DialogHeader>

            {/* Captain mini info banner */}
            <div className="bg-[#161F30]/60 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{receiptItem.captainName}</span>
                  <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                    {receiptItem.captainSerial}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  <span dir="ltr">{receiptItem.captainPhone}</span> • {receiptItem.amount} {receiptItem.currency} ({receiptItem.channel})
                </p>
              </div>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title={t('openWhatsApp')}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('whatsapp')}</span>
                </a>
              )}
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t('msgTitleLabel')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('msgTitleLabel')}
                className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500", isArabic ? "text-right" : "text-left")}
              />
            </div>

            {/* Fast Templates */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBody(tpl)}
                    className={cn("text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer", isArabic ? "text-right" : "text-left")}
                  >
                    {tpl.length > 32 ? tpl.slice(0, 32) + '...' : tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Message body */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t('msgBodyLabel')}</Label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('msgBodyPlaceholder')}
                rows={3}
                className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
                required
              />
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
              >
                {t('cancel')}
              </Button>

              <Button
                type="button"
                disabled={submitting || !body.trim()}
                onClick={onSend}
                className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} />
                    {t('sendingMsg')}
                  </>
                ) : (
                  <>
                    <Send className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />
                    {t('sendMsgBtn')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

