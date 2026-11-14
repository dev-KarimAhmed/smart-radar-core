'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { RiderUser, RiderMessageType, RiderBulkScope } from '@/features/admin/types/rider-management';
import {
  fetchRidersData,
  executeRiderAdminAction,
  translateNotificationContent,
} from '@/features/admin/services/riders-admin-service';
import { useRidersFilters } from './use-riders-filters';

export function useRidersManagement() {
  const t = useTranslations('adminRiders');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  const [riders, setRiders] = useState<RiderUser[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useRidersFilters({ riders });

  // Modals state
  const [inspectRider, setInspectRider] = useState<RiderUser | null>(null);
  const [securityRider, setSecurityRider] = useState<RiderUser | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Inactivity simulation state
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationRiderId, setSimulationRiderId] = useState<string | null>(null);

  const handleOpenSimulationForRider = (rider: RiderUser) => {
    setSimulationRiderId(rider.id);
    setIsSimulationOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct Message modal
  const [messageRider, setMessageRider] = useState<RiderUser | null>(null);
  const [messageTitle, setMessageTitle] = useState(isArabic ? 'رسالة من إدارة المنظومة' : 'Message from Platform Administration');
  const [messageBody, setMessageBody] = useState('');
  const [messageTitleEn, setMessageTitleEn] = useState('');
  const [messageBodyEn, setMessageBodyEn] = useState('');
  const [isTranslatingDirect, setIsTranslatingDirect] = useState(false);
  const [messageType, setMessageType] = useState<RiderMessageType>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  const handleTranslateDirect = async () => {
    setIsTranslatingDirect(true);
    try {
      const { titleEn, bodyEn } = await translateNotificationContent(messageTitle, messageBody);
      setMessageTitleEn(titleEn);
      setMessageBodyEn(bodyEn);
      toast({
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.' : 'You can review or edit the translated text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed',
        description: isArabic ? 'يرجى إدخال النص الإنجليزي يدوياً.' : 'Please enter English text manually.',
      });
    } finally {
      setIsTranslatingDirect(false);
    }
  };

  // Bulk Broadcast modal
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<RiderBulkScope>('all');
  const [bulkMsgTitle, setBulkMsgTitle] = useState(isArabic ? 'إشعار توجيهي من إدارة المنظومة' : 'Directive Notification from System Administration');
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgTitleEn, setBulkMsgTitleEn] = useState('');
  const [bulkMsgBodyEn, setBulkMsgBodyEn] = useState('');
  const [isTranslatingBulk, setIsTranslatingBulk] = useState(false);
  const [bulkMsgType, setBulkMsgType] = useState<RiderMessageType>('admin_message');
  const [submittingBulkMessage, setSubmittingBulkMessage] = useState(false);

  const handleTranslateBulk = async () => {
    setIsTranslatingBulk(true);
    try {
      const { titleEn, bodyEn } = await translateNotificationContent(bulkMsgTitle, bulkMsgBody);
      setBulkMsgTitleEn(titleEn);
      setBulkMsgBodyEn(bodyEn);
      toast({
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.' : 'You can review or edit the translated text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed',
        description: isArabic ? 'يرجى إدخال النص الإنجليزي يدوياً.' : 'Please enter English text manually.',
      });
    } finally {
      setIsTranslatingBulk(false);
    }
  };

  const fetchRiders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await fetchRidersData();
      setRiders(data.users);
      if (data.geo) filters.setGeoLookup(data.geo);
    } catch (err: any) {
      console.warn('[RidersManagementPanel] fetch error:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ استدعاء المستخدمين' : 'Riders Fetch Error',
        description: err.message || (isArabic ? 'تعذر جلب بيانات المستخدمين من قاعدة البيانات' : 'Could not fetch riders from database'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isArabic, filters]);

  useEffect(() => {
    void fetchRiders();
  }, [fetchRiders]);

  const executeAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    setSubmittingAction(true);
    try {
      const result = await executeRiderAdminAction(payload);
      toast({
        title: isArabic ? '⚡ تم تنفيذ الإجراء بنجاح' : '⚡ Action Executed Successfully',
        description: isArabic ? (result.message || successMsg) : successMsg,
      });
      await fetchRiders(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل العملية' : 'Operation Failed',
        description: err.message || (isArabic ? 'تعذر تطبيق الإجراء' : 'Could not apply action'),
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  return {
    t,
    isArabic,
    direction,
    riders,
    loading,
    fetchRiders,
    executeAdminAction,
    ...filters,
    inspectRider,
    setInspectRider,
    securityRider,
    setSecurityRider,
    targetStatus,
    setTargetStatus,
    submittingAction,
    isSimulationOpen,
    setIsSimulationOpen,
    simulationRiderId,
    setSimulationRiderId,
    handleOpenSimulationForRider,
    messageRider,
    setMessageRider,
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
    isBulkMessageOpen,
    setIsBulkMessageOpen,
    bulkScope,
    setBulkScope,
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
    submittingBulkMessage,
    setSubmittingBulkMessage,
    handleTranslateBulk,
  };
}
