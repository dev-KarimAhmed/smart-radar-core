'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, MapPin, VolumeX, MessageSquare, Car } from 'lucide-react';
import { getRankTheme } from '@/core/utils';
import { cn } from '@/lib/utils';
import type { User } from '@/core/types';

const styles = {
  style33_1: "bg-[#0F172A]/40 border-white/[0.06] transition-all duration-500 overflow-hidden mb-3 shadow-xl hover:border-[#14B8A6]/50",
  style34_2: "p-4",
  style35_3: "flex items-center gap-4",
  style36_4: "relative",
  style37_5: "w-16 h-16 border-2 border-[#14B8A6]/30 shadow-lg",
  style38_6: "bg-[#0A0F1D] text-white font-black text-xl",
  style40_7: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center shadow-md",
  style41_8: "w-4 h-4",
  style45_9: "flex-1 space-y-1",
  style46_10: "flex items-center justify-between",
  style47_11: "flex items-center gap-2",
  style48_12: "font-black text-white text-lg tracking-wide truncate max-w-[140px]",
  style49_13: "relative flex h-2 w-2",
  style51_14: "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
  style52_15: "bg-red-500",
  style52_16: "bg-blue-400",
  style55_17: "relative inline-flex rounded-full h-2 w-2",
  style56_18: "bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
  style56_19: "bg-blue-500 opacity-60",
  style60_20: "text-[10px] font-bold uppercase tracking-tighter shadow-sm",
  style65_21: "flex items-center gap-2",
  style66_22: "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20 text-[9px] font-bold",
  style69_23: "flex items-center gap-1 text-yellow-400 ml-auto",
  style70_24: "w-3.5 h-3.5 fill-current",
  style71_25: "font-black text-sm",
  style75_26: "flex items-center justify-between pt-1 border-t border-white/5 mt-1",
  style76_27: "text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1",
  style77_28: "w-3 h-3",
  style78_29: "text-white font-mono",
  style80_30: "flex items-center gap-1 text-[#14B8A6] font-mono text-xs font-bold",
  style81_31: "w-3 h-3",
  style86_32: "flex items-center gap-2 mt-2",
  style88_33: "flex items-center gap-1 text-blue-400/70 text-[9px] font-bold",
  style89_34: "w-3 h-3",
  style92_35: "flex items-center gap-1 text-amber-400/70 text-[9px] font-bold",
  style93_36: "w-3 h-3",
} as const;


interface DriverSovereignCardProps {
  driver: User & { distance: number };
}

/**
 * [SCR-2026-047] بطاقة الهوية المهنية للناقل
 * معقمة بـ React.memo لمنع استنزاف موارد هاتف الراكب أثناء البحث.
 * تعرض البيانات التشغيلية والصفة القانونية بشفافية  تامة.
 */
export const DriverSovereignCard = memo(({ driver }: DriverSovereignCardProps) => {
  const rankTheme = getRankTheme(driver.rank);
  const isSilent = driver.silencePreference === 'silent';

  // Deterministic stable market trend matching driver's id to avoid random re-renders/CPU load
  const isUp = driver.uid ? (driver.uid.charCodeAt(driver.uid.length - 1) % 2 === 0) : true;

  // شارة الهوية القانونية (جهة التشغيل)
  const operationalLabel = driver.affiliation?.type === 'office-taxi' ? 'تكسي مكتب' : 'تطبيق ذكي';
  const entityName = driver.affiliation?.name || 'مستقل';

  return (
    <Card className={cn(styles.style33_1, rankTheme.glow)}>
        <CardContent className={styles.style34_2}>
            <div className={styles.style35_3}>
                <div className={styles.style36_4}>
                    <Avatar className={styles.style37_5}>
                        <AvatarFallback className={styles.style38_6}>{driver.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className={cn(styles.style40_7, rankTheme.bg)}>
                          <ShieldCheck className={cn(styles.style41_8, rankTheme.color)} />
                    </div>
                </div>

                <div className={styles.style45_9}>
                    <div className={styles.style46_10}>
                        <div className={styles.style47_11}>
                            <h4 className={styles.style48_12}>{driver.name}</h4>
                            <div className={styles.style49_13}>
                                <span className={cn(
                                    styles.style51_14,
                                    isUp ? styles.style52_15 : styles.style52_16
                                )}></span>
                                <span className={cn(
                                    styles.style55_17,
                                    isUp ? styles.style56_18 : styles.style56_19
                                )}></span>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn(styles.style60_20, rankTheme.border, rankTheme.color)}>
                            {rankTheme.label}
                        </Badge>
                    </div>

                    <div className={styles.style65_21}>
                          <Badge className={styles.style66_22}>
                             {operationalLabel}: {entityName}
                          </Badge>
                         <div className={styles.style69_23}>
                            <Star className={styles.style70_24} />
                            <span className={styles.style71_25}>{(driver.rating || 5.0).toFixed(1)}</span>
                        </div>
                    </div>

                    <div className={styles.style75_26}>
                        <div className={styles.style76_27}>
                           <Car className={styles.style77_28} />
                           {driver.vehicle?.make} • {driver.vehicle?.color} • <span className={styles.style78_29}>{driver.vehicle?.plate}</span>
                        </div>
                        <div className={styles.style80_30}>
                            <MapPin className={styles.style81_31} />
                            <span>{driver.distance.toFixed(1)} كم</span>
                        </div>
                    </div>

                    <div className={styles.style86_32}>
                        {isSilent ? (
                            <div className={styles.style88_33}>
                                <VolumeX className={styles.style89_34} /> مسار هادئ (صامت)
                            </div>
                        ) : (
                            <div className={styles.style92_35}>
                                <MessageSquare className={styles.style93_36} /> مرحب بالحديث
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
});

DriverSovereignCard.displayName = 'DriverSovereignCard';
