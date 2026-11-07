'use client';

import React from 'react';
import {
  MessageSquare,
  MessageCircle,
  Globe,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { RiderUser } from './riders-types';

interface RiderMessageDialogProps {
  rider: RiderUser | null;
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  messageTitle: string;
  setMessageTitle: (val: string) => void;
  messageBody: string;
  setMessageBody: (val: string) => void;
  messageTitleEn: string;
  setMessageTitleEn: (val: string) => void;
  messageBodyEn: string;
  setMessageBodyEn: (val: string) => void;
  messageType: 'info' | 'admin_message' | 'warning' | 'urgent';
  setMessageType: (val: 'info' | 'admin_message' | 'warning' | 'urgent') => void;
  isTranslating: boolean;
  onTranslate: () => Promise<void>;
  submittingMessage: boolean;
  onSendMessage: () => Promise<void>;
  t: (key: any, values?: any) => string;
}

export function RiderMessageDialog({
  rider,
  open,
  onClose,
  isArabic,
  direction,
  messageTitle,
  setMessageTitle,
  messageBody,
  setMessageBody,
  messageTitleEn,
  setMessageTitleEn,
  messageBodyEn,
  setMessageBodyEn,
  messageType,
  setMessageType,
  isTranslating,
  onTranslate,
  submittingMessage,
  onSendMessage,
  t,
}: RiderMessageDialogProps) {
  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-lg bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                <MessageSquare className="h-5 w-5 text-teal-400" />
              </div>
              <span>{t('directMessageTitle')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('directMessageDesc')}
            </DialogDescription>
          </DialogHeader>

          {/* Rider Target Profile Banner */}
          <div className="bg-[#161F30]/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-teal-500/40 rounded-xl">
                <AvatarFallback className="bg-teal-500/20 text-teal-300 font-bold text-xs">
                  {rider.full_name ? rider.full_name.substring(0, 2) : 'R'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{rider.full_name}</span>
                  <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                    {rider.serial_id}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {rider.phone} • {rider.governorate}
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            {rider.phone && (
              <a
                href={`https://wa.me/${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  t('whatsappGreeting', { name: rider.full_name })
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
                title={t('openWhatsAppTitle')}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('whatsappBtn')}</span>
              </a>
            )}
          </div>

          {/* Message Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('msgTypePriority')}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMessageType('admin_message')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  messageType === 'admin_message'
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeAdmin')}
              </button>
              <button
                type="button"
                onClick={() => setMessageType('warning')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  messageType === 'warning'
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeWarning')}
              </button>
              <button
                type="button"
                onClick={() => setMessageType('urgent')}
                className={cn(
                  "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                  messageType === 'urgent'
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {t('msgTypeUrgent')}
              </button>
            </div>
          </div>

          {/* Message Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('msgTitleLabel')}</label>
            <Input
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              placeholder={t('msgTitlePlaceholder')}
              className={cn(
                "bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500",
                isArabic ? "text-right" : "text-left"
              )}
            />
          </div>

          {/* Fast Quick Templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                t('tplRiderWelcome'),
                t('tplRiderCancellationWarning'),
                t('tplRiderRehabilitated'),
                t('tplRiderPromos'),
                t('tplRiderGpsAccuracy'),
              ].map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageBody(tpl)}
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
              <label className="text-xs font-bold text-slate-300">{t('msgBodyLabel')}</label>
              <button
                type="button"
                disabled={isTranslating || !messageBody.trim()}
                onClick={onTranslate}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
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
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={t('directMsgPlaceholder')}
              rows={3}
              className={cn(
                "w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none font-sans leading-relaxed",
                isArabic ? "text-right" : "text-left"
              )}
              required
            />
          </div>

          {/* English Version (Optional / Auto-generated) */}
          <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>
                  {isArabic
                    ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)'
                    : 'English Version (Delivered if user UI is in English)'}
                </span>
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
              placeholder="English message content (Auto-fills when clicking 'Auto-Translate to English')"
              rows={2}
              className="w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg focus:border-teal-500 outline-none resize-none font-sans leading-relaxed text-left"
              dir="ltr"
            />
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submittingMessage}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingMessage || !messageBody.trim()}
              onClick={onSendMessage}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {submittingMessage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t('sendDirectMsgNow')}</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
