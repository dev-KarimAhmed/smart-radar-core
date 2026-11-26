'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CaptainUser } from '@/features/admin/types/driver-management';
import { executeCaptainAction, updateCaptainLanguage } from '@/features/admin/services/drivers-admin-service';
import { requestTranslation } from '@/shared/utils/notification-i18n';

interface UseDriversActionsProps {
  isArabic: boolean;
  onRefresh: (quiet?: boolean) => Promise<void>;
  setCaptains: React.Dispatch<React.SetStateAction<CaptainUser[]>>;
}

export function useDriversActions({ isArabic, onRefresh, setCaptains }: UseDriversActionsProps) {
  const { toast } = useToast();
  const [submittingAction, setSubmittingAction] = useState(false);

  const [inspectCaptain, setInspectCaptain] = useState<CaptainUser | null>(null);
  const [topupCaptain, setTopupCaptain] = useState<CaptainUser | null>(null);
  const [securityCaptain, setSecurityCaptain] = useState<CaptainUser | null>(null);
  const [messageCaptain, setMessageCaptain] = useState<CaptainUser | null>(null);
  const [minutesToAdd, setMinutesToAdd] = useState<number>(60);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [cashBalanceToAdd, setCashBalanceToAdd] = useState<number>(10);
  const [topupMode, setTopupMode] = useState<'minutes' | 'cash'>('minutes');
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [targetTier, setTargetTier] = useState<string>('SILVER');
  const [securityReason, setSecurityReason] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState(
    isArabic ? 'رسالة من إدارة المنظومة' : 'Message from System Administration'
  );
  const [messageBody, setMessageBody] = useState('');
  const [messageTitleEn, setMessageTitleEn] = useState('');
  const [messageBodyEn, setMessageBodyEn] = useState('');
  const [isTranslatingDirect, setIsTranslatingDirect] = useState(false);
  const [messageType, setMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  const executeAction = async (payload: Record<string, any>, successMsg: string): Promise<boolean> => {
    setSubmittingAction(true);
    try {
      const msg = await executeCaptainAction(payload);
      toast({
        title: isArabic ? '⚡ تم تنفيذ الإجراء بنجاح' : '⚡ Action Executed Successfully',
        description: isArabic ? (msg || successMsg) : successMsg,
      });
      await onRefresh(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل العملية' : 'Operation Failed',
        description: err.message || (isArabic ? 'تعذر تطبيق الإجراء' : 'Unable to apply action'),
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTranslateDirect = async () => {
    setIsTranslatingDirect(true);
    try {
      const [tTitle, tBody] = await Promise.all([
        messageTitle.trim() ? requestTranslation(messageTitle.trim(), 'en') : Promise.resolve(''),
        messageBody.trim() ? requestTranslation(messageBody.trim(), 'en') : Promise.resolve(''),
      ]);
      setMessageTitleEn(tTitle);
      setMessageBodyEn(tBody);
      toast({
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic
          ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.'
          : 'You can review or edit the English text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed',
        description: isArabic
          ? 'يرجى كتابة النص الإنجليزي يدوياً أو المحاولة لاحقاً.'
          : 'Please enter the English text manually or try again later.',
      });
    } finally {
      setIsTranslatingDirect(false);
    }
  };

  const handleToggleCaptainLanguage = async (captainId: string, currentLang?: string) => {
    const nextLang = (currentLang || 'ar').toLowerCase() === 'en' ? 'ar' : 'en';
    setCaptains((prev) =>
      prev.map((c) => (c.id === captainId ? { ...c, preferred_language: nextLang } : c))
    );
    try {
      await updateCaptainLanguage(captainId, nextLang);
      toast({
        title: isArabic ? 'تم تحديث لغة الكابتن' : 'Language updated',
        description: isArabic
          ? `تم ضبط لغة الكابتن إلى ${nextLang === 'en' ? 'الإنجليزية 🇬🇧' : 'العربية 🇸🇦'}`
          : `Captain language set to ${nextLang === 'en' ? 'English 🇬🇧' : 'Arabic 🇸🇦'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر تحديث لغة الكابتن' : 'Failed to update captain language',
        description: err?.message || (isArabic ? 'حدث خطأ' : 'An error occurred'),
      });
      setCaptains((prev) =>
        prev.map((c) => (c.id === captainId ? { ...c, preferred_language: currentLang || 'ar' } : c))
      );
    }
  };

  const handleTopupSubmit = async () => {
    if (!topupCaptain) return;
    if (topupMode === 'minutes') {
      const ok = await executeAction(
        { action: 'topup_minutes', userId: topupCaptain.id, minutes: minutesToAdd, extendDays },
        isArabic ? `تم شحن ${minutesToAdd} دقيقة رادار بنجاح.` : `Successfully added ${minutesToAdd} radar minutes.`
      );
      if (ok) setTopupCaptain(null);
    } else {
      const ok = await executeAction(
        { action: 'adjust_balance', userId: topupCaptain.id, amount: cashBalanceToAdd },
        isArabic ? `تم إيداع ${cashBalanceToAdd} في محفظة الكابتن بنجاح.` : `Successfully deposited ${cashBalanceToAdd} into captain wallet.`
      );
      if (ok) setTopupCaptain(null);
    }
  };

  const handleResetPenalties = async (cap: CaptainUser) => {
    await executeAction(
      { action: 'reset_penalties', userId: cap.id },
      isArabic ? 'تم تصفير المخالفات وإعادة التقييم بنجاح.' : 'Penalties successfully reset.'
    );
  };

  const handleClearTrip = async (cap: CaptainUser) => {
    await executeAction(
      { action: 'force_clear_trip', userId: cap.id },
      isArabic ? 'تم تحرير الكابتن المعلن وإعادته لوضع الجاهزية IDLE.' : 'Captain trip cleared, reverted to IDLE status.'
    );
  };

  const handleSaveSecurityActions = async () => {
    if (!securityCaptain) return;
    let ok = true;
    if (targetStatus !== securityCaptain.status) {
      ok = await executeAction(
        { action: 'update_status', userId: securityCaptain.id, status: targetStatus },
        isArabic ? `تم تحديث حالة الكابتن المعلن إلى ${targetStatus}` : `Captain status updated to ${targetStatus}`
      );
    }
    if (String(targetTier).toUpperCase() !== String(securityCaptain.tier).toUpperCase()) {
      ok = await executeAction(
        { action: 'update_tier', userId: securityCaptain.id, tier: targetTier },
        isArabic ? `تم ترقية الرتبة إلى ${targetTier}` : `Tier upgraded to ${targetTier}`
      );
    }
    if (ok) setSecurityCaptain(null);
  };

  const handleSendMessage = async () => {
    if (!messageCaptain || !messageBody.trim()) return;
    setSubmittingMessage(true);
    try {
      const ok = await executeAction(
        {
          action: 'send_message',
          userId: messageCaptain.id,
          title: messageTitle.trim(),
          message: messageBody.trim(),
          titleEn: messageTitleEn.trim(),
          messageEn: messageBodyEn.trim(),
          type: messageType,
        },
        isArabic ? 'تم إرسال الرسالة إلى الكابتن المعلن بنجاح عبر الإشعار اللحظي.' : 'Notification sent to captain successfully.'
      );
      if (ok) setMessageCaptain(null);
    } finally {
      setSubmittingMessage(false);
    }
  };

  return {
    submittingAction,
    inspectCaptain,
    setInspectCaptain,
    topupCaptain,
    setTopupCaptain,
    securityCaptain,
    setSecurityCaptain,
    messageCaptain,
    setMessageCaptain,
    minutesToAdd,
    setMinutesToAdd,
    extendDays,
    setExtendDays,
    cashBalanceToAdd,
    setCashBalanceToAdd,
    topupMode,
    setTopupMode,
    targetStatus,
    setTargetStatus,
    targetTier,
    setTargetTier,
    securityReason,
    setSecurityReason,
    messageTitle,
    setMessageTitle,
    messageBody,
    setMessageBody,
    messageTitleEn,
    setMessageTitleEn,
    messageBodyEn,
    setMessageBodyEn,
    isTranslatingDirect,
    messageType,
    setMessageType,
    submittingMessage,
    setSubmittingMessage,
    executeAction,
    handleTranslateDirect,
    handleToggleCaptainLanguage,
    handleTopupSubmit,
    handleResetPenalties,
    handleClearTrip,
    handleSaveSecurityActions,
    handleSendMessage,
  };
}

