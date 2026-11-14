'use client';

import React from 'react';
import type { useRidersManagement } from '@/features/admin/hooks/use-riders-management';
import { RiderInspectModal } from './rider-inspect-modal';
import { RiderSecurityModal } from './rider-security-modal';
import { RiderDirectMessageModal } from './rider-direct-message-modal';
import { RiderBulkMessageModal } from './rider-bulk-message-modal';

interface RiderManagementModalsProps {
  manager: ReturnType<typeof useRidersManagement>;
}

export function RiderManagementModals({ manager }: RiderManagementModalsProps) {
  const {
    t,
    isArabic,
    direction,
    riders,
    filteredRiders,
    selectedRiderIds,
    clearSelection,
    executeAdminAction,
    inspectRider,
    setInspectRider,
    securityRider,
    setSecurityRider,
    targetStatus,
    setTargetStatus,
    submittingAction,
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
  } = manager;

  return (
    <>
      <RiderInspectModal
        rider={inspectRider}
        onClose={() => setInspectRider(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />
      <RiderSecurityModal
        rider={securityRider}
        onClose={() => setSecurityRider(null)}
        targetStatus={targetStatus}
        onTargetStatusChange={setTargetStatus}
        submittingAction={submittingAction}
        onResetPenalties={async (riderId) => {
          const ok = await executeAdminAction({ action: 'reset_penalties', userId: riderId }, t('riderResetSuccess'));
          if (ok) setSecurityRider(null);
        }}
        onUpdateStatus={async (riderId, status) => {
          const ok = await executeAdminAction({ action: 'update_status', userId: riderId, status }, t('riderStatusUpdateSuccess', { status }));
          if (ok) setSecurityRider(null);
        }}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />
      <RiderDirectMessageModal
        rider={messageRider}
        onClose={() => {
          setMessageRider(null);
          setMessageTitleEn('');
          setMessageBodyEn('');
        }}
        messageTitle={messageTitle}
        onMessageTitleChange={setMessageTitle}
        messageBody={messageBody}
        onMessageBodyChange={setMessageBody}
        messageTitleEn={messageTitleEn}
        onMessageTitleEnChange={setMessageTitleEn}
        messageBodyEn={messageBodyEn}
        onMessageBodyEnChange={setMessageBodyEn}
        messageType={messageType}
        onMessageTypeChange={setMessageType}
        isTranslating={isTranslatingDirect}
        onTranslate={handleTranslateDirect}
        submitting={submittingMessage}
        onSend={async () => {
          if (!messageRider) return;
          setSubmittingMessage(true);
          try {
            const ok = await executeAdminAction({
              action: 'send_message',
              userId: messageRider.id,
              title: messageTitle.trim(),
              message: messageBody.trim(),
              titleEn: messageTitleEn.trim(),
              messageEn: messageBodyEn.trim(),
              type: messageType,
            }, t('directMsgSuccess'));
            if (ok) {
              setMessageRider(null);
              setMessageBody('');
              setMessageTitleEn('');
              setMessageBodyEn('');
            }
          } finally {
            setSubmittingMessage(false);
          }
        }}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />
      <RiderBulkMessageModal
        isOpen={isBulkMessageOpen}
        onClose={() => {
          setIsBulkMessageOpen(false);
          setBulkMsgTitleEn('');
          setBulkMsgBodyEn('');
        }}
        totalRidersCount={riders.length}
        selectedRidersCount={selectedRiderIds.size}
        filteredRidersCount={filteredRiders.length}
        bulkScope={bulkScope}
        onBulkScopeChange={setBulkScope}
        bulkMsgTitle={bulkMsgTitle}
        onBulkMsgTitleChange={setBulkMsgTitle}
        bulkMsgBody={bulkMsgBody}
        onBulkMsgBodyChange={setBulkMsgBody}
        bulkMsgTitleEn={bulkMsgTitleEn}
        onBulkMsgTitleEnChange={setBulkMsgTitleEn}
        bulkMsgBodyEn={bulkMsgBodyEn}
        onBulkMsgBodyEnChange={setBulkMsgBodyEn}
        bulkMsgType={bulkMsgType}
        onBulkMsgTypeChange={setBulkMsgType}
        isTranslating={isTranslatingBulk}
        onTranslate={handleTranslateBulk}
        submitting={submittingBulkMessage}
        onSend={async () => {
          let targetIds: string[] = [];
          if (bulkScope === 'selected') targetIds = Array.from(selectedRiderIds);
          else if (bulkScope === 'filtered') targetIds = filteredRiders.map((r) => r.id);

          setSubmittingBulkMessage(true);
          try {
            const ok = await executeAdminAction({
              action: 'bulk_send_message',
              role: 'RIDER',
              userIds: targetIds.length > 0 ? targetIds : undefined,
              title: bulkMsgTitle.trim(),
              message: bulkMsgBody.trim(),
              titleEn: bulkMsgTitleEn.trim(),
              messageEn: bulkMsgBodyEn.trim(),
              type: bulkMsgType,
            }, t('bulkBroadcastSuccess'));
            if (ok) {
              setIsBulkMessageOpen(false);
              setBulkMsgBody('');
              setBulkMsgTitleEn('');
              setBulkMsgBodyEn('');
              clearSelection();
            }
          } finally {
            setSubmittingBulkMessage(false);
          }
        }}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />
    </>
  );
}
