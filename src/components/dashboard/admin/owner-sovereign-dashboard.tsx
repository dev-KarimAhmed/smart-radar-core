'use client';

import React from 'react';
import { ShieldAlert, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useSovereignDashboard, DelegateData } from '@/hooks/admin/useSovereignDashboard';
import { DelegateCommissionPanel } from './panels/delegate-commission-panel';
import { DriverBlackBoxPanel } from './panels/driver-blackbox-panel';
import { SovereignGapSimulator } from './panels/sovereign-gap-simulator';
import { SovereignDemarcationCatalog } from '@/core/demarcation-catalog';

/**
 * 🏛️ [RAD-MAP-078-OWNER-DASHBOARD] Owner Supreme Chamber Component (V5.5)
 * Absolute sovereign control center incorporating hard-locked math models and black box controls.
 * Refactored under [Sovereign Splitting Operation - RAD-MAP-086] to adhere to cloud performance protocols.
 */
export function RadarOwnerSovereignDashboard() {
  const {
    delegates,
    drivers,
    loadingDelegates,
    loadingDrivers,
    isProcessing,
    setIsProcessing,
    fetchDrivers,
    handleSovereignKillSwitch,
    handleReviveDriver,
    handleClearDelegateDues,
    CONSTANTS
  } = useSovereignDashboard();

  /**
   * 🧮 auditRepresentativeCommissions
   * Mathematical validation representing Net Commission calculations with PENALTY_FACTOR applied
   */
  const auditRepresentativeCommissions = (delegate: DelegateData) => {
    const rawDues = delegate.pendingDues || 0;
    const delRate = delegate.deletionRate || 0; 
    const penaltyAmount = rawDues * (delRate / 100) * CONSTANTS.PENALTY_FACTOR;
    const withdrawableBalance = Math.max(0, rawDues - penaltyAmount);

    return {
      rawDues,
      penaltyAmount,
      withdrawableBalance
    };
  };

  // Aggregated mathematical statistics across all delegates
  const auditedStats = React.useMemo(() => {
    return delegates.reduce((acc, del) => {
      const audit = auditRepresentativeCommissions(del);
      return {
        totalDues: acc.totalDues + audit.rawDues,
        totalPenalties: acc.totalPenalties + audit.penaltyAmount,
        totalNet: acc.totalNet + audit.withdrawableBalance
      };
    }, { totalDues: 0, totalPenalties: 0, totalNet: 0 });
  }, [delegates]);

  return (
    <div className="space-y-8 bg-[#020202] text-right p-6 rounded-3xl border border-red-500/10 min-h-screen text-white font-sans" dir="rtl">
      
      {/* 👑 VIP OWNER LOGO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-black px-3 py-1 text-[11px] rounded-full animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.4)] font-sans">
              قمرة المالك السيادية ● V5.5 SECURITY PROTOCOL
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#00ffcc] tracking-tight flex items-center gap-2 font-sans">
            <ShieldAlert className="w-8 h-8 text-[#ff3366] animate-pulse animate-duration-1000" />
            غرفة التحكم العليا للمشرف (Owner Overlord Cabinet)
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
            مستوى التحكم الاستئصالي الشامل (SSOT) الحاكم لنواقل المملكة ومندوبيها الجغرافيين. تدرج هذه الغرفة المعادلات الرياضية المشددة وعقود الصعق الجنائية لمنع المضاربات.
          </p>
        </div>
        
        {/* Absolute Global Stats */}
        <div className="bg-zinc-950/90 border border-[#00ffcc]/20 rounded-2xl p-4 min-w-[240px] text-right">
          <span className="text-[10px] text-gray-500 block font-bold">إجمالي الاحتياطي المالي المحصن لأصحاب الحقوق</span>
          <span className="text-2xl font-black text-[#00ffcc] font-mono block mt-1">{(auditedStats.totalNet).toFixed(2)} د.أ</span>
          <span className="text-[9px] text-red-400 font-bold block mt-1">بعد حسم غرامات التزييف التلقائية ({auditedStats.totalPenalties.toFixed(2)} د.أ)</span>
        </div>
      </div>

      {/* 🛡️ DELEGATES SECTION (Net Commission Guard) */}
      <DelegateCommissionPanel 
        delegates={delegates}
        loadingDelegates={loadingDelegates}
        isProcessing={isProcessing}
        handleClearDelegateDues={handleClearDelegateDues}
        auditedStats={auditedStats}
        auditRepresentativeCommissions={auditRepresentativeCommissions}
      />

      {/* 💥 BLACK BOX LETHAL STRIKE PANEL */}
      <DriverBlackBoxPanel 
        drivers={drivers}
        loadingDrivers={loadingDrivers}
        isProcessing={isProcessing}
        handleSovereignKillSwitch={handleSovereignKillSwitch}
        handleReviveDriver={handleReviveDriver}
      />

      {/* 🔮 STRATEGIC GAPS SIMULATOR HUB */}
      <SovereignGapSimulator 
        drivers={drivers}
        fetchDrivers={fetchDrivers}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />

      {/* 📐 [RAD-SSOT-105] DEMARCATION & SECTOR CATALOG INSPECTOR */}
      <Card className="bg-[#050505] border border-blue-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
        <CardHeader className="bg-blue-950/15 border-b border-blue-500/10 p-5">
          <CardTitle className="text-blue-400 text-base font-extrabold flex items-center gap-2 font-sans">
            <Shield className="w-5 h-5 text-blue-400" />
            تفتيش كتالوج ترسيم الحدود البرمجية وفصل القطاعات (Sovereign Demarcation Inspector)
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs leading-relaxed text-right" dir="rtl">
            المرجع الدستوري لتقسيم المناطق (Regions 1, 2, 3) والقطاعات الخدمية (Sectors) لضمان المسؤولية الأحادية والتعقيم الماسي.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right" dir="rtl">
            
            {/* Regions List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-400 tracking-wide border-b border-white/5 pb-2">📂 حدود المناطق البرمجية السيادية (System Regions)</h3>
              <div className="space-y-3 font-sans">
                {Object.values(SovereignDemarcationCatalog.regions).map(region => (
                  <div key={region.id} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">{region.nameAr}</span>
                      <Badge className="bg-blue-950/50 border border-blue-500/30 text-blue-400 text-[9px] font-mono px-2 py-0.5">{region.id}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{region.descriptionAr}</p>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gray-500 block font-bold">📂 المسارات المحمية:</span>
                      <div className="flex flex-wrap gap-1">
                        {region.paths.map(path => (
                          <code key={path} className="text-[9px] bg-zinc-900 border border-white/5 text-gray-300 px-1 py-0.5 rounded font-mono">{path}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sectors List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#00ffcc] tracking-wide border-b border-white/5 pb-2">🧱 عزل القطاعات والقطوعات (Domain Sectors)</h3>
              <div className="space-y-3 font-sans">
                {Object.values(SovereignDemarcationCatalog.sectors).map(sector => (
                  <div key={sector.id} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">{sector.nameAr}</span>
                      <Badge className="bg-[#003322]/50 border border-[#00ffcc]/30 text-[#00ffcc] text-[9px] font-mono px-2 py-0.5">{sector.id}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{sector.descriptionAr}</p>
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        {/* Front-End Sub-Sector */}
                        <div className="bg-zinc-900/40 p-2 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[9px] text-[#00ffcc] font-black block">💻 الواجهة الأمامية (Front-End):</span>
                          <div>
                            <span className="text-[8px] text-gray-500 block font-bold">🧩 المكونات ({sector.frontend.components.length}):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {sector.frontend.components.length > 0 ? sector.frontend.components.map(c => (
                                <code key={c} className="text-[8px] text-gray-400 font-mono bg-zinc-950 px-1 rounded border border-white/5">{c.split('/').pop()}</code>
                              )) : <span className="text-[8px] text-zinc-600 italic">لا يوجد</span>}
                            </div>
                          </div>
                          <div className="pt-1">
                            <span className="text-[8px] text-gray-500 block font-bold">⚡ الخطافات ({sector.frontend.hooks.length}):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {sector.frontend.hooks.length > 0 ? sector.frontend.hooks.map(h => (
                                <code key={h} className="text-[8px] text-sky-400 font-mono bg-zinc-950 px-1 rounded border border-white/5">{h.split('/').pop()}</code>
                              )) : <span className="text-[8px] text-zinc-600 italic">لا يوجد</span>}
                            </div>
                          </div>
                        </div>

                        {/* Back-End Sub-Sector */}
                        <div className="bg-zinc-900/40 p-2 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[9px] text-amber-400 font-black block">⚙️ الخدمات الخلفية (Back-End):</span>
                          <div>
                            <span className="text-[8px] text-gray-500 block font-bold">🧠 النواة ({sector.backend.cores.length}):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {sector.backend.cores.length > 0 ? sector.backend.cores.map(c => (
                                <code key={c} className="text-[8px] text-purple-400 font-mono bg-zinc-950 px-1 rounded border border-white/5">{c.split('/').pop()}</code>
                              )) : <span className="text-[8px] text-zinc-600 italic">لا يوجد</span>}
                            </div>
                          </div>
                          <div className="pt-1">
                            <span className="text-[8px] text-gray-500 block font-bold">💾 المجموعات ({sector.backend.databaseCollections.length}):</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {sector.backend.databaseCollections.length > 0 ? sector.backend.databaseCollections.map(c => (
                                <code key={c} className="text-[8px] text-amber-500 font-mono bg-zinc-950 px-1 rounded border border-white/5">{c}</code>
                              )) : <span className="text-[8px] text-zinc-600 italic">لا يوجد</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 🔒 [RAD-MAP-080-FREEZE] Seal the Sovereign core cabinet module preventing prototype manipulation
Object.freeze(RadarOwnerSovereignDashboard);
