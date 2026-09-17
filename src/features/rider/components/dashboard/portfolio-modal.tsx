import React from 'react';
import { Briefcase, X, Heart, Trash2, Phone, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { styles, FavoriteCaptain, formatDashboardMoney, buildWhatsappUrl } from './dashboard-shared';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface PortfolioModalProps {
  isPortfolioOpen: boolean;
  setIsPortfolioOpen: (open: boolean) => void;
  uniqueFavoriteCaptains: FavoriteCaptain[];
  currencyLabel: string;
  updateCaptainType: (favId: number, type: FavoriteCaptain['captainType'], getLabel: (t: any) => string) => void;
  deleteFavoriteCard: (captain: FavoriteCaptain) => void;
}

export function PortfolioModal({
  isPortfolioOpen,
  setIsPortfolioOpen,
  uniqueFavoriteCaptains,
  currencyLabel,
  updateCaptainType,
  deleteFavoriteCard,
}: PortfolioModalProps) {
  const t = useTranslations('riderDashboard');
  const { isArabic } = useDashboardLanguage();

  const captainTypeLabel = (type: FavoriteCaptain['captainType']) => {
    if (type === 'uber') return t('recent.uber');
    if (type === 'careem') return t('recent.careem');
    return t('recent.independent');
  };

  if (!isPortfolioOpen) return null;

  return (
    <div className={cn(styles.style554_66, isArabic ? styles.style554_67 : styles.style554_68)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.style555_69}>
        <div className={styles.style556_70}>
          <Briefcase className={styles.style557_71} />
          <h3 className={styles.style558_72}>{t('recent.portfolioTitle')}</h3>
        </div>
        <button
          onClick={() => setIsPortfolioOpen(false)}
          className={styles.style562_73}
          type="button"
        >
          <X className={styles.style565_74} />
        </button>
      </div>

      <div className={styles.style569_75}>
        <p className={styles.style570_76}>
          {t('recent.portfolioDescription')}
        </p>

        {uniqueFavoriteCaptains.length === 0 ? (
          <div className={styles.style575_77}>
            <Heart className={styles.style576_78} />
            <h5 className={styles.style577_79}>{t('recent.portfolioEmpty')}</h5>
            <p className={styles.style578_80}>{t('recent.portfolioEmptyDescription')}</p>
          </div>
        ) : (
          <div className={styles.style581_81}>
            {uniqueFavoriteCaptains.map((captain) => {
              const savedType = captain.captainType || 'independent';
              const whatsappUrl = buildWhatsappUrl(captain.captainPhone, captain.captainName, isArabic);

              return (
                <article
                  key={captain.id ?? captain.tripId}
                  className={cn(styles.style589_82, isArabic ? styles.style589_83 : styles.style589_84)}
                >
                  <button
                    onClick={() => deleteFavoriteCard(captain)}
                    className={styles.style593_85}
                    title={t('toast.cardDeleted')}
                    type="button"
                  >
                    <Trash2 className={styles.style597_86} />
                  </button>

                  <div className={styles.style600_87}>
                    <div className={styles.style601_88}>
                      <h4 className={styles.style602_89}>{captain.captainName}</h4>
                      <span className={styles.style603_90}>
                        [{captain.captainRank}]
                      </span>
                    </div>
                    <p className={styles.style607_91}>{captain.vehicleInfo}</p>
                    <p className={styles.style608_92}>
                      {t('recent.lastPrice')}: {formatDashboardMoney(captain.finalPrice || 3, currencyLabel)}
                    </p>
                  </div>

                  <div className={styles.style613_93}>
                    <span className={styles.style614_94}>{t('recent.category')}</span>
                    <div className={styles.style615_95}>
                      {(['uber', 'careem', 'independent'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => captain.id && updateCaptainType(captain.id, type, captainTypeLabel)}
                          className={cn(styles.style620_96, savedType === type
                              ? type === 'uber'
                                ? styles.style623_97
                                : type === 'careem'
                                  ? styles.style625_98
                                  : styles.style626_99
                              : styles.style627_100)}
                          type="button"
                        >
                          {captainTypeLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.style637_101}>
                    <a
                      href={`tel:${captain.captainPhone}`}
                      className={styles.style640_102}
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className={styles.style643_103} />
                      <span>{t('recent.callNow')}</span>
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.style650_104}
                      style={{ textDecoration: 'none' }}
                    >
                      <MessageCircle className={styles.style653_105} />
                      <span>{t('recent.whatsapp')}</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.style664_106}>
        <Button
          onClick={() => setIsPortfolioOpen(false)}
          className={styles.style667_107}
        >
          {t('recent.close')}
        </Button>
      </div>
    </div>
  );
}
