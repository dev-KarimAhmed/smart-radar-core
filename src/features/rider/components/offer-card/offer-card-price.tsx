import React from 'react';
import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildOfferReceipt } from '../../services/offer-receipt';
import { CaptainOffer, styles, SectionHeader, money, getCaptainOfferPricing } from './offer-card-shared';

export function OfferCardPrice({
  offer,
  currencyCode,
  isOpen,
  onToggle,
}: {
  offer: CaptainOffer;
  currencyCode: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('Rider.CaptainOfferCard');
  
  const { finalFare } = getCaptainOfferPricing(offer);
  const breakdown = offer.fare_breakdown ?? null;
  const receipt = buildOfferReceipt(breakdown, finalFare);
  const pricingReason = t('noTariffReason');

  return (
    <div className={styles.sectionWrap}>
      <SectionHeader
        icon={<Wallet className={styles.sectionHeaderIcon} />}
        title={t('price')}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen ? (
        <div className={styles.collapsibleSectionBody}>
          <div className={styles.priceCard}>
            {/* 1. Featured Final Locked Price */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-black/40 border border-[#14B8A6]/30 shadow-inner">
              <div>
                <span className="block text-sm font-black text-white">
                  {t('finalPrice')}
                </span>
                <span className="block text-[11px] font-semibold text-[#14F5D5]/90 mt-0.5">
                  {t('lockedPriceDesc')}
                </span>
              </div>
              <div className="text-end shrink-0" dir="ltr">
                <strong className="text-xl sm:text-2xl font-black text-[#14F5D5] font-mono">
                  {finalFare.toFixed(2)}
                </strong>
                <span className="text-xs font-bold text-slate-300 ms-1.5">
                  {currencyCode}
                </span>
              </div>
            </div>

            {/* 2. Clean Market Comparison */}
            {receipt.marketFare > 0 ? (
              <div className="mt-2.5 p-3 rounded-xl bg-black/25 border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    {t('marketAverage')}
                  </span>
                  <span dir="ltr" className="font-mono text-xs font-black text-slate-200">
                    {money(receipt.marketFare)} {currencyCode}
                  </span>
                </div>
                {receipt.marketDeviationPercent < 0 ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      {t('competitivePrice')}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!breakdown || breakdown.tariffMissing ? (
              <p className={styles.reasonText}>{pricingReason}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
