'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './financial-chart-styles';
import { renderFinancialD3Chart, type ChartDataPoint } from './financial-chart-d3';

export type { ChartDataPoint };

interface FinancialChartProps {
  transactions: any[];
  balanceJD: number;
  currencyLabel?: string;
}

export function SovereignFinancialActivityChart({ transactions, balanceJD, currencyLabel = '' }: FinancialChartProps) {
  const { isArabic } = useDashboardLanguage();
  const t = useTranslations('financialChart');
  const tAuto = useTranslations('auto');
  const copy = {
    baseline: t('baseline'),
    currentBalance: t('currentBalance'),
    description: t('description'),
    empty: t('empty'),
    title: t('title'),
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 180 });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sorted = [...transactions]
      .filter((tx) => `${tx.status}`.toLowerCase() === 'completed')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sorted.length === 0) return [];

    let runningBalance = 0;
    const points: ChartDataPoint[] = [{
      timestamp: sorted[0].timestamp - 12 * 3600 * 1000,
      amount: 0,
      balance: 0,
      description: copy.baseline,
      type: 'baseline',
    }];

    sorted.forEach((tx) => {
      const value = tx.currency === tAuto('key_d54c0ef8') ? tx.amount * 0.5 : tx.amount;
      runningBalance += value;
      points.push({
        timestamp: tx.timestamp,
        amount: value,
        balance: Math.max(0, runningBalance),
        description: tx.description,
        type: tx.type,
      });
    });

    if (points.length > 0 && Math.abs(points[points.length - 1].balance - balanceJD) > 0.01) {
      points.push({
        timestamp: Date.now(),
        amount: 0,
        balance: balanceJD,
        description: copy.currentBalance,
        type: 'current',
      });
    }

    return points;
  }, [transactions, balanceJD, copy.baseline, copy.currentBalance, tAuto]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (!width) return;
      setDimensions({ width: Math.max(280, width), height: 160 });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    renderFinancialD3Chart({
      svgElement: svgRef.current,
      chartData,
      dimensions,
      currencyLabel,
      isArabic,
    });
  }, [chartData, dimensions, currencyLabel, isArabic]);

  return (
    <Card className={styles.style196_1}>
      <CardHeader className={styles.style197_2}>
        <div className={isArabic ? styles.style198_3 : styles.style198_4}>
          <CardTitle className={cn(styles.style199_5, isArabic ? styles.style199_6 : styles.style199_7)}>
            {copy.title}
            <Activity className={styles.style201_8} />
          </CardTitle>
          <CardDescription className={styles.style203_9}>
            {copy.description}
          </CardDescription>
        </div>
        <div className={styles.style207_10}>
          <TrendingUp className={styles.style208_11} />
          <span>{currencyLabel || 'Wallet'}</span>
        </div>
      </CardHeader>
      <CardContent className={styles.style212_12}>
        <div ref={containerRef} className={styles.style213_13}>
          {chartData.length > 0 ? (
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className={styles.style215_14} />
          ) : (
            <>
              <svg ref={svgRef} width={0} height={0} className={styles.style218_15} />
              <div className={styles.style219_16}>
                {copy.empty}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
