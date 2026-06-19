'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb } from '@/lib/dexie-db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History, Award, BookOpen, Clock, Heart, Trash2, Phone, Sparkles, AlertCircle, FileText } from 'lucide-react';

interface HistoricalTrip {
  tripId: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
}

export function HistoryTab() {
  const { user, isCaptain, isPassenger } = useAuth();
  const [favoriteCaptains, setFavoriteCaptains] = useState<any[]>([]);
  const { toast } = useToast();

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

  useEffect(() => {
    loadFavorites();
  }, []);

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
    const rawTrips: HistoricalTrip[] = [
      {
        tripId: 'h-trip-1',
        captainName: 'ثائر بني هاني',
        captainRank: 'PLATINUM',
        captainPhone: '0799988771',
        vehicleInfo: 'هيونداي أيونيك لون فضي - موديل 2022',
        finalPrice: 2.75,
        timestamp: Date.now() - 3 * 3600 * 1000, // 3 hours ago
      },
      {
        tripId: 'h-trip-2',
        captainName: 'أسامة النبر',
        captainRank: 'GOLD',
        captainPhone: '0788877662',
        vehicleInfo: 'كيا نيرو لون كحلي - موديل 2021',
        finalPrice: 3.40,
        timestamp: Date.now() - 17 * 3600 * 1000, // 17 hours ago
      }
    ];
    return rawTrips.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, []);

  // For Captain: Generate compliant mock history
  const captainHistoricalTrips = useMemo(() => {
    return [
      {
        tripId: 'c-trip-1',
        riderName: 'ليث مأدبا',
        pickup: 'الدوار السابع',
        dropoff: 'جامعة عمان الأهلية',
        earnedPrice: 4.80,
        timestamp: Date.now() - 2 * 3600 * 1000,
        status: 'completed'
      },
      {
        tripId: 'c-trip-2',
        riderName: 'يارا دير غبار',
        pickup: 'دير غبار',
        dropoff: 'العبدلي بوليفارد',
        earnedPrice: 3.10,
        timestamp: Date.now() - 12 * 3600 * 1000,
        status: 'completed'
      }
    ];
  }, []);

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
          description: `تمت إزالة الكابتن ${trip.captainName} من الخزنة الرقمية.`,
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
          title: "💖 تم التخليد السيادي بنجاح",
          description: `تم حفظ الكابتن ${trip.captainName} كـ ناقل مفضل مستقر للأبد بصفر كلفة سحابية.`,
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
            سجلات النبض والأرشيف الميداني
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            مراجعة كامل نشاطك الميداني وأرشيف الرحلات الأخير. تماشياً مع معيار الأمان الدستوري، يتم تلقائياً شطب وحذف جميع السجلات التي يمر عليها أكثر من 72 ساعة لضمان خصوصيتك وعزل البيانات.
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
                  رحلات النشأة والعبور (آخر 3 أيام)
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1">
                  الرحلات الموثقة بموجب بروتوكول التكلفة الصفرية
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono">
                {riderHistoricalTrips.length} رحلة
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {riderHistoricalTrips.length === 0 ? (
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
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[12px] text-emerald-400 font-black font-mono block">
                            {trip.finalPrice.toFixed(2)} د.أ
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
                          <span>اتصال للكابتن لمفقودات الرحلة</span>
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
                  خزنة المفضلة والمستودع السيادي العازل
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-1">
                  النواقل المفضين المخلدين على جهازك محلياً بشكل دائم بصفر كلفة
                </CardDescription>
              </div>
              <Badge className="bg-emerald-950 text-emerald-400 text-[9px] border border-emerald-500/20">
                {favoriteCaptains.length} ناقلين
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {favoriteCaptains.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-[11px]">
                  إنقر على أيقونة <strong className="text-[#00ffcc]">القلب</strong> بالرحلات النشطة لتخليد الكباتن وتخزينهم في البوابة العازلة بشكل دائم.
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
        <Card className="bg-[#020502]/95 border border-emerald-950 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                سجل العوائد والمهام الميدانية المنجزة
              </CardTitle>
              <CardDescription className="text-[10px] text-gray-400 mt-1 font-sans">
                المهام المعتمدة الموثقة بمركز النبض
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono">
              {captainHistoricalTrips.length} مهمة
            </Badge>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {captainHistoricalTrips.length === 0 ? (
              <div className="p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl">
                <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-gray-400 font-medium">لا توجد مهام ميدانية منجزة مسجلة للواء حالياً.</p>
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
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-[12px] text-emerald-400 font-black block">
                          +{trip.earnedPrice.toFixed(2)} د.أ
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
      )}
    </div>
  );
}
