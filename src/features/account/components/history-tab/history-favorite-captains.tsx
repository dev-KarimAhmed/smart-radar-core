import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Trash2 } from 'lucide-react';
import { styles } from './history-shared';
import { useTranslations } from "next-intl";

interface HistoryFavoriteCaptainsProps {
  favoriteCaptains: any[];
  toggleFavorite: (captain: any) => void;
  isArabic: boolean;
  t: any;
}

export function HistoryFavoriteCaptains({
  favoriteCaptains,
  toggleFavorite,
  isArabic,
  t
}: HistoryFavoriteCaptainsProps) {
  const tAuto = useTranslations('auto');
  return (
    <Card className={styles.style1092_91}>
      <CardHeader className={styles.style1093_92}>
        <div>
          <CardTitle className={styles.style1095_93}>
            <Sparkles className={styles.style1096_94} />
            {t('savedCaptainsTitle')}
          </CardTitle>
          <CardDescription className={styles.style1099_95}>
            {t('savedCaptainsDesc')}
          </CardDescription>
        </div>
        <Badge className={styles.style1103_96}>
          {favoriteCaptains.length} {isArabic ? tAuto('key_603ab93b') : 'drivers'}
        </Badge>
      </CardHeader>
      <CardContent className={styles.style1107_97}>
        {favoriteCaptains.length === 0 ? (
          <div className={styles.style1109_98}>
            {isArabic ? (
              <>{tAuto('key_258a9b0d')} <strong className={styles.style1111_99}>{tAuto('key_31002ea0')}</strong> {tAuto('key_e8de888f')}</>
            ) : (
              <>Click the <strong className={styles.style1113_100}>heart</strong> icon on any completed trip to add the driver to your favorites.</>
            )}
          </div>
        ) : (
          <div className={styles.style1117_101}>
            {favoriteCaptains.map((captain) => (
              <div key={captain.id} className={styles.style1121_102}>
                <div className={styles.style1123_103}>
                  <h5 className={styles.style1124_104}>
                    👤 {captain.captainName}
                    <span className={styles.style1126_105}>[{captain.captainRank || 'GOLD'}]</span>
                  </h5>
                  <p className={styles.style1128_106}>{captain.vehicleInfo}</p>
                </div>

                <div className={styles.style1131_107}>
                  <a
                    href={`tel:${captain.captainPhone}`}
                    className={styles.style1134_108}
                    style={{ textDecoration: 'none' }}
                  >
                    <Phone className={styles.style1137_109} /> {t('call')}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(captain)}
                    className={styles.style1143_110}
                  >
                    <Trash2 className={styles.style1145_111} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
