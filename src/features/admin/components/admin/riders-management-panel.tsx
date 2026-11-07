'use client';

import React from 'react';
import {
  Users,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Send,
  FlaskConical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AdminRiderInactivitySimulationPanel } from './admin-rider-inactivity-simulation-panel';
import { RiderUser, styles } from './riders/riders-types';
import { useRidersManagement } from './riders/use-riders-management';
import { RiderKpiBar } from './riders/rider-kpi-bar';
import { RiderFilterToolbar } from './riders/rider-filter-toolbar';
import { RiderSelectedFloatingBar } from './riders/rider-selected-floating-bar';
import { RiderInspectDialog } from './riders/rider-inspect-dialog';
import { RiderSecurityDialog } from './riders/rider-security-dialog';
import { RiderMessageDialog } from './riders/rider-message-dialog';
import { RiderBulkMessageDialog } from './riders/rider-bulk-message-dialog';
import { RiderTableRow } from './riders/rider-table-row';
import { getRiderStatusBadge, getRiderImmunityBadge } from './riders/rider-badges';

export type { RiderUser };

export function RidersManagementPanel() {
  const {
    t,
    direction,
    isArabic,
    riders,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    immunityFilter,
    setImmunityFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    selectedRiderIds,
    setSelectedRiderIds,
    inspectRider,
    setInspectRider,
    securityRider,
    setSecurityRider,
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
    handleTranslateDirect,
    messageType,
    setMessageType,
    submittingMessage,
    setSubmittingMessage,
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
    handleTranslateBulk,
    bulkMsgType,
    setBulkMsgType,
    submittingBulkMessage,
    setSubmittingBulkMessage,
    targetStatus,
    setTargetStatus,
    submittingAction,
    fetchRiders,
    executeAdminAction,
    filteredRiders,
    handleSelectAll,
    handleToggleSelect,
    stats,
  } = useRidersManagement();

  const getStatusBadge = (status: string) => getRiderStatusBadge(status, t, isArabic);
  const getImmunityBadge = (score: number) => getRiderImmunityBadge(score, t);

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Inactivity Simulation Toggle */}
          <Button
            type="button"
            onClick={() => setIsSimulationOpen((prev) => !prev)}
            className={cn(
              "font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md",
              isSimulationOpen
                ? "bg-amber-500 text-slate-950 border border-amber-400 shadow-amber-500/25 ring-1 ring-amber-400/50"
                : "border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
            )}
            title={t('simulationSubtitle')}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t('simulationToggleBtn')}</span>
          </Button>

          {/* Global Bulk Message / Notification Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedRiderIds.size > 0 ? 'selected' : 'all');
              setIsBulkMessageOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkMessageTooltip')}
          >
            <Send className="w-4 h-4 ml-0.5" />
            <span>{t('bulkMessageBtn')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fetchRiders()}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-cyan-400", loading && "animate-spin")} />
            <span>{t('refreshBtn')}</span>
          </Button>
        </div>
      </div>

      {/* Inactivity & Activity Simulation Panel */}
      {isSimulationOpen && (
        <AdminRiderInactivitySimulationPanel
          riders={riders}
          selectedRiderId={simulationRiderId}
          onSelectRider={(id) => setSimulationRiderId(id)}
          onRefresh={() => fetchRiders(true)}
          onClose={() => setIsSimulationOpen(false)}
          isArabic={isArabic}
        />
      )}

      {/* 2. KPI Summary Bar */}
      <RiderKpiBar stats={stats} isArabic={isArabic} t={t} />

      {/* 3. Search and Multi-filter Controls */}
      <RiderFilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        immunityFilter={immunityFilter}
        setImmunityFilter={setImmunityFilter}
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        geoLookup={geoLookup}
        onCountryChange={handleCountryChange}
        onGovernorateChange={handleGovernorateChange}
        onDistrictChange={handleDistrictChange}
        onResetGeo={handleResetGeo}
        isArabic={isArabic}
        t={t}
      />

      {/* Sticky Floating Action Bar for Selected Riders */}
      <RiderSelectedFloatingBar
        selectedCount={selectedRiderIds.size}
        onOpenBulkMessage={() => {
          setBulkScope('selected');
          setIsBulkMessageOpen(true);
        }}
        onClearSelection={() => setSelectedRiderIds(new Set())}
        t={t}
      />

      {/* 4. Riders Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-xs font-bold">{t('loadingTable')}</p>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <ShieldCheck className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">{t('noRidersFound')}</p>
              <p className="text-xs text-slate-500">{t('noRidersFoundSub')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className="py-4 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredRiders.length > 0 && selectedRiderIds.size === filteredRiders.length}
                        onChange={handleSelectAll}
                        className="rounded border-white/20 bg-black/60 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                        title={t('selectAll')}
                      />
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colIdentity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colLocation')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colImmunity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colTrips')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colCancellations')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colStatus')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colActivity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiders.map((rider) => (
                    <RiderTableRow
                      key={rider.id}
                      rider={rider}
                      isSelected={selectedRiderIds.has(rider.id)}
                      onToggleSelect={handleToggleSelect}
                      onInspect={(r) => setInspectRider(r)}
                      onSecurity={(r) => {
                        setSecurityRider(r);
                        setTargetStatus(r.status);
                      }}
                      onMessage={(r) => {
                        setMessageRider(r);
                        setMessageTitle(isArabic ? 'رسالة من إدارة المنظومة' : 'Directive from Platform Administration');
                        setMessageBody('');
                        setMessageType('admin_message');
                      }}
                      onSimulate={handleOpenSimulationForRider}
                      getStatusBadge={getStatusBadge}
                      getImmunityBadge={getImmunityBadge}
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

      {/* MODALS */}
      <RiderInspectDialog
        rider={inspectRider}
        open={!!inspectRider}
        onClose={() => setInspectRider(null)}
        isArabic={isArabic}
        direction={direction}
        getStatusBadge={getStatusBadge}
        t={t}
      />

      <RiderSecurityDialog
        rider={securityRider}
        open={!!securityRider}
        onClose={() => setSecurityRider(null)}
        isArabic={isArabic}
        direction={direction}
        targetStatus={targetStatus}
        setTargetStatus={setTargetStatus}
        submittingAction={submittingAction}
        onResetPenalties={async (riderId) => {
          return await executeAdminAction(
            { action: 'reset_penalties', userId: riderId },
            t('riderResetSuccess')
          );
        }}
        onUpdateStatus={async (riderId, status) => {
          return await executeAdminAction(
            { action: 'update_status', userId: riderId, status },
            t('riderStatusUpdateSuccess', { status })
          );
        }}
        t={t}
      />

      <RiderMessageDialog
        rider={messageRider}
        open={!!messageRider}
        onClose={() => {
          setMessageRider(null);
          setMessageTitleEn('');
          setMessageBodyEn('');
        }}
        isArabic={isArabic}
        direction={direction}
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
        isTranslating={isTranslatingDirect}
        onTranslate={handleTranslateDirect}
        submittingMessage={submittingMessage}
        onSendMessage={async () => {
          if (!messageRider) return;
          setSubmittingMessage(true);
          try {
            const ok = await executeAdminAction(
              {
                action: 'send_message',
                userId: messageRider.id,
                title: messageTitle.trim(),
                message: messageBody.trim(),
                titleEn: messageTitleEn.trim(),
                messageEn: messageBodyEn.trim(),
                type: messageType,
              },
              t('directMsgSuccess')
            );
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
        t={t}
      />

      <RiderBulkMessageDialog
        open={isBulkMessageOpen}
        onClose={() => {
          setIsBulkMessageOpen(false);
          setBulkMsgTitleEn('');
          setBulkMsgBodyEn('');
        }}
        isArabic={isArabic}
        direction={direction}
        totalRidersCount={riders.length}
        selectedCount={selectedRiderIds.size}
        filteredCount={filteredRiders.length}
        bulkScope={bulkScope}
        setBulkScope={setBulkScope}
        bulkMsgTitle={bulkMsgTitle}
        setBulkMsgTitle={setBulkMsgTitle}
        bulkMsgBody={bulkMsgBody}
        setBulkMsgBody={setBulkMsgBody}
        bulkMsgTitleEn={bulkMsgTitleEn}
        setBulkMsgTitleEn={setBulkMsgTitleEn}
        bulkMsgBodyEn={bulkMsgBodyEn}
        setBulkMsgBodyEn={setBulkMsgBodyEn}
        bulkMsgType={bulkMsgType}
        setBulkMsgType={setBulkMsgType}
        isTranslating={isTranslatingBulk}
        onTranslate={handleTranslateBulk}
        submittingBulkMessage={submittingBulkMessage}
        onSendBulkMessage={async () => {
          let targetIds: string[] = [];
          if (bulkScope === 'selected') {
            targetIds = Array.from(selectedRiderIds);
          } else if (bulkScope === 'filtered') {
            targetIds = filteredRiders.map((r) => r.id);
          }

          setSubmittingBulkMessage(true);
          try {
            const ok = await executeAdminAction(
              {
                action: 'bulk_send_message',
                role: 'RIDER',
                userIds: targetIds.length > 0 ? targetIds : undefined,
                title: bulkMsgTitle.trim(),
                message: bulkMsgBody.trim(),
                titleEn: bulkMsgTitleEn.trim(),
                messageEn: bulkMsgBodyEn.trim(),
                type: bulkMsgType,
              },
              t('bulkBroadcastSuccess')
            );
            if (ok) {
              setIsBulkMessageOpen(false);
              setBulkMsgBody('');
              setBulkMsgTitleEn('');
              setBulkMsgBodyEn('');
              setSelectedRiderIds(new Set());
            }
          } finally {
            setSubmittingBulkMessage(false);
          }
        }}
        t={t}
      />
    </div>
  );
}
