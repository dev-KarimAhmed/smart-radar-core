'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { generateWeeklyReport } from '../../services/captain-rank';

export function useDriverReports() {
  const { toast } = useToast();
  const t = useTranslations('transactions');
  const [isRequestingReport, setIsRequestingReport] = useState(false);

  const requestWeeklyReport = useCallback(async () => {
    setIsRequestingReport(true);
    try {
      const report = await generateWeeklyReport();

      if (!report.success) {
        toast({
          title: t(`rank${report.rank}`) ?? report.rank,
          description: report.message,
        });
        return;
      }

      const { averageRating, heartCount, newRank } = report.stats;
      toast({
        title: t('rankLabel', { rank: t(`rank${newRank}`) ?? newRank }),
        description: t('rankStats', { rating: Number(averageRating).toFixed(2), hearts: heartCount }),
      });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] weekly report failed:', error);
      toast({
        variant: 'destructive',
        title: t('reportFailedTitle'),
        description: error?.message || t('reportFailedDesc'),
      });
    } finally {
      setIsRequestingReport(false);
    }
  }, [t, toast]);

  return {
    isRequestingReport,
    requestWeeklyReport,
  };
}
