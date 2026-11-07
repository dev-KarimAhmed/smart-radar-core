'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { styles } from '../../admin-view-styles';

export function PendingAdReviewCard({
  ad,
  onApprove,
  onReject,
}: {
  ad: any;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const { isArabic } = useDashboardLanguage();
  const tAuto = useTranslations('auto');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(ad.id);
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(ad.id, reason);
      setRejecting(false);
      setReason('');
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = ad.content?.title || ad.title || (isArabic ? 'إعلان بدون عنوان' : 'Untitled Ad');
  const description =
    ad.content?.description || ad.description || (isArabic ? 'لا يوجد وصف متاح' : 'No description available');
  const posterUrl = ad.content?.posterUrl || ad.posterUrl || '';

  return (
    <Card className={styles.style59_1} dir={isArabic ? 'rtl' : 'ltr'}>
      {posterUrl && (
        <div className={styles.style61_2}>
          <img src={posterUrl} alt={title} className={styles.style62_3} referrerPolicy="no-referrer" />
          <Badge className={styles.style63_4}>{tAuto('key_ae999e08')}</Badge>
        </div>
      )}

      <CardHeader className={styles.style69_5}>
        <div className={styles.style70_6}>
          {!posterUrl && <Badge className={styles.style72_7}>{tAuto('key_ae999e08')}</Badge>}
          <CardTitle className={styles.style76_8}>{title}</CardTitle>
        </div>
        <CardDescription className={styles.style78_9}>{description}</CardDescription>
      </CardHeader>

      <CardContent className={styles.style83_10}>
        <div className={styles.style84_11}>
          <div className={styles.style85_12}>
            <span className={styles.style86_13}>{tAuto('key_388a477e')}</span>
            <span className={styles.style87_14}>
              📍 {ad.targetGovernorate || tAuto('key_b758add8')} {ad.targetDistrict ? `- ${ad.targetDistrict}` : ''}
            </span>
          </div>
          <div className={styles.style89_15}>
            <span className={styles.style90_16}>{tAuto('key_f034a882')}</span>
            <span className={styles.style91_17}>⚡ {(ad.targetImpressions || 10000).toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.style95_18}>
          <div className={styles.style96_19}>
            <span className={styles.style97_20}>{tAuto('key_da79fbe3')}</span>
            <span className={ad.isPremiumRetentionPaid ? styles.style98_21 : styles.style98_22}>
              {ad.isPremiumRetentionPaid ? tAuto('key_e2372c21') : tAuto('key_188155dd')}
            </span>
          </div>
          <div className={styles.style102_23}>
            <span className={styles.style103_24}>{tAuto('key_7d644c75')}</span>
            <span className={styles.style104_25}>
              {ad.role === 'all'
                ? tAuto('key_91559fa2')
                : ad.role === 'driver'
                ? tAuto('key_89c5c89e')
                : tAuto('key_da83fc08')}
            </span>
          </div>
          <div className={styles.style108_26}>
            <span className={styles.style109_27}>{tAuto('key_3af3abc0')}</span>
            <span className={styles.style110_28}>{ad.whatsapp || ad.phone || 'N/A'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className={styles.style115_29}>
        {!rejecting ? (
          <div className={styles.style117_30}>
            <Button onClick={handleApprove} disabled={isSubmitting} className={styles.style121_31}>
              {isSubmitting ? <Loader2 className={styles.style123_32} /> : <CheckCircle2 className={styles.style123_33} />}
              {tAuto('key_e82205b7')}
            </Button>
            <Button
              onClick={() => setRejecting(true)}
              variant="destructive"
              disabled={isSubmitting}
              className={styles.style130_34}
            >
              <ShieldAlert className={styles.style132_35} />
              {tAuto('key_848ae5bb')}
            </Button>
          </div>
        ) : (
          <div className={styles.style137_36}>
            <Label className={styles.style138_37}>{tAuto('key_80e1f450')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tAuto('key_e6cd6320')}
              className={styles.style143_38}
              dir="rtl"
            />
            <div className={styles.style146_39}>
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !reason.trim()}
                className={styles.style150_40}
              >
                {isSubmitting ? <Loader2 className={styles.style152_41} /> : null}
                {tAuto('key_d213271c')}
              </Button>
              <Button
                onClick={() => {
                  setRejecting(false);
                  setReason('');
                }}
                variant="outline"
                className={styles.style158_42}
              >
                {tAuto('key_32d990bf')}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
