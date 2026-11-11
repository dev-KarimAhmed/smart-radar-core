import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { requestTranslation } from '@/features/admin/lib/translation-service';
import type { CaptainUser } from './captains-types';
import type { WelcomeHoursConfigState } from './dialogs/captain-welcome-hours-dialog';
import {
  fetchWelcomeHoursApi,
  saveWelcomeSettingsApi,
  applyWelcomeToExistingApi,
  executeCaptainAdminActionApi,
} from './captain-api-actions';

interface UseCaptainsDialogsParams {
  fetchCaptains: (quiet?: boolean) => Promise<void>;
  captains: CaptainUser[];
  filteredCaptains: CaptainUser[];
  selectedCaptainIds: Set<string>;
}

export function useCaptainsDialogs({
  fetchCaptains,
  captains,
  filteredCaptains,
  selectedCaptainIds,
}: UseCaptainsDialogsParams) {
  const t = useTranslations('adminCaptains');
  const { isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  // Modals state
  const [inspectCaptain, setInspectCaptain] = useState<CaptainUser | null>(null);
  const [topupCaptain, setTopupCaptain] = useState<CaptainUser | null>(null);
  const [securityCaptain, setSecurityCaptain] = useState<CaptainUser | null>(null);
  const [messageCaptain, setMessageCaptain] = useState<CaptainUser | null>(null);

  // Message modal inputs
  const [messageTitle, setMessageTitle] = useState(
    isArabic ? 'رسالة من إدارة المنظومة' : 'Message from System Administration'
  );
  const [messageBody, setMessageBody] = useState('');
  const [messageTitleEn, setMessageTitleEn] = useState('');
  const [messageBodyEn, setMessageBodyEn] = useState('');
  const [isTranslatingDirect, setIsTranslatingDirect] = useState(false);
  const [messageType, setMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  // Topup modal inputs
  const [minutesToAdd, setMinutesToAdd] = useState<number>(60);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [cashBalanceToAdd, setCashBalanceToAdd] = useState<number>(10);
  const [topupMode, setTopupMode] = useState<'minutes' | 'cash'>('minutes');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [targetTier, setTargetTier] = useState<string>('SILVER');
  const [securityReason, setSecurityReason] = useState<string>('');

  // Bulk Modals state
  const [isBulkTopupOpen, setIsBulkTopupOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'selected' | 'filtered'>('all');

  // Bulk Topup inputs
  const [bulkTopupType, setBulkTopupType] = useState<'minutes' | 'cash'>('minutes');
  const [bulkMinutes, setBulkMinutes] = useState<number>(60);
  const [bulkExtendDays, setBulkExtendDays] = useState<number>(30);
  const [bulkCashAmount, setBulkCashAmount] = useState<number>(10);
  const [submittingBulkTopup, setSubmittingBulkTopup] = useState(false);

  // Bulk Message inputs
  const [bulkMsgTitle, setBulkMsgTitle] = useState(
    isArabic ? 'إشعار من إدارة المنظومة' : 'Notice from System Administration'
  );
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgTitleEn, setBulkMsgTitleEn] = useState('');
  const [bulkMsgBodyEn, setBulkMsgBodyEn] = useState('');
  const [isTranslatingBulk, setIsTranslatingBulk] = useState(false);
  const [bulkMsgType, setBulkMsgType] = useState<'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMsg, setSubmittingBulkMsg] = useState(false);

  // Welcome Hours Config state
  const [isWelcomeHoursOpen, setIsWelcomeHoursOpen] = useState(false);
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeHoursConfigState>({
    enabled: true,
    hours: 20,
    minutes: 1200,
    validityDays: 30,
  });
  const [loadingWelcomeConfig, setLoadingWelcomeConfig] = useState(true);
  const [savingWelcomeConfig, setSavingWelcomeConfig] = useState(false);
  const [applyingToExisting, setApplyingToExisting] = useState(false);

  const fetchWelcomeHoursConfig = useCallback(async () => {
    try {
      setLoadingWelcomeConfig(true);
      const data = await fetchWelcomeHoursApi();
      if (data && typeof data === 'object') {
        setWelcomeConfig({
          enabled: Boolean(data.enabled),
          hours: Number(data.hours ?? 20),
          minutes: Number(data.minutes ?? 1200),
          validityDays: Number(data.validityDays ?? 30),
        });
      }
    } catch (err) {
      console.warn('[WelcomeHours] Failed to fetch config:', err);
    } finally {
      setLoadingWelcomeConfig(false);
    }
  }, []);

  const handleSaveWelcomeSettings = async () => {
    try {
      setSavingWelcomeConfig(true);
      const data = await saveWelcomeSettingsApi({
        enabled: welcomeConfig.enabled,
        hours: welcomeConfig.hours,
        validityDays: welcomeConfig.validityDays,
      });
      toast({
        title: t('welcomeHoursSavedToast'),
        description:
          data.message ||
          (isArabic
            ? `تم ضبط رصيد الترحيب إلى ${welcomeConfig.hours} ساعة بنجاح.`
            : `Welcome credit set to ${welcomeConfig.hours} hours successfully.`),
      });
      setIsWelcomeHoursOpen(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الحفظ' : 'Save Error',
        description:
          err.message || (isArabic ? 'تعذر حفظ إعدادات رصيد الترحيب' : 'Failed to save welcome credit settings'),
      });
    } finally {
      setSavingWelcomeConfig(false);
    }
  };

  const handleApplyToExisting = async () => {
    const confirmed = window.confirm(
      t('welcomeHoursRetroConfirm', { hours: welcomeConfig.hours })
    );
    if (!confirmed) return;

    try {
      setApplyingToExisting(true);
      const data = await applyWelcomeToExistingApi({
        hours: welcomeConfig.hours,
        validityDays: welcomeConfig.validityDays,
      });
      toast({
        title: t('welcomeHoursApplySuccessToast', { count: data.count || 0 }),
        description: data.message,
      });
      void fetchCaptains(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ أثناء المنح' : 'Grant Error',
        description:
          err.message ||
          (isArabic ? 'تعذر منح الرصيد للكباتن المسجلين' : 'Failed to grant credit to registered captains'),
      });
    } finally {
      setApplyingToExisting(false);
    }
  };

  useEffect(() => {
    void fetchWelcomeHoursConfig();
  }, [fetchWelcomeHoursConfig]);

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
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English translation generated',
        description: isArabic
          ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.'
          : 'You can review or edit the translated English text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation failed',
        description: isArabic
          ? 'يرجى كتابة النص الإنجليزي يدوياً أو المحاولة لاحقاً.'
          : 'Please enter the English text manually or try again later.',
      });
    } finally {
      setIsTranslatingDirect(false);
    }
  };

  const handleTranslateBulk = async () => {
    setIsTranslatingBulk(true);
    try {
      const [tTitle, tBody] = await Promise.all([
        bulkMsgTitle.trim() ? requestTranslation(bulkMsgTitle.trim(), 'en') : Promise.resolve(''),
        bulkMsgBody.trim() ? requestTranslation(bulkMsgBody.trim(), 'en') : Promise.resolve(''),
      ]);
      setBulkMsgTitleEn(tTitle);
      setBulkMsgBodyEn(tBody);
      toast({
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English translation generated',
        description: isArabic
          ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.'
          : 'You can review or edit the translated English text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation failed',
        description: isArabic
          ? 'يرجى كتابة النص الإنجليزي يدوياً أو المحاولة لاحقاً.'
          : 'Please enter the English text manually or try again later.',
      });
    } finally {
      setIsTranslatingBulk(false);
    }
  };

  const executeAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    setSubmittingAction(true);
    try {
      const result = await executeCaptainAdminActionApi(payload);
      toast({
        title: isArabic ? '⚡ تم تنفيذ الإجراء بنجاح' : '⚡ Action executed successfully',
        description: result.message || successMsg,
      });
      await fetchCaptains(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل العملية' : 'Operation Failed',
        description: err.message || (isArabic ? 'تعذر تطبيق الإجراء' : 'Failed to apply action'),
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  const getTargetUserIds = (scope: 'all' | 'selected' | 'filtered'): string[] | undefined => {
    if (scope === 'all') return undefined;
    if (scope === 'selected') return Array.from(selectedCaptainIds);
    if (scope === 'filtered') return filteredCaptains.map((c) => c.id);
    return undefined;
  };

  const getTargetCount = (scope: 'all' | 'selected' | 'filtered'): number => {
    if (scope === 'all') return captains.length;
    if (scope === 'selected') return selectedCaptainIds.size;
    if (scope === 'filtered') return filteredCaptains.length;
    return 0;
  };

  const handleBulkTopup = async () => {
    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic
          ? 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.'
          : 'Please select at least one captain first.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic
          ? 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.'
          : 'No captains match the current filters.',
      });
      return;
    }

    setSubmittingBulkTopup(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_topup',
        topupType: bulkTopupType,
        userIds: targetIds,
      };
      if (bulkTopupType === 'minutes') {
        payload.minutes = bulkMinutes;
        payload.extendDays = bulkExtendDays;
      } else {
        payload.amount = bulkCashAmount;
      }

      const result = await executeCaptainAdminActionApi(payload);
      toast({
        title: isArabic ? '⚡ تم الشحن بنجاح' : '⚡ Top-up Completed',
        description:
          result.message ||
          (isArabic
            ? 'تم تحديث أرصدة الكباتن المعلنين وإشعارهم بنجاح.'
            : 'Captain balances updated and notifications sent successfully.'),
      });
      setIsBulkTopupOpen(false);
      await fetchCaptains(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الشحن الجماعي' : 'Bulk Top-Up Error',
        description:
          err.message || (isArabic ? 'تعذر إتمام عملية الشحن الجماعي' : 'Failed to complete bulk top-up'),
      });
    } finally {
      setSubmittingBulkTopup(false);
    }
  };

  const handleBulkSendMessage = async () => {
    if (!bulkMsgBody.trim()) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'نص الرسالة مطلوب' : 'Message text required',
        description: isArabic ? 'يرجى كتابة نص الإشعار قبل الإرسال.' : 'Please enter the message body before sending.',
      });
      return;
    }

    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic
          ? 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.'
          : 'Please select at least one captain first.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic
          ? 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.'
          : 'No captains match the current filters.',
      });
      return;
    }

    setSubmittingBulkMsg(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_send_message',
        title: bulkMsgTitle.trim(),
        message: bulkMsgBody.trim(),
        titleEn: bulkMsgTitleEn.trim(),
        messageEn: bulkMsgBodyEn.trim(),
        type: bulkMsgType,
        userIds: targetIds,
      };

      const result = await executeCaptainAdminActionApi(payload);
      toast({
        title: isArabic ? '📢 تم إرسال الإشعار اللحظي' : '📢 Broadcast Sent',
        description:
          result.message ||
          (isArabic
            ? 'تم بث الإشعار بنجاح إلى جميع الكباتن المعلنين المحددين.'
            : 'Notification sent successfully to all selected captains.'),
      });
      setIsBulkMessageOpen(false);
      setBulkMsgBody('');
      setBulkMsgTitleEn('');
      setBulkMsgBodyEn('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في إرسال الإشعار الجماعي' : 'Bulk Broadcast Error',
        description: err.message || (isArabic ? 'تعذر إرسال الإشعار الجماعي' : 'Failed to send bulk broadcast'),
      });
    } finally {
      setSubmittingBulkMsg(false);
    }
  };

  return {
    t,
    isArabic,
    inspectCaptain,
    setInspectCaptain,
    topupCaptain,
    setTopupCaptain,
    securityCaptain,
    setSecurityCaptain,
    messageCaptain,
    setMessageCaptain,
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
    handleTranslateDirect,
    minutesToAdd,
    setMinutesToAdd,
    extendDays,
    setExtendDays,
    cashBalanceToAdd,
    setCashBalanceToAdd,
    topupMode,
    setTopupMode,
    submittingAction,
    executeAdminAction,
    targetStatus,
    setTargetStatus,
    targetTier,
    setTargetTier,
    securityReason,
    setSecurityReason,
    isBulkTopupOpen,
    setIsBulkTopupOpen,
    isBulkMessageOpen,
    setIsBulkMessageOpen,
    bulkScope,
    setBulkScope,
    bulkTopupType,
    setBulkTopupType,
    bulkMinutes,
    setBulkMinutes,
    bulkExtendDays,
    setBulkExtendDays,
    bulkCashAmount,
    setBulkCashAmount,
    submittingBulkTopup,
    handleBulkTopup,
    bulkMsgTitle,
    setBulkMsgTitle,
    bulkMsgBody,
    setBulkMsgBody,
    bulkMsgTitleEn,
    setBulkMsgTitleEn,
    bulkMsgBodyEn,
    setBulkMsgBodyEn,
    isTranslatingBulk,
    bulkMsgType,
    setBulkMsgType,
    submittingBulkMsg,
    handleTranslateBulk,
    handleBulkSendMessage,
    welcomeConfig,
    setWelcomeConfig,
    isWelcomeHoursOpen,
    setIsWelcomeHoursOpen,
    loadingWelcomeConfig,
    savingWelcomeConfig,
    applyingToExisting,
    handleSaveWelcomeSettings,
    handleApplyToExisting,
    getTargetCount,
  };
}
