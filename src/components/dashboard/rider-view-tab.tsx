'use client';

import React, { useState } from 'react';
import { useRiderOperations } from '@/hooks/use-rider-operations';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wifi, Loader2, Info, MapPin, Phone, ShieldCheck, Star, Heart } from 'lucide-react';
import { DriverSovereignCard } from './rider/driver-sovereign-card';
import { RequestRideModal } from './rider/request-ride-modal';
import { OfferGallery } from './rider/offer-gallery';
import { VehicleSensoryProfile } from '../shared/VehicleSensoryProfile';
import { StarRating } from '@/components/ui/star-rating';
import { Card, CardContent } from '@/components/ui/card';
import { generateSovereignRouteUrl } from '@/lib/routing';
import { SovereignDict } from '@/lib/sovereign-dictionary';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'motion/react';
import { RadarRiderDashboard, HistoricalTrip } from './rider/rider-dashboard';
import { RiderPortal } from './rider-portal';
import { cn } from '@/lib/utils';

export function RiderViewTab() {
  const { 
    trip, tripStatus, pulsedDrivers, cancelTrip, isCancelling,
    acceptedDriver, selectOffer, isSelectingOffer, 
    rateTrip, isRating, confirmCheckpoint, isConfirmingCheckpoint,
    executeRedPathGuillotine, isExecutingGuillotine,
    isRequestModalOpen, openRequestModal, isRadarActive
  } = useRiderOperations()!;

  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'classic' | 'handshake'>('classic');

  const riderProfile = React.useMemo(() => {
    const ratingVal = user?.rating !== undefined 
      ? user.rating 
      : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 4.8);

    return {
      id: user?.uid || 'temp-rider-id',
      rating: ratingVal,
      governorate: user?.governorate || 'عمان',
      district: user?.district || 'وادي السير'
    };
  }, [user]);

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(() => {
    return [
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
  }, []);

  const systemMessages = React.useMemo(() => {
    return [
      'تنبيه: تم رصد كثافة ركاب مرتفعة في لواء ناعور المجاورة نتيجة تذبذب طفيف في العروض.',
      `تنبيه ملاحي: أعمال صيانة وإغلاقات مرورية جزئية في شارع اللواء الرئيسي بـلواء ${user?.district || 'وادي السير'}، يرجى احتساب ذلك في الرحلات القادمة.`
    ];
  }, [user]);

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [riderFeedback, setRiderFeedback] = useState({
    driverRating: 0,
    vehicleRating: 0,
    giveHeart: false,
    sensory: { cleanliness: 5, quietness: 5, adherence: 5 }
  });

  const [localCountdown, setLocalCountdown] = useState<number | null>(null);

  React.useEffect(() => {
    if (trip?.estimatedTime) {
      setLocalCountdown(trip.estimatedTime);
    } else if ((trip as any)?.frozenDurationMin) {
      setLocalCountdown((trip as any).frozenDurationMin);
    } else {
      setLocalCountdown(null);
    }
  }, [trip?.estimatedTime, (trip as any)?.frozenDurationMin]);

  React.useEffect(() => {
    if (localCountdown === null || localCountdown <= 1) return;
    const interval = setInterval(() => {
      setLocalCountdown(prev => {
        if (prev && prev > 1) {
          return prev - 1;
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [localCountdown]);

  // 1. Rendering Request Modal (Always available if idle)
  if (tripStatus === 'idle') {
    return (
      <>
        {/* Render Request Dialog when active */}
        <RequestRideModal />

        {/* Real-time Sovereign Standby Passenger Interface when modal is closed */}
        {!isRequestModalOpen && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                const adStageElement = document.querySelector('.ad-stage-clicktarget');
                if (adStageElement) {
                  (adStageElement as HTMLElement).click();
                }
              }
            }}
            className="h-full p-4 pb-28 select-none text-right font-sans relative z-20 pointer-events-auto space-y-6 flex flex-col items-center w-full"
          >
            {/* Top Bar Spacer */}
            <div />

            {/* Segmented control for switching sub-tabs */}
            <div className="flex bg-black/60 p-1 rounded-2xl border border-white/5 gap-1.5 w-full max-w-sm pointer-events-auto" dir="rtl">
              <button
                onClick={() => setActiveSubTab('classic')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer",
                  activeSubTab === 'classic'
                    ? "bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/25"
                    : "text-gray-400 hover:text-white"
                )}
              >
                الراصد الكلاسيكي 📡
              </button>
              <button
                onClick={() => setActiveSubTab('handshake')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer",
                  activeSubTab === 'handshake'
                    ? "bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/25"
                    : "text-gray-400 hover:text-white"
                )}
              >
                المصافحة والأسعار 🤝
              </button>
            </div>

            {activeSubTab === 'classic' ? (
              <>
                {/* Central Standby Theatre Plate */}
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-full max-w-sm bg-[#050D05]/95 border-2 border-emerald-500/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(16,185,129,0.15)] backdrop-blur-md space-y-5 pointer-events-auto"
                >
                  {/* Pulsing indicator */}
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3" dir="rtl">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      بروتوكول الانتظار السيادي V5.5
                    </span>
                    <span className="text-gray-500 font-mono text-[9px] font-bold">UTC: 2026-06-10</span>
                  </div>

                  {/* Display Typography */}
                  <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-black text-white tracking-tight">أهلاً بك في فضاء النبض السيادي</h1>
                    <p className="text-xs text-gray-400 leading-relaxed px-2">
                      الرادار الذكي يعمل الآن كوسيط محايد بموجب عقيدة التكلفة الصفرية ($0.00). المسرح الخلفي يعرض إعلانات محلية فائقة الدقة بنظام البصمة المضمونة.
                    </p>
                  </div>

                  {/* JetBrains Mono clock and status */}
                  <div className="bg-black/50 border border-emerald-500/10 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">التوقيت والتغطية الحالية للراصد</span>
                    <span className="text-lg font-mono font-bold text-emerald-400 block tracking-widest">
                      {user?.district || 'وادي السير'} • عمان
                    </span>
                    <span className="text-[9px] text-gray-500 block">نطاق الاستحواذ الدائري: 1.5 كم مغطى بالكامل</span>
                  </div>

                  {/* Launcher Button */}
                  {isRadarActive === false ? (
                    <div className="w-full min-h-16 bg-rose-950/20 border-2 border-rose-500/30 text-rose-400 font-extrabold text-xs rounded-2xl flex items-center justify-center p-4 text-center leading-normal">
                      🚫 الخدمة معلقة مؤقتاً بناءً على القرارات الرسمية
                    </div>
                  ) : (
                    <Button 
                      onClick={openRequestModal}
                      className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl tracking-tight rounded-2xl shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-emerald-500/20 flex items-center justify-center gap-2"
                      dir="rtl"
                    >
                      <span>إطلق نداء الراصد الموحد 🚀</span>
                    </Button>
                  )}
                </motion.div>

                {/* [SCR-DASH-RIDER-118] غرفة تحكم الراكب وأرشيف الـ 3 أيام المطهّر تلقائياً */}
                <div className="w-full max-w-lg pointer-events-auto">
                  <RadarRiderDashboard 
                    riderProfile={riderProfile}
                    tripsWithin72Hours={tripsWithin72Hours}
                    systemMessages={systemMessages}
                  />
                </div>

                {/* Bottom Slogan */}
                <p className="text-[10px] text-gray-400 font-bold text-center leading-normal max-w-xs uppercase bg-black/40 py-1.5 px-4 rounded-full border border-white/5 pointer-events-auto">
                  🛡️ رادار النبض: $0.00 تكلفة خادم لإنصاف أطراف الرحلة.
                </p>
              </>
            ) : (
              <RiderPortal />
            )}
          </div>
        )}
      </>
    );
  }

  // ==================== UNIVERSAL SOVEREIGN MODAL (RAD-CMD-035-SOVEREIGN-MODAL) ====================
  const renderSovereignCard = (stateType: 'floating' | 'auction_pulse' | 'confirmed') => {
    let badgeText = '';
    let badgeStyle = '';
    let titleText = '';
    let descriptionText = '';
    
    if (stateType === 'floating') {
      badgeText = 'قيد البث الجيومكاني 📡';
      badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      titleText = 'بث العوامة النسيجية';
      descriptionText = 'يجري الآن بث نداء الراصد والتقاط عروض السائقين بنظام التكلفة الصفرية المباشرة.';
    } else if (stateType === 'auction_pulse') {
      badgeText = 'عروض المزاد الميداني ⚡';
      badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
      titleText = 'صالة المزاد الميداني';
      descriptionText = `تقدم الآن ${trip?.offers?.length || 0} كباتن بعروضهم الحرة والمقيدة في نطاقك المباشر.`;
    } else {
      badgeText = 'مؤكد ✔️';
      badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      titleText = 'بيانات الناقل المعتمد';
      descriptionText = 'تم تأكيد الرحلة سيادياً وتثبيت الناقل والسعر النهائي بموجب الاتفاق المشترك.';
    }

    const estimatedTimeVal = localCountdown ? `${localCountdown} دقيقة` : 'غير محدد';
    const frozenPrice = trip?.offerPrice !== undefined && trip?.offerPrice !== -1 
      ? `${Number(trip.offerPrice).toFixed(2)} د.أ` 
      : 'حسب عداد المشغل';

    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[80vh] animate-in fade-in duration-600 relative z-20 w-full">
        <motion.div 
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md bg-[#131C31]/95 border-2 border-emerald-500/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(16,185,129,0.18)] backdrop-blur-md space-y-6 text-right"
          dir="rtl"
        >
          {/* Header Block */}
          <div className="space-y-3 border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black rounded-full border ${badgeStyle} uppercase tracking-wider`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                {badgeText}
              </span>
              <span className="text-gray-500 font-mono text-[9px] font-bold">UTC: 2026-06-13</span>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">{titleText}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">{descriptionText}</p>
            </div>
          </div>

          {/* Grid Layout (Key: Value Matrix) */}
          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5">
            {stateType === 'floating' && (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">العوامة الرقمية (H3)</span>
                  <span className="text-xs font-mono font-bold text-white block truncate">{trip?.h3Index ? trip.h3Index.substring(0, 10).toUpperCase() : trip?.gridId || 'غير محدد'}</span>
                </div>
                <div className="space-y-1 border-r border-white/5 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">السعر المقترح</span>
                  <span className="text-sm font-black text-emerald-400 block">{trip?.offerPrice ? `${trip.offerPrice.toFixed(2)} د.أ` : 'غير محدد'}</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 col-span-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">الراصدون النشطون</span>
                  <span className="text-sm font-black text-emerald-400 block">{pulsedDrivers.length} / 9</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 border-r border-white/5 pr-3 col-span-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">نطاق الاستحواذ</span>
                  <span className="text-xs font-semibold text-white block">1.5 كم مغطى بالكامل</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 col-span-2">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">الوجهة المستهدفة</span>
                  <span className="text-xs font-bold text-white block truncate">{trip?.dropoff || 'غير محدد'}</span>
                </div>
              </>
            )}

            {stateType === 'auction_pulse' && (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">عدد العطاءات</span>
                  <span className="text-sm font-black text-emerald-400 block">{trip?.offers?.length || 0} كباتن مصرحين</span>
                </div>
                <div className="space-y-1 border-r border-white/5 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">أدنى عرض متاح</span>
                  <span className="text-sm font-black text-emerald-400 block">
                    {trip?.offers && trip.offers.length > 0 
                      ? `${Math.min(...trip.offers.map(o => o.price)).toFixed(2)} د.أ` 
                      : 'غير محدد'}
                  </span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 col-span-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">رسوم الضمان</span>
                  <span className="text-xs font-black text-white block">$0.00 (حرة بالكامل)</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 border-r border-white/5 pr-3 col-span-1">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">رتبة القنوات الحالية</span>
                  <span className="text-xs font-semibold text-white block">بلاتيني / ذهبي نشط</span>
                </div>
              </>
            )}

            {stateType === 'confirmed' && (
              <>
                <div className="space-y-1 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">الناقل المعمد والمفوض</span>
                    <span className="text-sm font-black text-emerald-400 block">{acceptedDriver?.name || 'مستقل'}</span>
                  </div>
                  {acceptedDriver?.rating && (
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-black text-white">{acceptedDriver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">المركبة الحالية</span>
                  <span className="text-xs font-bold text-white block">{acceptedDriver?.vehicle?.make || 'بريوس'} • {acceptedDriver?.vehicle?.color || ''}</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 border-r border-white/5 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">رقم اللوحة المعرف</span>
                  <span className="text-xs font-mono font-bold text-white block tracking-widest">{acceptedDriver?.vehicle?.plate || 'محدد مسبقاً'}</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">السعر الملتزم به</span>
                  <span className="text-sm font-black text-emerald-400 block">{frozenPrice}</span>
                </div>
                <div className="space-y-1 pt-3 border-t border-white/5 border-r border-white/5 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">الزمن التقديري</span>
                  <span className="text-sm font-black text-white block">{estimatedTimeVal}</span>
                </div>
              </>
            )}
          </div>

          {/* Contextual Visual Blocks */}
          {stateType === 'floating' && (
            <div className="space-y-2">
              {trip?.riderNotification && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 font-bold leading-relaxed">{trip.riderNotification}</p>
                </div>
              )}
              <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                <div className="relative">
                  <Wifi className="w-10 h-10 text-emerald-500 animate-pulse" />
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-ping animate-pulse-slow" />
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">يرجى الانتظار، يجري رصد وتلقي عطاءات المشغلين...</span>
              </div>
            </div>
          )}

          {stateType === 'auction_pulse' && trip?.offers && (
            <div className="space-y-3">
              <span className="text-[10px] text-gray-500 font-bold block uppercase text-right">احتر العرض الأنسب لك للتفويض المباشر:</span>
              <div className="max-h-[32vh] overflow-y-auto space-y-3 pr-1">
                {trip.offers.map((offer) => {
                  const isPriceBurned = offer.isDumping || offer.driverRank === 'Silver' || offer.driverRank === 'Bronze';
                  
                  return (
                    <div 
                      key={offer.driverId} 
                      className="p-3.5 bg-[#101726]/90 border border-emerald-500/15 rounded-2xl flex flex-col gap-3 hover:border-emerald-500/40 transition-all shadow-md relative text-right"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                            {offer.driverName.substring(0, 2)}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-white block">{offer.driverName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-[10px] text-white font-bold">{offer.driverRating.toFixed(1)}</span>
                              <span className="text-[9px] text-gray-500 font-bold bg-white/5 px-1.5 py-0.2 rounded border border-white/5">{offer.driverRank}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left select-none">
                          <span className="text-[9px] text-gray-500 font-bold block">العرض المالي</span>
                          {offer.price === -1 ? (
                            <span className="text-xs font-black text-yellow-400">حسب العداد</span>
                          ) : (
                            <span className="text-sm font-black text-emerald-400">{offer.price.toFixed(2)} د.أ</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/5" dir="rtl">
                        <span>{offer.driverVehicle?.make || 'بريوس'} {offer.driverVehicle?.color || 'فضي'} - {offer.driverVehicle?.year || '2020'}</span>
                        <button 
                          type="button"
                          className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          onClick={() => setSelectedVehicle(offer.driverVehicle)}
                        >
                          <Info className="w-3 h-3" />
                          عرض ملف المركبة
                        </button>
                      </div>

                      {offer.isDumping && (
                        <div className="bg-red-500/5 border border-red-500/15 text-red-400 p-2 rounded-xl text-[10px] leading-relaxed">
                          ⚠️ السعر محروق وأقل بكثير من متوسط السوق؛ قد ينطوي على تضحية بالجودة.
                        </div>
                      )}

                      <Button 
                        onClick={() => selectOffer(offer)} 
                        disabled={isSelectingOffer}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] text-white font-bold text-xs rounded-xl transition-all border border-emerald-500/20 shadow-md flex items-center justify-center gap-1"
                      >
                        {isSelectingOffer ? <Loader2 className="animate-spin w-4 h-4" /> : 'تفويض واختيار هذا الكابتن 🫡'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Call to Actions Block */}
          <div className="pt-2 border-t border-white/5 flex gap-3 text-right">
            {stateType === 'confirmed' ? (
              <>
                <Button 
                  asChild
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-tight rounded-xl shadow-lg border border-emerald-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <a href={`tel:${acceptedDriver?.phone || ''}`}>
                    <Phone className="w-4 h-4" />
                    <span>اتصال ملاحي بالناقل</span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={cancelTrip}
                  disabled={isCancelling}
                  className="h-12 px-4 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-white font-bold text-xs rounded-xl transition-all"
                >
                  {isCancelling ? <Loader2 className="animate-spin w-4 h-4" /> : 'إلغاء الناقل'}
                </Button>
              </>
            ) : (
              <Button 
                variant="destructive" 
                onClick={cancelTrip}
                disabled={isCancelling}
                className="w-full h-12 bg-red-950/30 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black tracking-widest text-sm rounded-xl transition-all shadow-md flex items-center justify-center"
              >
                {isCancelling ? <Loader2 className="animate-spin w-4 h-4" /> : 'إلغاء نداء الراصد بالكامل ✖️'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // 2. Rendering Search & Radar Screen
  if (tripStatus === 'searching') {
    const hasOffers = trip?.offers && trip.offers.length > 0;
    
    if (hasOffers) {
      return (
        <>
          {renderSovereignCard('auction_pulse')}
          <VehicleSensoryProfile 
            vehicle={selectedVehicle} 
            isOpen={!!selectedVehicle} 
            onClose={() => setSelectedVehicle(null)} 
          />
        </>
      );
    }

    return renderSovereignCard('floating');
  }

  // 3. Rendering Busy (In-Progress) Screen
  if (tripStatus === 'busy' && trip) {
    return renderSovereignCard('confirmed');
  }

  // 4. Rendering Rating Screen
  if (tripStatus === 'rating') {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md bg-[#050D05] border-emerald-900/50 text-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black">{SovereignDict.RATING.SEAL_TITLE}</DialogTitle>
            <DialogDescription className="text-gray-400">{SovereignDict.RATING.SEAL_DESC}</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-8">
             <div className="space-y-3 text-center">
                <Label className="text-emerald-500 font-bold">{SovereignDict.RATING.SOUL_LABEL}</Label>
                <div className="flex justify-center">
                  <StarRating rating={riderFeedback.driverRating} setRating={(r: number) => setRiderFeedback({...riderFeedback, driverRating: r})} size="lg" />
                </div>
             </div>

             <div className="space-y-3 text-center">
                <Label className="text-emerald-500 font-bold">{SovereignDict.RATING.BODY_LABEL}</Label>
                <div className="flex justify-center">
                  <StarRating rating={riderFeedback.vehicleRating} setRating={(r: number) => setRiderFeedback({...riderFeedback, vehicleRating: r})} size="lg" color="amber" />
                </div>
             </div>

             <div className="flex items-center justify-center gap-4 p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                <span className="text-sm font-bold">{SovereignDict.RATING.FAVORITE_LABEL}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={riderFeedback.giveHeart ? "text-red-500 scale-125" : "text-gray-500"}
                  onClick={() => setRiderFeedback({...riderFeedback, giveHeart: !riderFeedback.giveHeart})}
                >
                  <Heart className={riderFeedback.giveHeart ? "fill-current" : ""} />
                </Button>
             </div>
          </div>

          <Button 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 font-black text-lg"
            disabled={isRating || riderFeedback.driverRating === 0 || riderFeedback.vehicleRating === 0}
            onClick={() => rateTrip(riderFeedback)}
          >
            {isRating ? <Loader2 className="animate-spin" /> : SovereignDict.RATING.SUBMIT_BTN}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // 5. Checkpoint Screen (Red Path)
  if (tripStatus === 'checkpoint_required') {
     return (
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
          <Card className="w-full max-w-md bg-red-950/20 border-red-500/50 shadow-2xl backdrop-blur-md">
            <CardContent className="p-6 space-y-6 text-center">
              <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50 animate-pulse">
                <Wifi className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white">{SovereignDict.CHECKPOINT.TITLE}</h2>
              <p className="text-sm text-red-200/70 leading-relaxed">
                {SovereignDict.CHECKPOINT.DESCRIPTION}
              </p>

              <div className="space-y-3">
                 <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-bold" onClick={confirmCheckpoint} disabled={isConfirmingCheckpoint}>
                   {isConfirmingCheckpoint ? <Loader2 className="animate-spin" /> : SovereignDict.CHECKPOINT.IGNORE_BTN}
                 </Button>
                 <Button variant="destructive" className="w-full h-12 font-bold" onClick={executeRedPathGuillotine} disabled={isExecutingGuillotine}>
                   {isExecutingGuillotine ? <Loader2 className="animate-spin" /> : SovereignDict.CHECKPOINT.GUILLOTINE_BTN}
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
     );
  }

  return <RequestRideModal />;
}
