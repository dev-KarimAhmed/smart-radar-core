'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import { Clock, Heart, Loader2, Navigation, ShieldCheck, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { AdStage } from './ad-stage';
import { RadarRiderDashboard, type HistoricalTrip } from './rider/rider-dashboard';
import { RiderMap, type RiderLocation, type RiderLocationStatus, type RiderLocationUpdate } from './rider/rider-map';
import {
  type RiderActiveTrip,
  type RiderDestination,
  useRiderDashboardMachine,
} from './rider/rider-state-machine';
import {
  acceptRideOffer,
  buildRideRequestInsertPayload,
  calculateServerFare,
  cancelRideRequest,
  completeRideTrip,
  createRideRequest,
  fetchAvailableCaptainPresence,
  fetchRideOffers,
  isCaptainPresenceFresh,
  mapRiderMarketplaceError,
  submitRideRating,
  subscribeToRideOffers,
  subscribeToRideRequestStatus,
  type CaptainPresencePoint,
} from './rider/rider-server-marketplace';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const H3_RIDER_REQUEST_RESOLUTION = 9;
const OFFER_TIMEOUT_MS = 2 * 60 * 1000;
const FARE_RECALCULATION_DEBOUNCE_MS = 350;
const CAPTAIN_PRESENCE_REFRESH_MS = 15_000;
const CAPTAIN_PRESENCE_PRUNE_MS = 5_000;
const INITIAL_RIDER_LOCATION: RiderLocation = { lat: 0, lng: 0 };
const NETWORK_ERROR_AR = 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت.';

interface CountryCurrencyConfig {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
}

interface GovernorateOption {
  id: string;
  numericId: number;
  nameAr: string;
  nameEn: string;
}

interface DistrictOption {
  id: string;
  numericId: number;
  governorateId: string;
  governorateAr: string;
  governorateEn: string;
  districtAr: string;
  districtEn: string;
  anchor: RiderLocation | null;
  tortuosityFactor: number;
}

export function RiderViewTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isArabic, language } = useDashboardLanguage();
  const copy = riderViewCopy[language];
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  const [selectedGovernorateId, setSelectedGovernorateId] = React.useState('');
  const [draftDestinationId, setDraftDestinationId] = React.useState('');
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [etaSeconds, setEtaSeconds] = React.useState(0);
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(INITIAL_RIDER_LOCATION);
  const [riderH3Cell, setRiderH3Cell] = React.useState(latLngToCell(INITIAL_RIDER_LOCATION.lat, INITIAL_RIDER_LOCATION.lng, H3_RIDER_REQUEST_RESOLUTION));
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('fallback');
  const [localCompletedTrips, setLocalCompletedTrips] = React.useState<HistoricalTrip[]>([]);
  const [captainLocations, setCaptainLocations] = React.useState<CaptainPresencePoint[]>([]);
  const [isSendingRideRequest, setIsSendingRideRequest] = React.useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);
  const [isCompletingTrip, setIsCompletingTrip] = React.useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const [countryConfig, setCountryConfig] = React.useState<CountryCurrencyConfig | null>(null);
  const [destinationGovernorates, setDestinationGovernorates] = React.useState<GovernorateOption[]>([]);
  const [destinationDistricts, setDestinationDistricts] = React.useState<DistrictOption[]>([]);
  const [destinationPinLocation, setDestinationPinLocation] = React.useState<RiderLocation | null>(null);
  const [isDestinationPinMoving, setIsDestinationPinMoving] = React.useState(false);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = React.useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState(false);
  const [destinationDataError, setDestinationDataError] = React.useState<string | null>(null);
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
  const pendingAcceptedOfferIdRef = React.useRef<string | null>(null);

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

  const availableDistricts = destinationDistricts;

  const selectedGovernorate = React.useMemo(
    () => destinationGovernorates.find((governorate) => governorate.id === selectedGovernorateId) || null,
    [destinationGovernorates, selectedGovernorateId],
  );

  const selectedDistrict = React.useMemo(() => {
    const direct = destinationDistricts.find((district) => district.id === draftDestinationId);
    return direct || destinationDistricts[0] || null;
  }, [destinationDistricts, draftDestinationId]);

  const activeCountryId = user?.countryId;
  const profileDistrict = React.useMemo(() => {
    const profileDistrictId = String(user?.district || '');
    return destinationDistricts.find((district) => district.id === profileDistrictId) || null;
  }, [destinationDistricts, user?.district]);
  const profileFallbackLocation = profileDistrict?.anchor || selectedDistrict?.anchor || riderLocation;
  const selectedDestinationCoords = destinationPinLocation || selectedDistrict?.anchor || null;

  const fareRequestKey = React.useMemo(
    () => (selectedDestinationCoords ? buildFareRequestKey(riderLocation, selectedDestinationCoords, activeCountryId) : 'no-destination'),
    [activeCountryId, riderLocation, selectedDestinationCoords],
  );

  const currentServerFare = serverFareState.key === fareRequestKey ? serverFareState.fare : null;
  const isServerFareLoading =
    !!selectedDestinationCoords && (serverFareState.key !== fareRequestKey || serverFareState.isLoading || isDestinationPinMoving);
  const serverFareError = serverFareState.key === fareRequestKey ? serverFareState.error : null;
  const currencyLabel = getCurrencyLabel(countryConfig, user);

  const selectedDraftDestination = React.useMemo(
    () =>
      selectedDistrict && selectedDestinationCoords
        ? buildRiderDestination(selectedDistrict, riderLocation, currentServerFare, selectedDestinationCoords)
        : null,
    [currentServerFare, riderLocation, selectedDestinationCoords, selectedDistrict],
  );

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [...localCompletedTrips],
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
    setRiderH3Cell(payload.h3Cell);
    setLocationStatus(payload.status);
  }, []);

  const handleDestinationPinMoveStart = React.useCallback(() => {
    setIsDestinationPinMoving(true);
  }, []);

  const handleDestinationPinChange = React.useCallback((location: RiderLocation) => {
    setDestinationPinLocation(location);
    setIsDestinationPinMoving(false);
  }, []);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    if (selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination]);

  React.useEffect(() => {
    if (state.screen === 'DESTINATION_SELECTION' && selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination, state.screen]);

  React.useEffect(() => {
    setDestinationPinLocation(selectedDistrict?.anchor || null);
    setIsDestinationPinMoving(false);
  }, [selectedDistrict?.anchor, selectedDistrict?.id]);

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
          .select('id,name_ar,name_en,currency_ar,currency_en')
          .eq('id', countryId)
          .single();
        if (error) throw error;
        if (active) setCountryConfig(data as CountryCurrencyConfig);
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Supabase Country Currency Fetch]', error);
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

    setDestinationGovernorates([]);
    setDestinationDistricts([]);
    setSelectedGovernorateId('');
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setDestinationDataError('لا توجد دولة مرتبطة بالحساب. حدّث بيانات حسابك أولاً.');
      return;
    }

    async function fetchDestinationGovernorates() {
      setIsLoadingGovernorates(true);
      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', countryId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeGovernorates(data);
        setDestinationGovernorates(options);

        const profileGovernorateId = String(user?.governorate || '');
        const preferred = options.find((governorate) => governorate.id === profileGovernorateId) || options[0] || null;
        setSelectedGovernorateId(preferred?.id || '');
        if (!preferred) setDestinationDataError('لا توجد محافظات متاحة لهذه الدولة حالياً.');
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Rider Destinations: Governorates]', error);
        setDestinationDataError(NETWORK_ERROR_AR);
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void fetchDestinationGovernorates();

    return () => {
      active = false;
    };
  }, [activeCountryId, toast, user?.governorate]);

  React.useEffect(() => {
    let active = true;
    const governorateId = Number(selectedGovernorateId);

    setDestinationDistricts([]);
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (!Number.isInteger(governorateId) || governorateId <= 0) {
      return;
    }

    async function fetchDestinationDistricts() {
      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', governorateId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeDistricts(data, selectedGovernorate);
        setDestinationDistricts(options);

        const profileDistrictId = String(user?.district || '');
        const preferred = options.find((district) => district.id === profileDistrictId) || options.find((district) => district.anchor) || options[0] || null;
        setDraftDestinationId(preferred?.id || '');
        if (!preferred) setDestinationDataError('لا توجد مناطق متاحة لهذه المحافظة حالياً.');
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Rider Destinations: Districts]', error);
        setDestinationDataError(NETWORK_ERROR_AR);
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void fetchDestinationDistricts();

    return () => {
      active = false;
    };
  }, [selectedGovernorate, selectedGovernorateId, toast, user?.district]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    if (!selectedDistrict) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: destinationDataError || 'اختر المحافظة والمنطقة أولاً.',
      });
      return;
    }

    if (!selectedDestinationCoords) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: 'هذه المنطقة لا تحتوي إحداثيات في قاعدة البيانات. حدّث بيانات المنطقة ثم حاول مرة أخرى.',
      });
      return;
    }

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

    const timeoutId = window.setTimeout(() => {
      calculateServerFare(supabase, {
        origin: riderLocation,
        destination: selectedDestinationCoords,
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
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeCountryId, destinationDataError, fareRequestKey, riderLocation, selectedDestinationCoords, selectedDistrict, toast]);

  React.useEffect(() => {
    if (!state.requestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      state.requestId,
      (row) => {
        const status = String(row.status || '').toUpperCase();

        if (status === 'RECEIVING_OFFERS') {
          dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
        }

        if (status === 'ACCEPTED') {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          pendingAcceptedOfferIdRef.current = null;
        }

        if (status === 'CANCELLED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'REQUEST_CANCELLED' });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'تعذر متابعة الطلب',
          description: mapRiderMarketplaceError(error) || NETWORK_ERROR_AR,
        });
      },
    );
  }, [dispatch, state.requestId, toast]);

  React.useEffect(() => {
    let active = true;

    async function loadCaptainPresence() {
      if (!activeCountryId) {
        setCaptainLocations([]);
        return;
      }

      try {
        const rows = await fetchAvailableCaptainPresence(supabase, {
          centerH3Cell: riderH3Cell,
          countryId: activeCountryId,
          ringSize: 1,
        });
        if (active) setCaptainLocations(rows);
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Rider Captain Presence]', error);
        setCaptainLocations([]);
      }
    }

    void loadCaptainPresence();
    const refreshInterval = window.setInterval(() => void loadCaptainPresence(), CAPTAIN_PRESENCE_REFRESH_MS);
    const pruneInterval = window.setInterval(() => {
      setCaptainLocations((previous) => previous.filter((captain) => isCaptainPresenceFresh(captain)));
    }, CAPTAIN_PRESENCE_PRUNE_MS);

    const channel = activeCountryId
      ? supabase
          .channel(`captain-presence-${activeCountryId}-${riderH3Cell}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'captain_locations',
            },
            () => void loadCaptainPresence(),
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.clearInterval(pruneInterval);
      void channel?.unsubscribe();
    };
  }, [activeCountryId, riderH3Cell]);

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    let active = true;

    const refreshOffers = async () => {
      try {
        const offers = await fetchRideOffers(supabase, state.requestId!);
        if (active) dispatch({ type: 'RECEIVE_OFFERS', offers });
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Rider Offers]', error);
        dispatch({ type: 'RECEIVE_OFFERS', offers: [] });
      }
    };

    void refreshOffers();

    const unsubscribe = subscribeToRideOffers(
      supabase,
      state.requestId,
      () => void refreshOffers(),
      () => {
        if (import.meta.env.DEV) console.warn('[Rider Offers Realtime] subscription unavailable');
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [dispatch, state.requestCancelledAt, state.requestId, state.screen, toast]);

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.offers.length > 0 || state.requestCancelledAt) return;

    const timeoutId = window.setTimeout(() => {
      cancelRideRequest(supabase, state.requestId!)
        .catch(() => {
          toast({
            variant: 'destructive',
            title: 'تعذر تحديث الطلب',
            description: NETWORK_ERROR_AR,
          });
        });
    }, OFFER_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, state.offers.length, state.requestCancelledAt, state.requestId, state.screen, toast]);

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

  const handleGovernorateChange = (governorateId: string) => {
    setSelectedGovernorateId(governorateId);
    setDraftDestinationId('');
  };

  const handleDistrictChange = (districtId: string) => {
    setDraftDestinationId(districtId);
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

    if (!selectedDraftDestination || !selectedDestinationCoords) {
      toast({
        variant: 'destructive',
        title: 'الوجهة غير جاهزة',
        description: 'اختر منطقة تحتوي إحداثيات صحيحة من قاعدة البيانات.',
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
        destination: selectedDestinationCoords,
        originH3: selectedDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationH3:
          selectedDraftDestination.destinationCell ||
          latLngToCell(selectedDestinationCoords.lat, selectedDestinationCoords.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationAddressAr: selectedDraftDestination.label,
        serverEstimatedFare: selectedDraftDestination.serverEstimatedFare,
        countryId,
      });

      const request = await createRideRequest(supabase, payload);
      dispatch({ type: 'SERVER_REQUEST_CREATED', requestId: request.id });

      toast({
        title: 'تم إرسال الطلب',
        description: 'تم حفظ طلب الرحلة. سنعرض العروض فور وصولها.',
      });
    } catch (error) {
      pendingAcceptedOfferIdRef.current = null;
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

  const handleAcceptOffer = async (offer: import('@/core/types').Offer) => {
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر قبول العرض',
        description: 'لا يوجد طلب رحلة نشط حالياً. حاول إرسال الطلب مرة أخرى.',
      });
      return;
    }

    const offerId = offer.id || offer.driverId;
    if (!offerId) {
      toast({
        variant: 'destructive',
        title: 'تعذر قبول العرض',
        description: 'بيانات العرض غير مكتملة. انتظر تحديث العروض ثم حاول مرة أخرى.',
      });
      return;
    }

    setAcceptingOfferId(offerId);
    pendingAcceptedOfferIdRef.current = offerId;

    try {
      await acceptRideOffer(supabase, {
        requestId: state.requestId,
        offerId,
      });
      dispatch({ type: 'SELECT_OFFER', offerId });
    } catch (error) {
      pendingAcceptedOfferIdRef.current = null;
      if (import.meta.env.DEV) console.warn('[Rider Accept Offer]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر قبول العرض',
        description: 'عذراً، تم قبول عرض آخر لهذه الرحلة بالفعل أو تم إلغاؤها.',
      });
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const handleCompleteTrip = async () => {
    if (!state.activeTrip) return;
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر إنهاء الرحلة',
        description: 'لا يوجد طلب رحلة نشط. انتظر تحديث الرحلة ثم حاول مرة أخرى.',
      });
      return;
    }

    setIsCompletingTrip(true);

    const historicalTrip = toHistoricalTrip(state.activeTrip);
    const ledgerEntry: RiderTripLedgerEntry = {
      ...historicalTrip,
      purgeAt: historicalTrip.timestamp + THREE_DAYS_MS,
    };

    try {
      await completeRideTrip(supabase, { requestId: state.requestId });

      try {
        await dexieDb.riderTripLedger.put(ledgerEntry);
        setLocalCompletedTrips((previous) => [
          historicalTrip,
          ...previous.filter((trip) => trip.tripId !== historicalTrip.tripId),
        ]);
      } catch (cacheError) {
        if (import.meta.env.DEV) console.warn('[Rider Complete Trip Cache]', cacheError);
        setLocalCompletedTrips((previous) => [historicalTrip, ...previous]);
      }

      dispatch({ type: 'COMPLETE_TRIP' });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Rider Complete Trip]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر إنهاء الرحلة',
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsCompletingTrip(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!state.completedTrip || !state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ التقييم',
        description: 'بيانات الرحلة غير مكتملة. انتظر تحديث الرحلة ثم حاول مرة أخرى.',
      });
      return;
    }

    const ratingValue = Math.max(1, Math.min(5, Math.round(rating.captain)));
    setIsSubmittingRating(true);

    try {
      await submitRideRating(supabase, {
        requestId: state.requestId,
        captainId: state.completedTrip.captainId,
        ratingValue,
      });

      if (rating.favorite) {
        try {
          const favoriteTrip = toHistoricalTrip(state.completedTrip);
          await dexieDb.favoriteCaptains.put({
            ...favoriteTrip,
            heartedAt: Date.now(),
          });
        } catch (cacheError) {
          if (import.meta.env.DEV) console.warn('[Rider Favorite Captain Cache]', cacheError);
        }
      }

      dispatch({ type: 'SUBMIT_RATING' });
      setRating({ captain: 0, vehicle: 0, favorite: false });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Rider Submit Rating]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ التقييم',
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const renderStatePanel = () => {
    if (state.screen === 'DESTINATION_SELECTION') {
      const hasDestinationOptions = destinationGovernorates.length > 0 && availableDistricts.length > 0;
      const selectedDestinationHasCoords = !!selectedDestinationCoords;
      const serverFareLabel =
        isServerFareLoading || isDestinationPinMoving
          ? copy.updatingFare
          : selectedDraftDestination?.serverEstimatedFare !== undefined
          ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
          : copy.notAvailable;

      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/88 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-[#14F5D5]">{copy.destinationEyebrow}</p>
                <h2 className="text-xl font-black sm:text-2xl">{copy.whereTo}</h2>
                <p className="text-xs leading-relaxed text-slate-400">
                  {copy.destinationSubtitle}
                  {countryConfig?.name_ar || countryConfig?.name_en ? (
                    <span className="mt-1 block text-[#14F5D5]">{copy.country}: {isArabic ? countryConfig.name_ar || countryConfig.name_en : countryConfig.name_en || countryConfig.name_ar}</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'RETURN_TO_MAP' })}
                aria-label={copy.closeDestination}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35 text-slate-300 transition hover:border-[#14B8A6]/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="block text-[11px] font-black text-slate-400">{copy.governorate}</span>
                <select
                  value={selectedGovernorateId}
                  onChange={(event) => handleGovernorateChange(event.target.value)}
                  disabled={isLoadingGovernorates || destinationGovernorates.length === 0}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-right text-sm font-black text-white outline-none transition focus:border-[#14B8A6]/60"
                >
                  {destinationGovernorates.length === 0 ? (
                    <option value="">{isLoadingGovernorates ? copy.loading : copy.noGovernorates}</option>
                  ) : null}
                  {destinationGovernorates.map((governorate) => (
                    <option key={governorate.id} value={governorate.id}>
                      {isArabic ? governorate.nameAr || governorate.nameEn : governorate.nameEn || governorate.nameAr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-[11px] font-black text-slate-400">{copy.district}</span>
                <select
                  value={selectedDistrict?.id || ''}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  disabled={isLoadingDistricts || availableDistricts.length === 0}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-right text-sm font-black text-white outline-none transition focus:border-[#14B8A6]/60"
                >
                  {availableDistricts.length === 0 ? (
                    <option value="">{isLoadingDistricts ? copy.loading : copy.noDistricts}</option>
                  ) : null}
                  {availableDistricts.map((destination) => (
                    <option key={destination.id} value={destination.id} disabled={!destination.anchor}>
                      {isArabic ? destination.districtAr || destination.districtEn : destination.districtEn || destination.districtAr}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {destinationDataError ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold leading-relaxed text-amber-100">
                {destinationDataError}
              </div>
            ) : null}

            {selectedDistrict ? (
              <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-3 text-xs leading-relaxed text-slate-300">
                <strong className="block text-sm text-white">
                  {isArabic
                    ? `${selectedDistrict.districtAr} - ${selectedDistrict.governorateAr}`
                    : `${selectedDistrict.districtEn || selectedDistrict.districtAr} - ${selectedDistrict.governorateEn || selectedDistrict.governorateAr}`}
                </strong>
                {selectedDistrict.anchor ? (
                  <span className="mt-1 block font-mono text-[10px] text-slate-500">
                    {(selectedDestinationCoords || selectedDistrict.anchor).lat.toFixed(4)}, {(selectedDestinationCoords || selectedDistrict.anchor).lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="mt-1 block text-[11px] font-bold text-amber-200">
                    لا توجد إحداثيات لهذه المنطقة في قاعدة البيانات.
                  </span>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <Metric label={copy.serverFare} value={serverFareLabel} />
              <Metric label={copy.fareStatus} value={serverFareError ? copy.fareFailed : isServerFareLoading ? copy.fareLoading : copy.ready} />
              <Metric label={copy.originH3} value={selectedDraftDestination?.originCell?.slice(0, 8).toUpperCase() || '-'} />
              <Metric label={copy.destinationH3} value={selectedDraftDestination?.destinationCell?.slice(0, 8).toUpperCase() || '-'} />
            </div>

            {serverFareError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-bold leading-relaxed text-red-100">
                {serverFareError}
              </div>
            )}

            <Button
              onClick={handleSendRequest}
              disabled={
                isSendingRideRequest ||
                isServerFareLoading ||
                !hasDestinationOptions ||
                !selectedDestinationHasCoords ||
                selectedDraftDestination?.serverEstimatedFare === undefined
              }
              className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
            >
              {isSendingRideRequest ? copy.sendingRequest : copy.requestNow}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (state.screen === 'RECEIVING_OFFERS') {
      const hasOffers = state.offers.length > 0;
      const isCancelled = !!state.requestCancelledAt;

      if (isCancelled) {
        return (
          <Card className="w-full border-amber-400/25 bg-[#0B0F19]/92 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CardContent className="space-y-5 p-5 text-right" dir="rtl">
              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
                <p className="text-[11px] font-black text-amber-200">لم تصل عروض</p>
                <h2 className="mt-2 text-xl font-black sm:text-2xl">نعتذر منك، جميع السائقون مشغولون حالياً</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  لم نجد عروضاً تناسب رحلتك في هذه اللحظة. يمكنك إعادة المحاولة أو تغيير الوجهة.
                </p>
              </div>

              <Button
                onClick={() => {
                  dispatch({ type: 'RESET_TO_IDLE' });
                  window.setTimeout(openDestination, 0);
                }}
                className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
              >
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="w-full border-[#14B8A6]/25 bg-[#0B0F19]/90 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="space-y-5 p-5 text-right" dir="rtl">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">{hasOffers ? 'وصلت عروض' : 'نبحث عن سائق'}</p>
              <h2 className="text-xl font-black sm:text-2xl">{hasOffers ? 'اختر السائق' : 'طلبك ظاهر للسائقين القريبين'}</h2>
              <p className="text-xs text-slate-400">
                {hasOffers ? 'اختر العرض المناسب لك.' : 'انتظر قليلا، ستظهر العروض هنا.'}
              </p>
            </div>

            {!hasOffers ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-[#14B8A6]/15 bg-black/30">
                <Loader2 className="h-9 w-9 animate-spin text-[#14F5D5]" />
                <span className="px-4 text-center text-xs font-bold leading-relaxed text-slate-300">
                  جاري البحث عن أقرب سائقين متوفرين لك... ثوانٍ من فضلك
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {state.offers.map((offer) => (
                  <article key={offer.id || offer.driverId} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
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
                      <Metric label="السيارة" value={`${offer.driverVehicle.make} ${offer.driverVehicle.color}`} />
                      <Metric label="اللوحة" value={offer.driverVehicle.plate} />
                    </div>

                    <Button
                      onClick={() => void handleAcceptOffer(offer)}
                      disabled={acceptingOfferId === (offer.id || offer.driverId)}
                      className="h-11 w-full rounded-xl bg-[#14B8A6] font-black text-[#031315] hover:bg-[#2DD4BF]"
                    >
                      {acceptingOfferId === (offer.id || offer.driverId) ? 'جاري قبول العرض...' : 'قبول العرض'}
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
                <p className="text-[11px] font-black text-[#14F5D5]">الرحلة بدأت</p>
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
              <Metric label="السيارة" value={state.activeTrip.vehicleType} />
              <Metric label="اللوحة" value={state.activeTrip.vehiclePlate} />
              <Metric label="السعر" value={formatMoney(state.activeTrip.finalPrice, currencyLabel)} />
              <Metric label="المسافة" value={`${state.activeTrip.distanceKm.toFixed(2)} كم`} />
              <Metric label="التتبع" value="تحديثات محلية" />
              <Metric label="عامل الطريق" value={(state.activeTrip.tortuosityFactor ?? 1.3).toFixed(2)} />
            </div>

            <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300">
              السائق في الطريق إليك. يتم تحديث الحالة عبر نبضات موقع آمنة.
            </div>

            <Button
              onClick={() => void handleCompleteTrip()}
              disabled={isCompletingTrip}
              className="h-14 w-full rounded-2xl bg-[#14B8A6] text-base font-black text-[#031315] hover:bg-[#2DD4BF]"
            >
              {isCompletingTrip ? 'جاري إنهاء الرحلة...' : 'إنهاء الرحلة'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="relative flex min-h-[calc(100svh-128px)] w-full flex-col gap-3 bg-[#0B0F19] p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-white sm:gap-4 sm:p-4 lg:h-screen lg:min-h-screen lg:overflow-hidden lg:bg-transparent lg:p-0" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto grid w-full max-w-6xl gap-3 sm:gap-4 lg:block lg:h-full lg:max-w-none">
        <div className="space-y-3 sm:space-y-4 lg:absolute lg:inset-0 lg:space-y-0">
          <RiderMap
            activeTripCaptainId={state.activeTrip?.captainId || null}
            captainLocations={captainLocations}
            className="h-[38svh] min-h-[250px] max-h-[320px] sm:h-[42svh] sm:min-h-[300px] sm:max-h-[380px] lg:h-full lg:max-h-none lg:min-h-0 lg:rounded-none lg:border-0"
            destinationFlyToTarget={state.screen === 'DESTINATION_SELECTION' ? selectedDistrict?.anchor || null : null}
            fallbackLocation={profileFallbackLocation}
            showDestinationPin={state.screen === 'DESTINATION_SELECTION'}
            onDestinationChange={handleDestinationPinChange}
            onDestinationMoveStart={handleDestinationPinMoveStart}
            onLocationChange={handleLocationChange}
          />
        </div>

        <aside className="space-y-3 sm:space-y-4 lg:absolute lg:bottom-6 lg:right-6 lg:top-6 lg:z-40 lg:w-[420px] lg:overflow-y-auto lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-[#0B0F19]/82 lg:p-4 lg:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:backdrop-blur-xl">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 shadow-xl shadow-black/20 backdrop-blur sm:rounded-[24px] sm:p-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div>
                <p className="text-[11px] font-black text-[#14F5D5]">{copy.panelEyebrow}</p>
                <h1 className="text-xl font-black sm:text-2xl">{copy.panelTitle}</h1>
              </div>
              <ShieldCheck className="h-7 w-7 text-[#14F5D5]" />
            </div>

            <div className="grid grid-cols-3 gap-2 lg:hidden">
              <NavButton active={state.screen === 'IDLE_MAP'} onClick={() => dispatch({ type: 'RETURN_TO_MAP' })}>
                {copy.mapTab}
              </NavButton>
              <NavButton active={state.screen === 'PURGE_LEDGER'} onClick={() => dispatch({ type: 'OPEN_PURGE_LEDGER' })}>
                {copy.tripsTab}
              </NavButton>
              <NavButton active={state.screen === 'FAVORITE_CAPTAINS'} onClick={() => dispatch({ type: 'OPEN_FAVORITE_CAPTAINS' })}>
                {copy.savedTab}
              </NavButton>
            </div>
          </div>

          {state.screen === 'IDLE_MAP' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-[#14B8A6]/25 bg-[#0B0F19]/90 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
                <CardContent className="space-y-5 p-5 text-right" dir="rtl">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-[#14F5D5]">{copy.readyQuestion}</p>
                    <h2 className="text-xl font-black sm:text-2xl">{copy.whereTo}</h2>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {copy.homeSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <Metric label={copy.yourArea} value={locationStatus === 'live' ? copy.currentLocation : copy.fallbackLocation} />
                    <Metric label={copy.yourRating} value={`${riderProfile.rating.toFixed(1)} / 5`} />
                  </div>

                  <Button
                    onClick={openDestination}
                    className="h-16 w-full rounded-2xl bg-[#14B8A6] text-lg font-black text-[#031315] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF]"
                  >
                    <Navigation className="ml-2 h-5 w-5" />
                    {copy.requestRide}
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
              <DialogDescription className="text-gray-400">يساعدنا تقييمك على تحسين الخدمة.</DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-6">
              <div className="space-y-3 text-center">
                <Label className="font-bold text-emerald-500">السائق</Label>
                <div className="flex justify-center">
                  <StarRating rating={rating.captain} setRating={(value: number) => setRating((prev) => ({ ...prev, captain: value }))} size="lg" />
                </div>
              </div>

              <div className="space-y-3 text-center">
                <Label className="font-bold text-emerald-500">السيارة</Label>
                <div className="flex justify-center">
                  <StarRating rating={rating.vehicle} setRating={(value: number) => setRating((prev) => ({ ...prev, vehicle: value }))} size="lg" color="amber" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRating((prev) => ({ ...prev, favorite: !prev.favorite }))}
                className="mx-auto flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-sm font-bold"
              >
                <span>أضف السائق إلى المفضلة</span>
                <Heart className={cn('h-5 w-5', rating.favorite ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
              </button>
            </div>

            <Button
              className="h-14 w-full bg-emerald-600 text-lg font-black hover:bg-emerald-500"
              disabled={rating.captain === 0 || rating.vehicle === 0 || isSubmittingRating}
              onClick={() => void handleSubmitRating()}
            >
              {isSubmittingRating ? 'جاري حفظ التقييم...' : 'حفظ التقييم'}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function normalizeGovernorates(rows: unknown): GovernorateOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      return {
        id: String(numericId),
        numericId,
        nameAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || `محافظة ${numericId}`,
        nameEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
      };
    })
    .filter((option): option is GovernorateOption => !!option);
}

function normalizeDistricts(rows: unknown, governorate: GovernorateOption | null): DistrictOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      const anchor = getRowAnchor(record);

      return {
        id: String(numericId),
        numericId,
        governorateId: String(record.governorate_id || governorate?.id || ''),
        governorateAr: governorate?.nameAr || '',
        governorateEn: governorate?.nameEn || '',
        districtAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || `منطقة ${numericId}`,
        districtEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
        anchor,
        tortuosityFactor: firstNumber(record.tortuosity_factor, record.road_factor, record.factor) ?? 1.3,
      };
    })
    .filter((option): option is DistrictOption => !!option);
}

function getRowAnchor(row: Record<string, unknown>): RiderLocation | null {
  const lat = firstNumber(row.lat, row.latitude, row.anchor_lat, row.center_lat, row.centroid_lat, row.location_lat);
  const lng = firstNumber(row.lng, row.lon, row.longitude, row.anchor_lng, row.anchor_lon, row.center_lng, row.centroid_lng, row.location_lng);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function buildRiderDestination(
  destination: DistrictOption,
  origin: RiderLocation,
  serverEstimatedFare: number | null,
  preciseDestination: RiderLocation,
): RiderDestination {
  if (!preciseDestination) {
    throw new Error('destination_missing_coordinates');
  }

  return {
    id: destination.id,
    label: `${destination.districtAr} - ${destination.governorateAr}`,
    governorate: destination.governorateAr,
    district: destination.districtAr,
    coords: preciseDestination,
    tortuosityFactor: destination.tortuosityFactor,
    serverEstimatedFare: serverEstimatedFare ?? undefined,
    originCell: latLngToCell(origin.lat, origin.lng, H3_RIDER_REQUEST_RESOLUTION),
    destinationCell: latLngToCell(preciseDestination.lat, preciseDestination.lng, H3_RIDER_REQUEST_RESOLUTION),
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
    captainRank: 'BRONZE',
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

const riderViewCopy = {
  ar: {
    closeDestination: 'إغلاق اختيار الوجهة',
    country: 'الدولة',
    currentLocation: 'موقعك الحالي',
    destinationEyebrow: 'اختيار الوجهة',
    destinationH3: 'H3 الوجهة',
    destinationSubtitle: 'اختر المنطقة ثم حرّك الخريطة لتحديد الوجهة بدقة. لا نستخدم Google Places أو Geocoding.',
    district: 'المنطقة',
    fallbackLocation: 'موقعك',
    fareFailed: 'تعذر الحساب',
    fareLoading: 'جاري تحديث السعر...',
    fareStatus: 'حالة السعر',
    governorate: 'المحافظة',
    homeSubtitle: 'اختر وجهتك وسنبحث عن سائق قريب. السعر يظهر قبل إرسال الطلب.',
    loading: 'جاري التحميل...',
    mapTab: 'الخريطة',
    noDistricts: 'لا توجد مناطق',
    noGovernorates: 'لا توجد محافظات',
    notAvailable: 'غير متاح',
    originH3: 'H3 الانطلاق',
    panelEyebrow: 'لوحة الراكب',
    panelTitle: 'طلب الرحلة',
    ready: 'جاهز',
    readyQuestion: 'جاهز؟',
    requestNow: 'اطلب الآن',
    requestRide: 'طلب رحلة',
    savedTab: 'المفضلة',
    sendingRequest: 'جاري إرسال الطلب...',
    serverFare: 'السعر من الخادم',
    tripsTab: 'رحلاتي',
    updatingFare: 'جاري تحديث السعر...',
    whereTo: 'إلى أين تريد الذهاب؟',
    yourArea: 'منطقتك',
    yourRating: 'تقييمك',
  },
  en: {
    closeDestination: 'Close destination selection',
    country: 'Country',
    currentLocation: 'Your location',
    destinationEyebrow: 'Choose destination',
    destinationH3: 'Destination H3',
    destinationSubtitle: 'Choose an area, then move the map to set the exact destination. No Google Places or Geocoding.',
    district: 'District',
    fallbackLocation: 'Your area',
    fareFailed: 'Failed',
    fareLoading: 'Updating fare...',
    fareStatus: 'Fare status',
    governorate: 'Governorate',
    homeSubtitle: 'Choose your destination and we will look for a nearby driver. The fare appears before sending.',
    loading: 'Loading...',
    mapTab: 'Map',
    noDistricts: 'No districts',
    noGovernorates: 'No governorates',
    notAvailable: 'Not available',
    originH3: 'Origin H3',
    panelEyebrow: 'Rider dashboard',
    panelTitle: 'Request ride',
    ready: 'Ready',
    readyQuestion: 'Ready?',
    requestNow: 'Request now',
    requestRide: 'Request ride',
    savedTab: 'Saved',
    sendingRequest: 'Sending request...',
    serverFare: 'Server fare',
    tripsTab: 'Trips',
    updatingFare: 'Updating fare...',
    whereTo: 'Where do you want to go?',
    yourArea: 'Your area',
    yourRating: 'Your rating',
  },
} satisfies Record<AppLanguage, Record<string, string>>;

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

