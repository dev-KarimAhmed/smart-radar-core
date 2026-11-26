'use client';

import React from 'react';
import { useDriversManagement } from '@/features/admin/hooks/use-drivers-management';
import { DriversStatsHeader } from './parts/drivers-stats-header';
import { DriversFilterControls } from './parts/drivers-filter-controls';
import { DriversDataTable } from './parts/drivers-data-table';
import { DriverManagementModals } from './parts/driver-management-modals';

export type { CaptainUser } from '@/features/admin/types/driver-management';
export { getCaptainCurrency } from '@/features/admin/types/driver-management';

export function DriversManagementTab() {
  const manager = useDriversManagement();
  const {
    welcomeConfig,
    setIsWelcomeHoursOpen,
    setIsBulkTopupOpen,
    setIsBulkMessageOpen,
    fetchCaptains,
    loading,
    isArabic,
    direction,
    t,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
    handleApplyFilters,
    handleResetAllFilters,
    hasDraftFilter,
    hasActiveFilter,
    hasPendingChanges,
    captains,
    filteredCaptains,
    selectedCaptainIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
    handleOpenBulkTopupForSelected,
    handleOpenBulkMessageForSelected,
    setInspectCaptain,
    setTopupCaptain,
    setSecurityCaptain,
    setMessageCaptain,
    handleToggleCaptainLanguage,
  } = manager;

  return (
    <div className="space-y-6" dir={direction}>
      {/* 1. Header & Actions */}
      <DriversStatsHeader
        welcomeConfig={welcomeConfig}
        onOpenWelcomeHours={() => setIsWelcomeHoursOpen(true)}
        onOpenBulkTopup={() => setIsBulkTopupOpen(true)}
        onOpenBulkMessage={() => setIsBulkMessageOpen(true)}
        onRefresh={() => fetchCaptains()}
        loading={loading}
        isArabic={isArabic}
        t={t}
      />

      {/* 2. Search, Filters & Geo Navigation Bar */}
      <DriversFilterControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        rankFilter={rankFilter}
        setRankFilter={setRankFilter}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        geoLookup={geoLookup}
        onCountryChange={handleCountryChange}
        onGovernorateChange={handleGovernorateChange}
        onDistrictChange={handleDistrictChange}
        onResetGeo={handleResetGeo}
        onApplyFilters={handleApplyFilters}
        onResetAllFilters={handleResetAllFilters}
        hasDraftFilter={hasDraftFilter}
        hasActiveFilter={hasActiveFilter}
        hasPendingChanges={hasPendingChanges}
        loading={loading}
        isArabic={isArabic}
        t={t}
      />

      {/* 3. Captains Data Table with Selection & Inline Actions */}
      <DriversDataTable
        captains={captains}
        filteredCaptains={filteredCaptains}
        hasActiveFilter={hasActiveFilter}
        loading={loading}
        selectedCaptainIds={selectedCaptainIds}
        onToggleSelectOne={toggleSelectOne}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        onOpenBulkTopupForSelected={handleOpenBulkTopupForSelected}
        onOpenBulkMessageForSelected={handleOpenBulkMessageForSelected}
        onInspect={(cap) => setInspectCaptain(cap)}
        onTopup={(cap) => setTopupCaptain(cap)}
        onSecurity={(cap) => setSecurityCaptain(cap)}
        onMessage={(cap) => setMessageCaptain(cap)}
        onToggleLanguage={handleToggleCaptainLanguage}
        isArabic={isArabic}
        t={t}
      />

      {/* 4. Modals Container (Inspect, Topup, Security, Message, Bulk, Welcome Hours) */}
      <DriverManagementModals manager={manager} />
    </div>
  );
}
