'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

import { styles } from './rating/rating-modal-styles';
import { RatingModalProps } from './rating/rating-types';
import { useRatingModal } from './rating/use-rating-modal';
import { RatingCaptainSection } from './rating/rating-captain-section';
import { RatingVehicleSection } from './rating/rating-vehicle-section';
import { RatingBlockDriverSection } from './rating/rating-block-driver-section';

export function RatingModal(props: RatingModalProps) {
  const {
    isOpen,
    onClose,
    captainName,
    vehicleInfo,
  } = props;

  const tAuto = useTranslations('auto');
  const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const {
    isSubmitting,
    isBlocking,
    confirmBlock,
    setConfirmBlock,
    comment,
    setComment,
    saveFavorite,
    setSaveFavorite,
    isAlreadyFavorite,
    vehicle,
    captain,
    handleSetAdCompliance,
    handleSetCommunication,
    handleSetVehicleRating,
    handleSubmit,
    handleBlockDriver,
  } = useRatingModal(props);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={styles.style215_1}
        dir={isArabic ? 'rtl' : 'ltr'}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className={cn(styles.style218_2, isArabic ? styles.style218_3 : styles.style218_4)}>
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className={styles.style220_5}>{tAuto('ratingModal_title')}</DialogTitle>
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{tAuto('ratingModal_quickBadge')}</span>
              </span>
            </div>
            <DialogDescription className={styles.style221_6}>{tAuto('ratingModal_description')}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* 1. Captain Rating (3 criteria: Ad compliance, Politeness/Communication, Unique Favorite) */}
          <RatingCaptainSection
            captain={captain}
            onSetAdCompliance={handleSetAdCompliance}
            onSetCommunication={handleSetCommunication}
            saveFavorite={saveFavorite}
            onToggleFavorite={() => {
              if (isAlreadyFavorite) return;
              setSaveFavorite((prev) => !prev);
            }}
            isAlreadyFavorite={isAlreadyFavorite}
            captainName={captainName}
            tAuto={tAuto}
          />

          {/* 2. Vehicle Rating (3 criteria: Interior hospitality, Exterior appearance, Comfort & quietness) */}
          <RatingVehicleSection
            vehicle={vehicle}
            onSetVehicleRating={handleSetVehicleRating}
            vehicleInfo={vehicleInfo}
            tAuto={tAuto}
          />

          {/* 3. Optional Comment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{tAuto('ratingModal_commentLabel')}</Label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={tAuto('ratingModal_commentPlaceholder')}
              rows={2}
              className={styles.style280_23}
            />
          </div>
        </div>

        <div className={styles.style285_24}>
          {!confirmBlock ? (
            <>
              <Button
                className={styles.style288_25}
                disabled={isSubmitting || isBlocking}
                onClick={handleSubmit}
              >
                {isSubmitting ? tAuto('ratingModal_submitting') : tAuto('ratingModal_submit')}
              </Button>
              <Button
                variant="ghost"
                type="button"
                className="w-full text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs h-9 rounded-xl transition-all"
                disabled={isSubmitting || isBlocking}
                onClick={onClose}
              >
                {tAuto('ratingModal_skipButton')}
              </Button>
            </>
          ) : null}

          <RatingBlockDriverSection
            confirmBlock={confirmBlock}
            setConfirmBlock={setConfirmBlock}
            isSubmitting={isSubmitting}
            isBlocking={isBlocking}
            onBlockDriver={handleBlockDriver}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
