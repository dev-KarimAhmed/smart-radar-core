import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { type PricingMode } from './bidding-pricing-selector';
import { styles } from './bidding-offer-stepper-styles';
import { BiddingFareCard } from './bidding-fare-card';
import { BiddingSummaryCards } from './bidding-summary-cards';
import { BiddingWarningsBlock } from './bidding-warnings-block';

export interface BiddingOfferStepperProps {
  language: string;
  currency: string;
  pricingMode: PricingMode | null;
  appPrice?: string;
  setAppPrice?: (val: string) => void;
  increaseAmount: number | string;
  setIncreaseAmount: React.Dispatch<React.SetStateAction<number | string>>;
  minIncreaseAmount: number;
  step: number;
  isMinusDisabled: boolean;
  isPlusDisabled: boolean;
  finalOfferPrice: number;
  normalizedAppPrice: number;
  baseFare: number;
  normalizedIncreaseAmount: number;
  isBlockedDeviation?: boolean;
  isTierAmber: boolean;
  isAboveBand: boolean;
  premiumFactor: number;
  isDumpingAmber: boolean;
  marketFare: number;
  marketDifference: number;
  marketDifferencePercent: number;
  isDumpingBlocked: boolean;
  professionalAd: any;
  MARKET_FLOOR_FACTOR: number;
  floorPrice: number;
  handleApplyFloorPrice: () => void;
  waitSecondsInput: string;
  setWaitSecondsInput: React.Dispatch<React.SetStateAction<string>>;
  MIN_OFFER_WAIT_SECONDS: number;
  DEFAULT_OFFER_WAIT_SECONDS?: number;
  MAX_OFFER_WAIT_SECONDS: number;
  parsedWaitSeconds: number;
  isWaitSecondsValid: boolean;
  onSubmit: (price: number, waitSecs: number, mode?: PricingMode) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  existingOffer: any;
  onIgnore: () => void;
  roundMoney: (val: number) => number;
  isSmartApp?: boolean;
}

export function BiddingOfferStepper({
  language,
  currency,
  pricingMode,
  appPrice = '',
  setAppPrice,
  increaseAmount,
  setIncreaseAmount,
  minIncreaseAmount,
  step,
  isMinusDisabled,
  isPlusDisabled,
  finalOfferPrice,
  normalizedAppPrice,
  baseFare,
  isTierAmber,
  isAboveBand,
  premiumFactor,
  isDumpingAmber,
  marketFare,
  marketDifference,
  marketDifferencePercent,
  isDumpingBlocked,
  professionalAd,
  floorPrice,
  handleApplyFloorPrice,
  waitSecondsInput,
  setWaitSecondsInput,
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS = 90,
  MAX_OFFER_WAIT_SECONDS,
  parsedWaitSeconds,
  isWaitSecondsValid,
  onSubmit,
  isSubmitting,
  existingOffer,
  onIgnore,
  roundMoney,
}: BiddingOfferStepperProps) {
  const t = useTranslations('captainBidding');

  if (pricingMode === null) return null;

  return (
    <div className={styles.container}>
      {/* 3-Box Grid: [الصق سعر التطبيق] | [السعر النهائي] | [مدة العرض] */}
      <div className={styles.biddingGrid}>
        <BiddingFareCard
          pricingMode={pricingMode}
          currency={currency}
          appPrice={appPrice}
          setAppPrice={setAppPrice}
          increaseAmount={increaseAmount}
          setIncreaseAmount={setIncreaseAmount}
          minIncreaseAmount={minIncreaseAmount}
          step={step}
          isMinusDisabled={isMinusDisabled}
          isPlusDisabled={isPlusDisabled}
          normalizedAppPrice={normalizedAppPrice}
          baseFare={baseFare}
          marketFare={marketFare}
          roundMoney={roundMoney}
        />

        <BiddingSummaryCards
          language={language}
          currency={currency}
          pricingMode={pricingMode}
          finalOfferPrice={finalOfferPrice}
          normalizedAppPrice={normalizedAppPrice}
          waitSecondsInput={waitSecondsInput}
          setWaitSecondsInput={setWaitSecondsInput}
          MIN_OFFER_WAIT_SECONDS={MIN_OFFER_WAIT_SECONDS}
          DEFAULT_OFFER_WAIT_SECONDS={DEFAULT_OFFER_WAIT_SECONDS}
          MAX_OFFER_WAIT_SECONDS={MAX_OFFER_WAIT_SECONDS}
          parsedWaitSeconds={parsedWaitSeconds}
        />
      </div>

      {/* Warnings & Dumping Block */}
      <BiddingWarningsBlock
        isTierAmber={isTierAmber}
        isAboveBand={isAboveBand}
        premiumFactor={premiumFactor}
        isDumpingAmber={isDumpingAmber}
        finalOfferPrice={finalOfferPrice}
        marketFare={marketFare}
        marketDifference={marketDifference}
        marketDifferencePercent={marketDifferencePercent}
        currency={currency}
        isDumpingBlocked={isDumpingBlocked}
        floorPrice={floorPrice}
        handleApplyFloorPrice={handleApplyFloorPrice}
        professionalAd={professionalAd}
      />

      {/* Action Buttons: [تقديم العرض] & [تجاهل] */}
      <div className={styles.actionsRow}>
        <span
          className={styles.submitWrap}
          title={!isWaitSecondsValid ? t('waitSecondsRange', { min: MIN_OFFER_WAIT_SECONDS, max: MAX_OFFER_WAIT_SECONDS }) : undefined}
        >
          <button
            type="button"
            onClick={() => {
              if ((pricingMode === 'APP' || pricingMode === 'TAXI') && (!appPrice || finalOfferPrice <= 0)) {
                alert(t('emptyAppPriceError'));
                return;
              }
              onSubmit(finalOfferPrice, parsedWaitSeconds, pricingMode || undefined);
            }}
            disabled={isSubmitting || !isWaitSecondsValid}
            className={styles.submitBtn}
          >
            {isSubmitting ? <Loader2 className={styles.submitSpinner} /> : <Send className={styles.submitIcon} />}
            <span>{existingOffer ? t('updateOffer') : t('submitDirect')}</span>
          </button>
        </span>
        <button type="button" onClick={onIgnore} className={styles.ignoreBtn}>
          {t('ignore')}
        </button>
      </div>
    </div>
  );
}
