'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ReceiptItem } from '../wallet-types';

interface WalletReceiptDialogsProps {
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: any, values?: any) => string;
  // Modal 1: Preview
  selectedReceiptForPreview: ReceiptItem | null;
  setSelectedReceiptForPreview: (r: ReceiptItem | null) => void;
  // Modal 2: Approve
  receiptToApprove: ReceiptItem | null;
  setReceiptToApprove: (r: ReceiptItem | null) => void;
  approveCreditType: 'CASH' | 'MINUTES';
  setApproveCreditType: (t: 'CASH' | 'MINUTES') => void;
  approveCustomMinutes: number;
  setApproveCustomMinutes: (m: number) => void;
  approveAdminNote: string;
  setApproveAdminNote: (n: string) => void;
  submittingModalAction: boolean;
  onApproveReceipt: () => Promise<void>;
  // Modal 3: Reject
  receiptToReject: ReceiptItem | null;
  setReceiptToReject: (r: ReceiptItem | null) => void;
  rejectReason: string;
  setRejectReason: (r: string) => void;
  onRejectReceipt: () => Promise<void>;
  // Modal 4: Message
  messageReceiptItem: ReceiptItem | null;
  setMessageReceiptItem: (r: ReceiptItem | null) => void;
  receiptMessageTitle: string;
  setReceiptMessageTitle: (t: string) => void;
  receiptMessageBody: string;
  setReceiptMessageBody: (b: string) => void;
  submittingReceiptMessage: boolean;
  onSendReceiptMessage: () => Promise<void>;
}

export function WalletReceiptDialogs({
  isArabic,
  direction,
  t,
  selectedReceiptForPreview,
  setSelectedReceiptForPreview,
  receiptToApprove,
  setReceiptToApprove,
  approveCreditType,
  setApproveCreditType,
  approveCustomMinutes,
  setApproveCustomMinutes,
  approveAdminNote,
  setApproveAdminNote,
  submittingModalAction,
  onApproveReceipt,
  receiptToReject,
  setReceiptToReject,
  rejectReason,
  setRejectReason,
  onRejectReceipt,
  messageReceiptItem,
  setMessageReceiptItem,
  receiptMessageTitle,
  setReceiptMessageTitle,
  receiptMessageBody,
  setReceiptMessageBody,
  submittingReceiptMessage,
  onSendReceiptMessage,
}: WalletReceiptDialogsProps) {
  return (
    <>
      {/* MODAL 1: Receipt Image Full Preview */}
      <Dialog open={!!selectedReceiptForPreview} onOpenChange={(open) => !open && setSelectedReceiptForPreview(null)}>
        <DialogContent className={cn("max-w-2xl bg-[#0B0F19] border border-white/10 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {selectedReceiptForPreview && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                  <span>{t('previewModalTitle', { name: selectedReceiptForPreview.captainName })}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {selectedReceiptForPreview.amount.toFixed(2)} {selectedReceiptForPreview.currency}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {selectedReceiptForPreview.channel} • {new Date(selectedReceiptForPreview.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US')}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center max-h-[60vh]">
                {selectedReceiptForPreview.receiptImageUrl ? (
                  <img
                    src={selectedReceiptForPreview.receiptImageUrl}
                    alt="Receipt Full Preview"
                    className="max-h-[60vh] w-auto object-contain"
                  />
                ) : (
                  <div className="p-12 text-slate-500">{t('noImageAvailable')}</div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  {t('close')}
                </Button>

                {selectedReceiptForPreview.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        const target = selectedReceiptForPreview;
                        setSelectedReceiptForPreview(null);
                        setReceiptToApprove(target);
                        setApproveCreditType('CASH');
                        setApproveCustomMinutes(Math.round(target.amount * 60));
                      }}
                      className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] text-xs font-black h-9 rounded-xl"
                    >
                      <CheckCircle2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      {t('approveReceipt')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const target = selectedReceiptForPreview;
                        setSelectedReceiptForPreview(null);
                        setReceiptToReject(target);
                      }}
                      className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold h-9 rounded-xl"
                    >
                      <XCircle className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      {t('rejectReceipt')}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Approve Receipt */}
      <Dialog open={!!receiptToApprove} onOpenChange={(open) => !open && setReceiptToApprove(null)}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToApprove && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  {t('approveModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('approveModalDesc', { name: receiptToApprove.captainName, amount: receiptToApprove.amount.toFixed(2), currency: receiptToApprove.currency })}
                </DialogDescription>
              </DialogHeader>

              {/* Credit Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 block">{t('creditMethodLabel')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveCreditType('CASH')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'CASH'
                        ? "border-amber-500 bg-amber-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-amber-300">{t('cashOptionTitle', { currency: receiptToApprove.currency })}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('cashOptionSub', { amount: receiptToApprove.amount, currency: receiptToApprove.currency })}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApproveCreditType('MINUTES')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'MINUTES'
                        ? "border-teal-500 bg-teal-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-teal-300">{t('minutesOptionTitle')}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('minutesOptionSub')}</span>
                  </button>
                </div>
              </div>

              {approveCreditType === 'MINUTES' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">{t('minutesCountLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={approveCustomMinutes}
                    onChange={(e) => setApproveCustomMinutes(Number(e.target.value))}
                    className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                  />
                  <span className="text-[10px] text-slate-400">
                    {t('minutesHoursEquiv', { hours: (approveCustomMinutes / 60).toFixed(1) })}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('confirmNoteLabel')}</Label>
                <Input
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder={t('adminNotePlaceholder2')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptToApprove(null)}
                  disabled={submittingModalAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  {t('cancel')}
                </Button>

                <Button
                  type="button"
                  onClick={onApproveReceipt}
                  disabled={submittingModalAction}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('approving')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmApproveBtn')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Reject Receipt */}
      <Dialog open={!!receiptToReject} onOpenChange={(open) => !open && setReceiptToReject(null)}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-rose-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToReject && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  {t('rejectModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('rejectModalDesc', { name: receiptToReject.captainName, amount: receiptToReject.amount.toFixed(2), currency: receiptToReject.currency })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('rejectReasonLabel')}</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReasonDefault')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptToReject(null)}
                  disabled={submittingModalAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  {t('back')}
                </Button>

                <Button
                  type="button"
                  onClick={onRejectReceipt}
                  disabled={submittingModalAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('rejecting')}
                    </>
                  ) : (
                    <>
                      <XCircle className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmRejectBtn')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Message Captain Regarding Receipt */}
      <Dialog open={!!messageReceiptItem} onOpenChange={(open) => !open && setMessageReceiptItem(null)}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl", isArabic ? "text-right" : "text-left")} dir={direction}>
          {messageReceiptItem && (
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
                    <span className="font-bold text-white text-sm">{messageReceiptItem.captainName}</span>
                    <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                      {messageReceiptItem.captainSerial}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    <span dir="ltr">{messageReceiptItem.captainPhone}</span> • {messageReceiptItem.amount} {messageReceiptItem.currency} ({messageReceiptItem.channel})
                  </p>
                </div>

                {messageReceiptItem.captainPhone && (
                  <a
                    href={`https://wa.me/${messageReceiptItem.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isArabic ? `مرحباً كابتن معلن ${messageReceiptItem.captainName}، بخصوص إيصال الشحن المرسل بقيمة ${messageReceiptItem.amount} ${messageReceiptItem.currency}...` : `Hello Captain ${messageReceiptItem.captainName}, regarding the recharge receipt for ${messageReceiptItem.amount} ${messageReceiptItem.currency}...`)}`}
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
                  value={receiptMessageTitle}
                  onChange={(e) => setReceiptMessageTitle(e.target.value)}
                  placeholder={t('msgTitleLabel')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500", isArabic ? "text-right" : "text-left")}
                />
              </div>

              {/* Fast Templates */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    t('tplReuploadClearer'),
                    t('tplProvideRefNumber'),
                    t('tplReceiptUnderReview'),
                    t('tplConfirmWalletNumber')
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceiptMessageBody(tpl)}
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
                  value={receiptMessageBody}
                  onChange={(e) => setReceiptMessageBody(e.target.value)}
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
                  onClick={() => setMessageReceiptItem(null)}
                  disabled={submittingReceiptMessage}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  {t('cancel')}
                </Button>

                <Button
                  type="button"
                  disabled={submittingReceiptMessage || !receiptMessageBody.trim()}
                  onClick={onSendReceiptMessage}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  {submittingReceiptMessage ? (
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
    </>
  );
}
