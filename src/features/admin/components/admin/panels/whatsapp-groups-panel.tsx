'use client';

import { Loader2, MapPin, MessageSquare, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdminWhatsAppGroups } from '@/features/admin/hooks/use-admin-whatsapp-groups';
import type { AdminWhatsAppGroupLinkItem, WhatsAppGroupActivityFilter, WhatsAppGroupZoneSortMode } from '@/features/whatsapp-groups/contract';
import { cn } from '@/lib/utils';
import { WhatsappGroupCard } from './whatsapp-group-card';
import { WhatsappGroupCreateModal } from './whatsapp-group-create-modal';
import { WhatsappGroupUiPreviewBar } from './whatsapp-group-ui-preview-bar';

const styles = {
  rootRtl: 'space-y-6 font-sans text-right',
  rootLtr: 'space-y-6 font-sans text-left',
  headerCard: 'bg-[#090e1a] border border-teal-500/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
  headerInfo: 'space-y-1.5',
  headerTitleRow: 'flex items-center gap-2.5',
  headerIconWrap: 'w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400',
  headerIcon: 'w-5 h-5',
  headerTitle: 'text-base sm:text-lg font-black text-white',
  headerSubtitle: 'text-xs text-slate-400 leading-relaxed max-w-2xl',
  headerActions: 'flex items-center gap-2 flex-wrap',
  refreshBtn: 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-9 rounded-xl',
  createBtn: 'bg-[#14B8A6] hover:bg-teal-400 text-[#0B0F19] font-black text-xs h-9 rounded-xl shadow-sm',
  btnIcon: 'w-4 h-4',
  kpiGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-3.5',
  kpiCard: 'bg-[#090e1a] border border-white/10 rounded-2xl',
  kpiHeader: 'pb-1.5 pt-4 px-4',
  kpiLabel: 'text-xs text-slate-400 font-bold',
  kpiContent: 'px-4 pb-4',
  kpiValueTeal: 'text-2xl font-black text-[#14B8A6] font-mono',
  kpiValueEmerald: 'text-2xl font-black text-emerald-400 font-mono',
  kpiValueWhite: 'text-2xl font-black text-white font-mono',
  kpiValueSlate: 'text-xl font-black text-slate-100 font-mono',
  kpiSubtle: 'text-[11px] text-slate-400 mt-1 block',
  toolbarCard: 'bg-[#090e1a] border border-white/10 rounded-2xl p-4 space-y-3',
  toolbarRow: 'flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between',
  searchWrap: 'relative flex-1',
  searchIcon: 'w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none',
  searchInput: 'bg-[#0B0F19] border-white/10 text-white text-xs h-9 rounded-xl ps-9',
  filterRow: 'flex items-center gap-1.5 flex-wrap',
  filterBtnActive: 'bg-[#14B8A6] text-[#0B0F19] font-black text-xs h-8 px-3 rounded-xl',
  filterBtnIdle: 'border-white/10 bg-[#0B0F19] text-slate-300 hover:bg-white/5 text-xs h-8 px-3 rounded-xl',
  zoneFiltersGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 border-t border-white/5',
  selectWrap: 'space-y-1',
  selectLabel: 'text-[11px] text-slate-400 font-bold flex items-center gap-1',
  selectIcon: 'w-3 h-3 text-teal-400',
  selectInput: 'w-full bg-[#0B0F19] border border-white/10 text-slate-200 text-xs h-9 rounded-xl px-2.5 focus:outline-none focus:border-teal-500/50',
  resetWrap: 'flex items-end',
  resetBtn: 'w-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-9 rounded-xl',
  loadingBox: 'bg-[#090e1a] border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center gap-3',
  spinner: 'w-6 h-6 animate-spin text-teal-400',
  loadingText: 'text-xs text-slate-400',
  emptyBox: 'bg-[#090e1a] border border-dashed border-white/15 rounded-2xl p-10 text-center space-y-2',
  emptyTitle: 'text-sm font-black text-white',
  emptyDesc: 'text-xs text-slate-400',
  listGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
} as const;

export function WhatsappGroupsPanel() {
  const t = useTranslations('adminWhatsappGroups');
  const { isArabic, direction } = useDashboardLanguage();
  const {
    captains, leaderGroupCounts, summary, totalGroupsOverall, activeGroupsOverall, totalMembersOverall, displayActiveCaptains, displayActiveRiders, hasActiveFilters, canResetFilters, schemaReady, monthlySchemaReady,
    filteredCards, governorateOptions, districtOptions,
    totalQualifiedFormatted, totalMonthQualifiedFormatted, overallQualifiedFormatted, loading, searchTerm, statusFilter,
    governorateFilter, districtFilter, activityFilter, sortMode,
    copiedId, togglingId, pendingDeactivateId, unlinkingId, pendingUnlinkId, modalOpen,
    setSearchTerm, setGovernorateFilter, setDistrictFilter, setActivityFilter, setSortMode,
    setModalOpen, openModal, filterAll, filterActive, filterInactive, resetZoneFilters, cancelDeactivate, cancelUnlink,
    loadData, handleGroupCreated, handleCopy, handleToggleStatus, handleUnlinkOwner,
  } = useAdminWhatsAppGroups();

  const onToggleItem = (item: AdminWhatsAppGroupLinkItem) => { void handleToggleStatus(item); };
  const onUnlinkItem = (item: AdminWhatsAppGroupLinkItem) => { void handleUnlinkOwner(item); };

  return (
    <div className={isArabic ? styles.rootRtl : styles.rootLtr} dir={direction}>
      <WhatsappGroupUiPreviewBar isArabic={isArabic} direction={direction === 'ltr' ? 'ltr' : 'rtl'} />

      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconWrap}><MessageSquare className={styles.headerIcon} /></div>
            <h2 className={styles.headerTitle}>{t('title')}</h2>
          </div>
          <p className={styles.headerSubtitle}>{t('subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={loadData} disabled={loading} className={styles.refreshBtn}>
            <RefreshCw className={cn(styles.btnIcon, loading ? styles.spinner : undefined)} />
            <span>{t('refresh')}</span>
          </Button>
          <Button onClick={openModal} disabled={!schemaReady} title={!schemaReady ? t('schemaNotReadyTitle') : undefined} className={styles.createBtn}>
            <Plus className={styles.btnIcon} />
            <span>{t('createLink')}</span>
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <CardHeader className={styles.kpiHeader}><CardTitle className={styles.kpiLabel}>{t('kpiTotalGroups')}</CardTitle></CardHeader>
          <CardContent className={styles.kpiContent}>
            <span className={styles.kpiValueWhite}>{summary.totalGroups}</span>
            <span className={styles.kpiSubtle}>
              {hasActiveFilters ? t('kpiFilteredOfTotal', { total: totalGroupsOverall }) : t('kpiInactiveSummary', { count: summary.inactiveGroups })}
            </span>
          </CardContent>
        </Card>
        <Card className={styles.kpiCard}>
          <CardHeader className={styles.kpiHeader}><CardTitle className={styles.kpiLabel}>{t('kpiActiveGroups')}</CardTitle></CardHeader>
          <CardContent className={styles.kpiContent}>
            <span className={styles.kpiValueEmerald}>{summary.activeGroups}</span>
            <span className={styles.kpiSubtle}>
              {hasActiveFilters
                ? t('kpiActiveOfTotal', { total: activeGroupsOverall })
                : t('kpiProductiveActive', { count: summary.productiveActiveGroups ?? 0 })}
            </span>
          </CardContent>
        </Card>
        <Card className={styles.kpiCard}>
          <CardHeader className={styles.kpiHeader}><CardTitle className={styles.kpiLabel}>{t('kpiQualifiedTime')}</CardTitle></CardHeader>
          <CardContent className={styles.kpiContent}>
            <span className={styles.kpiValueTeal}>{totalQualifiedFormatted}</span>
            <span className={styles.kpiSubtle}>{t('kpiTripsSummary', { trips: summary.totalQualifiedTrips })}</span>
            <span className={styles.kpiSubtle}>
              {!monthlySchemaReady
                ? t('monthlySchemaNotReady')
                : hasActiveFilters
                  ? t('kpiQualifiedOfTotal', { duration: overallQualifiedFormatted })
                  : t('kpiMonthQualifiedSummary', { duration: totalMonthQualifiedFormatted, trips: summary.currentMonthQualifiedTrips ?? 0 })}
            </span>
          </CardContent>
        </Card>
        <Card className={styles.kpiCard}>
          <CardHeader className={styles.kpiHeader}><CardTitle className={styles.kpiLabel}>{t('kpiActiveMembers')}</CardTitle></CardHeader>
          <CardContent className={styles.kpiContent}>
            <span className={styles.kpiValueSlate}>{summary.totalActiveMembers}</span>
            <span className={styles.kpiSubtle}>{t('kpiMembersSplit', { captains: summary.totalCaptains, riders: summary.totalRiders })}</span>
            <span className={styles.kpiSubtle}>{hasActiveFilters ? t('kpiMembersOfTotal', { total: totalMembersOverall }) : t('kpiMembersActiveOps', { captains: displayActiveCaptains, riders: displayActiveRiders })}</span>
          </CardContent>
        </Card>
      </div>

      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchGroupsPlaceholder')} className={styles.searchInput} />
          </div>
          <div className={styles.filterRow}>
            <Button variant={statusFilter === 'ALL' ? 'default' : 'outline'} onClick={filterAll} className={statusFilter === 'ALL' ? styles.filterBtnActive : styles.filterBtnIdle}>{t('statusAll')}</Button>
            <Button variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'} onClick={filterActive} className={statusFilter === 'ACTIVE' ? styles.filterBtnActive : styles.filterBtnIdle}>{t('statusActive')}</Button>
            <Button variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'} onClick={filterInactive} className={statusFilter === 'INACTIVE' ? styles.filterBtnActive : styles.filterBtnIdle}>{t('statusInactive')}</Button>
          </div>
        </div>
        <div className={styles.zoneFiltersGrid}>
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}><MapPin className={styles.selectIcon} /><span>{t('filterGovernorate')}</span></label>
            <select value={governorateFilter} onChange={(e) => setGovernorateFilter(e.target.value)} className={styles.selectInput}>
              <option value="ALL">{t('allGovernorates')}</option>
              {governorateOptions.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
            </select>
          </div>
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}><MapPin className={styles.selectIcon} /><span>{t('filterDistrict')}</span></label>
            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={styles.selectInput}>
              <option value="ALL">{t('allDistricts')}</option>
              {districtOptions.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
            </select>
          </div>
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}><span>{t('sortByLabel')}</span></label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as WhatsAppGroupZoneSortMode)} className={styles.selectInput}>
              <option value="least_captain_ops">{t('sortLeastCaptainOps')}</option>
              <option value="least_spread">{t('sortLeastSpread')}</option>
              <option value="least_rider_activity">{t('sortLeastRiderActivity')}</option>
              <option value="most_minutes">{t('sortMostMinutes')}</option>
              <option value="newest">{t('sortNewest')}</option>
            </select>
          </div>
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}><span>{t('activityFilterLabel')}</span></label>
            <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value as WhatsAppGroupActivityFilter)} className={styles.selectInput}>
              <option value="ALL">{t('activityAll')}</option>
              <option value="ZERO_MINUTES">{t('activityZeroMinutes')}</option>
              <option value="ZERO_MONTH_MINUTES">{t('activityZeroMonthMinutes')}</option>
              <option value="HAS_MINUTES">{t('activityHasMinutes')}</option>
              <option value="MISSING_PAIR">{t('activityMissingPair')}</option>
            </select>
          </div>
          <div className={styles.resetWrap}>
            <Button variant="outline" disabled={!canResetFilters} onClick={resetZoneFilters} className={styles.resetBtn}>
              <RotateCcw className={styles.btnIcon} />
              <span>{t('resetFilters')}</span>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingBox}><Loader2 className={styles.spinner} /><p className={styles.loadingText}>{t('loading')}</p></div>
      ) : filteredCards.length === 0 ? (
        <div className={styles.emptyBox}>
          <h3 className={styles.emptyTitle}>{schemaReady ? t('emptyTitle') : t('schemaNotReadyTitle')}</h3>
          <p className={styles.emptyDesc}>{!schemaReady ? t('schemaNotReadyDesc') : hasActiveFilters && totalGroupsOverall > 0 ? t('emptyFilteredDesc') : t('emptyDesc')}</p>
          {schemaReady && hasActiveFilters && totalGroupsOverall > 0 ? (
            <Button variant="outline" onClick={resetZoneFilters} className={styles.refreshBtn}><RotateCcw className={styles.btnIcon} /><span>{t('resetFilters')}</span></Button>
          ) : null}
        </div>
      ) : (
        <div className={styles.listGrid}>
          {filteredCards.map(({ item, formattedDuration, formattedMonthDuration, sharePath }) => (
            <WhatsappGroupCard
              key={item.id} item={item} formattedDuration={formattedDuration} formattedMonthDuration={formattedMonthDuration}
              sharePath={sharePath} copiedKey={copiedId} isToggling={togglingId === item.id}
              isConfirmingDeactivate={pendingDeactivateId === item.id} isUnlinking={unlinkingId === item.id}
              isConfirmingUnlink={pendingUnlinkId === item.id} onCopy={handleCopy} onToggleStatus={onToggleItem}
              onCancelDeactivate={cancelDeactivate} onUnlinkOwner={onUnlinkItem} onCancelUnlink={cancelUnlink}
            />
          ))}
        </div>
      )}

      <WhatsappGroupCreateModal
        open={modalOpen} direction={direction === 'ltr' ? 'ltr' : 'rtl'} captains={captains}
        leaderGroupCounts={leaderGroupCounts} governorateOptions={governorateOptions} districtOptions={districtOptions}
        onOpenChange={setModalOpen} onCreated={handleGroupCreated}
      />
    </div>
  );
}
