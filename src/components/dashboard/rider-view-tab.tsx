'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import { Clock, Heart, Loader2, Navigation, ShieldCheck, Star, X, MapPin, Phone } from 'lucide-react';
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
import { RatingModal } from './shared/rating-modal';
import { RadarRiderDashboard, type HistoricalTrip } from './rider/rider-dashboard';
import type { RiderLocation, RiderLocationStatus, RiderLocationUpdate } from './rider/rider-map';
import dynamic from 'next/dynamic';
const RiderMap = dynamic(() => import('./rider/rider-map').then(m => m.RiderMap), { ssr: false });
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
  fetchRideRequestStatus,
  fetchRideOffers,
  isCaptainPresenceFresh,
  mapRiderMarketplaceError,
  submitRideRating,
  subscribeToRideOffers,
  subscribeToRideRequestStatus,
  type CaptainPresencePoint,
} from './rider/rider-server-marketplace';
import { CaptainOfferCard, type CaptainOffer, type CaptainRank } from './rider/captain-offer-card';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const H3_RIDER_REQUEST_RESOLUTION = 9;
const OFFER_TIMEOUT_MS = 2 * 60 * 1000;
const FARE_RECALCULATION_DEBOUNCE_MS = 350;
const CAPTAIN_PRESENCE_REFRESH_MS = 15_000;
const CAPTAIN_PRESENCE_PRUNE_MS = 5_000;
const INITIAL_RIDER_LOCATION: RiderLocation = { lat: 0, lng: 0 };

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

export function RiderViewTab({ onExitRequestFlow, isStandbyDismissed = false }: { onExitRequestFlow?: () => void; isStandbyDismissed?: boolean } = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isArabic, language } = useDashboardLanguage();
  const copy = riderViewCopy[language];
  const requestFlowCopy = React.useMemo(() => (
    language === 'ar'
      ? {
          cancelRequest: 'إلغاء الطلب',
          cancellingRequest: 'جاري الإلغاء...',
          cancelRequestFailedTitle: 'تعذر إلغاء الطلب',
          requestCancelledTitle: 'تم إلغاء الطلب',
          requestCancelledDescription: 'تم إلغاء طلب الرحلة.',
        }
      : {
          cancelRequest: 'Cancel request',
          cancellingRequest: 'Cancelling...',
          cancelRequestFailedTitle: 'Could not cancel request',
          requestCancelledTitle: 'Request cancelled',
          requestCancelledDescription: 'Your ride request was cancelled.',
        }
  ), [language]);
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  const [selectedGovernorateId, setSelectedGovernorateId] = React.useState('');
  const [draftDestinationId, setDraftDestinationId] = React.useState('');
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [ratingComment, setRatingComment] = React.useState('');
  const [etaSeconds, setEtaSeconds] = React.useState(0);
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(INITIAL_RIDER_LOCATION);
  const [riderH3Cell, setRiderH3Cell] = React.useState(latLngToCell(INITIAL_RIDER_LOCATION.lat, INITIAL_RIDER_LOCATION.lng, H3_RIDER_REQUEST_RESOLUTION));
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('fallback');
  const [currentAddressName, setCurrentAddressName] = React.useState<string>('');
  const [isGeocoding, setIsGeocoding] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!riderLocation.lat || !riderLocation.lng) return;

    let active = true;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${riderLocation.lat}&lon=${riderLocation.lng}&format=json&accept-language=${language}`
        );
        if (!res.ok) throw new Error('Geocoding fail');
        const data = await res.json();
        if (active && data) {
          const addr = data.address || {};
          const localPart =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.town ||
            addr.city_district ||
            addr.road ||
            '';
          const cityPart =
            addr.city ||
            addr.state ||
            addr.governorate ||
            '';

          const separator = language === 'ar' ? '، ' : ', ';
          let displayAddress = '';
          if (localPart && cityPart && localPart !== cityPart) {
            displayAddress = `${localPart}${separator}${cityPart}`;
          } else {
            displayAddress = localPart || cityPart || data.display_name || '';
          }
          setCurrentAddressName(displayAddress);
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      } finally {
        if (active) setIsGeocoding(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAddress();
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [riderLocation.lat, riderLocation.lng, language]);

  const [localCompletedTrips, setLocalCompletedTrips] = React.useState<HistoricalTrip[]>([]);
  const [captainLocations, setCaptainLocations] = React.useState<CaptainPresencePoint[]>([]);
  const [blockedCaptainIds, setBlockedCaptainIds] = React.useState<Set<string>>(new Set());
  const [isSendingRideRequest, setIsSendingRideRequest] = React.useState(false);
  const [isCancellingRideRequest, setIsCancellingRideRequest] = React.useState(false);
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
  const currencyLabel = getCurrencyLabel(countryConfig, user, language);

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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Country Currency Fetch]', error);
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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Governorates]', error);
        setDestinationDataError(copy.networkError);
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void fetchDestinationGovernorates();

    return () => {
      active = false;
    };
  }, [activeCountryId, copy.networkError, toast, user?.governorate]);

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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Districts]', error);
        setDestinationDataError(copy.networkError);
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void fetchDestinationDistricts();

    return () => {
      active = false;
    };
  }, [copy.networkError, selectedGovernorate, selectedGovernorateId, toast, user?.district]);

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
        });
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeCountryId, destinationDataError, fareRequestKey, riderLocation, selectedDestinationCoords, selectedDistrict]);

  const loadBlockedCaptains = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.uid);
      if (error) throw error;
      setBlockedCaptainIds(new Set((data || []).map((row: any) => String(row.blocked_id))));
    } catch (err) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider View Tab] loadBlockedCaptains error:', err);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    void loadBlockedCaptains();
  }, [loadBlockedCaptains]);

  const mappedCaptains = React.useMemo(() => {
    return captainLocations.map((captain) => ({
      ...captain,
      isBlocked: blockedCaptainIds.has(captain.id),
    }));
  }, [captainLocations, blockedCaptainIds]);

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

        if (
          status === 'ACCEPTED'
          || status === 'EN_ROUTE'
          || status === 'ARRIVED'
          || status === 'STARTED'
          || status === 'TRIP_ACTIVE'
          || status === 'ACTIVE'
          || status === 'IN_PROGRESS'
        ) {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          if (status === 'ACCEPTED') {
            pendingAcceptedOfferIdRef.current = null;
          }
        }

        if (status === 'CANCELLED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: copy.requestUpdateFailedTitle,
          description: getLocalizedMarketplaceError(error, language),
        });
      },
    );
  }, [copy.requestUpdateFailedTitle, dispatch, language, state.requestId, toast]);

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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Captain Presence]', error);
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
        const [offers, favs] = await Promise.all([
          fetchRideOffers(supabase, state.requestId!),
          dexieDb.favoriteCaptains.toArray().catch(() => [])
        ]);

        const favPhones = new Set(favs.map(f => f.captainPhone).filter(Boolean));
        const favNames = new Set(favs.map(f => f.captainName).filter(Boolean));
        const favIds = new Set(favs.map((f: any) => f.captainId || f.driverId).filter(Boolean));

        const sortedOffers = [...offers].sort((a, b) => {
          const aPhone = a.driverAffiliation?.phone;
          const bPhone = b.driverAffiliation?.phone;
          const aIsFav = (aPhone && favPhones.has(aPhone)) || favNames.has(a.driverName) || favIds.has(a.driverId);
          const bIsFav = (bPhone && favPhones.has(bPhone)) || favNames.has(b.driverName) || favIds.has(b.driverId);
          
          if (aIsFav && !bIsFav) return -1;
          if (!aIsFav && bIsFav) return 1;
          return 0;
        });

        if (active) dispatch({ type: 'RECEIVE_OFFERS', offers: sortedOffers });
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers]', error);
        dispatch({ type: 'RECEIVE_OFFERS', offers: [] });
      }
    };

    void refreshOffers();

    const unsubscribe = subscribeToRideOffers(
      supabase,
      state.requestId,
      () => void refreshOffers(),
      () => {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers Realtime] subscription unavailable');
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
            title: copy.requestUpdateFailedTitle,
            description: copy.networkError,
          });
        });
    }, OFFER_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [copy.networkError, copy.requestUpdateFailedTitle, dispatch, state.offers.length, state.requestCancelledAt, state.requestId, state.screen, toast]);

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
        title: copy.loginRequiredTitle,
        description: copy.loginRequiredDescription,
      });
      return;
    }

    const countryId = Number(activeCountryId);
    if (!Number.isInteger(countryId) || countryId <= 0) {
      toast({
        variant: 'destructive',
        title: copy.countryMissingTitle,
        description: copy.countryMissingDescription,
      });
      return;
    }

    if (!selectedDraftDestination || !selectedDestinationCoords) {
      toast({
        variant: 'destructive',
        title: copy.destinationNotReadyTitle,
        description: copy.destinationNotReadyDescription,
      });
      return;
    }

    if (selectedDraftDestination.serverEstimatedFare === undefined || isServerFareLoading) {
      toast({
        variant: 'destructive',
        title: copy.fareNotReadyTitle,
        description: copy.fareNotReadyDescription,
      });
      return;
    }

    // Unlock audio context for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = new Audio('/sounds/notification.mp3');
      unlockAudio.volume = 0;
      unlockAudio.play().catch(() => {});
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
      dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });

      toast({
        title: copy.requestSentTitle,
        description: copy.requestSentDescription,
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) {
        console.warn('[Rider Ride Request Insert]', error);
      }
      pendingAcceptedOfferIdRef.current = null;
      dispatch({ type: 'REQUEST_FAILED' });
      toast({
        variant: 'destructive',
        title: copy.requestFailedTitle,
        description: getLocalizedMarketplaceError(error, language),
      });
    } finally {
      setIsSendingRideRequest(false);
    }
  };

  const handleCancelRideRequest = async () => {
    if (!state.requestId) {
      dispatch({ type: 'RESET_TO_IDLE' });
      return;
    }

    setIsCancellingRideRequest(true);

    try {
      await cancelRideRequest(supabase, state.requestId);
      pendingAcceptedOfferIdRef.current = null;
      dispatch({ type: 'RESET_TO_IDLE' });
      if (onExitRequestFlow) {
        onExitRequestFlow();
      }
      toast({
        title: requestFlowCopy.requestCancelledTitle,
        description: requestFlowCopy.requestCancelledDescription,
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Cancel Request]', error);
      toast({
        variant: 'destructive',
        title: requestFlowCopy.cancelRequestFailedTitle,
        description: getLocalizedMarketplaceError(error, language),
      });
    } finally {
      setIsCancellingRideRequest(false);
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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Accept Offer]', error);
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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Cache]', cacheError);
        setLocalCompletedTrips((previous) => [historicalTrip, ...previous]);
      }

      dispatch({ type: 'COMPLETE_TRIP' });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip]', error);
      try {
        const row = await fetchRideRequestStatus(supabase, state.requestId);
        const status = String(row?.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row: row || undefined });
          return;
        }
      } catch (statusError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Status Check]', statusError);
      }
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
        comment: ratingComment || undefined,
      });

      if (rating.favorite) {
        try {
          const favoriteTrip = toHistoricalTrip(state.completedTrip);
          await dexieDb.favoriteCaptains.put({
            ...favoriteTrip,
            heartedAt: Date.now(),
          });
        } catch (cacheError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Favorite Captain Cache]', cacheError);
        }
      }

      dispatch({ type: 'SUBMIT_RATING' });
      setRating({ captain: 0, vehicle: 0, favorite: false });
      setRatingComment('');
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Submit Rating]', error);
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

      const originH3 = selectedDraftDestination?.originCell || '';
      const destinationH3 = selectedDraftDestination?.destinationCell || '';
      const isSameLocation = !!originH3 && !!destinationH3 && originH3 === destinationH3;

      return (
        <div className="space-y-4 text-right" dir={isArabic ? 'rtl' : 'ltr'}>
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

            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 text-center">
              <div className="text-3xl font-extrabold text-teal-400 font-mono">
                {isServerFareLoading ? (language === 'ar' ? 'جاري الحساب...' : 'Calculating...') : serverFareLabel}
              </div>
              <p className="mt-1.5 text-xs font-bold text-slate-400">
                {language === 'ar' ? 'السعر التقريبي للرحلة' : 'Estimated Fare'}
              </p>
            </div>

            {serverFareError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-bold leading-relaxed text-red-100">
                {serverFareError}
              </div>
            )}

            {isSameLocation && (
              <div className="text-xs font-bold text-red-500 text-center py-1 animate-pulse">
                {language === 'ar'
                  ? 'لا يمكن أن تكون الوجهة هي نفس موقع الانطلاق.'
                  : 'Destination cannot be the same as origin location.'}
              </div>
            )}

            <button
              onClick={handleSendRequest}
              disabled={
                isSendingRideRequest ||
                isServerFareLoading ||
                !hasDestinationOptions ||
                !selectedDestinationHasCoords ||
                selectedDraftDestination?.serverEstimatedFare === undefined ||
                isSameLocation
              }
              className={cn(
                "h-14 w-full font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center",
                isSameLocation
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-[#14B8A6] text-[#0A0F1D] hover:bg-[#2DD4BF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSendingRideRequest ? copy.sendingRequest : copy.requestNow}
            </button>
          </div>
        );
    }

    if (state.screen === 'RECEIVING_OFFERS') {
      const hasOffers = state.offers.length > 0;
      const isCancelled = !!state.requestCancelledAt;
      const requestFareLabel = state.destination?.serverEstimatedFare !== undefined
        ? formatMoney(state.destination.serverEstimatedFare, currencyLabel)
        : copy.notAvailable;
      const shortRequestId = state.requestId ? state.requestId.slice(0, 8).toUpperCase() : copy.notAvailable;

      if (isCancelled) {
        return (
          <div className={`space-y-4 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5">
              <p className="text-[11px] font-black text-amber-200">{copy.noOffersEyebrow}</p>
              <h2 className="mt-2 text-xl font-bold text-white">{copy.noOffersTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {copy.noOffersDescription}
              </p>
            </div>

            <button
              onClick={() => {
                dispatch({ type: 'RESET_TO_IDLE' });
                window.setTimeout(openDestination, 0);
              }}
              className="h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] hover:bg-[#2DD4BF] flex items-center justify-center cursor-pointer"
            >
              {copy.retry}
            </button>
          </div>
        );
      }

      return (
        <div className={`space-y-4 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">{hasOffers ? copy.offersArrived : copy.searchingCaptain}</p>
              <h2 className="text-xl font-bold text-white">{hasOffers ? copy.chooseCaptain : copy.requestVisibleTitle}</h2>
              <p className="text-xs text-slate-400">
                {hasOffers ? copy.chooseOfferDescription : copy.waitingOffersDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCancelRideRequest()}
              disabled={isCancellingRideRequest}
              className="h-11 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-black text-red-100 hover:bg-red-600/25 flex items-center justify-center gap-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
              {isCancellingRideRequest ? requestFlowCopy.cancellingRequest : requestFlowCopy.cancelRequest}
            </button>
          </div>

          {state.requestId ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="mb-3 text-[11px] font-black text-[#14F5D5]">{copy.savedRequestTitle}</p>
              <div className="grid grid-cols-2 gap-3">
                <Metric label={copy.requestNumber} value={shortRequestId} />
                <Metric label={copy.requestStatus} value={copy.savedInDatabase} />
                <Metric label={copy.destination} value={state.destination?.label || copy.notAvailable} />
                <Metric label={copy.serverFare} value={requestFareLabel} />
              </div>
            </div>
          ) : null}

          {!hasOffers ? (
            <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5">
              <Loader2 className="h-9 w-9 animate-spin text-[#14F5D5]" />
              <span className="px-4 text-center text-xs font-bold leading-relaxed text-slate-300">
                {copy.waitingOffersLoader}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {state.offers.map((offer) => {
                const captain = captainLocations.find((c) => c.id === offer.driverId || c.serial === offer.driverName);
                let realDistance = offer.distance_to_rider;

                if (realDistance == null && captain && riderLocation) {
                  const R = 6371;
                  const dLat = (captain.coordinates.lat - riderLocation.lat) * (Math.PI / 180);
                  const dLon = (captain.coordinates.lng - riderLocation.lng) * (Math.PI / 180);
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(riderLocation.lat * (Math.PI / 180)) *
                      Math.cos(captain.coordinates.lat * (Math.PI / 180)) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  realDistance = R * c;
                }

                // Calculate trip distance (from rider's pickup to destination coords)
                let tripDistance: number | null = null;
                if (riderLocation && state.destination?.coords) {
                  const R = 6371;
                  const dLat = (state.destination.coords.lat - riderLocation.lat) * (Math.PI / 180);
                  const dLon = (state.destination.coords.lng - riderLocation.lng) * (Math.PI / 180);
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(riderLocation.lat * (Math.PI / 180)) *
                      Math.cos(state.destination.coords.lat * (Math.PI / 180)) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  tripDistance = R * c;
                }

                // Format it nicely for the same-location testing scenarios
                const distanceDisplay = realDistance != null ? (realDistance < 0.1 ? 0 : realDistance).toFixed(1) : '---';
                const etaDisplay = offer.pickup_eta_minutes ?? (realDistance != null ? Math.max(1, Math.round(realDistance * 3)) : '---');
                
                const rawDuration = offer.estimated_duration_minutes ?? (tripDistance != null ? Math.max(5, Math.round(tripDistance * 1.2)) : null);
                let durationDisplay = '';
                if (rawDuration != null) {
                  if (rawDuration >= 60) {
                    const hours = Math.floor(rawDuration / 60);
                    const mins = rawDuration % 60;
                    if (hours === 1) {
                      durationDisplay = mins > 0 ? `ساعة و ${mins} دقيقة` : `ساعة`;
                    } else if (hours === 2) {
                      durationDisplay = mins > 0 ? `ساعتين و ${mins} دقيقة` : `ساعتين`;
                    } else {
                      durationDisplay = mins > 0 ? `${hours} ساعات و ${mins} دقيقة` : `${hours} ساعات`;
                    }
                  } else {
                    durationDisplay = `${rawDuration} دقيقة`;
                  }
                }

                const captainName = getOfferCaptainName(offer, language);
                const vehicleSummary = getOfferVehicleSummary(offer, language);
                const plateValue = getOfferPlate(offer, language);
                const captainOffer: CaptainOffer = {
                  id: offer.id || offer.driverId,
                  captain: {
                    id: offer.driverId || offer.captain?.id || '',
                    name: captainName,
                    avatar_url: offer.captain?.avatar_url || offer.driverAvatar,
                    trust_rating: Number(offer.captain?.trust_rating || offer.driverRating || 5),
                    rank: toCaptainOfferRank(offer.captain?.tier || offer.driverRank || offer.tier),
                    vehicle_model: firstDisplayString(
                      offer.captain?.vehicle_model,
                      offer.driverVehicle?.model,
                      offer.driverVehicle?.make,
                      vehicleSummary,
                    ),
                    vehicle_color: firstDisplayString(offer.captain?.vehicle_color, offer.driverVehicle?.color),
                    plate_number: plateValue,
                  },
                  server_fare: Number(state.destination?.serverEstimatedFare || offer.price || 0),
                  submitted_fare: Number(offer.price || 0),
                  eta_minutes: Number(etaDisplay) || 1,
                  distance_km: Number(distanceDisplay) || 0,
                };

                return (
                  <CaptainOfferCard
                    key={offer.id || offer.driverId}
                    offer={captainOffer}
                    currencyCode={currencyLabel || 'EGP'}
                    language={language === 'ar' ? 'ar' : 'en'}
                    isAccepting={acceptingOfferId === (offer.id || offer.driverId)}
                    onAccept={() => void handleAcceptOffer(offer)}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (state.screen === 'TRIP_ACTIVE' && state.activeTrip) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = etaSeconds % 60;
      const activeTripStatus = String(state.activeTrip.status || '').toUpperCase();
      const tripHasStarted = isTripStartedStatus(activeTripStatus);

      return (
        <div className={`space-y-4 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-[#14F5D5]">{copy.tripStarted}</p>
              <h2 className="text-xl font-bold text-white">
                {state.activeTrip.captain?.full_name || state.activeTrip.captain?.name || state.activeTrip.captainName || "كابتن حركي"}
              </h2>
              <p className="text-xs text-slate-400">{state.activeTrip.destinationLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-center min-w-[100px]">
              <Clock className="mx-auto mb-1 h-4 w-4 text-[#14F5D5]" />
              <strong className="font-mono text-lg text-[#14F5D5] block">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </strong>
              <span className="text-[9px] text-slate-400 block mt-0.5 whitespace-nowrap font-bold">
                {tripHasStarted
                  ? (language === 'ar' ? 'متبقي للوصول' : 'Time Remaining')
                  : (language === 'ar' ? 'وصول الكابتن' : 'Driver Arrival')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
            <Metric
              label={copy.vehicle}
              value={`${state.activeTrip.captain?.vehicle_color || ''} ${state.activeTrip.captain?.vehicle_model || state.activeTrip.vehicleType || 'سيارة مشغلة'}`.trim()}
            />
            <Metric
              label={copy.plate}
              value={state.activeTrip.captain?.plate_number || state.activeTrip.captain?.license_plate || state.activeTrip.vehiclePlate || "أ ر ج 1234"}
            />
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 text-center">
            <div className="text-2xl font-extrabold text-teal-400 font-mono">
              {formatMoney(state.activeTrip.finalPrice, currencyLabel)}
            </div>
            <p className="mt-1 text-xs font-bold text-slate-400">
              {language === 'ar' ? 'تكلفة الرحلة النهائية' : 'Final Trip Cost'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300">
            {tripHasStarted
              ? (language === 'ar'
                  ? "رحلتك قيد التقدم الآن. نتمنى لك رحلة آمنة!"
                  : "Your trip is in progress. Have a safe ride!")
              : copy.driverEnRouteNote}
          </div>

          <div className="flex gap-2">
            {state.activeTrip.captainPhone && (
              <a
                href={`tel:${state.activeTrip.captainPhone}`}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-colors cursor-pointer"
                title={isArabic ? 'اتصال بالكابتن' : 'Call Captain'}
              >
                <Phone className="h-6 w-6" />
              </a>
            )}
            {tripHasStarted ? (
              <button
                type="button"
                onClick={() => {
                  toast({
                    title: language === 'ar' ? 'طوارئ وتتبع الرحلة' : 'SOS & Trip Sharing',
                    description: language === 'ar' ? 'تم نسخ رابط تتبع الرحلة لمشاركته بأمان.' : 'Trip tracking link copied to clipboard.',
                  });
                }}
                className="h-14 flex-1 bg-red-600/90 hover:bg-red-500 text-white font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
              >
                <ShieldCheck className="h-5 w-5 animate-pulse" />
                {language === 'ar' ? "طوارئ SOS / تتبع الرحلة" : "SOS / Share Trip"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelRideRequest}
                disabled={isCancellingRideRequest}
                className="h-14 flex-1 border border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-200 font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isCancellingRideRequest
                  ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                  : (language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request')}
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden text-white lg:h-screen lg:min-h-screen lg:overflow-hidden lg:bg-transparent" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative h-full w-full lg:block lg:max-w-none">
        <div className="hidden lg:block lg:absolute lg:inset-0 lg:z-0">
          <RiderMap
            activeTripCaptainId={state.activeTrip?.captainId || null}
            captainLocations={mappedCaptains}
            className="h-full w-full lg:rounded-none lg:border-0"
            destinationFlyToTarget={state.screen === 'DESTINATION_SELECTION' ? selectedDistrict?.anchor || null : null}
            fallbackLocation={profileFallbackLocation}
            showDestinationPin={state.screen === 'DESTINATION_SELECTION'}
            onDestinationChange={handleDestinationPinChange}
            onDestinationMoveStart={handleDestinationPinMoveStart}
            onLocationChange={handleLocationChange}
          />
        </div>

        <aside className="absolute bottom-0 start-0 end-0 z-10 w-full max-h-full overflow-hidden flex flex-col rounded-t-[32px] rounded-b-none border-t border-white/10 bg-[#0A0F1D]/80 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:absolute lg:bottom-6 lg:start-auto lg:end-6 lg:top-6 lg:z-40 lg:w-[420px] lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-[#0A0F1D]/80 lg:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:backdrop-blur-xl lg:max-h-none lg:rounded-b-[28px] lg:overflow-hidden">
          {/* Top Bar with Center Drag Handle and Right-aligned Close Button */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md rounded-t-[32px] lg:rounded-t-[28px] relative z-50">
            {/* Left-aligned balance spacer */}
            <div className="w-9" />

            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-500/40 rounded-full" />

            {/* Clear, High-Contrast Close Button */}
            <button
              type="button"
              onClick={async () => {
                if (state.requestId) {
                  await handleCancelRideRequest();
                } else if (state.screen === 'DESTINATION_SELECTION') {
                  dispatch({ type: 'RETURN_TO_MAP' });
                } else if (state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') {
                  dispatch({ type: 'RETURN_TO_MAP' });
                } else {
                  if (onExitRequestFlow) {
                    onExitRequestFlow();
                  } else {
                    window.dispatchEvent(new CustomEvent('exit-request-flow'));
                  }
                }
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-800 border border-white/20 text-white shadow-md active:scale-95 cursor-pointer hover:bg-slate-700 transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          {/* Scrollable Content Wrapper */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            {/* Mobile Map Card inside Bottom Sheet */}
            <div className="block lg:hidden w-full h-[240px] rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10">
              <RiderMap
                activeTripCaptainId={state.activeTrip?.captainId || null}
                captainLocations={mappedCaptains}
                className="h-full w-full"
                destinationFlyToTarget={state.screen === 'DESTINATION_SELECTION' ? selectedDistrict?.anchor || null : null}
                fallbackLocation={profileFallbackLocation}
                showDestinationPin={state.screen === 'DESTINATION_SELECTION'}
                onDestinationChange={handleDestinationPinChange}
                onDestinationMoveStart={handleDestinationPinMoveStart}
                onLocationChange={handleLocationChange}
              />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div>
                  <p className="text-[11px] font-black text-[#14F5D5] tracking-wider">{copy.panelEyebrow}</p>
                  <h1 className="text-xl font-bold text-white mt-0.5">{copy.panelTitle}</h1>
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
                <div className={`space-y-4 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-[#14F5D5]">{copy.readyQuestion}</p>
                    <h2 className="text-xl font-bold text-white">{copy.whereTo}</h2>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {copy.homeSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                    <Metric
                      label={copy.yourArea}
                      value={
                        isGeocoding
                          ? (language === 'ar' ? 'جاري تحديد الموقع...' : 'Locating...')
                          : currentAddressName || (locationStatus === 'live' ? copy.currentLocation : copy.fallbackLocation)
                      }
                    />
                    <Metric label={copy.yourRating} value={`${Math.floor(riderProfile.rating || 5)} / 5`} />
                  </div>

                  <button
                    onClick={openDestination}
                    className="h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation className="ml-2 h-5 w-5" />
                    {copy.requestRide}
                  </button>
                </div>
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
          </div>
        </aside>

        {/* Hide secondary ads inside the active request map flow */}
        {false && showAdRiver && (
          <div className="overflow-hidden rounded-[24px] border border-[#14B8A6]/15 lg:hidden">
            <AdStage />
          </div>
        )}
      </div>

      {state.screen === 'RATING_MODAL' && state.completedTrip?.captainId && state.requestId && user?.uid && (
        <RatingModal
          isOpen={true}
          onClose={() => {
            dispatch({ type: 'SUBMIT_RATING' });
            if (onExitRequestFlow) {
              onExitRequestFlow();
            }
          }}
          tripId={state.requestId}
          captainId={state.completedTrip.captainId}
          reviewerId={user.uid}
          supabase={supabase}
          onSuccess={() => {
            void loadBlockedCaptains();
            dispatch({ type: 'SUBMIT_RATING' });
            if (onExitRequestFlow) {
              onExitRequestFlow();
            }
          }}
        />
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
  language: AppLanguage = 'ar',
) {
  if (language === 'en') {
    return (
      countryConfig?.currency_en ||
      user?.currencyEn ||
      countryConfig?.currency_code ||
      countryConfig?.currency_ar ||
      user?.currencyAr ||
      ''
    );
  }

  return countryConfig?.currency_ar || user?.currencyAr || countryConfig?.currency_en || user?.currencyEn || countryConfig?.currency_code || '';
}

function formatMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${value.toFixed(2)} ${currencyLabel}` : value.toFixed(2);
}

function getOfferCaptainName(offer: any, language: AppLanguage) {
  return firstDisplayString(
    offer?.captain?.full_name,
    offer?.captain?.name,
    offer?.driverName,
    offer?.captain?.serial_id,
    language === 'ar' ? 'سائق' : 'Captain',
  );
}

function getOfferCaptainPhone(offer: any) {
  return firstDisplayString(
    offer?.driverAffiliation?.phone,
    offer?.captain?.phone,
    offer?.captain?.phone_number,
    offer?.driverVehicle?.phone,
  );
}

function getOfferContactUrl(offer: any) {
  return firstDisplayString(
    offer?.captain?.contact_page_url,
    offer?.captain?.social_url,
    offer?.captain?.facebook_url,
    offer?.captain?.whatsapp_url,
    offer?.driverVehicle?.contact_page_url,
  );
}

function getOfferAffiliationLabel(offer: any, language: AppLanguage) {
  const rawType = firstDisplayString(offer?.driverAffiliation?.type, offer?.captain?.affiliation_type, offer?.captain?.employment_type);
  const rawName = firstDisplayString(offer?.driverAffiliation?.name, offer?.captain?.affiliation_name, offer?.captain?.company_name);
  const normalized = `${rawName || ''} ${rawType || ''}`.toLowerCase();

  if (normalized.includes('uber') || normalized.includes('أوبر')) {
    return language === 'ar' ? 'أوبر' : 'Uber';
  }
  if (normalized.includes('indrive') || normalized.includes('in-drive') || normalized.includes('in drive') || normalized.includes('إن درايف') || normalized.includes('اندرايف')) {
    return language === 'ar' ? 'إن درايف' : 'inDrive';
  }
  if (normalized.includes('careem') || normalized.includes('كريم')) {
    return language === 'ar' ? 'كريم' : 'Careem';
  }
  if (normalized.includes('office') || normalized.includes('taxi') || normalized.includes('company') || normalized.includes('مكتب') || normalized.includes('شركة')) {
    return language === 'ar' ? 'تابع لشركة' : 'Company driver';
  }
  if (normalized.includes('self') || normalized.includes('independent') || normalized.includes('freelance') || normalized.includes('مستقل')) {
    return language === 'ar' ? 'مستقل' : 'Self-employed';
  }
  if (normalized.includes('smart') || normalized.includes('app')) {
    return language === 'ar' ? 'تطبيق' : 'App driver';
  }

  return language === 'ar' ? 'مستقل' : 'Self-employed';
}

function toCaptainOfferRank(value: unknown): CaptainRank {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  return 'SILVER';
}

function getOfferVehicleSummary(offer: any, language: AppLanguage) {
  const parts = [
    firstDisplayString(offer?.captain?.vehicle_color, offer?.driverVehicle?.color),
    firstDisplayString(offer?.captain?.vehicle_brand, offer?.driverVehicle?.brand),
    firstDisplayString(offer?.captain?.vehicle_model, offer?.driverVehicle?.model, offer?.driverVehicle?.make),
    firstDisplayString(offer?.captain?.vehicle_type, offer?.driverVehicle?.type),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : language === 'ar' ? 'غير متاح' : 'Not available';
}

function getOfferPlate(offer: any, language: AppLanguage) {
  return firstDisplayString(
    offer?.captain?.plate_number,
    offer?.captain?.license_plate,
    offer?.driverVehicle?.plate,
    language === 'ar' ? 'غير متاح' : 'Not available',
  );
}

function firstDisplayString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <span className="block text-[10px] font-bold text-slate-500">{label}</span>
      <span className="block truncate text-xs font-black text-white">{value}</span>
    </div>
  );
}

function OfferContactAction({
  label,
  value,
  href,
  icon,
  actionLabel,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  actionLabel: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="block text-[10px] font-bold text-slate-500">{label}</span>
        <span className="block truncate text-xs font-black text-white">{value}</span>
      </div>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] transition hover:bg-[#14B8A6]/20"
        aria-label={actionLabel}
        title={actionLabel}
      >
        {icon}
      </a>
    </div>
  );
}

function getLocalizedMarketplaceError(error: unknown, language: AppLanguage) {
  if (language === 'ar') return mapRiderMarketplaceError(error);

  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('42501') || message.includes('row-level security') || message.includes('permission denied')) {
    return 'The ride request could not be created because database permissions are not ready.';
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return 'You cannot create this request right now. Please sign in again.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return 'Could not connect to the service. Check your internet connection and try again.';
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return 'The server could not calculate the fare. Choose the destination again and retry.';
  }

  if (message.includes('42703') || message.includes('column') || message.includes('origin_h3') || message.includes('destination_h3')) {
    return 'The ride requests table is missing required columns. Apply the database update, then try again.';
  }

  if (message.includes('22p02') || message.includes('invalid input value for enum') || message.includes('ride_request_status')) {
    return 'The request status value does not match the database. Make sure PENDING is supported.';
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return 'The rider or country data does not match the database. Update the account or choose the destination again.';
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return 'You already have an active ride request. Finish or cancel it, then try again.';
  }

  return 'Could not send the ride request. Try again in a moment.';
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
    acceptOffer: 'قبول العرض',
    acceptingOffer: 'جاري قبول العرض...',
    chooseCaptain: 'اختر السائق',
    chooseOfferDescription: 'اختر العرض المناسب لك.',
    countryMissingDescription: 'لا يمكن إرسال الطلب قبل تحميل دولة الحساب.',
    countryMissingTitle: 'الدولة غير محددة',
    destination: 'الوجهة',
    destinationNotReadyDescription: 'اختر منطقة تحتوي إحداثيات صحيحة من قاعدة البيانات.',
    destinationNotReadyTitle: 'الوجهة غير جاهزة',
    fareNotReadyDescription: 'انتظر حساب السعر من الخادم ثم حاول مرة أخرى.',
    fareNotReadyTitle: 'السعر غير جاهز',
    loginRequiredDescription: 'يرجى تسجيل الدخول قبل إرسال طلب الرحلة.',
    loginRequiredTitle: 'يلزم تسجيل الدخول',
    networkError: 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت.',
    noOffersDescription: 'لم نجد عروضاً تناسب رحلتك في هذه اللحظة. يمكنك إعادة المحاولة أو تغيير الوجهة.',
    noOffersEyebrow: 'لم تصل عروض',
    noOffersTitle: 'نعتذر منك، جميع السائقين مشغولون حالياً',
    offersArrived: 'وصلت عروض',
    plate: 'اللوحة',
    requestFailedTitle: 'تعذر إرسال الطلب',
    requestNumber: 'رقم الطلب',
    requestNow: 'اطلب الآن',
    requestSentDescription: 'تم حفظ طلب الرحلة. سنعرض العروض فور وصولها.',
    requestSentTitle: 'تم إرسال الطلب',
    requestStatus: 'حالة الطلب',
    requestUpdateFailedTitle: 'تعذر تحديث الطلب',
    requestVisibleTitle: 'طلبك ظاهر للسائقين القريبين',
    retry: 'إعادة المحاولة',
    requestRide: 'طلب رحلة',
    savedTab: 'المفضلة',
    savedInDatabase: 'محفوظ في قاعدة البيانات',
    savedRequestTitle: 'طلب الرحلة المحفوظ',
    searchingCaptain: 'نبحث عن سائق',
    sendingRequest: 'جاري إرسال الطلب...',
    serverFare: 'السعر من الخادم',
    tripsTab: 'رحلاتي',
    updatingFare: 'جاري تحديث السعر...',
    vehicle: 'السيارة',
    waitingOffersDescription: 'انتظر قليلاً، ستظهر العروض هنا.',
    waitingOffersLoader: 'جاري البحث عن أقرب سائقين متوفرين لك... ثوانٍ من فضلك',
    whereTo: 'إلى أين تريد الذهاب؟',
    yourArea: 'منطقتك',
    yourRating: 'تقييمك',
    tripStarted: 'الرحلة بدأت',
    tripDistance: 'المسافة',
    km: 'كم',
    tracking: 'التتبع',
    localUpdates: 'تحديثات محلية',
    roadFactor: 'عامل الطريق',
    driverEnRouteNote: 'السائق في الطريق إليك. يتم تحديث الحالة عبر نبضات موقع آمنة.',
    completingTrip: 'جاري إنهاء الرحلة...',
    completeTrip: 'إنهاء الرحلة',
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
    acceptOffer: 'Accept offer',
    acceptingOffer: 'Accepting offer...',
    cancelRequest: 'Cancel request',
    cancelRequestFailedTitle: 'Could not cancel request',
    cancellingRequest: 'Cancelling...',
    chooseCaptain: 'Choose captain',
    chooseOfferDescription: 'Choose the offer that works best for you.',
    countryMissingDescription: 'The request cannot be sent before your account country is loaded.',
    countryMissingTitle: 'Country is missing',
    destination: 'Destination',
    destinationNotReadyDescription: 'Choose an area with valid coordinates from the database.',
    destinationNotReadyTitle: 'Destination is not ready',
    fareNotReadyDescription: 'Wait for the server fare calculation, then try again.',
    fareNotReadyTitle: 'Fare is not ready',
    loginRequiredDescription: 'Please sign in before sending a ride request.',
    loginRequiredTitle: 'Sign in required',
    networkError: 'Could not connect to the server. Check your internet connection.',
    noOffersDescription: 'We did not find offers for your trip at this moment. You can retry or change the destination.',
    noOffersEyebrow: 'No offers arrived',
    noOffersTitle: 'Sorry, all nearby captains are busy right now',
    offersArrived: 'Offers arrived',
    plate: 'Plate',
    requestFailedTitle: 'Could not send request',
    requestNumber: 'Request number',
    requestNow: 'Request now',
    requestSentDescription: 'Your ride request was saved. Offers will appear as soon as they arrive.',
    requestSentTitle: 'Request sent',
    requestCancelledDescription: 'Your ride request was cancelled.',
    requestCancelledTitle: 'Request cancelled',
    requestStatus: 'Request status',
    requestUpdateFailedTitle: 'Could not update request',
    requestVisibleTitle: 'Your request is visible to nearby captains',
    retry: 'Retry',
    requestRide: 'Request ride',
    savedTab: 'Saved',
    savedInDatabase: 'Saved in database',
    savedRequestTitle: 'Saved ride request',
    searchingCaptain: 'Looking for a captain',
    sendingRequest: 'Sending request...',
    serverFare: 'Server fare',
    tripsTab: 'Trips',
    updatingFare: 'Updating fare...',
    vehicle: 'Vehicle',
    waitingOffersDescription: 'Wait a moment. Offers will appear here.',
    waitingOffersLoader: 'Looking for the nearest available captains... please wait a few seconds',
    whereTo: 'Where do you want to go?',
    yourArea: 'Your area',
    yourRating: 'Your rating',
    tripStarted: 'Trip started',
    tripDistance: 'Distance',
    km: 'km',
    tracking: 'Tracking',
    localUpdates: 'Local updates',
    roadFactor: 'Road factor',
    driverEnRouteNote: 'The driver is on the way. Status is updated via secure location pulses.',
    completingTrip: 'Completing trip...',
    completeTrip: 'Complete trip',
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function isTripStartedStatus(status: string) {
  return status === 'STARTED'
    || status === 'TRIP_ACTIVE'
    || status === 'ACTIVE'
    || status === 'IN_PROGRESS';
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

