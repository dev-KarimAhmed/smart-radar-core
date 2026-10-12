'use client';

import React from 'react';
import { Megaphone, Plus, LayoutDashboard, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdvertiserPortalState } from '../hooks/use-advertiser-portal-state';
import { AdvertiserMarquee } from './portal/advertiser-marquee';
import { AdvertiserKpiGrid } from './portal/advertiser-kpi-grid';
import { AdvertiserHeatmap } from './portal/advertiser-heatmap';
import { AdvertiserPackagesCard } from './portal/advertiser-packages-card';
import { AdvertiserCampaignWizard } from './portal/advertiser-campaign-wizard';
import { AdvertiserAdList } from './portal/advertiser-ad-list';

interface AdvertiserPortalProps {
  onClose?: () => void;
}

export function AdvertiserPortal({ onClose }: AdvertiserPortalProps) {
  const state = useAdvertiserPortalState();

  return (
    <div
      dir="rtl"
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-5 select-none font-sans text-right animate-in fade-in duration-300"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">بوابة المعلن والراعي السيادي</h1>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                SC55 Edge
              </span>
            </div>
            <p className="text-xs text-slate-400">
              إطلاق ورعاية الحملات الجغرافية الموجهة للركاب والكباتن بنبضة رقمية واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs switch */}
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => state.setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                state.activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>لوحة المؤشرات</span>
            </button>
            <button
              type="button"
              onClick={() => {
                state.setActiveTab('create');
                state.setStep(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                state.activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>حملة جديدة</span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Stream Ad Marquee */}
      <AdvertiserMarquee ads={state.ads} />

      {/* Main Tab Content */}
      {state.activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* KPI Statistics */}
          <AdvertiserKpiGrid
            ledgerStats={state.ledgerStats}
            advertiserBalance={state.advertiserBalance}
            onOpenDeposit={() => state.handleDepositSimulate(50)}
          />

          {/* Heatmap and Traffic Pulse */}
          <AdvertiserHeatmap
            pulseData={state.pulseData}
            selectedDistrict={state.district}
            onSelectDistrict={(d) => state.setDistrict(d)}
            onRedirectToNaour={state.redirectCampaignToNaour}
          />

          {/* Pricing Packages & AI Budget */}
          <AdvertiserPackagesCard
            selectedPackageId={state.selectedPackageId}
            onSelectPackage={(id) => state.setSelectedPackageId(id)}
            aiBudget={state.aiBudget}
            setAiBudget={state.setAiBudget}
            aiGoal={state.aiGoal}
            setAiGoal={state.setAiGoal}
            aiRecommendation={state.aiRecommendation}
            onSuggestPackage={state.suggestBestPackage}
          />

          {/* Existing Ads List */}
          <AdvertiserAdList
            ads={state.allSovereignAds}
            onToggleStatus={state.toggleAdStatus}
            onDeleteAd={state.deleteAd}
            onExtendAd={(id) => state.extendAd(id, 5000, 3)}
          />
        </div>
      ) : (
        /* Create New Campaign Wizard */
        <AdvertiserCampaignWizard
          step={state.step}
          setStep={state.setStep}
          title={state.title}
          setTitle={state.setTitle}
          description={state.description}
          setDescription={state.setDescription}
          governorate={state.governorate}
          setGovernorate={state.setGovernorate}
          district={state.district}
          setDistrict={state.setDistrict}
          districts={state.districts}
          posterUrl={state.posterUrl}
          setPosterUrl={state.setPosterUrl}
          whatsapp={state.whatsapp}
          setWhatsapp={state.setWhatsapp}
          phone={state.phone}
          setPhone={state.setPhone}
          geoLoc={state.geoLoc}
          setGeoLoc={state.setGeoLoc}
          buttonText={state.buttonText}
          setButtonText={state.setButtonText}
          targetImpressions={state.targetImpressions}
          setTargetImpressions={state.setTargetImpressions}
          currentPackage={state.currentPackage}
          calculatedCost={state.calculatedCost}
          advertiserBalance={state.advertiserBalance}
          isSimulatingAudit={state.isSimulatingAudit}
          auditProgress={state.auditProgress}
          auditLogs={state.auditLogs}
          auditApproved={state.auditApproved}
          onLaunchAudit={state.runForensicAuditAndLaunch}
          onReset={() => {
            state.setActiveTab('dashboard');
            state.setStep(1);
          }}
        />
      )}
    </div>
  );
}
