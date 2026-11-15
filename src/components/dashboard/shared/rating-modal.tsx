'use client';

import React from 'react';
import { Heart } from 'lucide-react';
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
import { RatingCriteriaSection } from './rating/rating-criteria-section';
import { RatingBlockDriverSection } from './rating/rating-block-driver-section';

export function RatingModal(props: RatingModalProps) {
  const {
    isOpen,
    onClose,
    captainName,
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
    handleSetVehicle,
    handleSetCaptain,
    handleSubmit,
    handleBlockDriver,
  } = useRatingModal(props);

  const vehicleCriteria = [
    { key: 'cleanliness' as const, label: tAuto('ratingModal_vehicleCleanliness') },
    { key: 'ac' as const, label: tAuto('ratingModal_vehicleAc') },
    { key: 'comfort' as const, label: tAuto('ratingModal_vehicleComfort') },
    { key: 'quietness' as const, label: tAuto('ratingModal_vehicleQuietness') },
    { key: 'safety' as const, label: tAuto('ratingModal_vehicleSafety') },
  ];

  const captainCriteria = [
    { key: 'behavior' as const, label: tAuto('ratingModal_captainBehavior') },
    { key: 'driving' as const, label: tAuto('ratingModal_captainDriving') },
    { key: 'punctuality' as const, label: tAuto('ratingModal_captainPunctuality') },
    { key: 'routing' as const, label: tAuto('ratingModal_captainRouting') },
    { key: 'communication' as const, label: tAuto('ratingModal_captainCommunication') },
  ];

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
            <DialogTitle className={styles.style220_5}>{tAuto('ratingModal_title')}</DialogTitle>
            <DialogDescription className={styles.style221_6}>{tAuto('ratingModal_description')}</DialogDescription>
          </div>
        </DialogHeader>

        <div className={styles.style228_9}>
          <RatingCriteriaSection
            title={tAuto('ratingModal_vehicleSection')}
            hint={tAuto('ratingModal_criteriaHint')}
            items={vehicleCriteria}
            values={vehicle}
            accent="amber"
            onSelect={handleSetVehicle}
          />
          <RatingCriteriaSection
            title={tAuto('ratingModal_captainSection')}
            hint={tAuto('ratingModal_criteriaHint')}
            items={captainCriteria}
            values={captain}
            accent="teal"
            onSelect={handleSetCaptain}
          />

          <button
            type="button"
            onClick={() => {
              if (isAlreadyFavorite) return;
              setSaveFavorite((value) => !value);
            }}
            className={cn(
              styles.style247_10,
              saveFavorite || isAlreadyFavorite ? styles.style249_11 : styles.style250_12,
              isAlreadyFavorite && 'border-amber-500/40 bg-amber-500/10 cursor-default'
            )}
            aria-pressed={saveFavorite || isAlreadyFavorite}
            disabled={isAlreadyFavorite}
          >
            <div className={styles.style254_13}>
              <span className={cn(styles.style255_14, isAlreadyFavorite && 'text-amber-300 font-black')}>
                {isAlreadyFavorite
                  ? tAuto('ratingModal_favoriteAlreadySaved')
                  : saveFavorite
                    ? tAuto('ratingModal_favoriteWillSave')
                    : tAuto('ratingModal_favoriteSave')}
              </span>
              <span className={styles.style258_15}>
                {isAlreadyFavorite
                  ? tAuto('ratingModal_favoriteAlreadySavedDesc')
                  : captainName
                    ? tAuto('ratingModal_favoriteDescription', { name: captainName })
                    : tAuto('ratingModal_favoriteFallbackDescription')}
              </span>
            </div>
            <span
              className={cn(
                styles.style263_16,
                saveFavorite || isAlreadyFavorite ? styles.style265_17 : styles.style266_18,
                isAlreadyFavorite && 'border-amber-400/50 bg-amber-500/20 text-amber-300'
              )}
            >
              <Heart
                className={cn(
                  styles.style269_19,
                  saveFavorite || isAlreadyFavorite ? styles.style269_20 : '',
                  isAlreadyFavorite && 'fill-amber-400 text-amber-400'
                )}
              />
            </span>
          </button>

          <div className={styles.style273_21}>
            <Label className={styles.style274_22}>{tAuto('ratingModal_commentLabel')}</Label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={tAuto('ratingModal_commentPlaceholder')}
              rows={3}
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
                {isArabic ? 'تخطي التقييم الآن' : 'Skip for now'}
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
