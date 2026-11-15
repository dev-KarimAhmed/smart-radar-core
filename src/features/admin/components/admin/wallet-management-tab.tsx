'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAdminWallet } from '@/features/admin/hooks/use-admin-wallet';
import { HourlyRatesManagementPanel } from './hourly-rates-management-panel';
import { TransferChannelsPanel } from './panels/transfer-channels-panel';
import { FinancialDelegatesPanel } from './panels/financial-delegates-panel';
import { WalletOverviewKPIs } from './parts/wallet-overview-kpis';
import { WalletSubtabNav } from './parts/wallet-subtab-nav';
import { WalletReceiptsSubtab } from './parts/wallet-receipts-subtab';
import { WalletDirectTopupSubtab } from './parts/wallet-direct-topup-subtab';
import { WalletVouchersSubtab } from './parts/wallet-vouchers-subtab';
import { WalletLedgerSubtab } from './parts/wallet-ledger-subtab';
import { WalletManagementModals } from './parts/wallet-management-modals';

export function WalletManagementTab() {
  const manager = useAdminWallet();
  const {
    t,
    isArabic,
    direction,
    activeSubTab,
    setActiveSubTab,
    loadingOverview,
    loadingData,
    overview,
    ledger,
    captainsList,
    loadingCaptains,
    receiptStatusFilter,
    setReceiptStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredReceipts,
    filteredVouchers,
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
    handleDirectTopupSubmit,
    voucherMinutes,
    setVoucherMinutes,
    voucherCount,
    setVoucherCount,
    generatingVouchers,
    handleGenerateVouchers,
    copiedCode,
    handleCopyCode,
    togglingSelfTopup,
    loadOverview,
    loadSubTabData,
    handleToggleSelfTopup,
    setSelectedReceiptForPreview,
    setReceiptToApprove,
    setApproveCreditType,
    setApproveCustomMinutes,
    setApproveAdminNote,
    setReceiptToReject,
    setRejectReason,
    setMessageReceiptItem,
    setReceiptMessageTitle,
    setReceiptMessageBody,
    setReceiptMessageType,
  } = manager;

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. KPIs */}
      <WalletOverviewKPIs
        overview={overview}
        loadingOverview={loadingOverview}
        togglingSelfTopup={togglingSelfTopup}
        onToggleSelfTopup={handleToggleSelfTopup}
        t={t}
      />

      {/* 2. Sub-Navigation */}
      <WalletSubtabNav
        activeSubTab={activeSubTab}
        onSelectSubTab={setActiveSubTab}
        pendingReceiptsCount={overview?.pendingReceiptsCount ?? 0}
        loading={loadingData || loadingOverview}
        onRefresh={() => {
          void loadOverview();
          void loadSubTabData(activeSubTab);
        }}
        t={t}
      />

      {/* 3. Sub-Tab Content */}
      {activeSubTab === 'receipts' && (
        <WalletReceiptsSubtab
          receipts={filteredReceipts}
          loading={loadingData}
          statusFilter={receiptStatusFilter}
          onStatusFilterChange={setReceiptStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPreviewReceipt={setSelectedReceiptForPreview}
          onOpenApproveModal={(rcpt) => {
            setReceiptToApprove(rcpt);
            setApproveCreditType('CASH');
            setApproveCustomMinutes(Math.round(rcpt.amount * 60));
            setApproveAdminNote('');
          }}
          onOpenRejectModal={(rcpt) => {
            setReceiptToReject(rcpt);
            setRejectReason('');
          }}
          onOpenMessageModal={(rcpt) => {
            setMessageReceiptItem(rcpt);
            setReceiptMessageTitle(isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt');
            setReceiptMessageBody('');
            setReceiptMessageType('admin_message');
          }}
          isArabic={isArabic}
          t={t}
        />
      )}

      {activeSubTab === 'direct' && (
        <WalletDirectTopupSubtab
          captainsList={captainsList}
          loadingCaptains={loadingCaptains}
          selectedCaptain={selectedCaptain}
          onSelectCaptain={setSelectedCaptain}
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

      {activeSubTab === 'vouchers' && (
        <WalletVouchersSubtab
          vouchers={filteredVouchers}
          voucherMinutes={voucherMinutes}
          setVoucherMinutes={setVoucherMinutes}
          voucherCount={voucherCount}
          setVoucherCount={setVoucherCount}
          generatingVouchers={generatingVouchers}
          onGenerateVouchers={handleGenerateVouchers}
          copiedCode={copiedCode}
          onCopyCode={handleCopyCode}
          isArabic={isArabic}
          t={t}
        />
      )}

      {activeSubTab === 'ledger' && (
        <WalletLedgerSubtab
          ledger={ledger}
          isArabic={isArabic}
          t={t}
        />
      )}

      {activeSubTab === 'rates' && <HourlyRatesManagementPanel />}
      {activeSubTab === 'channels' && <TransferChannelsPanel />}
      {activeSubTab === 'delegates' && <FinancialDelegatesPanel />}

      {/* 4. Modals */}
      <WalletManagementModals manager={manager} />
    </div>
  );
}
