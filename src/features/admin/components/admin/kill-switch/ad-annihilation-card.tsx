'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Flame, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SovereignAd } from '@/core/types';
import { styles } from './kill-switch-styles';

interface AdAnnihilationCardProps {
  activeAds: SovereignAd[];
  selectedAdId: string;
  setSelectedAdId: (v: string) => void;
  annihilationReason: string;
  setAnnihilationReason: (v: string) => void;
  isAnnihilating: boolean;
  onAnnihilateAd: () => void;
}

export function AdAnnihilationCard({
  activeAds,
  selectedAdId,
  setSelectedAdId,
  annihilationReason,
  setAnnihilationReason,
  isAnnihilating,
  onAnnihilateAd,
}: AdAnnihilationCardProps) {
  const t = useTranslations('adminTab.killSwitch');

  return (
    <Card className={styles.style276_47}>
      <CardHeader className={styles.style277_48}>
        <CardTitle className={styles.style278_49}>
          <Flame className={styles.style279_50} />
          {t('annihilation.title')}
        </CardTitle>
        <CardDescription className={styles.style282_51}>{t('annihilation.description')}</CardDescription>
      </CardHeader>
      <CardContent className={styles.style286_52}>
        {/* Select Active Ads dropdown */}
        <div className={styles.style288_53}>
          <Label className={styles.style289_54}>{t('annihilation.selectTarget')}</Label>
          <Select value={selectedAdId} onValueChange={setSelectedAdId}>
            <SelectTrigger className={styles.style293_55}>
              <SelectValue placeholder={t('annihilation.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent className={styles.customSelectContent}>
              {activeAds.map((ad) => (
                <SelectItem key={ad.id} value={ad.id} className={styles.customSelectItem}>
                  {ad.content?.title || ad.title} (ID: {ad.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Annihilation Reason justification prompt */}
        <div className={styles.style306_56}>
          <Label className={styles.style307_57}>{t('annihilation.reasonLabel')}</Label>
          <Input
            value={annihilationReason}
            onChange={(e) => setAnnihilationReason(e.target.value)}
            placeholder={t('annihilation.reasonPlaceholder')}
            className={styles.style312_58}
          />
        </div>

        {/* Execution CTA button */}
        <Button
          onClick={onAnnihilateAd}
          disabled={isAnnihilating || !selectedAdId}
          className={cn(styles.style321_59, !selectedAdId ? styles.style323_60 : styles.style324_61)}
        >
          {isAnnihilating ? (
            <Loader2 className={styles.style328_62} />
          ) : (
            <>
              <EyeOff className={styles.style331_63} />
              {t('annihilation.executeBtn')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
