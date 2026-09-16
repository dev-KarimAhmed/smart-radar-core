import React from 'react';
import { Car, Building2, Trophy, Phone, ExternalLink, Facebook, Instagram } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import { CaptainOffer, styles, SectionHeader, InfoRow } from './offer-card-shared';

export function OfferCardCaptain({
  offer,
  isOpen,
  onToggle,
}: {
  offer: CaptainOffer;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const language = locale === 'ar' ? 'ar' : 'en';

  const captain = offer.captain;
  const vehicleModelLabel = captain.vehicle_model?.trim() || t('vehicle');
  const vehicleColorLabel = resolveColorDisplayName(captain.vehicle_color, language) || t('notSpecified');
  const companyLabel = captain.company_name?.trim() || captain.affiliation_label?.trim() || t('independentCaptain');
  
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);
  const hasContactLinks = Boolean(captain.phone || captain.contact_url || captain.facebook_url || captain.instagram_url);
  const hasVehicleYear = Boolean(captain.vehicle_year);
  const hasVehicleCategory = Boolean(captain.vehicle_category);
  const vehicleDetailFieldCount = 1 + Number(hasVehicleYear) + Number(hasVehicleCategory);
  const lastVehicleDetailField = hasVehicleCategory ? 'category' : hasVehicleYear ? 'year' : 'plate';
  const vehicleDetailTrailingSpansFull = vehicleDetailFieldCount % 2 !== 0;

  return (
    <div className={styles.sectionWrap}>
      <SectionHeader
        icon={<Car className={styles.sectionHeaderIcon} />}
        title={t('captainAndVehicle')}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen ? (
        <div className={styles.collapsibleSectionBody}>
          <div className={styles.sectionCard}>
            <div className={styles.vehicleGrid}>
              <InfoRow icon={<Car className={styles.vehicleRowIcon} />} label={t('vehicle')} value={vehicleModelLabel} />
              <InfoRow label={t('color')} value={vehicleColorLabel} />
            </div>
            <div className={styles.vehicleDetailGrid}>
              <InfoRow
                label={t('plate')}
                value={captain.plate_number?.trim() || t('notAvailable')}
                fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'plate'}
              />
              {hasVehicleYear ? (
                <InfoRow
                  label={t('year')}
                  value={String(captain.vehicle_year)}
                  fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'year'}
                />
              ) : null}
              {hasVehicleCategory ? (
                <InfoRow
                  label={t('category')}
                  value={captain.vehicle_category}
                  fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'category'}
                />
              ) : null}
            </div>

            <div className={styles.captainMetaGrid}>
              <InfoRow icon={<Building2 className={styles.captainMetaIcon} />} label={t('captainType')} value={companyLabel} />
              <InfoRow icon={<Trophy className={styles.captainMetaIcon} />} label={t('completedTrips')} value={String(completedTrips)} />
            </div>

            {hasContactLinks ? (
              <div className={styles.contactGrid}>
                {captain.phone ? (
                  <a href={`tel:${captain.phone}`} className={styles.contactButtonAccent}>
                    <Phone className={styles.contactButtonIcon} />
                    {t('call')}
                  </a>
                ) : null}
                {captain.contact_url ? (
                  <a href={captain.contact_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                    <ExternalLink className={styles.contactButtonIcon} />
                    {t('contactLink')}
                  </a>
                ) : null}
                {captain.facebook_url ? (
                  <a href={captain.facebook_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                    <Facebook className={styles.contactButtonIcon} />
                    {t('facebook')}
                  </a>
                ) : null}
                {captain.instagram_url ? (
                  <a href={captain.instagram_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                    <Instagram className={styles.contactButtonIcon} />
                    {t('instagram')}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
