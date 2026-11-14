'use client';

import React from 'react';
import type { useAdminWallet } from '@/features/admin/hooks/use-admin-wallet';
import { WalletReceiptPreviewModal } from './wallet-receipt-preview-modal';
import { WalletReceiptReviewModals } from './wallet-receipt-review-modals';
import { WalletReceiptMessageModal } from './wallet-receipt-message-modal';

interface WalletManagementModalsProps {
  manager: ReturnType<typeof useAdminWallet>;
}

export function WalletManagementModals({ manager }: WalletManagementModalsProps) {
  const {
    t,
    isArabic,
    direction,
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
    submittingReceiptMessage,
    handleApproveReceipt,
    handleRejectReceipt,
    handleSendReceiptMessage,
  } = manager;

  return (
    <>
      <WalletReceiptPreviewModal
        receipt={selectedReceiptForPreview}
        onClose={() => setSelectedReceiptForPreview(null)}
        onApproveTrigger={(rcpt) => {
          setReceiptToApprove(rcpt);
          setApproveCreditType('CASH');
          setApproveCustomMinutes(Math.round(rcpt.amount * 60));
          setApproveAdminNote('');
        }}
        onRejectTrigger={(rcpt) => {
          setReceiptToReject(rcpt);
          setRejectReason('');
        }}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <WalletReceiptReviewModals
        receiptToApprove={receiptToApprove}
        onCloseApprove={() => setReceiptToApprove(null)}
        approveCreditType={approveCreditType}
        setApproveCreditType={setApproveCreditType}
        approveCustomMinutes={approveCustomMinutes}
        setApproveCustomMinutes={setApproveCustomMinutes}
        approveAdminNote={approveAdminNote}
        setApproveAdminNote={setApproveAdminNote}
        onConfirmApprove={handleApproveReceipt}
        receiptToReject={receiptToReject}
        onCloseReject={() => setReceiptToReject(null)}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onConfirmReject={handleRejectReceipt}
        submittingAction={submittingModalAction}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <WalletReceiptMessageModal
        receiptItem={messageReceiptItem}
        onClose={() => {
          setMessageReceiptItem(null);
          setReceiptMessageBody('');
        }}
        title={receiptMessageTitle}
        setTitle={setReceiptMessageTitle}
        body={receiptMessageBody}
        setBody={setReceiptMessageBody}
        submitting={submittingReceiptMessage}
        onSend={handleSendReceiptMessage}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />
    </>
  );
}
