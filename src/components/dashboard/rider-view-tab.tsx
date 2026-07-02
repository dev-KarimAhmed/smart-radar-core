'use client';

import React, { useState } from 'react';
import { AlertTriangle, Heart, Info, Loader2, Phone, Star, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { useRiderOperations } from '@/hooks/use-rider-operations';
import { cn } from '@/lib/utils';
import { riderDashboardCopy } from '@/lib/i18n/rider-dashboard-copy';
import { RequestRideModal } from './rider/request-ride-modal';
import { RadarRiderDashboard, HistoricalTrip } from './rider/rider-dashboard';
import { RiderPortal } from './rider-portal';
import { VehicleSensoryProfile } from '../shared/VehicleSensoryProfile';

export function RiderViewTab() {
  const copy = riderDashboardCopy.ar;
  const {
    trip,
    tripStatus,
    pulsedDrivers,
    cancelTrip,
    isCancelling,
    acceptedDriver,
    selectOffer,
    isSelectingOffer,
    rateTrip,
    isRating,
    confirmCheckpoint,
    isConfirmingCheckpoint,
    executeRedPathGuillotine,
    isExecutingGuillotine,
    isRequestModalOpen,
    openRequestModal,
    isRadarActive,
  } = useRiderOperations()!;

  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'classic' | 'handshake'>('classic');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [riderFeedback, setRiderFeedback] = useState({
    driverRating: 0,
    vehicleRating: 0,
    giveHeart: false,
  });

  const riderProfile = React.useMemo(() => {
    const ratingVal =
      user?.rating !== undefined ? user.rating : user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 4.8;

    return {
      id: user?.uid || 'temp-rider-id',
      rating: ratingVal,
      governorate: user?.governorate || 'عمان',
      district: user?.district || 'وادي السير',
    };
  }, [user]);

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [
      {
        tripId: 'h-trip-1',
        captainName: copy.demo.captainOne,
        captainRank: 'PLATINUM',
        captainPhone: '0799988771',
        vehicleInfo: copy.demo.vehicleOne,
        finalPrice: 2.75,
        timestamp: Date.now() - 3 * 3600 * 1000,
      },
      {
        tripId: 'h-trip-2',
        captainName: copy.demo.captainTwo,
        captainRank: 'GOLD',
        captainPhone: '0788877662',
        vehicleInfo: copy.demo.vehicleTwo,
        finalPrice: 3.4,
        timestamp: Date.now() - 17 * 3600 * 1000,
      },
    ],
    [copy.demo.captainOne, copy.demo.captainTwo, copy.demo.vehicleOne, copy.demo.vehicleTwo]
  );

  const systemMessages = React.useMemo(
    () => [
      copy.demo.systemMessageOne,
      `${copy.demo.systemMessageTwoPrefix} ${user?.district || 'وادي السير'}. ${copy.demo.systemMessageTwoSuffix}`,
    ],
    [copy.demo.systemMessageOne, copy.demo.systemMessageTwoPrefix, copy.demo.systemMessageTwoSuffix, user?.district]
  );

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
      setLocalCountdown((prev) => (prev && prev > 1 ? prev - 1 : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, [localCountdown]);

  if (tripStatus === 'idle') {
    return (
      <>
        <RequestRideModal />

        {!isRequestModalOpen && (
          <div className="h-full p-4 pb-28 select-none text-right font-sans relative z-20 pointer-events-auto space-y-6 flex flex-col items-center w-full">
            <div />

            <div className="flex bg-black/60 p-1 rounded-2xl border border-white/5 gap-1.5 w-full max-w-sm" dir="rtl">
              <button
                type="button"
                onClick={() => setActiveSubTab('classic')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer',
                  activeSubTab === 'classic'
                    ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/25'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {copy.tabs.classic}
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('handshake')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer',
                  activeSubTab === 'handshake'
                    ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/25'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {copy.tabs.handshake}
              </button>
            </div>

            {activeSubTab === 'classic' ? (
              <>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="w-full max-w-sm bg-[#050D05]/95 border-2 border-emerald-500/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(16,185,129,0.15)] backdrop-blur-md space-y-5 pointer-events-auto"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3" dir="rtl">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      {copy.idle.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-black text-white tracking-tight">{copy.idle.title}</h1>
                    <p className="text-xs text-gray-400 leading-relaxed px-2">{copy.idle.description}</p>
                  </div>

                  <div className="bg-black/50 border border-emerald-500/10 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">{copy.idle.coverageLabel}</span>
                    <span className="text-lg font-mono font-bold text-emerald-400 block tracking-widest">
                      {user?.district || 'وادي السير'} - {user?.governorate || 'عمان'}
                    </span>
                    <span className="text-[9px] text-gray-500 block">{copy.idle.coverageRange}</span>
                  </div>

                  {isRadarActive === false ? (
                    <div className="w-full min-h-16 bg-rose-950/20 border-2 border-rose-500/30 text-rose-400 font-extrabold text-xs rounded-2xl flex items-center justify-center p-4 text-center leading-normal">
                      {copy.idle.servicePaused}
                    </div>
                  ) : (
                    <Button
                      onClick={openRequestModal}
                      className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl tracking-tight rounded-2xl shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-emerald-500/20"
                      dir="rtl"
                    >
                      {copy.idle.requestButton}
                    </Button>
                  )}
                </motion.div>

                <div className="w-full max-w-lg pointer-events-auto">
                  <RadarRiderDashboard
                    riderProfile={riderProfile}
                    tripsWithin72Hours={tripsWithin72Hours}
                    systemMessages={systemMessages}
                  />
                </div>

                <p className="text-[10px] text-gray-400 font-bold text-center leading-normal max-w-xs bg-black/40 py-1.5 px-4 rounded-full border border-white/5 pointer-events-auto">
                  {copy.idle.footer}
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

  const renderTripCard = (stateType: 'searching' | 'offers' | 'confirmed') => {
    const stateCopy =
      stateType === 'searching'
        ? {
            badge: copy.states.searchingBadge,
            title: copy.states.searchingTitle,
            description: copy.states.searchingDescription,
          }
        : stateType === 'offers'
          ? {
              badge: copy.states.offersBadge,
              title: copy.states.offersTitle,
              description: `${copy.states.offersDescriptionPrefix} ${trip?.offers?.length || 0} ${copy.states.offersDescriptionSuffix}`,
            }
          : {
              badge: copy.states.confirmedBadge,
              title: copy.states.confirmedTitle,
              description: copy.states.confirmedDescription,
            };

    const estimatedTimeVal = localCountdown ? `${localCountdown} دقيقة` : copy.details.unknown;
    const frozenPrice =
      trip?.offerPrice !== undefined && trip?.offerPrice !== -1 ? `${Number(trip.offerPrice).toFixed(2)} د.أ` : copy.details.meterPrice;

    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[80vh] animate-in fade-in duration-600 relative z-20 w-full">
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-[#131C31]/95 border-2 border-emerald-500/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(16,185,129,0.18)] backdrop-blur-md space-y-6 text-right"
          dir="rtl"
        >
          <div className="space-y-3 border-b border-white/5 pb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              {stateCopy.badge}
            </span>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">{stateCopy.title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">{stateCopy.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5">
            {stateType === 'searching' && (
              <>
                <Metric label={copy.details.h3} value={trip?.h3Index ? trip.h3Index.substring(0, 10).toUpperCase() : trip?.gridId || copy.details.unknown} />
                <Metric label={copy.details.suggestedPrice} value={trip?.offerPrice ? `${trip.offerPrice.toFixed(2)} د.أ` : copy.details.unknown} />
                <Metric label={copy.details.activeDrivers} value={`${pulsedDrivers.length} / 9`} />
                <Metric label={copy.details.range} value={copy.details.nearbyRange} />
                <Metric label={copy.details.destination} value={trip?.dropoff || copy.details.unknown} wide />
              </>
            )}

            {stateType === 'offers' && (
              <>
                <Metric label={copy.details.offerCount} value={`${trip?.offers?.length || 0} ${copy.offers.licensedCaptains}`} />
                <Metric
                  label={copy.details.bestOffer}
                  value={
                    trip?.offers && trip.offers.length > 0
                      ? `${Math.min(...trip.offers.map((offer) => offer.price)).toFixed(2)} د.أ`
                      : copy.details.unknown
                  }
                />
                <Metric label={copy.details.serviceFee} value={copy.details.noFee} />
                <Metric label={copy.details.activeRanks} value="Platinum / Gold" />
              </>
            )}

            {stateType === 'confirmed' && (
              <>
                <Metric label={copy.details.selectedCaptain} value={acceptedDriver?.name || copy.details.unknown} wide />
                <Metric label={copy.details.vehicle} value={`${acceptedDriver?.vehicle?.make || copy.details.unknown} ${acceptedDriver?.vehicle?.color || ''}`} />
                <Metric label={copy.details.plate} value={acceptedDriver?.vehicle?.plate || copy.details.unknown} />
                <Metric label={copy.details.finalPrice} value={frozenPrice} />
                <Metric label={copy.details.eta} value={estimatedTimeVal} />
              </>
            )}
          </div>

          {stateType === 'searching' && (
            <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/5 space-y-3">
              <Wifi className="w-10 h-10 text-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">{copy.offers.waiting}</span>
            </div>
          )}

          {stateType === 'offers' && trip?.offers && (
            <div className="space-y-3">
              <span className="text-[10px] text-gray-500 font-bold block uppercase text-right">{copy.offers.chooseBest}</span>
              <div className="max-h-[32vh] overflow-y-auto space-y-3 pr-1">
                {trip.offers.map((offer) => (
                  <div key={offer.driverId} className="p-3.5 bg-[#101726]/90 border border-emerald-500/15 rounded-2xl flex flex-col gap-3 hover:border-emerald-500/40 transition-all shadow-md relative text-right">
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
                            <span className="text-[9px] text-gray-500 font-bold bg-white/5 px-1.5 rounded border border-white/5">{offer.driverRank}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left select-none">
                        <span className="text-[9px] text-gray-500 font-bold block">{copy.offers.price}</span>
                        <span className="text-sm font-black text-emerald-400">
                          {offer.price === -1 ? copy.offers.byMeter : `${offer.price.toFixed(2)} د.أ`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/5" dir="rtl">
                      <span>
                        {offer.driverVehicle?.make || copy.details.vehicle} {offer.driverVehicle?.color || ''} - {offer.driverVehicle?.year || ''}
                      </span>
                      <button type="button" className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1" onClick={() => setSelectedVehicle(offer.driverVehicle)}>
                        <Info className="w-3 h-3" />
                        {copy.offers.viewVehicle}
                      </button>
                    </div>

                    {offer.isDumping && (
                      <div className="bg-red-500/5 border border-red-500/15 text-red-400 p-2 rounded-xl text-[10px] leading-relaxed">
                        {copy.offers.lowPriceWarning}
                      </div>
                    )}

                    <Button
                      onClick={() => selectOffer(offer)}
                      disabled={isSelectingOffer}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] text-white font-bold text-xs rounded-xl transition-all border border-emerald-500/20 shadow-md"
                    >
                      {isSelectingOffer ? <Loader2 className="animate-spin w-4 h-4" /> : copy.offers.selectCaptain}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex gap-3 text-right">
            {stateType === 'confirmed' ? (
              <>
                <Button asChild className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl">
                  <a href={`tel:${acceptedDriver?.phone || ''}`}>
                    <Phone className="w-4 h-4" />
                    <span>{copy.actions.callCaptain}</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelTrip}
                  disabled={isCancelling}
                  className="h-12 px-4 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-white font-bold text-xs rounded-xl"
                >
                  {isCancelling ? <Loader2 className="animate-spin w-4 h-4" /> : copy.actions.cancelCaptain}
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                onClick={cancelTrip}
                disabled={isCancelling}
                className="w-full h-12 bg-red-950/30 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black text-sm rounded-xl"
              >
                {isCancelling ? <Loader2 className="animate-spin w-4 h-4" /> : copy.actions.cancelSearch}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  if (tripStatus === 'searching') {
    const hasOffers = trip?.offers && trip.offers.length > 0;
    return (
      <>
        {renderTripCard(hasOffers ? 'offers' : 'searching')}
        <VehicleSensoryProfile vehicle={selectedVehicle} isOpen={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      </>
    );
  }

  if (tripStatus === 'busy' && trip) {
    return renderTripCard('confirmed');
  }

  if (tripStatus === 'rating') {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-md bg-[#050D05] border-emerald-900/50 text-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black">{copy.rating.title}</DialogTitle>
            <DialogDescription className="text-gray-400">{copy.rating.description}</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-8">
            <div className="space-y-3 text-center">
              <Label className="text-emerald-500 font-bold">{copy.rating.captain}</Label>
              <div className="flex justify-center">
                <StarRating rating={riderFeedback.driverRating} setRating={(rating: number) => setRiderFeedback({ ...riderFeedback, driverRating: rating })} size="lg" />
              </div>
            </div>

            <div className="space-y-3 text-center">
              <Label className="text-emerald-500 font-bold">{copy.rating.vehicle}</Label>
              <div className="flex justify-center">
                <StarRating rating={riderFeedback.vehicleRating} setRating={(rating: number) => setRiderFeedback({ ...riderFeedback, vehicleRating: rating })} size="lg" color="amber" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
              <span className="text-sm font-bold">{copy.rating.favorite}</span>
              <Button
                variant="ghost"
                size="icon"
                className={riderFeedback.giveHeart ? 'text-red-500 scale-125' : 'text-gray-500'}
                onClick={() => setRiderFeedback({ ...riderFeedback, giveHeart: !riderFeedback.giveHeart })}
              >
                <Heart className={riderFeedback.giveHeart ? 'fill-current' : ''} />
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 font-black text-lg"
            disabled={isRating || riderFeedback.driverRating === 0 || riderFeedback.vehicleRating === 0}
            onClick={() => rateTrip(riderFeedback)}
          >
            {isRating ? <Loader2 className="animate-spin" /> : copy.rating.submit}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (tripStatus === 'checkpoint_required') {
    return (
      <div className="flex items-center justify-center p-4 min-h-[80vh]">
        <Card className="w-full max-w-md bg-red-950/20 border-red-500/50 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white">{copy.checkpoint.title}</h2>
            <p className="text-sm text-red-200/70 leading-relaxed">{copy.checkpoint.description}</p>

            <div className="space-y-3">
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-bold" onClick={confirmCheckpoint} disabled={isConfirmingCheckpoint}>
                {isConfirmingCheckpoint ? <Loader2 className="animate-spin" /> : copy.checkpoint.confirm}
              </Button>
              <Button variant="destructive" className="w-full h-12 font-bold" onClick={executeRedPathGuillotine} disabled={isExecutingGuillotine}>
                {isExecutingGuillotine ? <Loader2 className="animate-spin" /> : copy.checkpoint.report}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RequestRideModal />;
}

function Metric({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('space-y-1', wide && 'col-span-2')}>
      <span className="text-[10px] text-gray-500 font-bold block uppercase">{label}</span>
      <span className="text-xs font-bold text-white block truncate">{value}</span>
    </div>
  );
}
