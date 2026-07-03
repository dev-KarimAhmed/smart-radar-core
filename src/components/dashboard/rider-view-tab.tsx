'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import { Clock, Heart, Loader2, Navigation, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { AdStage } from './ad-stage';
import {
  AMMAN_FALLBACK_LOCATION,
  JORDAN_GOVERNORATES,
  getJordanDestinationById,
  getJordanDistrictsByGovernorate,
  type JordanDistrictDestination,
  type JordanGovernorateId,
} from './rider/jordan-destinations';
import { RadarRiderDashboard, type HistoricalTrip } from './rider/rider-dashboard';
import { RiderMap, type RiderLocation, type RiderLocationStatus, type RiderLocationUpdate } from './rider/rider-map';
import {
  type RiderActiveTrip,
  type RiderDestination,
  useRiderDashboardMachine,
} from './rider/rider-state-machine';
import {
  buildRideRequestInsertPayload,
  calculateServerFare,
  createRideRequest,
  mapRiderMarketplaceError,
  subscribeToRideRequestStatus,
} from './rider/rider-server-marketplace';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const H3_RIDER_REQUEST_RESOLUTION = 9;

interface CountryCurrencyConfig {
  id: number;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
}

const demoLedgerTrips: HistoricalTrip[] = [
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
];

export function RiderViewTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  const [selectedGovernorateId, setSelectedGovernorateId] = React.useState<JordanGovernorateId>('amman');
  const [draftDestinationId, setDraftDestinationId] = React.useState(getJordanDistrictsByGovernorate('amman')[0].id);
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [etaSeconds, setEtaSeconds] = React.useState(0);
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(AMMAN_FALLBACK_LOCATION);
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('fallback');
  const [localCompletedTrips, setLocalCompletedTrips] = React.useState<HistoricalTrip[]>([]);
  const [activeRideRequestId, setActiveRideRequestId] = React.useState<string | null>(null);
  const [isSendingRideRequest, setIsSendingRideRequest] = React.useState(false);
  const [countryConfig, setCountryConfig] = React.useState<CountryCurrencyConfig | null>(null);
  const [serverFareState, setServerFareState] = React.useState<{
    key: string;
    fare: number | null;
    isLoading: boolean;
    error: string | null;
  }>({
    key: '',
    fare: null,
    isLoading: false,
    error: null,
  });

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
      governorate: user?.governorate || 'عمّان',
      district: user?.district || 'وادي السير',
    };
  }, [user]);

  const availableDistricts = React.useMemo(
    () => getJordanDistrictsByGovernorate(selectedGovernorateId),
    [selectedGovernorateId],
  );

  const selectedDistrict = React.useMemo(() => {
    const direct = getJordanDestinationById(draftDestinationId);
    if (direct.governorateId === selectedGovernorateId) return direct;
    return availableDistricts[0];
  }, [availableDistricts, draftDestinationId, selectedGovernorateId]);

  const activeCountryId = user?.countryId;

  const fareRequestKey = React.useMemo(
    () => buildFareRequestKey(riderLocation, selectedDistrict.anchor, activeCountryId),
    [activeCountryId, riderLocation, selectedDistrict.anchor],
  );

  const currentServerFare = serverFareState.key === fareRequestKey ? serverFareState.fare : null;
  const isServerFareLoading = serverFareState.key !== fareRequestKey || serverFareState.isLoading;
  const serverFareError = serverFareState.key === fareRequestKey ? serverFareState.error : null;
  const currencyLabel = getCurrencyLabel(countryConfig, user);

  const selectedDraftDestination = React.useMemo(
    () => buildRiderDestination(selectedDistrict, riderLocation, currentServerFare),
    [currentServerFare, riderLocation, selectedDistrict],
  );

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [...localCompletedTrips, ...demoLedgerTrips],
    [localCompletedTrips],
  );

  const systemMessages = React.useMemo(
    () => [
      'الخريطة تعمل بمصدر مجاني بدون خرائط مدفوعة.',
      `نطاقك الحالي: ${locationStatus === 'live' ? 'موقعك الحقيقي' : 'عمّان كنقطة احتياط'}.`,
    ],
    [locationStatus],
  );

  const handleLocationChange = React.useCallback((payload: RiderLocationUpdate) => {
    setRiderLocation(payload.location);
    setLocationStatus(payload.status);
  }, []);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
  }, [dispatch, selectedDraftDestination]);

  React.useEffect(() => {
    dispatch({ type: 'RESET_TO_IDLE' });
  }, [dispatch, user?.uid]);

  React.useEffect(() => {
    window.addEventListener('rider-open-destination', openDestination);
    return () => window.removeEventListener('rider-open-destination', openDestination);
  }, [openDestination]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    setCountryConfig(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      return;
    }

    async function fetchCountryCurrency() {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id,currency_ar,currency_en')
          .eq('id', countryId)
          .single();
        if (error) throw error;
        if (active) setCountryConfig(data as CountryCurrencyConfig);
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Supabase Country Currency Fetch]', error);
        toast({
          variant: 'destructive',
          title: 'تعذر تحميل العملة',
          description: 'تعذر تحميل إعدادات عملة الدولة من الخادم.',
        });
      }
    }

    void fetchCountryCurrency();

    return () => {
      active = false;
    };
  }, [activeCountryId, toast]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: 'لا يمكن حساب السعر قبل تحديد دولة الحساب.',
      });
      return;
    }

    setServerFareState({
      key: fareRequestKey,
      fare: null,
      isLoading: true,
      error: null,
    });

    calculateServerFare(supabase, {
      origin: riderLocation,
      destination: selectedDistrict.anchor,
      countryId,
    })
      .then((fare) => {
        if (!active) return;
        setServerFareState({
          key: fareRequestKey,
          fare,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        const message = mapRiderMarketplaceError(error);
        setServerFareState({
          key: fareRequestKey,
          fare: null,
          isLoading: false,
          error: message,
        });
        toast({
          variant: 'destructive',
          title: 'تعذر حساب السعر',
          description: message,
        });
      });

    return () => {
      active = false;
    };
  }, [activeCountryId, fareRequestKey, riderLocation, selectedDistrict.anchor, toast]);

  React.useEffect(() => {
    if (!activeRideRequestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      activeRideRequestId,
      (row) => {
        if (String(row.status) === 'RECEIVING_OFFERS') {
          dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
          setActiveRideRequestId(null);
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'تعذر متابعة الطلب',
          description: mapRiderMarketplaceError(error),
        });
      },
    );
  }, [activeRideRequestId, dispatch, toast]);

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

  const handleGovernorateChange = (governorateId: JordanGovernorateId) => {
    const firstDistrict = getJordanDistrictsByGovernorate(governorateId)[0];
    setSelectedGovernorateId(governorateId);
    setDraftDestinationId(firstDistrict.id);
  };

  const handleDistrictChange = (districtId: string) => {
    const destination = getJordanDestinationById(districtId);
    setDraftDestinationId(destination.id);
  };

  const handleSendRequest = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'يلزم تسجيل الدخول',
        description: 'يرجى تسجيل الدخول قبل إرسال طلب الرحلة.',
      });
      return;
    }

    const countryId = Number(activeCountryId);
    if (!Number.isInteger(countryId) || countryId <= 0) {
      toast({
        variant: 'destructive',
        title: 'الدولة غير محددة',
        description: 'لا يمكن إرسال الطلب قبل تحميل دولة الحساب.',
      });
      return;
    }

    if (selectedDraftDestination.serverEstimatedFare === undefined || isServerFareLoading) {
      toast({
        variant: 'destructive',
        title: 'السعر غير جاهز',
        description: 'انتظر حساب السعر من الخادم ثم حاول مرة أخرى.',
      });
      return;
    }

    dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    dispatch({ type: 'SEND_REQUEST' });
    setIsSendingRideRequest(true);

    try {
      const payload = buildRideRequestInsertPayload({
        riderId: user.uid,
        origin: riderLocation,
        destination: selectedDistrict.anchor,
        originH3: selectedDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationH3:
          selectedDraftDestination.destinationCell ||
          latLngToCell(selectedDistrict.anchor.lat, selectedDistrict.anchor.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationAddressAr: selectedDraftDestination.label,
        serverEstimatedFare: selectedDraftDestination.serverEstimatedFare,
        countryId,
      });

      const request = await createRideRequest(supabase, payload);
      dispatch({ type: 'SERVER_REQUEST_CREATED', requestId: request.id });
      setActiveRideRequestId(request.id);

      toast({
        title: 'تم إرسال الطلب',
        description: 'تم حفظ طلب الرحلة في الخادم وننتظر تحديث الحالة.',
      });

      if (request.status === 'RECEIVING_OFFERS') {
        dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
        setActiveRideRequestId(null);
      }
    } catch (error) {
      dispatch({ type: 'REQUEST_FAILED' });
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال الطلب',
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsSendingRideRequest(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!state.activeTrip) return;

    const historicalTrip = toHistoricalTrip(state.activeTrip);
    const ledgerEntry: RiderTripLedgerEntry = {
      ...historicalTrip,
      purgeAt: historicalTrip.timestamp + THREE_DAYS_MS,
    };

    try {
      await dexieDb.riderTripLedger.put(ledgerEntry);
      setLocalCompletedTrips((previous) => [
        historicalTrip,
        ...previous.filter((trip) => trip.tripId !== historicalTrip.tripId),
      ]);
    } catch (error) {
      console.error('Failed to store completed local trip in Dexie:', error);
      setLocalCompletedTrips((previous) => [historicalTrip, ...previous]);
    }

    dispatch({ type: 'COMPLETE_TRIP' });
  };

  const renderStatePanel = () => {
    if (state.screen === 'DESTINATION_SELECTION') {
      const serverFareLabel =
        selectedDraftDestination.serverEstimatedFare !== undefined
          ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
          : isServerFareLoading
            ? 'يتم الحساب...'
            : 'غير متاح';

      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/88 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir="rtl">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">اختيار الوجهة</p>
              <h2 className="text-xl font-black sm:text-2xl">وين بدك تروح؟</h2>
              <p className="text-xs text-slate-400">اختيار محلي داخل الأردن فقط. بدون Google Places وبدون Geocoding.</p>
            </div>

            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="block text-[11px] font-black text-slate-400">المحافظة</span>
                <select
                  value={selectedGovernorateId}
                  onChange={(event) => handleGovernorateChange(event.target.value as JordanGovernorateId)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-right text-sm font-black text-white outline-none transition focus:border-[#14B8A6]/60"
                >
                  {JORDAN_GOVERNORATES.map((governorate) => (
                    <option key={governorate.id} value={governorate.id}>
                      {governorate.nameAr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-[11px] font-black text-slate-400">اللواء / المنطقة</span>
                <select
                  value={selectedDistrict.id}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-right text-sm font-black text-white outline-none transition focus:border-[#14B8A6]/60"
                >
                  {availableDistricts.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.districtAr}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-3 text-xs leading-relaxed text-slate-300">
              <strong className="block text-sm text-white">{selectedDraftDestination.label}</strong>
              <span className="mt-1 block font-mono text-[10px] text-slate-500">
                {selectedDraftDestination.coords.lat.toFixed(4)}, {selectedDraftDestination.coords.lng.toFixed(4)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <Metric label="السعر من الخادم" value={serverFareLabel} />
              <Metric label="حالة السعر" value={serverFareError ? 'تعذر الحساب' : isServerFareLoading ? 'جار الحساب' : 'جاهز'} />
              <Metric label="H3 الانطلاق" value={selectedDraftDestination.originCell?.slice(0, 8).toUpperCase() || '-'} />
              <Metric label="H3 الوجهة" value={selectedDraftDestination.destinationCell?.slice(0, 8).toUpperCase() || '-'} />
            </div>

            {serverFareError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-bold leading-relaxed text-red-100">
                {serverFareError}
              </div>
            )}

            <Button
              onClick={handleSendRequest}
              disabled={isSendingRideRequest || isServerFareLoading || selectedDraftDestination.serverEstimatedFare === undefined}
              className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
            >
              {isSendingRideRequest ? 'جاري إرسال الطلب...' : 'إرسال طلب الرحلة'}
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
              <h2 className="text-xl font-black sm:text-2xl">{hasOffers ? 'اختار الكابتن المناسب' : 'طلبك ظاهر للكباتن القريبين'}</h2>
              <p className="text-xs text-slate-400">
                {hasOffers ? 'اختر العرض المناسب عند وصوله من الخادم.' : 'ننتظر تحديث حالة الطلب من الخادم وظهور العروض.'}
              </p>
            </div>

            {!hasOffers ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-[#14B8A6]/15 bg-black/30">
                <Loader2 className="h-9 w-9 animate-spin text-[#14F5D5]" />
                <span className="text-xs font-bold text-slate-300">يتم البحث داخل خلايا H3 القريبة</span>
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
                        {formatMoney(offer.price, currencyLabel)}
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
                <h2 className="text-xl font-black sm:text-2xl">{state.activeTrip.captainSerial}</h2>
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
              <Metric label="السعر النهائي" value={formatMoney(state.activeTrip.finalPrice, currencyLabel)} />
              <Metric label="المسافة" value={`${state.activeTrip.distanceKm.toFixed(2)} كم`} />
              <Metric label="التتبع" value="نبض H3 محلي" />
              <Metric label="عامل الطريق" value={(state.activeTrip.tortuosityFactor ?? 1.3).toFixed(2)} />
            </div>

            <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300">
              الكابتن يتحرك على الخريطة كنموذج محلي. لا يوجد بث GPS مباشر ولا أي طلب خارجي مدفوع.
            </div>

            <Button
              onClick={() => void handleCompleteTrip()}
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
    <div className="relative flex min-h-[calc(100svh-128px)] w-full flex-col gap-3 bg-[#0B0F19] p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-white sm:gap-4 sm:p-4 lg:h-screen lg:min-h-screen lg:overflow-hidden lg:bg-transparent lg:p-0" dir="rtl">
      <div className="mx-auto grid w-full max-w-6xl gap-3 sm:gap-4 lg:block lg:h-full lg:max-w-none">
        <div className="space-y-3 sm:space-y-4 lg:absolute lg:inset-0 lg:space-y-0">
          <RiderMap
            activeTripCaptainId={state.activeTrip?.captainId || null}
            className="h-[38svh] min-h-[250px] max-h-[320px] sm:h-[42svh] sm:min-h-[300px] sm:max-h-[380px] lg:h-full lg:max-h-none lg:min-h-0 lg:rounded-none lg:border-0"
            onLocationChange={handleLocationChange}
          />
        </div>

        <aside className="space-y-3 sm:space-y-4 lg:absolute lg:bottom-6 lg:right-6 lg:top-6 lg:z-40 lg:w-[420px] lg:overflow-y-auto lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-[#0B0F19]/82 lg:p-4 lg:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:backdrop-blur-xl">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 shadow-xl shadow-black/20 backdrop-blur sm:rounded-[24px] sm:p-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div>
                <p className="text-[11px] font-black text-[#14F5D5]">لوحة الراكب</p>
                <h1 className="text-xl font-black sm:text-2xl">رادار الرحلة المحلي</h1>
              </div>
              <ShieldCheck className="h-7 w-7 text-[#14F5D5]" />
            </div>

            <div className="grid grid-cols-3 gap-2 lg:hidden">
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
                    <p className="text-[11px] font-black text-[#14F5D5]">جاهز لطلب رحلة</p>
                    <h2 className="text-xl font-black sm:text-2xl">أهلا بك</h2>
                    <p className="text-xs leading-relaxed text-slate-400">
                      الخريطة مجانية، والوجهات من بيانات الأردن المحلية، والسعر يحسب من موقعك الحالي أو من عمّان عند عدم توفر GPS.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <Metric label="منطقتك" value={locationStatus === 'live' ? 'موقعك الحالي' : 'عمّان'} />
                    <Metric label="ثقتك" value={`${riderProfile.rating.toFixed(1)} / 5`} />
                  </div>

                  <Button
                    onClick={openDestination}
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

          {showAdRiver && (
            <div className="hidden overflow-hidden rounded-[24px] border border-[#14B8A6]/15 bg-[#0B0F19]/88 shadow-2xl shadow-black/35 backdrop-blur-xl lg:block">
              <AdStage />
            </div>
          )}

          {(state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') && (
            <RadarRiderDashboard
              riderProfile={riderProfile}
              tripsWithin72Hours={tripsWithin72Hours}
              systemMessages={systemMessages}
              currencyLabel={currencyLabel}
            />
          )}
        </aside>

        {showAdRiver && (
          <div className="overflow-hidden rounded-[24px] border border-[#14B8A6]/15 lg:hidden">
            <AdStage />
          </div>
        )}
      </div>

      {state.screen === 'RATING_MODAL' && (
        <Dialog open>
          <DialogContent className="border-emerald-900/50 bg-[#050D05] text-white sm:max-w-md">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-black">قيّم الرحلة</DialogTitle>
              <DialogDescription className="text-gray-400">التقييم محفوظ محليا فقط في هذا النموذج.</DialogDescription>
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

function buildRiderDestination(
  destination: JordanDistrictDestination,
  origin: RiderLocation,
  serverEstimatedFare: number | null,
): RiderDestination {
  return {
    id: destination.id,
    label: `${destination.districtAr} - ${destination.governorateAr}`,
    governorate: destination.governorateAr,
    district: destination.districtAr,
    coords: destination.anchor,
    tortuosityFactor: destination.tortuosityFactor,
    serverEstimatedFare: serverEstimatedFare ?? undefined,
    originCell: latLngToCell(origin.lat, origin.lng, H3_RIDER_REQUEST_RESOLUTION),
    destinationCell: latLngToCell(destination.anchor.lat, destination.anchor.lng, H3_RIDER_REQUEST_RESOLUTION),
  };
}

function buildFareRequestKey(origin: RiderLocation, destination: RiderLocation, countryId: unknown) {
  return [
    Number(countryId) || 'no-country',
    origin.lat.toFixed(6),
    origin.lng.toFixed(6),
    destination.lat.toFixed(6),
    destination.lng.toFixed(6),
  ].join(':');
}

function toHistoricalTrip(trip: RiderActiveTrip): HistoricalTrip {
  return {
    tripId: trip.tripId,
    captainName: trip.captainSerial,
    captainRank: trip.captainSerial === 'D-102' ? 'PLATINUM' : trip.captainSerial === 'D-118' ? 'GOLD' : 'BRONZE',
    captainPhone: trip.captainPhone,
    vehicleInfo: `${trip.vehicleType} - ${trip.vehiclePlate}`,
    finalPrice: trip.finalPrice,
    timestamp: Date.now(),
  };
}

function getCurrencyLabel(
  countryConfig: CountryCurrencyConfig | null,
  user: { currencyAr?: string; currencyEn?: string } | null | undefined,
) {
  return (
    countryConfig?.currency_ar ||
    user?.currencyAr ||
    countryConfig?.currency_en ||
    user?.currencyEn ||
    countryConfig?.currency_code ||
    ''
  );
}

function formatMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${value.toFixed(2)} ${currencyLabel}` : value.toFixed(2);
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
