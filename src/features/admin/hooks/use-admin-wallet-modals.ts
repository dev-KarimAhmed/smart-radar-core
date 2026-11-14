'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ReceiptItem } from '@/features/admin/types/admin-wallet';
import {
  approveReceiptAction,
  rejectReceiptAction,
  sendReceiptMessageAction,
} from '@/features/admin/services/admin-wallet-service';

interface UseAdminWalletModalsProps {
  isArabic: boolean;
  onReceiptActionSuccess: () => void;
}

export function useAdminWalletModals({ isArabic, onReceiptActionSuccess }: UseAdminWalletModalsProps) {
  const { toast } = useToast();

  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ReceiptItem | null>(null);
  const [receiptToApprove, setReceiptToApprove] = useState<ReceiptItem | null>(null);
  const [receiptToReject, setReceiptToReject] = useState<ReceiptItem | null>(null);
  const [approveCreditType, setApproveCreditType] = useState<'CASH' | 'MINUTES'>('CASH');
  const [approveCustomMinutes, setApproveCustomMinutes] = useState<number>(60);
  const [approveAdminNote, setApproveAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingModalAction, setSubmittingModalAction] = useState(false);

  const [messageReceiptItem, setMessageReceiptItem] = useState<ReceiptItem | null>(null);
  const [receiptMessageTitle, setReceiptMessageTitle] = useState(
    isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt'
  );
  const [receiptMessageBody, setReceiptMessageBody] = useState('');
  const [receiptMessageType, setReceiptMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingReceiptMessage, setSubmittingReceiptMessage] = useState(false);

  const handleApproveReceipt = async () => {
    if (!receiptToApprove) return;
    setSubmittingModalAction(true);
    try {
      const msg = await approveReceiptAction({
        transactionId: receiptToApprove.id,
        creditType: approveCreditType,
        minutesToGrant: approveCreditType === 'MINUTES' ? approveCustomMinutes : 0,
        adminNote: approveAdminNote,
      });
      toast({ title: isArabic ? 'تم اعتماد الإيصال بنجاح' : 'Receipt Approved Successfully', description: msg });
      setReceiptToApprove(null);
      setApproveAdminNote('');
      onReceiptActionSuccess();
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ في الاعتماد' : 'Approval Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  const handleRejectReceipt = async () => {
    if (!receiptToReject) return;
    setSubmittingModalAction(true);
    try {
      const msg = await rejectReceiptAction({
        transactionId: receiptToReject.id,
        reason: rejectReason || (isArabic ? 'الإيصال غير واضح أو لم يتم استلام الحوالة' : 'Receipt is unclear or transfer was not received'),
      });
      toast({ title: isArabic ? 'تم رفض الإيصال' : 'Receipt Rejected', description: msg });
      setReceiptToReject(null);
      setRejectReason('');
      onReceiptActionSuccess();
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ أثناء الرفض' : 'Rejection Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  const handleSendReceiptMessage = async () => {
    if (!messageReceiptItem) return;
    setSubmittingReceiptMessage(true);
    try {
      const msg = await sendReceiptMessageAction({
        captainId: messageReceiptItem.profileId,
        title: receiptMessageTitle.trim(),
        message: receiptMessageBody.trim(),
        type: receiptMessageType,
      });
      toast({
        title: isArabic ? 'تم إرسال الرسالة بنجاح' : 'Message Sent Successfully',
        description: isArabic ? (msg || 'تم إرسال الإشعار اللحظي إلى الكابتن.') : 'Instant notification sent to captain.',
      });
      setMessageReceiptItem(null);
      setReceiptMessageBody('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ أثناء الإرسال' : 'Error Sending',
        description: err.message || (isArabic ? 'تعذر إرسال الإشعار للكابتن' : 'Could not send notification'),
      });
    } finally {
      setSubmittingReceiptMessage(false);
    }
  };

  return {
    selectedReceiptForPreview,
    setSelectedReceiptForPreview,
    receiptToApprove,
    setReceiptToApprove,
    receiptToReject,
    setReceiptToReject,
    approveCreditType,
    setApproveCreditType,
    approveCustomMinutes,
    setApproveCustomMinutes,
    approveAdminNote,
    setApproveAdminNote,
    rejectReason,
    setRejectReason,
    submittingModalAction,
    messageReceiptItem,
    setMessageReceiptItem,
    receiptMessageTitle,
    setReceiptMessageTitle,
    receiptMessageBody,
    setReceiptMessageBody,
    receiptMessageType,
    setReceiptMessageType,
    submittingReceiptMessage,
    handleApproveReceipt,
    handleRejectReceipt,
    handleSendReceiptMessage,
  };
}
