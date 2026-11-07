'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { styles } from './tariff-modal-styles';

interface PricingModeNoticeCardsProps {
  setupMode: 'FREE' | 'APP' | 'TAXI';
  isArabic: boolean;
}

export function PricingModeNoticeCards({ setupMode, isArabic }: PricingModeNoticeCardsProps) {
  if (setupMode === 'APP') {
    return (
      <div className={styles.appNoticeCard}>
        <div className={styles.appNoticeTitle}>
          <Sparkles className="h-5 w-5 text-blue-400" />
          <span>{isArabic ? 'نظام التطبيقات الذكية المعتمد' : 'Official Smart App Rates'}</span>
        </div>
        <p className={styles.appNoticeBody}>
          {isArabic
            ? 'سيتم اعتماد التسعيرة الرسمية المعتمدة للتطبيقات الذكية: 0.50 دينار فتح عداد، 0.40 دينار لكل كم، و0.05 دينار لكل دقيقة.'
            : 'Official rates: 0.50 JOD base, 0.40 JOD/km, 0.05 JOD/min.'}
        </p>
      </div>
    );
  }

  if (setupMode === 'TAXI') {
    return (
      <div className={styles.taxiNoticeCard}>
        <div className={styles.taxiNoticeTitle}>
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span>{isArabic ? 'نظام التكسي العمومي (العداد الرسمي)' : 'Official Yellow Taxi Meter'}</span>
        </div>
        <p className={styles.taxiNoticeBody}>
          {isArabic
            ? 'سيتم اعتماد تسعيرة العداد المعتمدة للتكسي العمومي: 0.35 دينار فتح عداد، 0.25 دينار لكل كم، و0.03 دينار لكل دقيقة.'
            : 'Official taxi meter rates: 0.35 JOD base, 0.25 JOD/km, 0.03 JOD/min.'}
        </p>
      </div>
    );
  }

  return null;
}
