'use client';

import { useState } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import type { AdminNotificationItem, NotificationsSummary } from '../types/admin-notification-types';

interface UseAdminReceiptReviewParams {
  reviewItem: AdminNotificationItem | null;
  onClose: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotificationItem[]>>;
  setSummary: React.Dispatch<React.SetStateAction<NotificationsSummary>>;
  fetchNotifications: () => void;
  t: (key: string, values?: any) => string;
}

export function useAdminReceiptReview({
  reviewItem,
  onClose,
  setNotifications,
  setSummary,
  fetchNotifications,
  t,
}: UseAdminReceiptReviewParams) {
  const { toast } = useToast();

  const [creditType, setCreditType] = useState<'MINUTES' | 'CASH'>('MINUTES');
  const [minutesValue, setMinutesValue] = useState<number>(() => {
    return Math.round((reviewItem?.payload.amount || 0) * 60);
  });
  const [adminNote, setAdminNote] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const handleApprove = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'APPROVE_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          creditType,
          minutesToGrant: minutesValue,
          adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastApproveErrorDesc'));
      }

      toast({
        title: t('toastApprovedTitle'),
        description: data.message || t('toastApprovedDesc'),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      onClose();
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastApproveErrorTitle'),
        description: err.message || t('toastApproveErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'REJECT_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastRejectErrorDesc'));
      }

      toast({
        title: t('toastRejectedTitle'),
        description: t('toastRejectedDesc'),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      onClose();
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastRejectErrorTitle'),
        description: err.message || t('toastRejectErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  return {
    creditType,
    setCreditType,
    minutesValue,
    setMinutesValue,
    adminNote,
    setAdminNote,
    processingAction,
    rejectMode,
    setRejectMode,
    rejectionReason,
    setRejectionReason,
    handleApprove,
    handleReject,
  };
}
