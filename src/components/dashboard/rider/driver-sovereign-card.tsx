'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, MapPin, VolumeX, MessageSquare, Car } from 'lucide-react';
import { getRankTheme } from '@/lib/theme-utils';
import { cn } from '@/lib/utils';
import type { User } from '@/core/types';

interface DriverSovereignCardProps {
  driver: User & { distance: number };
}

/**
 * [SCR-2026-047] بطاقة الهوية المهنية للناقل
 * معقمة بـ React.memo لمنع استنزاف موارد هاتف الراكب أثناء البحث.
 * تعرض البيانات التشغيلية والصفة القانونية بشفافية سيادية تامة.
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
    <Card className={cn("bg-[#050D05]/60 border-emerald-900/30 transition-all duration-500 overflow-hidden mb-3 shadow-xl hover:border-emerald-500/50", rankTheme.glow)}>
        <CardContent className="p-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-emerald-500/30 shadow-lg">
                        <AvatarFallback className="bg-emerald-950 text-white font-black text-xl">{driver.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center shadow-md", rankTheme.bg)}>
                          <ShieldCheck className={cn("w-4 h-4", rankTheme.color)} />
                    </div>
                </div>
                
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-lg tracking-wide truncate max-w-[140px]">{driver.name}</h4>
                            <div className="relative flex h-2 w-2">
                                <span className={cn(
                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    isUp ? "bg-red-500" : "bg-blue-400"
                                )}></span>
                                <span className={cn(
                                    "relative inline-flex rounded-full h-2 w-2",
                                    isUp ? "bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-blue-500 opacity-60"
                                )}></span>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tighter shadow-sm", rankTheme.border, rankTheme.color)}>
                            {rankTheme.label}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <Badge className="bg-emerald-900/20 text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                            {operationalLabel}: {entityName}
                         </Badge>
                         <div className="flex items-center gap-1 text-yellow-400 ml-auto">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-black text-sm">{(driver.rating || 5.0).toFixed(1)}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-1">
                        <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1">
                           <Car className="w-3 h-3" />
                           {driver.vehicle?.make} • {driver.vehicle?.color} • <span className="text-white font-mono">{driver.vehicle?.plate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold">
                            <MapPin className="w-3 h-3" />
                            <span>{driver.distance.toFixed(1)} كم</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        {isSilent ? (
                            <div className="flex items-center gap-1 text-blue-400/70 text-[9px] font-bold">
                                <VolumeX className="w-3 h-3" /> مسار هادئ (صامت)
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-amber-400/70 text-[9px] font-bold">
                                <MessageSquare className="w-3 h-3" /> مرحب بالحديث
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
