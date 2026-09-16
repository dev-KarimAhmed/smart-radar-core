import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './request-modal-shared';

interface ModalFooterProps {
  isRadarActive: boolean | null | undefined;
  requestRide: () => void;
  isRequesting: boolean;
  isLocationConfirmed: boolean;
  dropoff: string;
}

export function ModalFooter({
  isRadarActive,
  requestRide,
  isRequesting,
  isLocationConfirmed,
  dropoff,
}: ModalFooterProps) {
  const t = useTranslations('requestRide');

  return (
    <DialogFooter className={styles.style293_86}>
      {isRadarActive === false ? (
        <div className={styles.style295_87}>
          <span className={styles.style296_88}>{t('suspended')}</span>
        </div>
      ) : (
        <Button
          onClick={requestRide}
          disabled={isRequesting || !isLocationConfirmed || !dropoff}
          className={cn(
            styles.style305_89,
            isLocationConfirmed && dropoff ? styles.style307_90 : styles.style308_91
          )}
        >
          {isRequesting ? (
            <div className={styles.style312_92}>
              <Loader2 className={styles.style313_93} />
              <span>{t('sending')}</span>
            </div>
          ) : (
            t('sendRequest')
          )}
        </Button>
      )}
    </DialogFooter>
  );
}
