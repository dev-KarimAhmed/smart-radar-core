'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { RiderUser, RiderMessageType, RiderBulkScope } from '@/features/admin/types/rider-management';
import { translateNotificationContent } from '@/features/admin/services/riders-admin-service';

export function useRidersMessaging(isArabic: boolean) {
  const { toast } = useToast();

  // Direct Message modal
  const [messageRider, setMessageRider] = useState<RiderUser | null>(null);
  const [messageTitle, setMessageTitle] = useState(
    isArabic ? 'رسالة من إدارة المنظومة' : 'Message from Platform Administration'
  );
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
        description: isArabic
          ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.'
          : 'You can review or edit the translated text before sending.',
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
  const [bulkMsgTitle, setBulkMsgTitle] = useState(
    isArabic ? 'إشعار توجيهي من إدارة المنظومة' : 'Directive Notification from System Administration'
  );
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
        description: isArabic
          ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.'
          : 'You can review or edit the translated text before sending.',
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

  return {
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
