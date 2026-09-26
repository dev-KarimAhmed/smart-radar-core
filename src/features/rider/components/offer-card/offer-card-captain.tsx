import React from 'react';
import { Car, Building2, Trophy, ExternalLink, Facebook, Instagram, Link2, MessageCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import { CaptainOffer, styles, SectionHeader, InfoRow } from './offer-card-shared';

function formatExternalLink(url: string) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function OfferCardCaptain({
  offer,
}: {
  offer: CaptainOffer;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const language = isArabic ? 'ar' : 'en';

  const captain = offer.captain;
  const vehicleModelLabel = captain.vehicle_model?.trim() || t('vehicle');
  const vehicleColorLabel = resolveColorDisplayName(captain.vehicle_color, language) || t('notSpecified');
  const companyLabel = captain.company_name?.trim() || captain.affiliation_label?.trim() || t('independentCaptain');
  
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);

  const facebookUrl = captain.facebook_url || (offer as any).facebook_url || (offer as any).captain_facebook_url;
  const instagramUrl = captain.instagram_url || (offer as any).instagram_url || (offer as any).captain_instagram_url;
  const contactUrl = captain.contact_url || (offer as any).contact_url;
  const whatsappUrl = captain.whatsapp_url || (offer as any).whatsapp_url || (offer as any).captain_whatsapp_url;

  const hasContactLinks = Boolean(facebookUrl || instagramUrl || contactUrl || whatsappUrl);
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
      />
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

          {/* روابط الكابتن: تظهر إذا كانت موجودة ومرفوعة من الكابتن */}
          {hasContactLinks ? (
            <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-3">
              <span className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-[#94A3B8]">
                <Link2 className="h-3.5 w-3.5 text-[#14F5D5]" />
                <span>{isArabic ? 'روابط الكابتن' : 'Captain Links'}</span>
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {facebookUrl ? (
                  <a
                    href={formatExternalLink(facebookUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 text-xs font-black text-blue-300 transition hover:border-blue-500/45 hover:bg-blue-500/20"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>{isArabic ? 'فيسبوك' : 'Facebook'}</span>
                  </a>
                ) : null}
                {instagramUrl ? (
                  <a
                    href={formatExternalLink(instagramUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-pink-500/25 bg-pink-500/10 px-3 text-xs font-black text-pink-300 transition hover:border-pink-500/45 hover:bg-pink-500/20"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>{isArabic ? 'إنستغرام' : 'Instagram'}</span>
                  </a>
                ) : null}
                {whatsappUrl ? (
                  <a
                    href={formatExternalLink(whatsappUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-black text-emerald-300 transition hover:border-emerald-500/45 hover:bg-emerald-500/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                  </a>
                ) : null}
                {contactUrl ? (
                  <a
                    href={formatExternalLink(contactUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 text-xs font-black text-[#14F5D5] transition hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{isArabic ? 'رابط التواصل' : 'Contact Link'}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
