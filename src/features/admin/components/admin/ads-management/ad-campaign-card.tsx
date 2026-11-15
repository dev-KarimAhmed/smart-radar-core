'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  Users,
  Car,
  MapPin,
  Eye,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Trash2,
  Snowflake,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { cn } from '@/lib/utils';
import type { SovereignAd } from '@/core/types';
import { styles } from './ads-management-styles';

export interface AdCampaignCardProps {
  ad: SovereignAd;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string, isFrozen: boolean) => void;
  onExtend: (id: string, extraImpressions: number, extraDays: number) => void;
}

export function AdCampaignCard({ ad, onToggle, onDelete, onFreeze, onExtend }: AdCampaignCardProps) {
  const currentImpressions = ad.currentImpressions || 0;
  const targetImpressions = ad.targetImpressions || 1;
  const consumption = (currentImpressions / targetImpressions) * 100;
  const isExpired = ad.endDate ? new Date(ad.endDate) < new Date() : false;

  const statusLower = (ad.status || '').toLowerCase();
  const isFrozen = statusLower === 'frozen';
  const isActive = statusLower === 'active';
  const isPaused = statusLower === 'paused';
  const t = useTranslations('adminTab.adsManagement.card');

  return (
    <Card
      className={cn(
        styles.style255_27,
        (isPaused || isFrozen) && styles.style256_28,
        isExpired && styles.style257_29,
        isFrozen && styles.style258_30
      )}
    >
      <CardHeader className={styles.style260_31} dir="rtl">
        <div className={styles.style261_32}>
          <div className={styles.style262_33}>
            <CardTitle className={styles.style263_34}>{ad.content?.title || ad.title}</CardTitle>
            {ad.serial_id && <span className={styles.style265_35}>🧬 {ad.serial_id}</span>}
          </div>
          <Badge
            variant={isExpired ? 'destructive' : isFrozen ? 'secondary' : 'outline'}
            className={cn(
              isActive && !isExpired && styles.style271_36,
              isPaused && styles.style272_37,
              isFrozen && styles.style273_38
            )}
          >
            {isExpired
              ? t('status.expired')
              : isFrozen
              ? t('status.frozen')
              : isActive
              ? t('status.active')
              : t('status.paused')}
          </Badge>
        </div>
        <CardDescription className={styles.style279_39}>
          <span className={styles.style280_40}>
            {ad.role === 'all' ? (
              <Users className={styles.style281_41} />
            ) : ad.role === 'driver' ? (
              <Car className={styles.style281_42} />
            ) : (
              <Users className={styles.style281_43} />
            )}
            {ad.role === 'all' ? t('roles.all') : ad.role === 'driver' ? t('roles.driver') : t('roles.rider')}
          </span>
          <span className={styles.style284_44}>
            <MapPin className={styles.style285_45} />
            {ad.targetDistrict ? `${t('districtPrefix')}${ad.targetDistrict}` : ad.targetGovernorate || t('defaultGov')}
          </span>
        </CardDescription>
      </CardHeader>

      <div className={styles.style291_46}>
        <AdDisplayCard
          ad={ad}
          showHeart={false}
          badgeText={t('defaultBadgeText')}
          ctaText={(ad as any).action?.buttonText || (ad as any).buttonText || t('defaultCtaText')}
          className={styles.style297_47}
        />
      </div>

      <CardContent className={styles.style301_48} dir="rtl">
        <div>
          <Label className={styles.style303_49}>{t('consumptionLabel')}</Label>
          <div className={styles.style304_50}>
            <Progress
              value={consumption}
              className={styles.style305_51}
              indicatorClassName={consumption > 85 ? 'bg-destructive' : 'bg-emerald-500'}
            />
            <span className={styles.style306_52}>{consumption.toFixed(0)}%</span>
          </div>
        </div>

        <div className={styles.style310_53}>
          <div className={styles.style311_54}>
            <p className={styles.style312_55}>
              <Eye className={styles.style312_56} /> {t('impressionsLabel')}{' '}
            </p>
            <p className={styles.style313_57}>
              {(ad.currentImpressions || 0).toLocaleString()} / {(ad.targetImpressions || 0).toLocaleString()}
            </p>
          </div>
          <div className={styles.style315_58}>
            <p className={styles.style316_59}>
              <MousePointerClick className={styles.style316_60} /> {t('clicksLabel')}
            </p>
            <p className={styles.style317_61}>{(ad.clicksCount || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.style322_62}>
          <div className={styles.style323_63}>
            <span>{t('whatsappLabel')}</span>
            <span className={styles.style325_64}>{ad.whatsapp || 'N/A'}</span>
          </div>
          <div className={styles.style327_65}>
            <span>{t('phoneLabel')}</span>
            <span className={styles.style329_66}>{ad.phone || 'N/A'}</span>
          </div>
        </div>

        <div className={styles.style333_67}>
          {t('expireLabel')} {ad.endDate ? format(new Date(ad.endDate), 'dd/MM/yyyy') : 'N/A'}
        </div>
      </CardContent>

      <CardFooter className={styles.style339_68} dir="rtl">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(ad.id, ad.status)}
          disabled={isFrozen}
          className={styles.style347_69}
        >
          {isActive ? <PauseCircle className={styles.style349_70} /> : <PlayCircle className={styles.style349_71} />}
          {isActive ? t('buttons.pause') : t('buttons.resume')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onFreeze(ad.id, isFrozen)}
          className={cn(styles.style358_72, isFrozen && styles.style358_73)}
        >
          <Snowflake className={styles.style360_74} />
          {isFrozen ? t('buttons.unfreeze') : t('buttons.freeze')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onExtend(ad.id, 5000, 30)}
          className={styles.style369_75}
        >
          <Clock className={styles.style371_76} />
          {t('buttons.extend')}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className={styles.style378_77}>
              <Trash2 className={styles.style379_78} />
              {t('buttons.archive')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className={styles.style383_79} dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className={styles.style385_80}>{t('archiveDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription className={styles.style386_81}>{t('archiveDialog.desc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={styles.style390_82}>
              <AlertDialogCancel className={styles.style391_83}>{t('archiveDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(ad.id)} className={styles.style392_84}>
                {t('archiveDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
