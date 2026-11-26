'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CaptainUser, BulkScope } from '@/features/admin/types/driver-management';
import { executeCaptainAction } from '@/features/admin/services/drivers-admin-service';
import { requestTranslation } from '@/shared/utils/notification-i18n';

interface UseDriversBulkProps {
  isArabic: boolean;
  captains: CaptainUser[];
  totalCaptainsCount?: number;
  filteredCaptains: CaptainUser[];
  selectedCaptainIds: Set<string>;
  onRefresh: (quiet?: boolean) => Promise<void>;
}

export function useDriversBulk({
  isArabic,
  captains,
  totalCaptainsCount,
  filteredCaptains,
  selectedCaptainIds,
  onRefresh,
}: UseDriversBulkProps) {
  const { toast } = useToast();

  const [isBulkTopupOpen, setIsBulkTopupOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<BulkScope>('all');

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
  const [bulkMsgType, setBulkMsgType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMsg, setSubmittingBulkMsg] = useState(false);

  const getTargetUserIds = useCallback((scope: BulkScope): string[] | undefined => {
    if (scope === 'all') return undefined;
    if (scope === 'selected') return Array.from(selectedCaptainIds);
    if (scope === 'filtered') return filteredCaptains.map((c) => c.id);
    return undefined;
  }, [selectedCaptainIds, filteredCaptains]);

  const getTargetCount = useCallback((scope: BulkScope): number => {
    if (scope === 'all') return totalCaptainsCount || captains.length;
    if (scope === 'selected') return selectedCaptainIds.size;
    if (scope === 'filtered') return filteredCaptains.length;
    return 0;
  }, [totalCaptainsCount, captains.length, selectedCaptainIds.size, filteredCaptains.length]);

  const getTargetList = useCallback((scope: BulkScope): CaptainUser[] => {
    if (scope === 'all') return captains;
    if (scope === 'selected') return captains.filter((c) => selectedCaptainIds.has(c.id));
    if (scope === 'filtered') return filteredCaptains;
    return [];
  }, [captains, selectedCaptainIds, filteredCaptains]);

  const handleBulkTopup = async () => {
    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.' });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.' });
      return;
    }

    setSubmittingBulkTopup(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_topup',
        topupType: bulkTopupType,
        userIds: targetIds,
        ...(bulkTopupType === 'minutes' ? { minutes: bulkMinutes, extendDays: bulkExtendDays } : { amount: bulkCashAmount }),
      };

      const msg = await executeCaptainAction(payload);
      toast({
        title: isArabic ? '⚡ تم الشحن بنجاح' : '⚡ Top-Up Completed',
        description: isArabic ? (msg || 'تم تحديث أرصدة الكباتن المعلنين بنجاح.') : 'Captain balances updated successfully.',
      });
      setIsBulkTopupOpen(false);
      await onRefresh(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الشحن الجماعي' : 'Bulk Top-Up Error',
        description: err.message || (isArabic ? 'تعذر إتمام عملية الشحن الجماعي' : 'Failed to complete bulk top-up'),
      });
    } finally {
      setSubmittingBulkTopup(false);
    }
  };

  const handleBulkSendMessage = async () => {
    if (!bulkMsgBody.trim()) {
      toast({ variant: 'destructive', title: isArabic ? 'نص الرسالة مطلوب' : 'Message Body Required', description: isArabic ? 'يرجى كتابة نص الإشعار قبل الإرسال.' : 'Please enter notification message.' });
      return;
    }
    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({ variant: 'destructive', title: isArabic ? 'تنبيه' : 'Notice', description: isArabic ? 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.' : 'Please select at least one captain.' });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({ variant: 'destructive', title: isArabic ? 'تنبيه' : 'Notice', description: isArabic ? 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.' : 'No captains match filters.' });
      return;
    }

    setSubmittingBulkMsg(true);
    try {
      const msg = await executeCaptainAction({
        action: 'bulk_send_message',
        title: bulkMsgTitle.trim(),
        message: bulkMsgBody.trim(),
        titleEn: bulkMsgTitleEn.trim(),
        messageEn: bulkMsgBodyEn.trim(),
        type: bulkMsgType,
        userIds: targetIds,
      });

      toast({
        title: isArabic ? '📢 تم إرسال الإشعار اللحظي' : '📢 Instant Notification Sent',
        description: isArabic ? (msg || 'تم بث الإشعار بنجاح.') : 'Notification broadcast sent successfully.',
      });
      setIsBulkMessageOpen(false);
      setBulkMsgBody('');
      setBulkMsgTitleEn('');
      setBulkMsgBodyEn('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في إرسال الإشعار الجماعي' : 'Bulk Notification Error',
        description: err.message || (isArabic ? 'تعذر إرسال الإشعار الجماعي' : 'Unable to send bulk notification'),
      });
    } finally {
      setSubmittingBulkMsg(false);
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
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic ? 'يمكنك مراجعة النص الإنجليزي المترجم.' : 'You can review translated English text.',
      });
    } catch {
      toast({ variant: 'destructive', title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed', description: isArabic ? 'يرجى كتابة النص الإنجليزي يدوياً.' : 'Enter English text manually.' });
    } finally {
      setIsTranslatingBulk(false);
    }
  };

  const handleOpenBulkTopupForSelected = () => {
    setBulkScope('selected');
    setIsBulkTopupOpen(true);
  };

  const handleOpenBulkMessageForSelected = () => {
    setBulkScope('selected');
    setIsBulkMessageOpen(true);
  };

  return {
    isBulkTopupOpen,
    setIsBulkTopupOpen,
    handleOpenBulkTopupForSelected,
    handleOpenBulkMessageForSelected,
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
    isBulkMessageOpen,
    setIsBulkMessageOpen,
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
    handleBulkTopup,
    handleBulkSendMessage,
    handleTranslateBulk,
    getTargetCount,
    getTargetList,
  };
}
