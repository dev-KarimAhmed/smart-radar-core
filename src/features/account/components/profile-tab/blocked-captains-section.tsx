import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { styles } from './profile-shared';

interface BlockedCaptainsSectionProps {
  isArabic: boolean;
  t: any;
  isLoadingBlocks: boolean;
  blockedCaptains: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    serialId: string;
  }[];
  confirmingUnblockId: string | null;
  setConfirmingUnblockId: (id: string | null) => void;
  handleUnblockCaptain: (id: string) => void;
}

export function BlockedCaptainsSection({
  isArabic,
  t,
  isLoadingBlocks,
  blockedCaptains,
  confirmingUnblockId,
  setConfirmingUnblockId,
  handleUnblockCaptain,
}: BlockedCaptainsSectionProps) {
  return (
    <Card className={styles.style779_80}>
      <CardHeader className={styles.style780_81}>
        <CardTitle className={styles.style781_82}>
          <ShieldCheck className={styles.style782_83} />
          {t('blockedCaptains')}
        </CardTitle>
        <CardDescription className={styles.style785_84}>
          {t('blockedCaptainsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingBlocks ? (
          <div className={styles.style793_85}>
            <Loader2 className={styles.style794_86} />
            {t('loadingBlockedList')}
          </div>
        ) : blockedCaptains.length === 0 ? (
          <p className={styles.style798_87}>
            {t('noBlockedCaptains')}
          </p>
        ) : (
          <div className={styles.style802_88}>
            {blockedCaptains.map((captain) => (
              <div
                key={captain.id}
                className={styles.style806_89}
              >
                <div className={styles.style808_90}>
                  <div>
                    <strong className={styles.style810_91}>{captain.name}</strong>
                    {captain.serialId && (
                      <span className={styles.style812_92}>
                        {t('accountNumber')}: {captain.serialId}
                      </span>
                    )}
                  </div>
                  {confirmingUnblockId === captain.id ? (
                    <div className={styles.style818_93}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleUnblockCaptain(captain.id);
                          setConfirmingUnblockId(null);
                        }}
                        className={styles.style826_94}
                      >
                        {t('confirm')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmingUnblockId(null)}
                        className={styles.style834_95}
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingUnblockId(captain.id)}
                      className={styles.style844_96}
                    >
                      {t('unblock')}
                    </Button>
                  )}
                </div>

                <div className={styles.style851_97}>
                  <div>
                    <span>{t('rating')}: </span>
                    <span className={styles.style854_98}>★ {captain.rating.toFixed(1)}</span>
                  </div>
                  <div>
                    <span>{t('phone')}: </span>
                    <span className={styles.style858_99}>{captain.phone || t('phoneUnavailable')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
