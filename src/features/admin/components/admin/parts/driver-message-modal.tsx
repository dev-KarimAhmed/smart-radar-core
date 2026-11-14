'use client';

import React from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
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
import type { CaptainUser } from '@/features/admin/types/driver-management';
import { DriverMessageBanner } from './driver-message-banner';
import { DriverMessageInputs } from './driver-message-inputs';

interface DriverMessageModalProps {
  captain: CaptainUser | null;
  onClose: () => void;
  messageTitle: string;
  setMessageTitle: (t: string) => void;
  messageBody: string;
  setMessageBody: (b: string) => void;
  messageTitleEn: string;
  setMessageTitleEn: (t: string) => void;
  messageBodyEn: string;
  setMessageBodyEn: (b: string) => void;
  messageType: 'info' | 'admin_message' | 'warning' | 'urgent';
  setMessageType: (t: 'info' | 'admin_message' | 'warning' | 'urgent') => void;
  isTranslatingDirect: boolean;
  onTranslateDirect: () => void;
  submittingMessage: boolean;
  onSendMessage: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriverMessageModal({
  captain,
  onClose,
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
  isTranslatingDirect,
  onTranslateDirect,
  submittingMessage,
  onSendMessage,
  isArabic,
  direction,
  t,
}: DriverMessageModalProps) {
  if (!captain) return null;

  const quickTemplates = isArabic ? [
    "يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب تعليق الحساب.",
    "تمت مراجعة حسابك واعتماد بياناتك ووثائقك بنجاح.",
    "تنبيه إداري: نرجو الالتزام بعدم إلغاء الرحلات بعد قبولها لضمان استقرار حسابك.",
    "شكر وتقدير من إدارة بينكم لأدائك المتميز والتزامك العالي.",
    "يرجى التأكد من تشغيل محدد الموقع (GPS) بدقة عالية أثناء فترات العمل."
  ] : [
    "Please renew driving license or vehicle documents to avoid account suspension.",
    "Your account has been audited and verified successfully.",
    "Administrative notice: Please avoid canceling accepted trips to preserve your account stability.",
    "Appreciation from byncom Administration for your exemplary service and commitment.",
    "Please ensure GPS high-accuracy mode is enabled during active duty."
  ];

  return (
    <Dialog open={!!captain} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl", isArabic ? "text-right" : "text-left")} dir={direction}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                <MessageSquare className="h-5 w-5 text-teal-400" />
              </div>
              <span>{t('sendMessageModalTitle')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('sendMessageModalDesc')}
            </DialogDescription>
          </DialogHeader>

          {/* Captain Target Profile Banner */}
          <DriverMessageBanner captain={captain} isArabic={isArabic} t={t} />

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

          {/* Message Inputs & Bilingual Fields */}
          <DriverMessageInputs
            messageTitle={messageTitle}
            setMessageTitle={setMessageTitle}
            messageBody={messageBody}
            setMessageBody={setMessageBody}
            messageTitleEn={messageTitleEn}
            setMessageTitleEn={setMessageTitleEn}
            messageBodyEn={messageBodyEn}
            setMessageBodyEn={setMessageBodyEn}
            isTranslatingDirect={isTranslatingDirect}
            onTranslateDirect={onTranslateDirect}
            quickTemplates={quickTemplates}
            isArabic={isArabic}
            t={t}
          />

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submittingMessage}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingMessage || !messageBody.trim()}
              onClick={onSendMessage}
              className="bg-teal-500 hover:bg-teal-400 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {submittingMessage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-1" />
                  {t('sendDirectMsgBtn')}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
