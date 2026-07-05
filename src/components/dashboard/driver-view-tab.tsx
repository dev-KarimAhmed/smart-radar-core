'use client';

import React from 'react';
import { Loader2, MapPin, Phone, RadioTower, Star, X, Zap } from 'lucide-react';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StarRating } from '@/components/ui/star-rating';
import { RadarCaptainDashboard } from './driver/captain-dashboard';

export function DriverViewTab() {
  const { language } = useDashboardLanguage();
  const copy = driverViewCopy[language];
  const driverOps = useDriverOperations();
  const [offerDrafts, setOfferDrafts] = React.useState<Record<string, string>>({});
  const [riderRating, setRiderRating] = React.useState(0);
  const [isDashboardOpen, setIsDashboardOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = () => setIsDashboardOpen(true);
    window.addEventListener('open-captain-dashboard', handleOpen);
    return () => window.removeEventListener('open-captain-dashboard', handleOpen);
  }, []);

  if (!driverOps) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  const {
    activeRequest,
    acceptedRider,
    driverStatus,
    endTrip,
    isEndingTrip,
    isSubmittingOffer,
    rateAndFinishTrip,
    isRatingRider,
    rejectRequest,
    requests,
    submitOffer,
    toggleDriverStatus,
  } = driverOps;

  const isActive = driverStatus === 'active';

  const handleSubmitOffer = (requestId: string) => {
    const draft = Number(offerDrafts[requestId]);
    if (!Number.isFinite(draft) || draft <= 0) return;
    void submitOffer({ tripId: requestId, offerPrice: draft });
    setOfferDrafts((prev) => ({ ...prev, [requestId]: '' }));
  };

  const handleRateAndFinish = () => {
    if (riderRating <= 0) return;
    void rateAndFinishTrip(riderRating);
    setRiderRating(0);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-24 pt-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-emerald-500/20 bg-[#05080f] p-4 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
            <h1 className="text-2xl font-black">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => toggleDriverStatus(isActive ? 'idle' : 'active')}
              className={isActive ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-white hover:bg-slate-700'}
            >
              <RadioTower className="h-4 w-4" />
              {isActive ? copy.goOffline : copy.goOnline}
            </Button>
            <Button variant="outline" onClick={() => setIsDashboardOpen(true)} className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10">
              {copy.openDashboard}
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-emerald-500/20 bg-black/40 p-4 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-black">{copy.requestsTitle}</h2>
            <p className="text-sm text-slate-400">{copy.requestsSubtitle}</p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
            {requests.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {requests.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center">
              <RadioTower className="mx-auto mb-3 h-10 w-10 text-emerald-400/70" />
              <h3 className="font-black">{copy.noRequestsTitle}</h3>
              <p className="mt-2 text-sm text-slate-400">{copy.noRequestsBody}</p>
            </div>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-800 bg-[#080d16] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[#14B8A6]">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-bold">{copy.destination}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-black">{request.dropoff || copy.unknownDestination}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {request.h3Index ? `${copy.h3}: ${request.h3Index.slice(-8).toUpperCase()}` : copy.nearby}
                    </p>
                  </div>
                  {request.offerPrice ? (
                    <span className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-300">
                      {Number(request.offerPrice).toFixed(2)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={offerDrafts[request.id] || ''}
                    onChange={(event) => setOfferDrafts((prev) => ({ ...prev, [request.id]: event.target.value }))}
                    inputMode="decimal"
                    placeholder={copy.offerPlaceholder}
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                  />
                  <Button
                    onClick={() => handleSubmitOffer(request.id)}
                    disabled={isSubmittingOffer}
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    {isSubmittingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {copy.submitOffer}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => rejectRequest(request.id)}
                    className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Dialog open={driverStatus === 'busy' && !!activeRequest}>
        <DialogContent className="border-emerald-500/20 bg-[#0B0F19] text-white">
          <DialogHeader>
            <DialogTitle>{copy.activeTripTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">{copy.activeTripBody}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-slate-800 bg-black/40 p-4">
            <p className="text-xs text-slate-400">{copy.destination}</p>
            <p className="mt-1 font-black">{activeRequest?.dropoff || copy.unknownDestination}</p>
            {acceptedRider?.phone ? (
              <a href={`tel:${acceptedRider.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-3 py-2 text-sm font-bold text-emerald-300">
                <Phone className="h-4 w-4" />
                {copy.callRider}
              </a>
            ) : null}
          </div>
          <Button onClick={() => void endTrip()} disabled={isEndingTrip} className="bg-emerald-600 text-white hover:bg-emerald-500">
            {isEndingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.completeTrip}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={driverStatus === 'rating' && !!activeRequest}>
        <DialogContent className="border-emerald-500/20 bg-[#0B0F19] text-white">
          <DialogHeader>
            <DialogTitle>{copy.ratingTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">{copy.ratingBody}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <StarRating rating={riderRating} setRating={setRiderRating} disabled={isRatingRider} size="md" />
          </div>
          <Button onClick={handleRateAndFinish} disabled={riderRating === 0 || isRatingRider} className="bg-emerald-600 text-white hover:bg-emerald-500">
            {isRatingRider ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Star className="h-4 w-4" /> {copy.saveRating}</>}
          </Button>
        </DialogContent>
      </Dialog>

      {isDashboardOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-emerald-300">{copy.openDashboard}</span>
              <button onClick={() => setIsDashboardOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
                {copy.close}
              </button>
            </div>
            <RadarCaptainDashboard />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const driverViewCopy = {
  ar: {
    loading: 'جار تحميل لوحة الكابتن...',
    badge: 'لوحة الكابتن',
    title: 'طلبات الركاب القريبة',
    subtitle: 'تظهر هنا الطلبات المحفوظة في قاعدة البيانات والقريبة من موقعك الحالي.',
    goOnline: 'ابدأ استقبال الطلبات',
    goOffline: 'إيقاف استقبال الطلبات',
    openDashboard: 'فتح لوحة الكابتن',
    close: 'إغلاق',
    requestsTitle: 'الرادار',
    requestsSubtitle: 'طلبات بحالة انتظار داخل خلية H3 الحالية أو الخلايا المجاورة.',
    noRequestsTitle: 'لا توجد طلبات حالياً',
    noRequestsBody: 'فعّل حالتك وابق قريباً من مناطق الطلب. ستظهر الطلبات الجديدة فور وصولها.',
    destination: 'الوجهة',
    unknownDestination: 'وجهة غير محددة',
    h3: 'خلية H3',
    nearby: 'طلب قريب من موقعك',
    offerPlaceholder: 'اكتب عرضك',
    submitOffer: 'إرسال العرض',
    activeTripTitle: 'رحلة نشطة',
    activeTripBody: 'تم قبول عرضك. تواصل مع الراكب عند الحاجة ثم أنه الرحلة من الخادم.',
    callRider: 'اتصال بالراكب',
    completeTrip: 'إنهاء الرحلة',
    ratingTitle: 'تقييم الرحلة',
    ratingBody: 'اختر تقييماً واضحاً بعد انتهاء الرحلة.',
    saveRating: 'حفظ التقييم',
  },
  en: {
    loading: 'Loading captain dashboard...',
    badge: 'Captain dashboard',
    title: 'Nearby rider requests',
    subtitle: 'Database-backed requests near your current location appear here.',
    goOnline: 'Start receiving requests',
    goOffline: 'Stop receiving requests',
    openDashboard: 'Open captain dashboard',
    close: 'Close',
    requestsTitle: 'Radar',
    requestsSubtitle: 'Pending requests in your current H3 cell or neighboring cells.',
    noRequestsTitle: 'No requests right now',
    noRequestsBody: 'Go online and stay near demand areas. New requests will appear as soon as they arrive.',
    destination: 'Destination',
    unknownDestination: 'Unknown destination',
    h3: 'H3 cell',
    nearby: 'Nearby request',
    offerPlaceholder: 'Enter your offer',
    submitOffer: 'Submit offer',
    activeTripTitle: 'Active trip',
    activeTripBody: 'Your offer was accepted. Contact the rider if needed, then complete the trip from the server.',
    callRider: 'Call rider',
    completeTrip: 'Complete trip',
    ratingTitle: 'Trip rating',
    ratingBody: 'Choose a clear rating after the trip is finished.',
    saveRating: 'Save rating',
  },
} as const;
