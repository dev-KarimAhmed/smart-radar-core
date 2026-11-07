'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { HourlyRatesManagementPanel } from './hourly-rates-management-panel';
import { TransferChannelsPanel } from './panels/transfer-channels-panel';
import { FinancialDelegatesPanel } from './panels/financial-delegates-panel';
import { useWalletManagement } from './wallet/use-wallet-management';
import { WalletHeaderStats } from './wallet/wallet-header-stats';
import { WalletReceiptsPanel } from './wallet/panels/wallet-receipts-panel';
import { WalletDirectCreditPanel } from './wallet/panels/wallet-direct-credit-panel';
import { WalletVouchersPanel } from './wallet/panels/wallet-vouchers-panel';
import { WalletLedgerPanel } from './wallet/panels/wallet-ledger-panel';
import { WalletReceiptDialogs } from './wallet/dialogs/wallet-receipt-dialogs';
import type {
  WalletOverview,
  ReceiptItem,
  VoucherItem,
  LedgerItem,
  CaptainOption,
  WalletSubTab,
} from './wallet/wallet-types';

export type {
  WalletOverview,
  ReceiptItem,
  VoucherItem,
  LedgerItem,
  CaptainOption,
  WalletSubTab,
};

export function WalletManagementTab() {
  const {
    t,
    direction,
    isArabic,
    activeSubTab,
    setActiveSubTab,
    loadingOverview,
    loadingData,
    overview,
    receipts,
    ledger,
    receiptStatusFilter,
    setReceiptStatusFilter,
    searchQuery,
    setSearchQuery,
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
    captainsList,
    loadingCaptains,
    selectedCaptain,
    setSelectedCaptain,
    directCashAmount,
    setDirectCashAmount,
    directMinutes,
    setDirectMinutes,
    directExtendDays,
    setDirectExtendDays,
    directNote,
    setDirectNote,
    submittingDirectTopup,
    voucherMinutes,
    setVoucherMinutes,
    voucherCount,
    setVoucherCount,
    generatingVouchers,
    copiedCode,
    togglingSelfTopup,
    loadOverview,
    loadSubTabData,
    handleApproveReceipt,
    handleRejectReceipt,
    handleDirectTopupSubmit,
    handleGenerateVouchers,
    handleToggleSelfTopup,
    handleCopyCode,
    handleSendReceiptMessage,
    filteredReceipts,
    filteredVouchers,
  } = useWalletManagement();

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* Financial KPIs & Navigation Tabs */}
      <WalletHeaderStats
        overview={overview}
        loadingOverview={loadingOverview}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        loadingData={loadingData}
        togglingSelfTopup={togglingSelfTopup}
        onToggleSelfTopup={handleToggleSelfTopup}
        onRefresh={() => {
          void loadOverview();
          void loadSubTabData(activeSubTab);
        }}
        t={t}
      />

      {/* Subtab 1: Receipts Audit */}
      {activeSubTab === 'receipts' && (
        <WalletReceiptsPanel
          receipts={receipts}
          filteredReceipts={filteredReceipts}
          loadingData={loadingData}
          receiptStatusFilter={receiptStatusFilter}
          setReceiptStatusFilter={setReceiptStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onPreviewReceipt={(r) => setSelectedReceiptForPreview(r)}
          onOpenApproveModal={(r) => {
            setReceiptToApprove(r);
            setApproveCreditType('CASH');
            setApproveCustomMinutes(Math.round(r.amount * 60));
            setApproveAdminNote('');
          }}
          onOpenRejectModal={(r) => {
            setReceiptToReject(r);
            setRejectReason('');
          }}
          onOpenMessageModal={(r) => {
            setMessageReceiptItem(r);
            setReceiptMessageTitle(isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt');
            setReceiptMessageBody('');
          }}
          isArabic={isArabic}
          t={t}
        />
      )}

      {/* Subtab 2: Direct Top-up */}
      {activeSubTab === 'direct' && (
        <WalletDirectCreditPanel
          captainsList={captainsList}
          loadingCaptains={loadingCaptains}
          selectedCaptain={selectedCaptain}
          setSelectedCaptain={setSelectedCaptain}
          directCashAmount={directCashAmount}
          setDirectCashAmount={setDirectCashAmount}
          directMinutes={directMinutes}
          setDirectMinutes={setDirectMinutes}
          directExtendDays={directExtendDays}
          setDirectExtendDays={setDirectExtendDays}
          directNote={directNote}
          setDirectNote={setDirectNote}
          submittingDirectTopup={submittingDirectTopup}
          onSubmit={handleDirectTopupSubmit}
          isArabic={isArabic}
          t={t}
        />
      )}

      {/* Subtab 3: Vouchers Generator */}
      {activeSubTab === 'vouchers' && (
        <WalletVouchersPanel
          filteredVouchers={filteredVouchers}
          voucherMinutes={voucherMinutes}
          setVoucherMinutes={setVoucherMinutes}
          voucherCount={voucherCount}
          setVoucherCount={setVoucherCount}
          generatingVouchers={generatingVouchers}
          copiedCode={copiedCode}
          onGenerateVouchers={handleGenerateVouchers}
          onCopyCode={handleCopyCode}
          isArabic={isArabic}
          t={t}
        />
      )}

      {/* Subtab 4: Financial Ledger */}
      {activeSubTab === 'ledger' && (
        <WalletLedgerPanel
          ledger={ledger}
          isArabic={isArabic}
          t={t}
        />
      )}

      {/* Subtab 5: Hourly Rates Regional */}
      {activeSubTab === 'rates' && (
        <HourlyRatesManagementPanel />
      )}

      {/* Subtab 6: Transfer Channels */}
      {activeSubTab === 'channels' && (
        <TransferChannelsPanel />
      )}

      {/* Subtab 7: Financial Delegates */}
      {activeSubTab === 'delegates' && (
        <FinancialDelegatesPanel />
      )}

      {/* Receipt Action Dialogs */}
      <WalletReceiptDialogs
        isArabic={isArabic}
        direction={direction}
        t={t}
        selectedReceiptForPreview={selectedReceiptForPreview}
        setSelectedReceiptForPreview={setSelectedReceiptForPreview}
        receiptToApprove={receiptToApprove}
        setReceiptToApprove={setReceiptToApprove}
        approveCreditType={approveCreditType}
        setApproveCreditType={setApproveCreditType}
        approveCustomMinutes={approveCustomMinutes}
        setApproveCustomMinutes={setApproveCustomMinutes}
        approveAdminNote={approveAdminNote}
        setApproveAdminNote={setApproveAdminNote}
        submittingModalAction={submittingModalAction}
        onApproveReceipt={handleApproveReceipt}
        receiptToReject={receiptToReject}
        setReceiptToReject={setReceiptToReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onRejectReceipt={handleRejectReceipt}
        messageReceiptItem={messageReceiptItem}
        setMessageReceiptItem={setMessageReceiptItem}
        receiptMessageTitle={receiptMessageTitle}
        setReceiptMessageTitle={setReceiptMessageTitle}
        receiptMessageBody={receiptMessageBody}
        setReceiptMessageBody={setReceiptMessageBody}
        submittingReceiptMessage={submittingReceiptMessage}
        onSendReceiptMessage={handleSendReceiptMessage}
      />
    </div>
  );
}
