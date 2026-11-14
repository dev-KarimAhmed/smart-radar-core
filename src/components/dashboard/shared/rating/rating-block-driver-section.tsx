import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { styles } from './rating-modal-styles';

interface RatingBlockDriverSectionProps {
  confirmBlock: boolean;
  setConfirmBlock: (val: boolean) => void;
  isSubmitting: boolean;
  isBlocking: boolean;
  onBlockDriver: () => void;
}

export function RatingBlockDriverSection({
  confirmBlock,
  setConfirmBlock,
  isSubmitting,
  isBlocking,
  onBlockDriver,
}: RatingBlockDriverSectionProps) {
  const tAuto = useTranslations('auto');

  if (!confirmBlock) {
    return (
      <button
        type="button"
        disabled={isSubmitting || isBlocking}
        onClick={() => setConfirmBlock(true)}
        className={styles.style301_26}
      >
        <AlertOctagon className={styles.style303_27} />
        {tAuto('ratingModal_blockDriver')}
      </button>
    );
  }

  return (
    <div className={styles.style307_28}>
      <p className={styles.style308_29}>{tAuto('ratingModal_blockConfirm')}</p>
      <div className={styles.style309_30}>
        <Button
          variant="destructive"
          className={styles.style312_31}
          disabled={isBlocking}
          onClick={onBlockDriver}
        >
          {isBlocking ? tAuto('ratingModal_blocking') : tAuto('ratingModal_confirmBlock')}
        </Button>
        <Button
          variant="outline"
          className={styles.style320_32}
          disabled={isBlocking}
          onClick={() => setConfirmBlock(false)}
        >
          {tAuto('ratingModal_back')}
        </Button>
      </div>
    </div>
  );
}
