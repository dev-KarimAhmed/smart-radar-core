import React from 'react';
import { Heart, Trash2, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { styles, FavoriteCaptain } from './dashboard-shared';

interface SavedCaptainsSectionProps {
  uniqueFavoriteCaptains: FavoriteCaptain[];
  removeFavorite: (captain: FavoriteCaptain) => void;
}

export function SavedCaptainsSection({
  uniqueFavoriteCaptains,
  removeFavorite,
}: SavedCaptainsSectionProps) {
  const t = useTranslations('riderDashboard');

  return (
    <section className={styles.style482_42}>
      <h4 className={styles.style483_43}>
        <span>{t('recent.savedCaptains')}</span>
        <span className={styles.style485_44}>
          {uniqueFavoriteCaptains.length}
        </span>
      </h4>

      {uniqueFavoriteCaptains.length === 0 ? (
        <div className={styles.style491_45}>
          <Heart className={styles.style492_46} />
          <p className={styles.style493_47}>{t('recent.noFavorites')}</p>
        </div>
      ) : (
        <div className={styles.style496_48}>
          {uniqueFavoriteCaptains.map((captain) => (
            <div key={captain.id ?? captain.tripId} className={styles.style498_49}>
              <button
                onClick={() => removeFavorite(captain)}
                className={styles.style501_50}
                title={t('toast.removedFavorite')}
                type="button"
              >
                <Trash2 className={styles.style505_51} />
              </button>

              <div className={styles.style508_52}>
                <h5 className={styles.style509_53}>
                  {captain.captainName}{' '}
                  <span className={styles.style511_54}>[{captain.captainRank}]</span>
                </h5>
                <p className={styles.style513_55}>{captain.vehicleInfo}</p>
              </div>

              <div className={styles.style516_56}>
                <span className={styles.style517_57}>
                  {t('recent.savedPermanent')}
                </span>
                <a
                  href={`tel:${captain.captainPhone}`}
                  className={styles.style522_58}
                  style={{ textDecoration: 'none' }}
                >
                  <Phone className={styles.style525_59} />
                  <span>{t('recent.callNow')}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
