'use client';

import React from 'react';
import { MessageSquare, MessageCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { RiderUser, RiderMessageType } from '@/features/admin/types/rider-management';
import { RiderBilingualMessageFields } from './rider-bilingual-message-fields';

interface RiderDirectMessageModalProps {
  rider: RiderUser | null;
  onClose: () => void;
  messageTitle: string;
  onMessageTitleChange: (v: string) => void;
  messageBody: string;
  onMessageBodyChange: (v: string) => void;
  messageTitleEn: string;
  onMessageTitleEnChange: (v: string) => void;
  messageBodyEn: string;
  onMessageBodyEnChange: (v: string) => void;
  messageType: RiderMessageType;
  onMessageTypeChange: (t: RiderMessageType) => void;
  isTranslating: boolean;
  onTranslate: () => void;
  submitting: boolean;
  onSend: () => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RiderDirectMessageModal({
  rider,
  onClose,
  messageTitle,
  onMessageTitleChange,
  messageBody,
  onMessageBodyChange,
  messageTitleEn,
  onMessageTitleEnChange,
  messageBodyEn,
  onMessageBodyEnChange,
  messageType,
  onMessageTypeChange,
  isTranslating,
  onTranslate,
  submitting,
  onSend,
  direction,
  isArabic,
  t,
}: RiderDirectMessageModalProps) {
  if (!rider) return null;

  const quickTemplates = [
    t('tplRiderWelcome'),
    t('tplRiderCancellationWarning'),
    t('tplRiderRehabilitated'),
    t('tplRiderPromos'),
    t('tplRiderGpsAccuracy'),
  ];

  return (
    <Dialog open={!!rider} onOpenChange={(open) => !open && onClose()}>
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
                href={`https://wa.me/${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('whatsappGreeting', { name: rider.full_name }))}`}
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
              {(['admin_message', 'warning', 'urgent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onMessageTypeChange(type)}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    messageType === type
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
            title={messageTitle}
            onTitleChange={onMessageTitleChange}
            titlePlaceholder={t('msgTitlePlaceholder')}
            body={messageBody}
            onBodyChange={onMessageBodyChange}
            bodyPlaceholder={t('directMsgPlaceholder')}
            titleEn={messageTitleEn}
            onTitleEnChange={onMessageTitleEnChange}
            bodyEn={messageBodyEn}
            onBodyEnChange={onMessageBodyEnChange}
            templates={quickTemplates}
            isTranslating={isTranslating}
            onTranslate={onTranslate}
            accentColor="teal"
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
              disabled={submitting || !messageBody.trim()}
              onClick={onSend}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{t('sendDirectMsgNow')}</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
