'use client';

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import type { Trip } from '@/core/types';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, RadioTower, Lock, Zap, ShieldCheck, Loader2, Phone } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateSovereignDistance, estimateTripTime, generateSovereignRouteUrl } from '@/core/logic/geospatial-kernel';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/ui/star-rating';
import { DriverPricingCard } from './driver-pricing-card';
import { usePricingMatrix } from '@/hooks/use-pricing-matrix';
import { useAuth } from '@/hooks/use-auth';
import { RadarCaptainDashboard } from './driver/captain-dashboard';

const KineticTrendTicker = React.memo(() => {
  const anonymizedSectors = [
    { name: 'منطقة طلب مرتفع A1', trend: '+4.8%', status: 'high_demand' },
    { name: 'منطقة نشطة C2', trend: '+12.5%', status: 'high_demand' },
    { name: 'النطاق اللوجستي المتزن B9', trend: '-2.1%', status: 'balanced' },
    { name: 'المعقل الحضري الفرعي F3', trend: '+8.3%', status: 'high_demand' },
    { name: 'قطاع الاستقرار العام G5', trend: '0.0%', status: 'balanced' },
    { name: 'عوام مجمعات الضغط E7', trend: '-5.4%', status: 'high_supply' },
  ];

  return (
    <div className="bg-emerald-950/25 border-y border-emerald-900/30 py-2 overflow-hidden w-full relative h-9 flex items-center shrink-0">
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-continuous {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `}</style>
      <div className="animate-marquee-continuous whitespace-nowrap gap-2 flex items-center font-mono text-[10px]">
        {[...anonymizedSectors, ...anonymizedSectors, ...anonymizedSectors].map((sector, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 select-none">
            <span className="text-emerald-800 font-bold">•</span>
            <span className="font-bold text-gray-200 font-sans">{sector.name}</span>
            <span className={
              sector.status === 'high_demand'
                ? 'text-emerald-400 font-extrabold'
                : sector.status === 'high_supply'
                ? 'text-red-400 font-extrabold'
                : 'text-gray-400 font-extrabold'
            }>
              [{sector.trend}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export function DriverViewTab() {
  const {
    driverStatus, activeRequest, acceptedRider, submitOffer, isSubmittingOffer,
    isRequestListOpen, toggleRequestList, isDormancyWarningVisible, resetDormancyTimer,
    endTrip, isEndingTrip, rateAndFinishTrip, isRatingRider, requests,
    driverLocation, rejectRequest, rejectedTripIds, pulseData,
    currentDistrict, currentH3Cell
  } = useDriverOperations()!;

  const { user } = useAuth();

  const { matrix } = usePricingMatrix();
  const { toast } = useToast();
  const [riderRating, setRiderRating] = useState(0);
  const [activePricingRequest, setActivePricingRequest] = useState<Trip | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsDashboardOpen(true);
    };
    window.addEventListener('open-captain-dashboard', handleOpen);
    return () => window.removeEventListener('open-captain-dashboard', handleOpen);
  }, []);

  const visibleRequests = useMemo(() => {
    return requests.filter(req => {
      if (rejectedTripIds.includes(req.id)) return false;
      if (req.requiresOfficialRate && !matrix.isOperatorLinked) return false;
      return true;
    });
  }, [requests, rejectedTripIds, matrix.isOperatorLinked]);

  // تطبيق شروط الحصص: 9 أساسي + 3 احتياط
  const primaryRequests = useMemo(() => visibleRequests.slice(0, 9), [visibleRequests]);

  const handleRateAndFinish = useCallback(() => {
    if (riderRating === 0) {
      toast({
        variant: 'destructive',
        title: 'مطلوب تقييم',
        description: 'تطبيقاً للشروط، يجب تقييم الراكب قبل العودة للميدان.'
      });
      return;
    }
    rateAndFinishTrip(riderRating);
    setRiderRating(0);
  }, [riderRating, rateAndFinishTrip, toast]);

  const { tripDistance, dynamicTripDuration } = useMemo(() => {
    if (!activePricingRequest) return { tripDistance: 0, dynamicTripDuration: 0 };

    const tripDistrict = activePricingRequest.district;
    const currentPulse = pulseData.find(p => p.id === tripDistrict);

    let pulseStatusForEstimate: 'critical' | 'active' | 'stable' | 'dormant' = 'stable';
    if (currentPulse) {
        if (currentPulse.trend === 'high_demand') pulseStatusForEstimate = 'critical';
        else if (currentPulse.trend === 'balanced') pulseStatusForEstimate = 'active';
    }

    const distance = activePricingRequest.estimatedDistance || 0;
    const duration = estimateTripTime(distance, pulseStatusForEstimate);

    return { tripDistance: distance, dynamicTripDuration: duration };
  }, [activePricingRequest, pulseData]);

  return (
    <>
      <AlertDialog open={isDormancyWarningVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل ما زلت هنا؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم تحويل حالتك إلى "خامل" لتوفير الموارد.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetDormancyTimer}>نعم، أنا متواجد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isRequestListOpen && (
        <div className="absolute inset-0 z-40 flex items-start justify-center bg-background/95 backdrop-blur-md p-4 pt-20 animate-in fade-in-25">
          <Card className="w-full max-w-lg shadow-2xl border-primary/20 glass-effect animate-in slide-in-from-top-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b bg-black/30">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-white">
                    <span className="font-headline tracking-wide">خريطة الطلبات</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-primary border-primary bg-black/50">
                    {primaryRequests.length} متاح
                  </Badge>
                </div>
                {currentDistrict && (
                  <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] py-0 px-2 font-mono" variant="outline">
                    المنطقة: {currentDistrict} • {currentH3Cell?.substring(0, 8)}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => toggleRequestList(false)} className="text-white hover:bg-white/10 h-8 w-8">
                <X className="w-5 h-5"/>
              </Button>
            </CardHeader>

            {/* مؤشر التوجه السعري الحركي المجهول */}
            <KineticTrendTicker />

            <CardContent className="p-3 space-y-3 overflow-y-auto max-h-[70vh]">
              {primaryRequests.length > 0 ? (
                <>
                  {primaryRequests.map((req) => {
                    const targetCoords = req.obfuscatedPickupCoords || req.pickupCoords;
                    const distanceToRider = driverLocation && targetCoords
                      ? calculateSovereignDistance(driverLocation.lat, driverLocation.lng, targetCoords.lat, targetCoords.lng)
                      : 0;

                    const anyReq = req as any;
                    const averageRiderRating = anyReq.riderRating !== undefined
                      ? anyReq.riderRating
                      : (anyReq.riderRatingSum && anyReq.riderRatingCount
                          ? anyReq.riderRatingSum / anyReq.riderRatingCount
                          : 5.0);
                    const isRiderFieldRisk = averageRiderRating <= 4.2;

                    return (
                      <Card key={req.id} className={`transition-colors duration-300 ${isRiderFieldRisk ? 'border-red-500/30 bg-red-950/10 hover:border-red-500/50' : 'bg-muted/30 border-white/10 hover:border-primary/50'}`}>
                        <div className="p-4 flex flex-col items-start">
                             <div className="space-y-1 w-full">
                                 <p className="font-bold text-lg flex items-center gap-2 text-white">
                                     {isRiderFieldRisk && (
                                     <div className="flex items-center justify-between text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-md p-1.5 px-2 mb-2 w-full animate-pulse font-sans">
                                         <span>🚨 مخاطر ميدانية</span>
                                         <span>تقييم الراكب: {averageRiderRating.toFixed(1)} / 5.0</span>
                                     </div>
                                  )}
                                  <MapPin className="w-4 h-4 text-primary" /> {req.dropoff}
                                 </p>
                                 <div className="flex justify-between items-center w-full gap-2">
                                     <p className="text-sm text-gray-400">
                                       {distanceToRider.toFixed(1)} كم للوصول • {req.estimatedTime} دقيقة للرحلة • {req.seats} مقاعد
                                     </p>
                                     {req.h3Index && (
                                         <Badge variant="outline" className="text-emerald-400 border-emerald-500/15 bg-emerald-950/20 font-mono text-[9px] shrink-0">
                                            H3: {req.h3Index}
                                         </Badge>
                                     )}
                                 </div>
                             </div>

                             <div className="flex gap-2 w-full mt-2">
                                 <Button onClick={() => rejectRequest(req.id)} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20 border border-transparent hover:border-destructive/30 shrink-0">
                                     <X className="w-5 h-5" />
                                 </Button>

                                 <Button
                                   onClick={() => setActivePricingRequest(req)}
                                   className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold tracking-wide shadow-md shadow-green-900/20"
                                 >
                                   <Zap className="w-4 h-4 ml-1" />
                                   تقديم عرض سعر
                                 </Button>
                             </div>
                        </div>
                      </Card>
                    );
                  })}

                  {[1, 2, 3].map((placeholderIndex) => (
                    <Card key={`placeholder-${placeholderIndex}`} className="bg-black/40 border-dashed border-white/20 opacity-60 pointer-events-none select-none">
                      <div className="p-4 flex justify-between items-center">
                          <div className="space-y-1">
                              <p className="font-bold text-lg flex items-center gap-2 text-white/50">
                                  <Lock className="w-4 h-4 text-muted-foreground" /> فرصة احتياطية {placeholderIndex}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                حصة احتياطية: تتدفق للرادار فور شغور المساحة الأساسية.
                              </p>
                          </div>
                          <Button disabled variant="outline" className="border-white/10 text-white/30 bg-transparent">
                              <Lock className="ml-2 h-4 h-4" /> مغلق
                          </Button>
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-center text-white/60 animate-in fade-in zoom-in duration-500">
                  <RadioTower className="w-20 h-20 mb-6 text-primary/40 animate-pulse-neon" />
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-wider">الرادار صامت حالياً</h3>
                  <p className="text-base px-6 leading-relaxed">
                    لا توجد طلبات متاحة في نطاقك الحالي (1.5 كم).<br/>
                    ابقَ في وضع <span className="text-primary font-bold">"التحفز"</span>، سيتم إعلامك بالفرص الجديدة فور ظهورها.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={driverStatus === 'busy' && !!activeRequest}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden>
            <DialogTitle>مهمة نشطة</DialogTitle>
            <DialogDescription>تفاصيل المهمة المقبولة للوصول إلى الراكب.</DialogDescription>
          </VisuallyHidden>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center border-b pb-4">
               <div>
                 <p className="text-xs text-muted-foreground">وجهة الراكب</p>
                 <p className="font-bold">{activeRequest?.dropoff}</p>
               </div>
               <div className="text-left">
                  <a
                    href={activeRequest ? generateSovereignRouteUrl(activeRequest) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="animate-pulse-neon">
                      <MapPin className="ml-2"/>
                      فتح تفاصيل الرحلة
                    </Button>
                  </a>
               </div>
            </div>
            <div className="mb-4 p-4 bg-yellow-950/30 border border-yellow-600/30 rounded-xl flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">المستحقات المضمونة</span>
              </div>
              {activeRequest?.offerPrice === -1 ? (
                <div className="text-center">
                  <span className="text-2xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                    تسعيرة العداد / التطبيق
                  </span>
                  <p className="text-[10px] text-yellow-600/80 mt-1">
                    تم إبلاغ الراكب بأنك ستحاسبه بناءً على نظام المشغل الخاص بك.
                  </p>
                </div>
              ) : activeRequest?.offerPrice !== undefined && activeRequest?.offerPrice !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                    {Number(activeRequest.offerPrice).toFixed(2)}
                  </span>
                  <span className="text-xl font-bold text-yellow-600">د.أ</span>
                </div>
              ) : (
                <span className="text-sm text-yellow-600/70 animate-pulse mt-2">
                  جاري استرجاع العقد...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={!acceptedRider?.phone}>
                          <Phone className="ml-2"/>
                          اتصال بالراكب
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>تنبيه قانوني</AlertDialogTitle>
                      <AlertDialogDescription>
                          بالضغط على "متابعة"، أنت توافق على استخدام رقمك الشخصي للاتصال. هذا الاتصال يخضع لقوانين الجرائم الإلكترونية والخصوصية في بلدك. المنصة وسيط تقني فقط.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction asChild>
                          <a href={`tel:${acceptedRider?.phone}`}>متابعة</a>
                      </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <Button onClick={endTrip} disabled={isEndingTrip}>
                  {isEndingTrip ? <Loader2 className="animate-spin" /> : 'إنهاء المهمة'}
              </Button>
            </div>

          </CardContent>
        </DialogContent>
      </Dialog>

      <Dialog open={driverStatus === 'rating' && !!activeRequest}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center">
            <DialogTitle>تقييم الراكب</DialogTitle>
            <DialogDescription>تقييمك يضمن عدالة الميدان. كيف كانت تجربة الرحلة مع الراكب؟</DialogDescription>
          </DialogHeader>
          <CardContent className="flex justify-center py-6">
            <StarRating
              rating={riderRating}
              setRating={setRiderRating}
              disabled={isRatingRider}
              size="md"
            />
          </CardContent>
          <Button onClick={handleRateAndFinish} disabled={riderRating === 0 || isRatingRider} className="w-full">
            {isRatingRider ? <Loader2 className="animate-spin" /> : 'إرسال والعودة للرادار'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* بطاقة استقبال الطلبات القريبة */}
      {driverStatus === 'active' && !isRequestListOpen && primaryRequests.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="bg-[#050D05]/95 border-2 border-emerald-500/30 text-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(16,185,129,0.15)] backdrop-blur-md pointer-events-auto flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <RadioTower className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                الطلبات القريبة النشطة
              </span>
              <Badge variant="outline" className="text-[9px] bg-emerald-950/40 border-emerald-500/20 text-emerald-300">
                متاح {primaryRequests.length}
              </Badge>
            </div>
            {(() => {
              const latestReq = primaryRequests[0];
              const distanceToRider = driverLocation && latestReq.pickupCoords
                ? calculateSovereignDistance(driverLocation.lat, driverLocation.lng, latestReq.pickupCoords.lat, latestReq.pickupCoords.lng)
                : 0;
              const anyReq = latestReq as any;
              const averageRiderRating = anyReq.riderRating !== undefined
                ? anyReq.riderRating
                : (anyReq.riderRatingSum && anyReq.riderRatingCount
                    ? anyReq.riderRatingSum / anyReq.riderRatingCount
                    : 5.0);
              const isRiderFieldRisk = averageRiderRating <= 4.2;

              return (
                <div className="space-y-2">
                  <div className="space-y-1">
                    {isRiderFieldRisk && (
                      <div className="flex items-center justify-between text-[9px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-md p-1 px-1.5 mb-1 animate-pulse">
                        <span>🚨 مخاطر ميدانية (تقييم منخفض)</span>
                        <span>{averageRiderRating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      إلى: {latestReq.dropoff}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      المسافة العوامة: {distanceToRider.toFixed(1)} كم للوصول • {latestReq.estimatedDistance} كم للوجهة
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1 font-sans">
                    <Button
                      onClick={() => rejectRequest(latestReq.id)}
                      variant="ghost"
                      className="h-10 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 px-3 border border-red-500/10 hover:border-red-500/20 rounded-xl font-bold"
                    >
                      تجاهل
                    </Button>
                    <Button
                      onClick={() => {
                        setActivePricingRequest(latestReq);
                      }}
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wide shadow-md hover:shadow-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-1.5 font-bold"
                    >
                      <Zap className="w-3.5 h-3.5 text-white active:scale-95" />
                      تقديم عرض سعر
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activePricingRequest && (
        <DriverPricingCard
          mode="offer"
          tripDistance={tripDistance}
          tripDuration={dynamicTripDuration}
          requiresOfficialRate={activePricingRequest.requiresOfficialRate}
          isSubmitting={isSubmittingOffer}
          onConfirm={(offerPrice) => {
            submitOffer({ tripId: activePricingRequest.id, offerPrice: offerPrice as number });
            setActivePricingRequest(null);
          }}
          onCancel={() => setActivePricingRequest(null)}
        />
      )}

      {/* لوحة العمليات لضبط الرصيد والساعات والتعليقات */}
      <div className="w-full max-w-lg mx-auto pb-24 pt-4 px-2">
        <button
          onClick={() => setIsDashboardOpen(true)}
          className="w-full text-right p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-black via-emerald-950/10 to-black hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(0,255,150,0.1)] transition-all group flex items-center justify-between cursor-pointer active:scale-98"
        >
          <div>
            <h3 className="text-sm font-black text-[#00ffcc] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
              </span>
              فتح لوحة العمليات
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">اضبط باقة الساعات المتجمدة، واطلع على رصيد الثقة والتعليقات المجهرية</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 decoration-transparent transition-transform">←</span>
        </button>
      </div>

      {isDashboardOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-98 backdrop-blur-md p-4 md:p-6 flex flex-col justify-start animate-in fade-in duration-300" dir="rtl">
          <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-2">
              <span className="text-xs font-black text-emerald-400">نظام الرادار الموحد ● لوحة المتابعة</span>
              <button
                onClick={() => setIsDashboardOpen(false)}
                className="px-3 py-1 text-xs font-black bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-500/30 rounded-lg cursor-pointer transition-all active:scale-95"
              >
                إغلاق اللوحة
              </button>
            </div>

            <RadarCaptainDashboard />

            <button
              onClick={() => setIsDashboardOpen(false)}
              className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl border border-emerald-400/20 shadow-lg cursor-pointer transition-all active:scale-98 text-center"
            >
              العودة إلى الطلبات القريبة
            </button>
          </div>
        </div>
      )}
    </>
  );
}
