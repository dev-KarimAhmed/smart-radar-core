'use client';

import React from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Heart,
  Navigation,
  Star,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { preferRoutedMinutes } from '@/shared/services/trip-duration';
import { formatCountdown } from '@/shared/services/trip-countdown';

import { 
  styles, 
  CaptainOffer, 
  CaptainOfferCardCountdown,
  rankLabels,
  getCaptainOfferPricing,
  CaptainAvatar,
  formatMinutes
} from './offer-card/offer-card-shared';
import { OfferCardTrip } from './offer-card/offer-card-trip';
import { OfferCardCaptain } from './offer-card/offer-card-captain';
import { OfferCardPrice } from './offer-card/offer-card-price';

interface CaptainOfferCardProps {
  offer: CaptainOffer;
  currencyCode?: string;
  isAccepting?: boolean;
  isPreferred?: boolean;
  isExpanded?: boolean;
  countdown?: CaptainOfferCardCountdown;
  onToggleExpand?: () => void;
  onAccept: (offer: CaptainOffer) => void;
}

export function CaptainOfferCard({
  offer,
  currencyCode = 'EGP',
  isAccepting = false,
  isPreferred = false,
  isExpanded = false,
  countdown,
  onToggleExpand,
  onAccept,
}: CaptainOfferCardProps) {
  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const language = isArabic ? 'ar' : 'en';

  const [openSections, setOpenSections] = React.useState<Record<'trip' | 'captain' | 'price', boolean>>({
    trip: false,
    captain: false,
    price: false,
  });

  const toggleSection = React.useCallback((section: 'trip' | 'captain' | 'price') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const captain = offer.captain;
  const rating = Math.floor(Number(captain.trust_rating) || 5);
  const rankLabel = rankLabels[language][captain.rank] || captain.rank;
  const { finalFare } = getCaptainOfferPricing(offer);
  
  const captainName = captain.name?.trim() || t('captain');
  const companyLabel = captain.company_name?.trim()
    || captain.affiliation_label?.trim()
    || t('independentCaptain');

  const pricingMode = offer.pricing_mode || (offer as any).pricingMode;
  const affiliationType = (captain.affiliation_type || (captain as any).employment_type || '').toLowerCase();
  const isTaxiOffer = pricingMode === 'TAXI' || affiliationType === 'office-taxi' || affiliationType.includes('taxi');
  const isAppOffer = pricingMode === 'APP' || affiliationType === 'smart-app' || affiliationType.includes('app');
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);

  const durationLabel = formatMinutes(
    preferRoutedMinutes(offer.estimated_duration_minutes, offer.trip_distance_km || offer.distance_km),
    language,
  );
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;

  const isCountdownUrgent = Boolean(
    countdown?.hasCountdown
    && (countdown.percentRemaining <= 20 || countdown.remainingSeconds <= 10),
  );

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(styles.style136_1, isPreferred ? styles.style137_2 : styles.style137_3)}
    >
      {countdown?.hasCountdown ? (
        <div className={styles.countdownWrap}>
          <div className={styles.countdownTrack}>
            <div
              className={cn(styles.countdownFill, isCountdownUrgent ? styles.countdownFillUrgent : '')}
              style={{ width: `${countdown.percentRemaining}%` }}
            />
          </div>
          <span className={isCountdownUrgent ? styles.countdownLabelUrgent : styles.countdownLabel} dir="ltr">
            {formatCountdown(countdown.remainingSeconds)}
          </span>
        </div>
      ) : null}

      <div className={styles.headerRow}>
        <div className={styles.style146_5}>
          <CaptainAvatar captain={captain} captainName={captainName} />
          <div className={styles.style148_6}>
            <div className={styles.style149_7}>
              <h3 dir="auto" className={styles.style150_8}>{captainName}</h3>
              {captain.is_verified ? (
                <span className={styles.style152_9}>
                  <CheckCircle2 className={styles.style153_10} />
                  {t('verified')}
                </span>
              ) : null}
              {isPreferred ? (
                <span className={styles.style158_11}>
                  <Heart className={styles.style159_12} />
                  {t('preferredCaptain')}
                </span>
              ) : null}
              {isTaxiOffer ? (
                <span className={styles.modeBadgeTaxi}>
                  🚕 {t('taxiMeter')}
                </span>
              ) : isAppOffer ? (
                <span className={styles.modeBadgeApp}>
                  📱 {t('appFare')}
                </span>
              ) : (
                <span className={styles.modeBadgeFree}>
                  🟢 {t('freePrice')}
                </span>
              )}
              <span className={styles.companyBadge}>
                <Building2 className={styles.companyIcon} />
                {companyLabel}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.style165_14}>
                <Star className={styles.style166_15} />
                <strong className={styles.style167_16}>{rating}.0</strong>
              </span>
              <span className={styles.style169_17}>
                {rankLabel}
              </span>
              {completedTrips > 0 ? (
                <>
                  <span className={styles.metaDot}>·</span>
                  <span>{completedTrips} {t('trips')}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.factsStrip}>
        <div className={styles.fact}>
          <span className={styles.factLabel}>{t('arrivesIn')}</span>
          <span className={styles.factValueAccent}>{formatMinutes(offer.eta_minutes, language)}</span>
        </div>
        <div className={cn(styles.fact, styles.factDivided)}>
          <span className={styles.factLabel}>{t('tripTime')}</span>
          <span className={styles.factValue}>{durationLabel}</span>
        </div>
        <div className={cn(styles.fact, styles.factDivided)}>
          <span className={styles.factLabel}>{t('tripDistance')}</span>
          <span className={styles.factValue}>{Number(tripDistance || 0).toFixed(1)} {t('km')}</span>
        </div>
      </div>

      <div className={styles.priceRow}>
        <div className={styles.priceLabelWrap}>
          <span className={styles.priceLabel}>{t('finalPrice')}</span>
          <span className={styles.priceValueRow} dir="ltr">
            <strong className={styles.priceValue}>{finalFare.toFixed(2)}</strong>
            <span className={styles.priceCurrency}>{currencyCode}</span>
          </span>
        </div>
        <span className={styles.priceAside}>
          {t('allInclusive')}
        </span>
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={() => onAccept(offer)}
          disabled={isAccepting}
          className={styles.acceptButton}
        >
          <Navigation className={styles.acceptButtonIcon} />
          {isAccepting ? t('accepting') : t('acceptOffer')}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className={styles.detailsButton}
          aria-expanded={isExpanded}
        >
          {t('details')}
          <ChevronDown className={cn(styles.detailsIcon, isExpanded ? styles.detailsIconOpen : '')} />
        </button>
      </div>

      <div
        className={cn(styles.style192_26, isExpanded ? styles.style193_27 : styles.style193_28)}
      >
        <div className={styles.style196_29}>
          <div className={styles.cardBody}>
            <OfferCardTrip 
              offer={offer} 
              isOpen={openSections.trip} 
              onToggle={() => toggleSection('trip')} 
            />
            
            <OfferCardCaptain 
              offer={offer} 
              isOpen={openSections.captain} 
              onToggle={() => toggleSection('captain')} 
            />
            
            <OfferCardPrice 
              offer={offer} 
              currencyCode={currencyCode} 
              isOpen={openSections.price} 
              onToggle={() => toggleSection('price')} 
            />

            {offer.additional_info ? (
              <p className={styles.additionalInfo}>
                {offer.additional_info}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
