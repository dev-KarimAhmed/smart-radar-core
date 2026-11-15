import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { styles } from './driver-rating-modal.styles';

interface DriverRatingBlockProps {
  confirmBlock: boolean;
  onSetConfirmBlock: (value: boolean) => void;
  isSubmitting: boolean;
  isBlocking: boolean;
  onBlockRider: () => Promise<void>;
  copy: {
    blockRider: string;
    blockConfirm: string;
    confirmBlock: string;
    blocking: string;
    back: string;
  };
}

export function DriverRatingBlock({
  confirmBlock,
  onSetConfirmBlock,
  isSubmitting,
  isBlocking,
  onBlockRider,
  copy,
}: DriverRatingBlockProps) {
  if (!confirmBlock) {
    return (
      <button
        type="button"
        disabled={isSubmitting || isBlocking}
        onClick={() => onSetConfirmBlock(true)}
        className={styles.blockButton}
      >
        <AlertOctagon className={styles.blockIcon} />
        {copy.blockRider}
      </button>
    );
  }

  return (
    <div className={styles.blockConfirmWrap}>
      <p className={styles.blockConfirmText}>{copy.blockConfirm}</p>
      <div className={styles.blockConfirmActions}>
        <Button
          variant="destructive"
          className={styles.blockConfirmButton}
          disabled={isBlocking}
          onClick={onBlockRider}
        >
          {isBlocking ? copy.blocking : copy.confirmBlock}
        </Button>
        <Button
          variant="outline"
          className={styles.blockCancelButton}
          disabled={isBlocking}
          onClick={() => onSetConfirmBlock(false)}
        >
          {copy.back}
        </Button>
      </div>
    </div>
  );
}

