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

export function RiderViewTab() {
  const { 
    trip, tripStatus, pulsedDrivers, cancelTrip, isCancelling,
    acceptedDriver, selectOffer, isSelectingOffer, 
    rateTrip, isRating, confirmCheckpoint, isConfirmingCheckpoint,
    executeRedPathGuillotine, isExecutingGuillotine,
    isRequestModalOpen, openRequestModal
  } = useRiderOperations();

  const { user } = useAuth();

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
              <Button 
                onClick={openRequestModal}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl tracking-tight rounded-2xl shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-emerald-500/20 flex items-center justify-center gap-2"
                dir="rtl"
              >
                <span>إطلق نداء الراصد الموحد 🚀</span>
              </Button>
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
          </div>
        )}
      </>
    );
  }

  // 2. Rendering Search & Radar Screen
  if (tripStatus === 'searching') {
    const hasOffers = trip?.offers && trip.offers.length > 0;
    
    if (hasOffers) {
      return (
        <>
          <OfferGallery 
            offers={trip!.offers!} 
            favoriteIds={[]} 
            onSelect={selectOffer} 
            onCancel={cancelTrip}
            onInfo={setSelectedVehicle}
            isSelecting={isSelectingOffer}
            isCancelling={isCancelling}
          />
          <VehicleSensoryProfile 
            vehicle={selectedVehicle} 
            isOpen={!!selectedVehicle} 
            onClose={() => setSelectedVehicle(null)} 
          />
        </>
      );
    }

    const quota = 9;
    const emptySlots = Math.max(0, quota - pulsedDrivers.length);

    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[80vh] animate-in fade-in duration-700 relative z-20">
          <div className="w-full max-w-md space-y-4">
              <div className="text-center space-y-2 mb-6">
                  <div className="flex justify-center">
                      <div className="relative">
                          <Wifi className="w-16 h-16 text-emerald-500 animate-pulse" />
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-ping" />
                      </div>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-widest">{SovereignDict.SEARCH.TITLE}</h2>
                  <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-tighter">
                      {SovereignDict.SEARCH.SUBTITLE}: {pulsedDrivers.length}/{quota}
                  </p>
              </div>

              {trip?.riderNotification && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-200 font-bold leading-relaxed">{trip.riderNotification}</p>
                  </div>
              )}

              <div className="space-y-1">
                  {pulsedDrivers.map((driver: any) => (
                      <DriverSovereignCard key={driver.uid} driver={driver} />
                  ))}
                  
                  {Array.from({ length: emptySlots }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-20 border border-dashed border-emerald-900/20 bg-emerald-950/5 rounded-xl flex items-center justify-center opacity-30 mb-3">
                          <div className="flex items-center gap-2 text-emerald-900">
                              <span className="text-[10px] font-black tracking-widest uppercase">{SovereignDict.SEARCH.EMPTY_SLOT}</span>
                          </div>
                      </div>
                  ))}
              </div>

              <Button 
                  variant="destructive" 
                  className="w-full h-14 mt-6 bg-red-950/40 border border-red-500/30 text-red-500 font-black tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  onClick={cancelTrip}
                  disabled={isCancelling}
              >
                  {isCancelling ? <Loader2 className="animate-spin" /> : SovereignDict.SEARCH.CANCEL_RADAR}
              </Button>
          </div>
      </div>
    );
  }

  // 3. Rendering Busy (In-Progress) Screen
  if (tripStatus === 'busy' && trip) {
    const isDriverUp = acceptedDriver?.uid ? (acceptedDriver.uid.charCodeAt(acceptedDriver.uid.length - 1) % 2 === 0) : true;
    const frozenPrice = trip.offerPrice !== undefined && trip.offerPrice !== -1 
      ? `${Number(trip.offerPrice).toFixed(2)} دينار` 
      : 'حسب عداد المشغل';
    const estimatedTimeVal = localCountdown ? `${localCountdown} دقيقة` : 'غير محدد';

    return (
      <div className="flex items-center justify-center p-4 min-h-[80vh]">
        <Card className="w-full max-w-md bg-[#091B09]/90 border-emerald-500/30 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
               <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
               <h2 className="text-xl font-black text-white">{SovereignDict.BUSY.TITLE}</h2>
               <p className="text-xs text-gray-400">{SovereignDict.BUSY.SUBTITLE}</p>
            </div>

            {/* [العمى التقني للراكب] - عرض السعر النهائي والزمن فقط وحظر الخرائط تماماً لمنع التشتيت */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded-xl border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">السعر والمسافة الملتزم بها</span>
                <span className="text-lg font-black text-emerald-400 block tracking-tight">{frozenPrice}</span>
              </div>
              <div className="bg-black/50 p-4 rounded-xl border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">الوقت التقديري للوصول</span>
                <span className="text-lg font-black text-emerald-400 block tracking-tight">{estimatedTimeVal}</span>
              </div>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase">{SovereignDict.BUSY.DRIVER}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-emerald-400 font-black">{acceptedDriver?.name}</span>
                     <div className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDriverUp ? 'bg-red-500' : 'bg-blue-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isDriverUp ? 'bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-blue-500 opacity-60'}`}></span>
                     </div>
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase">{SovereignDict.BUSY.VEHICLE}</span>
                  <span className="text-white font-medium">{acceptedDriver?.vehicle?.make} - {acceptedDriver?.vehicle?.color}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase">{SovereignDict.BUSY.PLATE}</span>
                  <span className="text-white font-mono font-bold tracking-widest">{acceptedDriver?.vehicle?.plate}</span>
               </div>
            </div>

            <div className="space-y-3">
               <Button variant="outline" className="w-full h-12 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" asChild>
                  <a href={`tel:${acceptedDriver?.phone}`}>
                    <Phone className="ml-2 w-4 h-4" /> {SovereignDict.BUSY.CALL}
                  </a>
               </Button>
               <Button variant="destructive" className="w-full h-12 bg-red-900/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all" onClick={cancelTrip}>
                  {SovereignDict.BUSY.CANCEL}
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
