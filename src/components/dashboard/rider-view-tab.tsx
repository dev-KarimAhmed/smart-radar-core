'use client';

import React from 'react';
import { Car, Clock, Heart, Loader2, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { AdStage } from './ad-stage';
import { RadarRiderDashboard, HistoricalTrip } from './rider/rider-dashboard';
import { RiderMap } from './rider/rider-map';
import {
  RiderDestination,
  shouldShowAdRiver,
  useRiderDashboardMachine,
} from './rider/rider-state-machine';

const destinationOptions: RiderDestination[] = [
  {
    id: 'wadi-seer',
    label: 'وادي السير - عمان',
    governorate: 'عمان',
    district: 'وادي السير',
    coords: { lat: 31.9586, lng: 35.8684 },
  },
  {
    id: 'abdoun',
    label: 'عبدون - عمان',
    governorate: 'عمان',
    district: 'عبدون',
    coords: { lat: 31.9414, lng: 35.8865 },
  },
  {
    id: 'downtown-amman',
    label: 'وسط البلد - عمان',
    governorate: 'عمان',
    district: 'وسط البلد',
    coords: { lat: 31.9519, lng: 35.9393 },
  },
  {
    id: 'zarqa-center',
    label: 'الزرقاء الجديدة',
    governorate: 'الزرقاء',
    district: 'الزرقاء الجديدة',
    coords: { lat: 32.0728, lng: 36.087 },
  },
];

export function RiderViewTab() {
  const { user } = useAuth();
  const { state, dispatch } = useRiderDashboardMachine();
  const [draftDestinationId, setDraftDestinationId] = React.useState(destinationOptions[0].id);
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [etaSeconds, setEtaSeconds] = React.useState(0);
  const showAdRiver = shouldShowAdRiver(state);

  const riderProfile = React.useMemo(() => {
    const ratingValue =
      user?.rating !== undefined
        ? user.rating
        : user?.ratingSum && user?.ratingCount
          ? user.ratingSum / user.ratingCount
          : 4.8;

    return {
      id: user?.uid || 'local-rider',
      rating: ratingValue,
      governorate: user?.governorate || 'عمان',
      district: user?.district || 'وادي السير',
    };
  }, [user]);

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [
      {
        tripId: 'local-ledger-1',
        captainName: 'D-102',
        captainRank: 'PLATINUM',
        captainPhone: '0799988771',
        vehicleInfo: 'Toyota Corolla White - 77-102',
        finalPrice: 2.75,
        timestamp: Date.now() - 3 * 3600 * 1000,
      },
      {
        tripId: 'local-ledger-2',
        captainName: 'D-118',
        captainRank: 'GOLD',
        captainPhone: '0788877662',
        vehicleInfo: 'Hyundai Ioniq Silver - 22-118',
        finalPrice: 3.4,
        timestamp: Date.now() - 17 * 3600 * 1000,
      },
    ],
    [],
  );

  const systemMessages = React.useMemo(
    () => [
      'المنطقة تعمل محلياً بدون خرائط مدفوعة.',
      `نطاقك الحالي: ${user?.district || 'وادي السير'}.`,
    ],
    [user?.district],
  );

  React.useEffect(() => {
    if (!state.activeTrip) {
      setEtaSeconds(0);
      return;
    }

    setEtaSeconds(state.activeTrip.etaSeconds);
    const interval = window.setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.activeTrip]);

  const selectedDraftDestination =
    destinationOptions.find((destination) => destination.id === draftDestinationId) || destinationOptions[0];

  const renderStatePanel = () => {
    if (state.screen === 'DESTINATION_SELECTION') {
      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/88 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir="rtl">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">اختيار الوجهة</p>
              <h2 className="text-2xl font-black">وين بدك تروح؟</h2>
              <p className="text-xs text-slate-400">اختيار محلي فقط. لا يوجد Geocoding ولا Google Places.</p>
            </div>

            <div className="grid gap-2">
              {destinationOptions.map((destination) => {
                const isSelected = destination.id === draftDestinationId;

                return (
                  <button
                    type="button"
                    key={destination.id}
                    onClick={() => {
                      setDraftDestinationId(destination.id);
                      dispatch({ type: 'CONFIRM_DESTINATION', destination });
                    }}
                    className={cn(
                      'rounded-2xl border p-3 text-right transition',
                      isSelected
                        ? 'border-[#14B8A6]/50 bg-[#14B8A6]/12 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#14B8A6]/30',
                    )}
                  >
                    <span className="block text-sm font-black">{destination.label}</span>
                    <span className="mt-1 block font-mono text-[10px] text-slate-500">
                      {destination.coords.lat.toFixed(4)}, {destination.coords.lng.toFixed(4)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <Metric label="المسافة" value="6.8 كم" />
              <Metric label="السعر المتوقع" value="2.75 د.أ" />
              <Metric label="الحساب" value="H3 محلي" />
              <Metric label="الكباتن" value="3-5 قريبين" />
            </div>

            <Button
              onClick={() => {
                dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
                dispatch({ type: 'SEND_REQUEST' });
              }}
              className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
            >
              إرسال طلب الرحلة
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (state.screen === 'RECEIVING_OFFERS') {
      const hasOffers = state.offers.length > 0;

      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/90 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir="rtl">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">{hasOffers ? 'وصلت عروض' : 'ننتظر الكباتن'}</p>
              <h2 className="text-2xl font-black">{hasOffers ? 'اختار الكابتن المناسب' : 'طلبك ظاهر للكباتن القريبين'}</h2>
              <p className="text-xs text-slate-400">
                {hasOffers ? 'العروض تجريبية ومحسوبة محلياً.' : 'سيتم عرض عروض تجريبية تلقائياً بعد 3 ثواني.'}
              </p>
            </div>

            {!hasOffers ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-[#14B8A6]/15 bg-black/30">
                <Loader2 className="h-9 w-9 animate-spin text-[#14F5D5]" />
                <span className="text-xs font-bold text-slate-300">يتم البحث داخل خلايا H3 المجاورة</span>
              </div>
            ) : (
              <div className="space-y-3">
                {state.offers.map((offer) => (
                  <article key={offer.driverId} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{offer.driverName}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {offer.driverRating.toFixed(1)} / {offer.driverRank}
                        </p>
                      </div>
                      <strong className="text-xl font-black text-[#14F5D5]">
                        {offer.price.toFixed(2)} د.أ
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/25 p-3 text-xs text-slate-300">
                      <Metric label="المركبة" value={`${offer.driverVehicle.make} ${offer.driverVehicle.color}`} />
                      <Metric label="اللوحة" value={offer.driverVehicle.plate} />
                    </div>

                    <Button
                      onClick={() => dispatch({ type: 'SELECT_OFFER', offerId: offer.driverId })}
                      className="h-11 w-full rounded-xl bg-[#14B8A6] font-black text-[#031315] hover:bg-[#2DD4BF]"
                    >
                      اختيار هذا الكابتن
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (state.screen === 'TRIP_ACTIVE' && state.activeTrip) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = etaSeconds % 60;

      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/92 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir="rtl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-[#14F5D5]">رحلة نشطة</p>
                <h2 className="text-2xl font-black">{state.activeTrip.captainSerial}</h2>
                <p className="text-xs text-slate-400">{state.activeTrip.destinationLabel}</p>
              </div>
              <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-4 py-2 text-center">
                <Clock className="mx-auto mb-1 h-4 w-4 text-[#14F5D5]" />
                <strong className="font-mono text-lg text-[#14F5D5]">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <Metric label="المركبة" value={state.activeTrip.vehicleType} />
              <Metric label="اللوحة" value={state.activeTrip.vehiclePlate} />
              <Metric label="السعر النهائي" value={`${state.activeTrip.finalPrice.toFixed(2)} د.أ`} />
              <Metric label="التتبع" value="نبض H3 كل فترة" />
            </div>

            <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300">
              لا يوجد بث GPS مباشر. هذا النموذج يستخدم حالة محلية وعداد ETA تجريبي فقط.
            </div>

            <Button
              onClick={() => dispatch({ type: 'COMPLETE_TRIP' })}
              className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
            >
              إنهاء الرحلة للتجربة
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-160px)] w-full flex-col gap-5 bg-[#0B0F19] p-4 pb-28 text-white" dir="rtl">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-4">
          <RiderMap activeTripCaptainId={state.activeTrip?.captainId || null} className="h-[420px] lg:h-[620px]" />

          {showAdRiver && (
            <div className="mb-24 overflow-hidden rounded-[24px] border border-[#14B8A6]/15">
              <AdStage />
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-[#14F5D5]">لوحة الراكب</p>
                <h1 className="text-2xl font-black">رادار الرحلة المحلي</h1>
              </div>
              <ShieldCheck className="h-7 w-7 text-[#14F5D5]" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <NavButton active={state.screen === 'IDLE_MAP'} onClick={() => dispatch({ type: 'RETURN_TO_MAP' })}>
                الخريطة
              </NavButton>
              <NavButton active={state.screen === 'PURGE_LEDGER'} onClick={() => dispatch({ type: 'OPEN_PURGE_LEDGER' })}>
                السجل
              </NavButton>
              <NavButton active={state.screen === 'FAVORITE_CAPTAINS'} onClick={() => dispatch({ type: 'OPEN_FAVORITE_CAPTAINS' })}>
                المحفوظ
              </NavButton>
            </div>
          </div>

          {state.screen === 'IDLE_MAP' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-[#14B8A6]/25 bg-[#0B0F19]/90 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
                <CardContent className="space-y-5 p-5 text-right" dir="rtl">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-[#14F5D5]">جاهز لاستقبال طلب</p>
                    <h2 className="text-2xl font-black">أهلاً بك</h2>
                    <p className="text-xs leading-relaxed text-slate-400">
                      الخريطة تعمل بمصدر مجاني، والنقاط القريبة مولدة محلياً من خلايا H3.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <Metric label="منطقتك" value={user?.district || 'وادي السير'} />
                    <Metric label="ثقتك" value={`${riderProfile.rating.toFixed(1)} / 5`} />
                  </div>

                  <Button
                    onClick={() => dispatch({ type: 'OPEN_DESTINATION' })}
                    className="h-16 w-full rounded-2xl bg-[#14B8A6] text-lg font-black text-[#031315] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF]"
                  >
                    <Navigation className="ml-2 h-5 w-5" />
                    طلب رحلة
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {renderStatePanel()}

          {(state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') && (
            <RadarRiderDashboard
              riderProfile={riderProfile}
              tripsWithin72Hours={tripsWithin72Hours}
              systemMessages={systemMessages}
            />
          )}
        </aside>
      </div>

      {state.screen === 'RATING_MODAL' && (
        <Dialog open>
          <DialogContent className="border-emerald-900/50 bg-[#050D05] text-white sm:max-w-md">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-black">قيّم الرحلة</DialogTitle>
              <DialogDescription className="text-gray-400">التقييم محفوظ محلياً فقط في هذا النموذج.</DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-6">
              <div className="space-y-3 text-center">
                <Label className="font-bold text-emerald-500">الكابتن</Label>
                <div className="flex justify-center">
                  <StarRating rating={rating.captain} setRating={(value: number) => setRating((prev) => ({ ...prev, captain: value }))} size="lg" />
                </div>
              </div>

              <div className="space-y-3 text-center">
                <Label className="font-bold text-emerald-500">المركبة</Label>
                <div className="flex justify-center">
                  <StarRating rating={rating.vehicle} setRating={(value: number) => setRating((prev) => ({ ...prev, vehicle: value }))} size="lg" color="amber" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRating((prev) => ({ ...prev, favorite: !prev.favorite }))}
                className="mx-auto flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-sm font-bold"
              >
                <span>احفظ الكابتن</span>
                <Heart className={cn('h-5 w-5', rating.favorite ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
              </button>
            </div>

            <Button
              className="h-14 w-full bg-emerald-600 text-lg font-black hover:bg-emerald-500"
              disabled={rating.captain === 0 || rating.vehicle === 0}
              onClick={() => {
                dispatch({ type: 'SUBMIT_RATING', rating });
                setRating({ captain: 0, vehicle: 0, favorite: false });
              }}
            >
              حفظ التقييم
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <span className="block text-[10px] font-bold text-slate-500">{label}</span>
      <span className="block truncate text-xs font-black text-white">{value}</span>
    </div>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-xl border text-xs font-black transition',
        active
          ? 'border-[#14B8A6]/45 bg-[#14B8A6]/15 text-[#14F5D5]'
          : 'border-white/10 bg-black/20 text-slate-400 hover:border-[#14B8A6]/25 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
