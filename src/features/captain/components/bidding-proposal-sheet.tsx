'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { MARKET_FLOOR_FACTOR, warnFactorForTier } from '../services/offer-band';
import { BiddingTripSummary } from './bidding/bidding-trip-summary';
import { BiddingTariffComparison } from './bidding/bidding-tariff-comparison';
import { BiddingPricingSelector } from './bidding/bidding-pricing-selector';
import { BiddingOfferStepper } from './bidding/bidding-offer-stepper';
import { useBiddingProposal, roundMoney } from '../hooks/use-bidding-proposal';
import { MIN_OFFER_WAIT_SECONDS, MAX_OFFER_WAIT_SECONDS } from '../hooks/use-driver-transactions';

const styles = {
  container: "mx-auto max-w-3xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl",
  header: "flex items-start justify-between gap-4",
  badge: "text-xs font-black text-[#14B8A6]",
  title: "mt-1 text-2xl font-black",
  subtitle: "mt-2 text-sm leading-6 text-slate-400",
  ignoreBtn: "rounded-2xl border border-white/10 p-3 text-slate-300 hover:bg-white/10 transition-colors",
  pricingComparisonWrap: "mt-5 rounded-2xl border border-[#14B8A6]/20 bg-[#0B2A2A]/25 p-4",
} as const;

interface BiddingProposalSheetProps {
  language: 'ar' | 'en';
  request: Trip;
  currency: string;
  driverLocation: { lat: number; lng: number } | null;
  isSubmitting: boolean;
  initialOfferPrice?: number | null;
  initialPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  captainPricingMode?: 'FREE' | 'APP' | null;
  currentTariff?: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
    includedKm?: number;
    pricingMode?: 'FREE' | 'APP' | null;
    marketAverage?: any;
  } | null;
  onEditTariff?: () => void;
  onSubmit: (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnore: () => void;
}

export function BiddingProposalSheet({
  language,
  request,
  currency,
  driverLocation,
  isSubmitting,
  initialOfferPrice = null,
  initialPricingMode = null,
  captainPricingMode = null,
  currentTariff: currentTariffProp,
  onEditTariff,
  onSubmit,
  onIgnore,
}: BiddingProposalSheetProps) {
  const t = useTranslations('captainBidding');

  const proposal = useBiddingProposal({
    request,
    driverLocation,
    initialOfferPrice,
    initialPricingMode,
    captainPricingMode,
    currentTariffProp,
    isSubmitting,
  });

  const tierLabel = t(`tierLabels.${proposal.tier}`);

  return (
    <section className={styles.container}>
      {/* Header bar */}
      <div className={styles.header}>
        <div>
          <p className={styles.badge}>{t('badge')}</p>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>
        <button onClick={onIgnore} className={styles.ignoreBtn} aria-label={t('ignore')}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 1. Trip Summary Component */}
      <BiddingTripSummary
        request={request}
        language={language}
        pickupEtaMinutes={proposal.pickupEtaMinutes}
      />

      {/* 2. Pricing & Tariff Comparison Section */}
      <div className={styles.pricingComparisonWrap}>
        <BiddingTariffComparison
          language={language}
          currency={currency}
          tierLabel={tierLabel}
          rankIncreaseFactor={proposal.rankIncreaseFactor}
          premiumFactor={proposal.premiumFactor}
          bandHeadroom={proposal.bandHeadroom}
          isGoldOrPlatinum={proposal.isGoldOrPlatinum}
          isSilver={proposal.isSilver}
          isWithinBaseFare={proposal.isWithinBaseFare}
          marketBaseFare={proposal.marketBaseFare}
          marketPerKm={proposal.marketPerKm}
          marketPerMin={proposal.marketPerMin}
          currentBaseFare={proposal.currentBaseFare}
          currentPerKm={proposal.currentPerKm}
          currentPerMin={proposal.currentPerMin}
          offerBaseFare={proposal.offerBaseFare}
          offerPerKm={proposal.offerPerKm}
          offerPerMin={proposal.offerPerMin}
          isDumpingAmber={proposal.isDumpingAmber}
          dumpingDeviationRatio={proposal.dumpingDeviationRatio}
          riderPreference={proposal.riderPreference}
          pricingMode={proposal.pricingMode}
          setPricingMode={proposal.setPricingMode}
          onEditTariff={onEditTariff}
        />
        <BiddingPricingSelector
          language={language}
          currency={currency}
          pricingMode={proposal.pricingMode}
          appPrice={proposal.appPrice}
          setAppPrice={proposal.setAppPrice}
          marketFare={proposal.marketFare}
          baseFare={proposal.baseFare}
          isCoveredInBaseFare={proposal.isCoveredInBaseFare}
          meterDetails={proposal.meterDetails}
          captainMeterFare={proposal.captainMeterFare}
          premiumFactor={proposal.premiumFactor}
          ceilingPrice={proposal.ceilingPrice}
          floorPrice={proposal.floorPrice}
          MARKET_FLOOR_FACTOR={MARKET_FLOOR_FACTOR}
          normalizedIncreaseAmount={proposal.normalizedIncreaseAmount}
          isMeterOffMarket={proposal.isMeterOffMarket}
          bandHeadroom={proposal.bandHeadroom}
          setIncreaseAmount={proposal.setIncreaseAmount}
          isAboveBand={proposal.isAboveBand}
          aboveBandPercent={proposal.aboveBandPercent}
        />
      </div>

      {/* 3. Offer Stepper, Wait Seconds, Floor Warnings & Actions */}
      <BiddingOfferStepper
        language={language}
        currency={currency}
        pricingMode={proposal.pricingMode}
        increaseAmount={proposal.increaseAmount}
        setIncreaseAmount={proposal.setIncreaseAmount}
        minIncreaseAmount={proposal.minIncreaseAmount}
        step={proposal.step}
        isMinusDisabled={proposal.isMinusDisabled}
        isPlusDisabled={proposal.isPlusDisabled}
        finalOfferPrice={proposal.finalOfferPrice}
        normalizedAppPrice={proposal.normalizedAppPrice}
        baseFare={proposal.baseFare}
        normalizedIncreaseAmount={proposal.normalizedIncreaseAmount}
        isTierAmber={proposal.isTierAmber}
        isAboveBand={proposal.isAboveBand}
        premiumFactor={proposal.premiumFactor}
        isDumpingAmber={proposal.isDumpingAmber}
        marketFare={proposal.marketFare}
        marketDifference={proposal.marketDifference}
        marketDifferencePercent={proposal.marketDifferencePercent}
        isDumpingBlocked={proposal.isDumpingBlocked}
        professionalAd={proposal.professionalAd}
        MARKET_FLOOR_FACTOR={MARKET_FLOOR_FACTOR}
        floorPrice={proposal.floorPrice}
        handleApplyFloorPrice={proposal.handleApplyFloorPrice}
        waitSecondsInput={proposal.waitSecondsInput}
        setWaitSecondsInput={proposal.setWaitSecondsInput}
        MIN_OFFER_WAIT_SECONDS={MIN_OFFER_WAIT_SECONDS}
        MAX_OFFER_WAIT_SECONDS={MAX_OFFER_WAIT_SECONDS}
        parsedWaitSeconds={proposal.parsedWaitSeconds}
        isWaitSecondsValid={proposal.isWaitSecondsValid}
        onSubmit={onSubmit}
        canSubmit={proposal.canSubmit}
        isSubmitting={isSubmitting}
        existingOffer={proposal.existingOffer}
        onIgnore={onIgnore}
        roundMoney={roundMoney}
      />
    </section>
  );
}
