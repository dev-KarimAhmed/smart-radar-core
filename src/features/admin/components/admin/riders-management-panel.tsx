'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useRidersManagement } from '@/features/admin/hooks/use-riders-management';
import { RidersHeader } from './parts/riders-header';
import { RidersStatsBar } from './parts/riders-stats-bar';
import { RidersFilterControls } from './parts/riders-filter-controls';
import { RidersSelectionBar } from './parts/riders-selection-bar';
import { RidersTable } from './parts/riders-table';
import { RiderManagementModals } from './parts/rider-management-modals';
import { AdminRiderInactivitySimulationPanel } from './admin-rider-inactivity-simulation-panel';

// Re-export type for 100% backward compatibility
export type { RiderUser } from '@/features/admin/types/rider-management';

export function RidersManagementPanel() {
  const manager = useRidersManagement();
  const {
    t,
    isArabic,
    direction,
    riders,
    loading,
    fetchRiders,
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
    resetAllFilters,
    hasActiveFilter,
    selectedRiderIds,
    handleSelectAll,
    handleToggleSelect,
    clearSelection,
    filteredRiders,
    stats,
    setInspectRider,
    setSecurityRider,
    setTargetStatus,
    isSimulationOpen,
    setIsSimulationOpen,
    simulationRiderId,
    setSimulationRiderId,
    handleOpenSimulationForRider,
    setMessageRider,
    setMessageTitle,
    setMessageBody,
    setMessageTitleEn,
    setMessageBodyEn,
    setMessageType,
    setIsBulkMessageOpen,
    setBulkScope,
    setBulkMsgTitle,
    setBulkMsgTitleEn,
    setBulkMsgBodyEn,
  } = manager;

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Actions */}
      <RidersHeader
        isSimulationOpen={isSimulationOpen}
        onToggleSimulation={() => setIsSimulationOpen((prev) => !prev)}
        onOpenBulkMessage={() => {
          setBulkScope(selectedRiderIds.size > 0 ? 'selected' : 'all');
          setBulkMsgTitle(isArabic ? 'إشعار توجيهي من إدارة المنظومة' : 'Directive Notification from System Administration');
          setBulkMsgTitleEn('');
          setBulkMsgBodyEn('');
          setIsBulkMessageOpen(true);
        }}
        onRefresh={() => fetchRiders()}
        loading={loading}
        t={t}
      />

      {/* Inactivity Simulation Panel */}
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
      <RidersStatsBar stats={stats} isArabic={isArabic} t={t} />

      {/* 3. Search and Multi-filter Controls */}
      <RidersFilterControls
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        immunityFilter={immunityFilter}
        onImmunityFilterChange={setImmunityFilter}
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        geoLookup={geoLookup}
        onCountryChange={handleCountryChange}
        onGovernorateChange={handleGovernorateChange}
        onDistrictChange={handleDistrictChange}
        onResetGeo={handleResetGeo}
        onResetAllFilters={resetAllFilters}
        isArabic={isArabic}
        t={t}
      />

      {/* Sticky Floating Action Bar for Selected Riders */}
      <RidersSelectionBar
        selectedCount={selectedRiderIds.size}
        onOpenBulkSelected={() => {
          setBulkScope('selected');
          setBulkMsgTitle(isArabic ? 'إشعار توجيهي من إدارة المنظومة' : 'Directive Notification from System Administration');
          setBulkMsgTitleEn('');
          setBulkMsgBodyEn('');
          setIsBulkMessageOpen(true);
        }}
        onClearSelection={clearSelection}
        t={t}
      />

      {/* 4. Riders Data Table */}
      <RidersTable
        loading={loading}
        filteredRiders={filteredRiders}
        hasActiveFilter={hasActiveFilter}
        selectedRiderIds={selectedRiderIds}
        onSelectAll={handleSelectAll}
        onToggleSelect={handleToggleSelect}
        onOpenSimulation={handleOpenSimulationForRider}
        onInspect={(rider) => setInspectRider(rider)}
        onSecurity={(rider) => {
          setSecurityRider(rider);
          setTargetStatus(rider.status);
        }}
        onMessage={(rider) => {
          setMessageRider(rider);
          setMessageTitle(isArabic ? 'رسالة من إدارة المنظومة' : 'Directive from Platform Administration');
          setMessageBody('');
          setMessageTitleEn('');
          setMessageBodyEn('');
          setMessageType('admin_message');
        }}
        isArabic={isArabic}
        t={t}
      />

      {/* Modals Container */}
      <RiderManagementModals manager={manager} />
    </div>
  );
}
