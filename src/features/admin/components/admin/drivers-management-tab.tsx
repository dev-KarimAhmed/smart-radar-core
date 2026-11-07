'use client';

import React from 'react';
import { Check, Car, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types & Helpers re-exported for backwards compatibility
export { getCaptainCurrency, styles } from './captains/captains-types';
export type { CaptainUser } from './captains/captains-types';

import { styles } from './captains/captains-types';
import { useCaptainsManagement } from './captains/use-captains-management';
import { CaptainHeader } from './captains/captain-header';
import { CaptainKpiBar } from './captains/captain-kpi-bar';
import { CaptainFilterToolbar } from './captains/captain-filter-toolbar';
import { CaptainSelectedFloatingBar } from './captains/captain-selected-floating-bar';
import { CaptainTableRow } from './captains/captain-table-row';

import { CaptainInspectDialog } from './captains/dialogs/captain-inspect-dialog';
import { CaptainTopupDialog } from './captains/dialogs/captain-topup-dialog';
import { CaptainSecurityDialog } from './captains/dialogs/captain-security-dialog';
import { CaptainMessageDialog } from './captains/dialogs/captain-message-dialog';
import { CaptainBulkTopupDialog } from './captains/dialogs/captain-bulk-topup-dialog';
import { CaptainBulkMessageDialog } from './captains/dialogs/captain-bulk-message-dialog';
import { CaptainWelcomeHoursDialog } from './captains/dialogs/captain-welcome-hours-dialog';

export function DriversManagementTab() {
  const {
    t,
    isArabic,
    direction,
    captains,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    verificationFilter,
    setVerificationFilter,
    rankFilter,
    setRankFilter,
    languageFilter,
    setLanguageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    handleResetAllFilters,
    filteredCaptains,
    stats,
    selectedCaptainIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
    inspectCaptain,
    setInspectCaptain,
    topupCaptain,
    setTopupCaptain,
    securityCaptain,
    setSecurityCaptain,
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
    isTranslatingDirect,
    messageType,
    setMessageType,
    submittingMessage,
    handleTranslateDirect,
    minutesToAdd,
    setMinutesToAdd,
    extendDays,
    setExtendDays,
    cashBalanceToAdd,
    setCashBalanceToAdd,
    topupMode,
    setTopupMode,
    submittingAction,
    executeAdminAction,
    targetStatus,
    setTargetStatus,
    targetTier,
    setTargetTier,
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
    bulkExtendDays,
    setBulkExtendDays,
    bulkCashAmount,
    setBulkCashAmount,
    submittingBulkTopup,
    handleBulkTopup,
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
    handleTranslateBulk,
    handleBulkSendMessage,
    welcomeConfig,
    setWelcomeConfig,
    isWelcomeHoursOpen,
    setIsWelcomeHoursOpen,
    savingWelcomeConfig,
    applyingToExisting,
    handleSaveWelcomeSettings,
    handleApplyToExisting,
    fetchCaptains,
    handleToggleCaptainLanguage,
    getTargetCount,
  } = useCaptainsManagement();

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Actions */}
      <CaptainHeader
        t={t}
        isArabic={isArabic}
        welcomeConfig={welcomeConfig}
        onOpenWelcomeHours={() => setIsWelcomeHoursOpen(true)}
        onOpenBulkTopup={() => {
          setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
          setIsBulkTopupOpen(true);
        }}
        onOpenBulkMessage={() => {
          setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
          setIsBulkMessageOpen(true);
        }}
        onRefresh={() => fetchCaptains()}
        loading={loading}
      />

      {/* 2. KPI Summary Bar */}
      <CaptainKpiBar stats={stats} t={t} />

      {/* 3. Search and Multi-filter Controls */}
      <CaptainFilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        verificationFilter={verificationFilter}
        setVerificationFilter={setVerificationFilter}
        rankFilter={rankFilter}
        setRankFilter={setRankFilter}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        handleCountryChange={handleCountryChange}
        handleGovernorateChange={handleGovernorateChange}
        handleDistrictChange={handleDistrictChange}
        handleResetGeo={handleResetGeo}
        handleResetAllFilters={handleResetAllFilters}
        geoLookup={geoLookup}
        isArabic={isArabic}
        t={t}
      />

      {/* Floating / Sticky Bulk Action Bar for Selected Captains */}
      <CaptainSelectedFloatingBar
        selectedCount={selectedCaptainIds.size}
        onOpenBulkTopup={() => {
          setBulkScope('selected');
          setIsBulkTopupOpen(true);
        }}
        onOpenBulkMessage={() => {
          setBulkScope('selected');
          setIsBulkMessageOpen(true);
        }}
        onClearSelection={clearSelection}
        t={t}
      />

      {/* 4. Fleet Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              <p className="text-xs font-bold">{t('loadingTable')}</p>
            </div>
          ) : filteredCaptains.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Car className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">{t('noCaptainsFound')}</p>
              <p className="text-xs text-slate-500">{t('noCaptainsFoundSub')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead className={styles.tableHead}>
                  <tr>
                    {/* Master Checkbox Header */}
                    <th className="py-4 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                            : filteredCaptains.some(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6]/30 border-[#14B8A6] text-[#14B8A6]"
                            : "border-white/20 bg-black/40 hover:border-white/40"
                        )}
                        title={
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? t('deselectAllTooltip')
                            : t('selectAllTooltip')
                        }
                      >
                        {filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id)) ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : filteredCaptains.some(c => selectedCaptainIds.has(c.id)) ? (
                          <div className="w-2 h-0.5 bg-[#14B8A6] rounded" />
                        ) : null}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colIdentity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVehicle')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colFlightMinutes')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colRankRating')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVerification')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colOperational')}</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaptains.map((captain) => (
                    <CaptainTableRow
                      key={captain.id}
                      captain={captain}
                      isSelected={selectedCaptainIds.has(captain.id)}
                      onToggleSelect={toggleSelectOne}
                      onToggleLanguage={handleToggleCaptainLanguage}
                      onInspect={setInspectCaptain}
                      onTopup={(cap) => {
                        setTopupCaptain(cap);
                        setMinutesToAdd(60);
                        setExtendDays(30);
                        setCashBalanceToAdd(0);
                      }}
                      onSecurity={(cap) => {
                        setSecurityCaptain(cap);
                        setTargetStatus(cap.status);
                        setTargetTier((cap.tier || 'SILVER').toUpperCase());
                      }}
                      onMessage={(cap) => {
                        setMessageCaptain(cap);
                        setMessageTitle(t('msgSubjectDefault'));
                        setMessageBody('');
                        setMessageType('admin_message');
                      }}
                      isArabic={isArabic}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog 1: Inspect Captain Full Profile & Documents */}
      <CaptainInspectDialog
        captain={inspectCaptain}
        onClose={() => setInspectCaptain(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
        submittingAction={submittingAction}
        executeAdminAction={executeAdminAction}
      />

      {/* Dialog 2: Radar Flight Minutes Allocation & Top-Up */}
      <CaptainTopupDialog
        captain={topupCaptain}
        onClose={() => setTopupCaptain(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
        topupMode={topupMode}
        setTopupMode={setTopupMode}
        minutesToAdd={minutesToAdd}
        setMinutesToAdd={setMinutesToAdd}
        extendDays={extendDays}
        setExtendDays={setExtendDays}
        cashBalanceToAdd={cashBalanceToAdd}
        setCashBalanceToAdd={setCashBalanceToAdd}
        submittingAction={submittingAction}
        executeAdminAction={executeAdminAction}
      />

      {/* Dialog 3: Status, Penalties & Sovereign Anti-Cheat */}
      <CaptainSecurityDialog
        captain={securityCaptain}
        onClose={() => setSecurityCaptain(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
        targetStatus={targetStatus}
        setTargetStatus={setTargetStatus}
        targetTier={targetTier}
        setTargetTier={setTargetTier}
        submittingAction={submittingAction}
        executeAdminAction={executeAdminAction}
      />

      {/* Dialog 4: Send Direct Message & Administrative Directive */}
      <CaptainMessageDialog
        captain={messageCaptain}
        onClose={() => setMessageCaptain(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
        messageType={messageType}
        setMessageType={setMessageType}
        messageTitle={messageTitle}
        setMessageTitle={setMessageTitle}
        messageBody={messageBody}
        setMessageBody={setMessageBody}
        messageTitleEn={messageTitleEn}
        setMessageTitleEn={setMessageTitleEn}
        messageBodyEn={messageBodyEn}
        setMessageBodyEn={setMessageBodyEn}
        isTranslatingDirect={isTranslatingDirect}
        handleTranslateDirect={handleTranslateDirect}
        submittingMessage={submittingMessage}
        executeAdminAction={executeAdminAction}
      />

      {/* Dialog 5: Bulk Top-Up (Fleet / Selected / Filtered) */}
      <CaptainBulkTopupDialog
        open={isBulkTopupOpen}
        onOpenChange={setIsBulkTopupOpen}
        direction={direction}
        isArabic={isArabic}
        t={t}
        bulkScope={bulkScope}
        setBulkScope={setBulkScope}
        bulkTopupType={bulkTopupType}
        setBulkTopupType={setBulkTopupType}
        bulkMinutes={bulkMinutes}
        setBulkMinutes={setBulkMinutes}
        bulkExtendDays={bulkExtendDays}
        setBulkExtendDays={setBulkExtendDays}
        bulkCashAmount={bulkCashAmount}
        setBulkCashAmount={setBulkCashAmount}
        submittingBulkTopup={submittingBulkTopup}
        handleBulkTopup={handleBulkTopup}
        captains={captains}
        filteredCaptains={filteredCaptains}
        selectedCaptainIds={selectedCaptainIds}
        getTargetCount={getTargetCount}
      />

      {/* Dialog 6: Fleet Broadcast Notification System */}
      <CaptainBulkMessageDialog
        open={isBulkMessageOpen}
        onOpenChange={setIsBulkMessageOpen}
        direction={direction}
        isArabic={isArabic}
        t={t}
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
        handleTranslateBulk={handleTranslateBulk}
        submittingBulkMsg={submittingBulkMsg}
        handleBulkSendMessage={handleBulkSendMessage}
        captains={captains}
        filteredCaptains={filteredCaptains}
        selectedCaptainIds={selectedCaptainIds}
        getTargetCount={getTargetCount}
      />

      {/* Dialog 7: Sovereign Welcome Flight Hours Configuration Dialog */}
      <CaptainWelcomeHoursDialog
        open={isWelcomeHoursOpen}
        onOpenChange={setIsWelcomeHoursOpen}
        direction={direction}
        isArabic={isArabic}
        t={t}
        welcomeConfig={welcomeConfig}
        setWelcomeConfig={setWelcomeConfig}
        handleApplyToExisting={handleApplyToExisting}
        handleSaveWelcomeSettings={handleSaveWelcomeSettings}
        applyingToExisting={applyingToExisting}
        savingWelcomeConfig={savingWelcomeConfig}
      />
    </div>
  );
}
