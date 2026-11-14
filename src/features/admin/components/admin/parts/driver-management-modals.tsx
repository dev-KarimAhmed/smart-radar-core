'use client';

import React from 'react';
import type { UseDriversManagementReturn } from '@/features/admin/hooks/use-drivers-management';
import { DriverInspectModal } from './driver-inspect-modal';
import { DriverTopupModal } from './driver-topup-modal';
import { DriverSecurityModal } from './driver-security-modal';
import { DriverMessageModal } from './driver-message-modal';
import { DriversBulkTopupModal } from './drivers-bulk-topup-modal';
import { DriversBulkMessageModal } from './drivers-bulk-message-modal';
import { DriversWelcomeHoursModal } from './drivers-welcome-hours-modal';

interface DriverManagementModalsProps {
  manager: UseDriversManagementReturn;
}

export function DriverManagementModals({ manager }: DriverManagementModalsProps) {
  const {
    inspectCaptain,
    setInspectCaptain,
    handleApproveCaptain,
    topupCaptain,
    setTopupCaptain,
    topupMode,
    setTopupMode,
    minutesToAdd,
    setMinutesToAdd,
    cashBalanceToAdd,
    setCashBalanceToAdd,
    extendDays,
    handleTopupSubmit,
    securityCaptain,
    setSecurityCaptain,
    targetStatus,
    setTargetStatus,
    targetTier,
    setTargetTier,
    handleResetPenalties,
    handleClearTrip,
    handleSaveSecurityActions,
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
    messageType,
    setMessageType,
    isTranslatingDirect,
    handleTranslateDirect,
    submittingMessage,
    handleSendMessage,
    submittingAction,
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
    bulkCashAmount,
    setBulkCashAmount,
    submittingBulkTopup,
    handleBulkTopup,
    bulkMsgType,
    setBulkMsgType,
    bulkMsgTitle,
    setBulkMsgTitle,
    bulkMsgBody,
    setBulkMsgBody,
    bulkMsgTitleEn,
    setBulkMsgTitleEn,
    bulkMsgBodyEn,
    setBulkMsgBodyEn,
    isTranslatingBulk,
    handleTranslateBulk,
    submittingBulkMsg,
    handleBulkSendMessage,
    getTargetCount,
    getTargetList,
    captains,
    selectedCaptainIds,
    filteredCaptains,
    isWelcomeHoursOpen,
    setIsWelcomeHoursOpen,
    welcomeConfig,
    setWelcomeConfig,
    savingWelcomeConfig,
    applyingToExisting,
    handleSaveWelcomeSettings,
    handleApplyToExisting,
    isArabic,
    direction,
    t,
  } = manager;

  return (
    <>
      <DriverInspectModal
        captain={inspectCaptain}
        onClose={() => setInspectCaptain(null)}
        onApprove={handleApproveCaptain}
        submittingAction={submittingAction}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriverTopupModal
        captain={topupCaptain}
        onClose={() => setTopupCaptain(null)}
        topupMode={topupMode}
        setTopupMode={setTopupMode}
        minutesToAdd={minutesToAdd}
        setMinutesToAdd={setMinutesToAdd}
        cashBalanceToAdd={cashBalanceToAdd}
        setCashBalanceToAdd={setCashBalanceToAdd}
        extendDays={extendDays}
        onConfirm={handleTopupSubmit}
        submittingAction={submittingAction}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriverSecurityModal
        captain={securityCaptain}
        onClose={() => setSecurityCaptain(null)}
        targetStatus={targetStatus}
        setTargetStatus={setTargetStatus}
        targetTier={targetTier}
        setTargetTier={setTargetTier}
        onResetPenalties={handleResetPenalties}
        onClearTrip={handleClearTrip}
        onSaveSecurityActions={handleSaveSecurityActions}
        submittingAction={submittingAction}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriverMessageModal
        captain={messageCaptain}
        onClose={() => setMessageCaptain(null)}
        messageTitle={messageTitle}
        setMessageTitle={setMessageTitle}
        messageBody={messageBody}
        setMessageBody={setMessageBody}
        messageTitleEn={messageTitleEn}
        setMessageTitleEn={setMessageTitleEn}
        messageBodyEn={messageBodyEn}
        setMessageBodyEn={setMessageBodyEn}
        messageType={messageType}
        setMessageType={setMessageType}
        isTranslatingDirect={isTranslatingDirect}
        onTranslateDirect={handleTranslateDirect}
        submittingMessage={submittingMessage}
        onSendMessage={handleSendMessage}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriversBulkTopupModal
        isOpen={isBulkTopupOpen}
        onClose={() => setIsBulkTopupOpen(false)}
        bulkScope={bulkScope}
        setBulkScope={setBulkScope}
        bulkTopupType={bulkTopupType}
        setBulkTopupType={setBulkTopupType}
        bulkMinutes={bulkMinutes}
        setBulkMinutes={setBulkMinutes}
        bulkCashAmount={bulkCashAmount}
        setBulkCashAmount={setBulkCashAmount}
        totalCaptainsCount={captains.length}
        selectedCount={selectedCaptainIds.size}
        filteredCount={filteredCaptains.length}
        targetCount={getTargetCount(bulkScope)}
        submittingBulkTopup={submittingBulkTopup}
        onConfirm={handleBulkTopup}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriversBulkMessageModal
        isOpen={isBulkMessageOpen}
        onClose={() => setIsBulkMessageOpen(false)}
        bulkScope={bulkScope}
        setBulkScope={setBulkScope}
        bulkMsgType={bulkMsgType}
        setBulkMsgType={setBulkMsgType}
        bulkMsgTitle={bulkMsgTitle}
        setBulkMsgTitle={setBulkMsgTitle}
        bulkMsgBody={bulkMsgBody}
        setBulkMsgBody={setBulkMsgBody}
        bulkMsgTitleEn={bulkMsgTitleEn}
        setBulkMsgTitleEn={setBulkMsgTitleEn}
        bulkMsgBodyEn={bulkMsgBodyEn}
        setBulkMsgBodyEn={setBulkMsgBodyEn}
        isTranslatingBulk={isTranslatingBulk}
        onTranslateBulk={handleTranslateBulk}
        totalCaptainsCount={captains.length}
        selectedCount={selectedCaptainIds.size}
        filteredCount={filteredCaptains.length}
        targetCount={getTargetCount(bulkScope)}
        targetList={getTargetList(bulkScope)}
        submittingBulkMsg={submittingBulkMsg}
        onSend={handleBulkSendMessage}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      <DriversWelcomeHoursModal
        open={isWelcomeHoursOpen}
        onOpenChange={setIsWelcomeHoursOpen}
        welcomeConfig={welcomeConfig}
        setWelcomeConfig={setWelcomeConfig}
        saving={savingWelcomeConfig}
        applying={applyingToExisting}
        onSave={handleSaveWelcomeSettings}
        onApplyExisting={handleApplyToExisting}
        t={t}
      />
    </>
  );
}
