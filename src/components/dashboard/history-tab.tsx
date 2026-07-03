'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History, Award, BookOpen, Clock, Heart, Trash2, Phone, Sparkles, AlertCircle, FileText, Activity, Compass, ShieldCheck, Search, ShieldAlert, Lock, Coins, Megaphone, Sliders } from 'lucide-react';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';

interface HistoricalTrip {
  tripId: string;
  serialId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
}

function normalizeCaptainRank(value: unknown): HistoricalTrip['captainRank'] {
  const normalized = `${value || ''}`.toUpperCase();
  if (normalized.includes('PLATINUM')) return 'PLATINUM';
  if (normalized.includes('GOLD')) return 'GOLD';
  return 'BRONZE';
}

function formatVehicleInfo(vehicle: any) {
  if (!vehicle || typeof vehicle !== 'object') return 'غير متاح';
  const parts = [vehicle.make, vehicle.model, vehicle.color, vehicle.plate].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'غير متاح';
}

function parseTripTimestamp(trip: any) {
  const raw = trip.completed_at ?? trip.completedAt ?? trip.created_at ?? trip.createdAt ?? trip.timestamp;
  if (typeof raw === 'number') return raw;
  if (raw?.seconds) return raw.seconds * 1000;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatHistoryMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);
}

function HistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-neutral-900/45 border border-white/5 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="h-6 bg-white/10 rounded w-16" />
          </div>
          <div className="pt-2 border-t border-white/5 flex gap-2">
            <div className="h-6 bg-white/5 rounded w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HistoryTab() {
  const { user, isCaptain, isPassenger } = useAuth();
  const [favoriteCaptains, setFavoriteCaptains] = useState<any[]>([]);
  const [sovereignLogs, setSovereignLogs] = useState<any[]>([]);
  const [realTrips, setRealTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // مضاف خصيصاً لمنع انزياح CLS
  const { toast } = useToast();
  const currencyLabel = user?.currencyAr || user?.currencyEn || '';

  const [errorSearch, setErrorSearch] = useState('');
  const [errorCategory, setErrorCategory] = useState<string>('ALL');
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);

  const filteredErrors = useMemo(() => {
    const allErrors = Object.values(SOVEREIGN_ERR_DICTIONARY);
    return allErrors.filter((err) => {
      const matchesCategory = errorCategory === 'ALL' || err.code.startsWith(errorCategory);
      const matchesSearch =
        err.code.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.name.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.description.toLowerCase().includes(errorSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [errorSearch, errorCategory]);

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const loadFavorites = async () => {
    try {
      const favs = await dexieDb.favoriteCaptains.toArray();
      setFavoriteCaptains(favs);
    } catch (e) {
      console.error("Failed to load favorites from Dexie:", e);
    }
  };

  const loadSovereignLogs = async () => {
    if (!user?.uid || !isCaptain) return;
    try {
      const logs = await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .reverse()
        .sortBy('timestamp');
      setSovereignLogs(logs);
    } catch (e) {
      console.error("Failed to load captain sovereign logs from Dexie:", e);
    }
  };

  const clearSovereignLogs = async () => {
    if (!user?.uid) return;
    try {
      await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .delete();
      setSovereignLogs([]);
      toast({
        title: "🧹 تم تفريغ السجل المحلي",
        description: "تم مسح جميع سجلات الحركة والحالات المحلية من هاتفك بنجاح سائق."
      });
    } catch (err) {
      console.error("Failed to clear sovereign logs:", err);
    }
  };

  useEffect(() => {
    loadFavorites();
    if (isCaptain) {
      loadSovereignLogs();
    }

    const handleLogAdded = () => {
      if (isCaptain) {
        loadSovereignLogs();
      }
    };

    window.addEventListener('sovereign-log-added', handleLogAdded);
    return () => {
      window.removeEventListener('sovereign-log-added', handleLogAdded);
    };
  }, [user, isCaptain]);

  useEffect(() => {
    if (!user?.uid) {
      setRealTrips([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchTripHistory() {
      setLoading(true);
      try {
        const userColumn = isCaptain ? 'driver_id' : 'rider_id';
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq(userColumn, user!.uid)
          .in('status', ['COMPLETED', 'completed', 'RATING', 'rating', 'CLASSIFIED', 'classified', 'ARCHIVED', 'archived'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (active) setRealTrips(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;
        setRealTrips([]);
        toast({
          variant: 'destructive',
          title: 'تعذر تحميل الرحلات',
          description: 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت.',
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTripHistory();

    return () => {
      active = false;
    };
  }, [user?.uid, isCaptain, toast]);

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
    const combinedReal = realTrips.map(trip => {
      const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
      return {
        tripId: trip.id,
        serialId: trip.serial_id || trip.serialId,
        captainName: acceptedOffer?.driverName || trip.driver_name || trip.captain_name || trip.driverName || 'سائق',
        captainRank: normalizeCaptainRank(acceptedOffer?.driverRank || trip.driver_rank || trip.captain_rank),
        captainPhone: acceptedOffer?.driverVehicle?.phone || trip.driver_phone || trip.captain_phone || trip.driverPhone || '',
        vehicleInfo: formatVehicleInfo(acceptedOffer?.driverVehicle || trip.driver_vehicle || trip.vehicle),
        finalPrice: Number(trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  const captainHistoricalTrips = useMemo(() => {
    const combinedReal = realTrips.map(trip => {
      return {
        tripId: trip.id,
        serialId: trip.serial_id || trip.serialId,
        riderName: trip.rider_name || trip.riderName || 'راكب',
        pickup: trip.pickup_address_ar || trip.pickup || 'غير متاح',
        dropoff: trip.destination_address_ar || trip.dropoff || 'غير متاح',
        earnedPrice: Number(trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
        status: trip.status || 'COMPLETED'
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  const toggleFavorite = async (trip: HistoricalTrip) => {
    try {
      const existing = await dexieDb.favoriteCaptains.where('tripId').equals(trip.tripId).first();
      if (existing) {
        if (existing.id !== undefined) {
          await dexieDb.favoriteCaptains.delete(existing.id);
        }
        try {
          localStorage.removeItem(`radar_preferred_captain_${trip.tripId}`);
        } catch (err) {
          console.warn("Storage deletion failed (removeItem):", err);
        }
        toast({
          title: "💔 تم الإزالة من المفضلة",
          description: `تمت إزالة السائق ${trip.captainName} من المحفظة الرقمية.`,
        });
      } else {
        await dexieDb.favoriteCaptains.add({
          tripId: trip.tripId,
          captainName: trip.captainName,
          captainRank: trip.captainRank,
          captainPhone: trip.captainPhone,
          vehicleInfo: trip.vehicleInfo,
          finalPrice: trip.finalPrice,
          timestamp: trip.timestamp,
          heartedAt: Date.now()
        });
        toast({
          title: "💖 تم التخليد  بنجاح",
          description: `تم حفظ السائق ${trip.captainName} كـ ناقل مفضل مستقر للأبد بصفر كلفة سحابية.`,
        });
      }
      loadFavorites();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-24 text-right font-sans space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* 1. Header Card */}
      <Card className="bg-[#050505] border-emerald-950 text-white overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
        <CardContent className="p-6 space-y-2">
          <h2 className="text-lg font-black text-emerald-400 flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-500" />
            رحلاتي
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            راجع رحلاتك الأخيرة. يتم حذف الرحلات التي مر عليها أكثر من 72 ساعة لحماية خصوصيتك.
          </p>
        </CardContent>
      </Card>

      {/* 2. Primary Listing */}
      {isPassenger && (
        <div className="space-y-4">
          <Card className="bg-[#020502]/95 border border-emerald-950 shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  الرحلات الأخيرة (آخر 3 أيام)
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1">
                  الرحلات التي اكتملت من حسابك
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono">
                {riderHistoricalTrips.length} رحلة
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {loading ? (
                <HistorySkeleton />
              ) : riderHistoricalTrips.length === 0 ? (
                <div className="p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-gray-400 font-medium">لا توجد رحلات نشطة مسجلة في آخر 72 ساعة.</p>
                </div>
              ) : (
                riderHistoricalTrips.map((trip) => {
                  const isHearted = favoriteCaptains.some(fav => fav.tripId === trip.tripId);
                  const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

                  return (
                    <div
                      key={trip.tripId}
                      className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/20 transition-all"
                    >
                      {/* Heart action */}
                      <button
                        onClick={() => toggleFavorite(trip)}
                        className="absolute top-4 left-4 p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-rose-500 transition-all hover:scale-105 active:scale-95"
                      >
                        <Heart className={`h-4.5 w-4.5 transition-all ${isHearted ? 'fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc]' : 'text-gray-400 hover:text-rose-400'}`} />
                      </button>

                      <div className="flex justify-between items-start pl-8">
                        <div>
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            🚗 {trip.captainName}
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/20 border border-amber-500/10 px-1.5 py-0.5 rounded select-none">
                              [{trip.captainRank}]
                            </span>
                          </h4>
                          <p className="text-[11px] text-gray-400 font-sans mt-1">{trip.vehicleInfo}</p>
                          {trip.serialId && (
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center gap-1 bg-[#011e15] text-[#00ffcc] text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">
                                🧬 {trip.serialId}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[12px] text-emerald-400 font-black font-mono block">
                            {formatHistoryMoney(trip.finalPrice, currencyLabel)}
                          </span>
                          <span className="text-[9px] text-gray-500 font-sans block mt-0.5">
                            قبل {timeAgo === 0 ? 'أقل من ساعة' : `${timeAgo} ساعة`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <a
                          href={`tel:${trip.captainPhone}`}
                          className="px-3 py-1.5 bg-emerald-950/30 font-black text-[10px] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60 rounded-lg flex items-center gap-1 text-center select-none"
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className="h-3 w-3" />
                          <span>اتصال بالسائق بخصوص الرحلة</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Favorited Captains Quick Vault Section */}
          <Card className="bg-[#010301] border border-emerald-950 shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                  السائقون المفضلون
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1">
                  السائقون الذين حفظتهم من رحلاتك السابقة
                </CardDescription>
              </div>
              <Badge className="bg-emerald-950 text-emerald-400 text-[9px] border border-emerald-500/20">
                {favoriteCaptains.length} سائق
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {favoriteCaptains.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-[11px]">
                  اضغط على أيقونة <strong className="text-[#00ffcc]">القلب</strong> في أي رحلة مكتملة لإضافة السائق إلى المفضلة.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {favoriteCaptains.map((captain) => (
                    <div
                      key={captain.id}
                      className="bg-[#060a06] border border-emerald-500/10 p-3 rounded-lg flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-white text-[12px] flex items-center gap-1">
                          👤 {captain.captainName}
                          <span className="text-[8px] font-mono text-amber-500">[{captain.captainRank || 'GOLD'}]</span>
                        </h5>
                        <p className="text-[10px] text-gray-400 leading-normal font-sans">{captain.vehicleInfo}</p>
                      </div>

                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${captain.captainPhone}`}
                          className="p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0"
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className="h-3 w-3" /> اتصل
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(captain)}
                          className="h-7 w-7 text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isCaptain && (
        <div className="space-y-6">
          <Card className="bg-[#020502]/95 border border-emerald-950 shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  سجل العوائد والمهام الميدانية المنجزة
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1 font-sans">
                  المهام المعتمدة الموثقة بمركز النشاط
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono">
                {captainHistoricalTrips.length} مهمة
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {loading ? (
                <HistorySkeleton />
              ) : captainHistoricalTrips.length === 0 ? (
                <div className="p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-gray-400 font-medium">لا توجد مهام ميدانية منجزة مسجلة لمنطقة حالياً.</p>
                </div>
              ) : (
                captainHistoricalTrips.map((trip) => {
                  const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

                  return (
                    <div
                      key={trip.tripId}
                      className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 hover:border-emerald-500/20 transition-all font-mono"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-1">
                            👤 الراكب: {trip.riderName}
                          </h4>
                          <p className="text-[11px] text-gray-400 font-sans mt-1">
                            من: {trip.pickup} ➔ إلى: {trip.dropoff}
                          </p>
                          {trip.serialId && (
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center gap-1 bg-[#011e15] text-[#00ffcc] text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">
                                🧬 {trip.serialId}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[12px] text-emerald-400 font-black block">
                            +{formatHistoryMoney(trip.earnedPrice, currencyLabel)}
                          </span>
                          <span className="text-[9px] text-gray-500 font-sans block mt-0.5">
                            قبل {timeAgo} ساعة
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* براءة ذمة نقاء النظام الحافة من الثرثرة الشبكية وقنوات المساعدة */}
          <Card className="bg-[#020502]/95 border border-emerald-950/60 shadow-xl overflow-hidden relative text-right">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse" />
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 animate-pulse" />
                    وثيقة براءة الذمة  ونقاء النظام (Anti-Chattiness & Zero-Chat Decree)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-gray-400 mt-1 font-sans">
                    شهادة هندسية معتمدة تثبت خلو النظام تماماً من أي بروتوكولات دردشة مساعدة أو استهلاك عشوائي للباقة
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-300 bg-emerald-950/30 font-mono">
                  SECURE-V2.6
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-950/40 rounded-lg text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">صفر تعقيد وصفر ثرثرة شبكية (Zero-Chat Mandate)</h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      لا توجد قنوات محادثة خلفية أو دردشة معقدة تستهلك باقة الإنترنت. التواصل يتم عبر روابط مباشرة لتقليل الضغط على الشبكة.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                  <div className="p-2 bg-cyan-950/40 rounded-lg text-cyan-400 shrink-0 mt-0.5 border border-cyan-500/20">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">النشاط المالي والربط  المؤتمت</h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      يتم جلب النشاط والرحلات عند الحاجة المباشرة فقط (Event-Driven) دون ثرثرة شبكية مستمرة (No polling chat networks). تلتزم شاشة السجل بمبدأ المحكم الرقمي القطعي (SSOT) بنسبة 100%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                  <div className="p-2 bg-amber-950/40 rounded-lg text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">تصفية السجلات المؤتمت (72-Hour Auto Purge)</h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      امتثالاً للمحدد الثالث في بنود المعمارية المحلية الحافة، يتم إيقاف ومسح جميع تفاصيل الحركة ميكانيكياً بعد مرور 72 ساعة ثابتة من هاتفك وخادم النظام لحماية خصوصيتك وصفرية التكلفة الحافة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 border border-[#00ffcc]/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#00ffcc] animate-ping" />
                  <span className="text-[10px] text-gray-400 font-sans">حالة نقاء خطوط النقل الحالية:</span>
                  <span className="text-[10px] text-[#00ffcc] font-black font-mono">100% PURE & SECURE</span>
                </div>
                <span className="text-[9px] text-gray-500 font-sans">براءة ذمة معتمدة ومختومة رقمياً 🛡️</span>
              </div>
            </CardContent>
          </Card>

          {/* Dedicated Sovereign Logs (سجل خاص به ويكون مرجعًا له) */}
          <Card className="bg-[#020502]/95 border border-emerald-950 shadow-xl overflow-hidden relative text-right">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500 animate-pulse" />
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#00ffcc] animate-pulse" />
                  سجل الفعاليات والحركة اللامركزية (الأرشيف )
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1 font-sans">
                  سجل قطاع الناقل الميداني الذاتي لمراقبة تبديل الحالة ومحيط المنطقة
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {sovereignLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSovereignLogs}
                    className="h-7 text-[10px] text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    مسح السجل
                  </Button>
                )}
                <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 bg-cyan-950/20 font-mono">
                  {sovereignLogs.length} حركة
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {loading ? (
                <HistorySkeleton />
              ) : sovereignLogs.length === 0 ? (
                <div className="p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl space-y-2">
                  <ShieldCheck className="h-8 w-8 text-cyan-800 mx-auto animate-pulse" />
                  <p className="text-xs text-gray-400 font-medium">السجل خاوٍ حالياً سائق.</p>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    سيتم تلقائياً تخليد الحركات الميدانية مثل تبديل الحالة بين النشط والخامل، التعطيل التلقائي بسبب الخمول أو نفاد الباقة، وخروجك من محيط المنطقة هنا كمرجع  آمن وأمني لك.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {sovereignLogs.map((log) => {
                    let badgeColor = "border-cyan-500/10 text-cyan-400 bg-cyan-950/10";
                    let iconEmoji = "🧭";
                    if (log.type === 'system_action') {
                      badgeColor = "border-amber-500/10 text-amber-400 bg-amber-950/10";
                      iconEmoji = "🤖";
                    } else if (log.type === 'district_exit') {
                      badgeColor = "border-rose-500/10 text-rose-400 bg-rose-950/10";
                      iconEmoji = "🗺️";
                    }

                    return (
                      <div
                        key={log.id}
                        className="bg-black/40 border border-white/5 p-3 rounded-lg hover:border-cyan-500/10 transition-all font-sans space-y-1.5 text-right"
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {iconEmoji} {log.type === 'status_change' ? 'تعديل الحالة' : log.type === 'system_action' ? 'إجراء النظام' : 'تخطي الحدود'}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            ⏱️ {log.timeString}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-[12px] font-black text-white">
                            {log.event}
                          </h5>
                          <p className="text-[11px] text-gray-400 leading-normal">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* كشاف القاموس  للأخطاء (SSOT Error Explorer) */}
          <Card id="ssot-error-explorer-card" className="bg-[#020502]/95 border border-[#00ffcc]/20 shadow-xl overflow-hidden relative text-right">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00ffcc] animate-pulse" />
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-[#00ffcc] animate-pulse" />
                    كشاف القاموس  للأخطاء (SSOT Error Explorer)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-gray-400 mt-1 font-sans">
                    أداة فحص تفاعلية لرموز الأمان والمحكم الميداني الحافة
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] border-[#00ffcc]/20 text-[#00ffcc] bg-[#00ffcc]/5 font-mono">
                  V5.5-Secured
                </Badge>
              </div>

              {/* البحث و الفلترة */}
              <div className="mt-4 space-y-2.5">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="ابحث بكود الخطأ، الاسم، أو الإجراء الوقائي..."
                    value={errorSearch}
                    onChange={(e) => setErrorSearch(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-lg py-2 pr-9 pl-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffcc]/40 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 justify-start">
                  <Button
                    variant={errorCategory === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ALL')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ALL' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    الكل
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-SOV' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-SOV')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ERR-SOV' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    🛡️ الإدارة
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-FIN' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-FIN')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ERR-FIN' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    💸 النشاط المالي
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-MAP' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-MAP')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ERR-MAP' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    🗺️ المحكم الرقمي
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-ADV' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-ADV')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ERR-ADV' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    📢 الإعلانات
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-KNL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-KNL')}
                    className={`h-7 text-[10px] font-bold px-2 ${errorCategory === 'ERR-KNL' ? 'bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    🎛️ الكوابح
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {filteredErrors.length === 0 ? (
                <div className="p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl space-y-1.5">
                  <AlertCircle className="h-6 w-6 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">لا توجد رموز أخطاء تطابق بحثك حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredErrors.map((err) => {
                    const isExpanded = expandedErrorCode === err.code;
                    let categoryIcon = <Lock className="h-3.5 w-3.5 text-cyan-400" />;
                    let label = "إدارة وصلاحيات";
                    if (err.code.startsWith('ERR-FIN')) {
                      categoryIcon = <Coins className="h-3.5 w-3.5 text-emerald-400" />;
                      label = "نشاط مالي ومحفظة";
                    } else if (err.code.startsWith('ERR-MAP')) {
                      categoryIcon = <Compass className="h-3.5 w-3.5 text-sky-400" />;
                      label = "محكم رقمي وخرائط";
                    } else if (err.code.startsWith('ERR-ADV')) {
                      categoryIcon = <Megaphone className="h-3.5 w-3.5 text-purple-400" />;
                      label = "حملات إعلانية";
                    } else if (err.code.startsWith('ERR-KNL')) {
                      categoryIcon = <Sliders className="h-3.5 w-3.5 text-rose-400 animate-pulse" />;
                      label = "نواة السيطرة والكبح";
                    }

                    return (
                      <div
                        key={err.code}
                        onClick={() => setExpandedErrorCode(isExpanded ? null : err.code)}
                        className={`border rounded-lg p-3 transition-all cursor-pointer text-right select-none ${
                          isExpanded
                            ? 'bg-black/80 border-[#00ffcc]/40 shadow-[0_0_12px_rgba(0,255,204,0.08)]'
                            : 'bg-black/40 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            {categoryIcon}
                            <span className="text-[12px] font-black font-mono text-white">
                              {err.code}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans">
                            {label}
                          </span>
                        </div>

                        <div className="mt-1.5">
                          <h4 className="text-[12px] font-bold text-gray-200">
                            {err.name}
                          </h4>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-fadeIn text-right">
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-500 block">الوصف الأمني للخلل:</span>
                              <p className="text-[11px] text-gray-300 leading-normal">
                                {err.description}
                              </p>
                            </div>
                            <div className="bg-[#022a22]/30 border border-emerald-500/20 rounded p-2 space-y-1">
                              <span className="text-[9px] text-[#00ffcc] font-bold block">🛡️ الإجراء الوقائي الآلي الحافة:</span>
                              <p className="text-[11px] text-emerald-300 leading-normal font-sans">
                                {err.action}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
