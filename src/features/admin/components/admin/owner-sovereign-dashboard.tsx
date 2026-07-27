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

const styles = {
  style63_1: "space-y-8 bg-[#020202] text-right p-6 rounded-3xl border border-red-500/10 min-h-screen text-white font-sans",
  style66_2: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-6",
  style68_3: "flex items-center gap-2 mb-2",
  style69_4: "bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-black px-3 py-1 text-[11px] rounded-full animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.4)] font-sans",
  style73_5: "text-2xl sm:text-3xl font-black text-[#00ffcc] tracking-tight flex items-center gap-2 font-sans",
  style74_6: "w-8 h-8 text-[#ff3366] animate-pulse animate-duration-1000",
  style77_7: "text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl",
  style83_8: "bg-zinc-950/90 border border-[#00ffcc]/20 rounded-2xl p-4 min-w-[240px] text-right",
  style84_9: "text-[10px] text-gray-500 block font-bold",
  style85_10: "text-2xl font-black text-[#00ffcc] font-mono block mt-1",
  style86_11: "text-[9px] text-red-400 font-bold block mt-1",
  style118_12: "bg-[#050505] border border-blue-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8",
  style119_13: "bg-blue-950/15 border-b border-blue-500/10 p-5",
  style120_14: "text-blue-400 text-base font-extrabold flex items-center gap-2 font-sans",
  style121_15: "w-5 h-5 text-blue-400",
  style124_16: "text-gray-400 text-xs leading-relaxed text-right",
  style128_17: "p-6 space-y-6",
  style129_18: "grid grid-cols-1 lg:grid-cols-2 gap-6 text-right",
  style132_19: "space-y-4",
  style133_20: "text-xs font-black text-blue-400 tracking-wide border-b border-white/5 pb-2",
  style134_21: "space-y-3 font-sans",
  style136_22: "bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2",
  style137_23: "flex items-center justify-between",
  style138_24: "font-extrabold text-xs text-white",
  style139_25: "bg-blue-950/50 border border-blue-500/30 text-blue-400 text-[9px] font-mono px-2 py-0.5",
  style141_26: "text-[11px] text-gray-400 leading-relaxed",
  style142_27: "space-y-1 pt-1",
  style143_28: "text-[10px] text-gray-500 block font-bold",
  style144_29: "flex flex-wrap gap-1",
  style146_30: "text-[9px] bg-zinc-900 border border-white/5 text-gray-300 px-1 py-0.5 rounded font-mono",
  style156_31: "space-y-4",
  style157_32: "text-xs font-black text-[#00ffcc] tracking-wide border-b border-white/5 pb-2",
  style158_33: "space-y-3 font-sans",
  style160_34: "bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2",
  style161_35: "flex items-center justify-between",
  style162_36: "font-extrabold text-xs text-white",
  style163_37: "bg-[#003322]/50 border border-[#00ffcc]/30 text-[#00ffcc] text-[9px] font-mono px-2 py-0.5",
  style165_38: "text-[11px] text-gray-400 leading-relaxed",
  style166_39: "space-y-2 pt-2 border-t border-white/5",
  style167_40: "grid grid-cols-2 gap-3 text-[10px]",
  style169_41: "bg-zinc-900/40 p-2 rounded-lg border border-white/5 space-y-1",
  style170_42: "text-[9px] text-[#00ffcc] font-black block",
  style172_43: "text-[8px] text-gray-500 block font-bold",
  style173_44: "flex flex-wrap gap-1 mt-0.5",
  style175_45: "text-[8px] text-gray-400 font-mono bg-zinc-950 px-1 rounded border border-white/5",
  style176_46: "text-[8px] text-zinc-600 italic",
  style179_47: "pt-1",
  style180_48: "text-[8px] text-gray-500 block font-bold",
  style181_49: "flex flex-wrap gap-1 mt-0.5",
  style183_50: "text-[8px] text-sky-400 font-mono bg-zinc-950 px-1 rounded border border-white/5",
  style184_51: "text-[8px] text-zinc-600 italic",
  style190_52: "bg-zinc-900/40 p-2 rounded-lg border border-white/5 space-y-1",
  style191_53: "text-[9px] text-amber-400 font-black block",
  style193_54: "text-[8px] text-gray-500 block font-bold",
  style194_55: "flex flex-wrap gap-1 mt-0.5",
  style196_56: "text-[8px] text-purple-400 font-mono bg-zinc-950 px-1 rounded border border-white/5",
  style197_57: "text-[8px] text-zinc-600 italic",
  style200_58: "pt-1",
  style201_59: "text-[8px] text-gray-500 block font-bold",
  style202_60: "flex flex-wrap gap-1 mt-0.5",
  style204_61: "text-[8px] text-amber-500 font-mono bg-zinc-950 px-1 rounded border border-white/5",
  style205_62: "text-[8px] text-zinc-600 italic",
} as const;


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
    <div className={styles.style63_1} dir="rtl">

      {/* 👑 VIP OWNER LOGO HEADER */}
      <div className={styles.style66_2}>
        <div>
          <div className={styles.style68_3}>
            <Badge className={styles.style69_4}>
              لوحة المالك  ● V5.5 SECURITY PROTOCOL
            </Badge>
          </div>
          <h2 className={styles.style73_5}>
            <ShieldAlert className={styles.style74_6} />
            غرفة التحكم العليا للمشرف (Owner Overlord Cabinet)
          </h2>
          <p className={styles.style77_7}>
            مستوى التحكم الاستئصالي الشامل (SSOT) الحاكم لنواقل المملكة ومندوبيها الجغرافيين. تدرج هذه الغرفة المعادلات الرياضية المشددة وعقود الصعق الأمنية لمنع المضاربات.
          </p>
        </div>

        {/* Absolute Global Stats */}
        <div className={styles.style83_8}>
          <span className={styles.style84_9}>إجمالي الاحتياطي المالي المحصن لأصحاب الحقوق</span>
          <span className={styles.style85_10}>{(auditedStats.totalNet).toFixed(2)} د.أ</span>
          <span className={styles.style86_11}>بعد حسم غرامات التزييف التلقائية ({auditedStats.totalPenalties.toFixed(2)} د.أ)</span>
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
      <Card className={styles.style118_12}>
        <CardHeader className={styles.style119_13}>
          <CardTitle className={styles.style120_14}>
            <Shield className={styles.style121_15} />
            تفتيش كتالوج ترسيم الحدود البرمجية وفصل القطاعات (Sovereign Demarcation Inspector)
          </CardTitle>
          <CardDescription className={styles.style124_16} dir="rtl">
            المرجع الحالي لتقسيم المناطق (Regions 1, 2, 3) والقطاعات الخدمية (Sectors) لضمان المسؤولية الأحادية والتعقيم الماسي.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style128_17}>
          <div className={styles.style129_18} dir="rtl">

            {/* Regions List */}
            <div className={styles.style132_19}>
              <h3 className={styles.style133_20}>📂 حدود المناطق البرمجية  (System Regions)</h3>
              <div className={styles.style134_21}>
                {Object.values(SovereignDemarcationCatalog.regions).map(region => (
                  <div key={region.id} className={styles.style136_22}>
                    <div className={styles.style137_23}>
                      <span className={styles.style138_24}>{region.nameAr}</span>
                      <Badge className={styles.style139_25}>{region.id}</Badge>
                    </div>
                    <p className={styles.style141_26}>{region.descriptionAr}</p>
                    <div className={styles.style142_27}>
                      <span className={styles.style143_28}>📂 المسارات المحمية:</span>
                      <div className={styles.style144_29}>
                        {region.paths.map(path => (
                          <code key={path} className={styles.style146_30}>{path}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sectors List */}
            <div className={styles.style156_31}>
              <h3 className={styles.style157_32}>🧱 عزل القطاعات والقطوعات (Domain Sectors)</h3>
              <div className={styles.style158_33}>
                {Object.values(SovereignDemarcationCatalog.sectors).map(sector => (
                  <div key={sector.id} className={styles.style160_34}>
                    <div className={styles.style161_35}>
                      <span className={styles.style162_36}>{sector.nameAr}</span>
                      <Badge className={styles.style163_37}>{sector.id}</Badge>
                    </div>
                    <p className={styles.style165_38}>{sector.descriptionAr}</p>
                    <div className={styles.style166_39}>
                      <div className={styles.style167_40}>
                        {/* Front-End Sub-Sector */}
                        <div className={styles.style169_41}>
                          <span className={styles.style170_42}>💻 الواجهة الأمامية (Front-End):</span>
                          <div>
                            <span className={styles.style172_43}>🧩 المكونات ({sector.frontend.components.length}):</span>
                            <div className={styles.style173_44}>
                              {sector.frontend.components.length > 0 ? sector.frontend.components.map(c => (
                                <code key={c} className={styles.style175_45}>{c.split('/').pop()}</code>
                              )) : <span className={styles.style176_46}>لا يوجد</span>}
                            </div>
                          </div>
                          <div className={styles.style179_47}>
                            <span className={styles.style180_48}>⚡ الخطافات ({sector.frontend.hooks.length}):</span>
                            <div className={styles.style181_49}>
                              {sector.frontend.hooks.length > 0 ? sector.frontend.hooks.map(h => (
                                <code key={h} className={styles.style183_50}>{h.split('/').pop()}</code>
                              )) : <span className={styles.style184_51}>لا يوجد</span>}
                            </div>
                          </div>
                        </div>

                        {/* Back-End Sub-Sector */}
                        <div className={styles.style190_52}>
                          <span className={styles.style191_53}>⚙️ الخدمات الخلفية (Back-End):</span>
                          <div>
                            <span className={styles.style193_54}>🧠 النواة ({sector.backend.cores.length}):</span>
                            <div className={styles.style194_55}>
                              {sector.backend.cores.length > 0 ? sector.backend.cores.map(c => (
                                <code key={c} className={styles.style196_56}>{c.split('/').pop()}</code>
                              )) : <span className={styles.style197_57}>لا يوجد</span>}
                            </div>
                          </div>
                          <div className={styles.style200_58}>
                            <span className={styles.style201_59}>💾 المجموعات ({sector.backend.databaseCollections.length}):</span>
                            <div className={styles.style202_60}>
                              {sector.backend.databaseCollections.length > 0 ? sector.backend.databaseCollections.map(c => (
                                <code key={c} className={styles.style204_61}>{c}</code>
                              )) : <span className={styles.style205_62}>لا يوجد</span>}
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
