'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface ChartDataPoint {
  timestamp: number;
  amount: number;
  balance: number;
  description: string;
  type: string;
}

interface FinancialChartProps {
  transactions: any[];
  balanceJD: number;
  currencyLabel?: string;
}

export function SovereignFinancialActivityChart({ transactions, balanceJD, currencyLabel = '' }: FinancialChartProps) {
  const { isArabic, language } = useDashboardLanguage();
  const copy = financialChartCopy[language];
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
      const value = tx.currency === 'ساعة' ? tx.amount * 0.5 : tx.amount;
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
  }, [transactions, balanceJD, copy.baseline, copy.currentBalance]);

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

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (chartData.length === 0) return;

    const group = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const x = d3
      .scaleTime()
      .domain(d3.extent(chartData, (point) => new Date(point.timestamp)) as [Date, Date])
      .range([0, chartWidth]);
    const maxBalance = d3.max(chartData, (point) => point.balance) || 10;
    const y = d3.scaleLinear().domain([0, maxBalance * 1.15]).range([chartHeight, 0]);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'wallet-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.28);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0);

    const glow = defs.append('filter').attr('id', 'wallet-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    glow.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    group.append('path')
      .datum(chartData)
      .attr('fill', 'url(#wallet-area-gradient)')
      .attr('d', d3.area<ChartDataPoint>()
        .x((point) => x(new Date(point.timestamp)))
        .y0(chartHeight)
        .y1((point) => y(point.balance))
        .curve(d3.curveMonotoneX));

    group.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#wallet-glow)')
      .attr('d', d3.line<ChartDataPoint>()
        .x((point) => x(new Date(point.timestamp)))
        .y((point) => y(point.balance))
        .curve(d3.curveMonotoneX));

    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(chartData.length, 4))
      .tickFormat((value) => (value as Date).toLocaleTimeString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }));

    const xAxisGroup = group.append('g').attr('transform', `translate(0, ${chartHeight})`).call(xAxis);
    xAxisGroup.selectAll('.domain').remove();
    xAxisGroup.selectAll('line').attr('stroke', '#064e3b').attr('stroke-opacity', 0.5);
    xAxisGroup.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '9px').attr('font-weight', 'bold').attr('dy', '10px');

    const yAxis = d3.axisLeft(y).ticks(3).tickFormat((value) => `${value} ${currencyLabel}`.trim());
    const yAxisGroup = group.append('g').call(yAxis);
    yAxisGroup.selectAll('.domain').remove();
    yAxisGroup.selectAll('line').attr('stroke', '#064e3b').attr('stroke-dasharray', '2,2').attr('stroke-opacity', 0.5).attr('x2', chartWidth);
    yAxisGroup.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '9px').attr('font-weight', 'bold').attr('dx', '-4px');

    group.selectAll('.dot')
      .data(chartData.filter((point) => point.type !== 'baseline'))
      .enter()
      .append('circle')
      .attr('cx', (point) => x(new Date(point.timestamp)))
      .attr('cy', (point) => y(point.balance))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#022c22')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', function (_event, point) {
        d3.select(this).transition().duration(150).attr('r', 6.5).attr('fill', '#34d399');

        const tooltip = group.append('g')
          .attr('id', 'chart-tooltip')
          .attr('transform', `translate(${x(new Date(point.timestamp))}, ${y(point.balance) - 22})`);

        tooltip.append('rect')
          .attr('x', -60)
          .attr('y', -14)
          .attr('width', 120)
          .attr('height', 24)
          .attr('rx', 6)
          .attr('fill', '#022c22')
          .attr('stroke', '#10b981')
          .attr('stroke-opacity', 0.6);

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .attr('font-weight', 'black')
          .attr('y', 1)
          .text(`${point.balance.toFixed(2)} ${currencyLabel}`.trim());
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 4).attr('fill', '#10b981');
        group.select('#chart-tooltip').remove();
      });
  }, [chartData, dimensions, currencyLabel, isArabic]);

  return (
    <Card className="mb-6 overflow-hidden rounded-2xl border border-emerald-900/30 bg-radar-black/95 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-900/20 p-4 pb-2">
        <div className={isArabic ? 'text-right' : 'text-left'}>
          <CardTitle className={`flex items-center gap-1.5 text-xs font-black text-white ${isArabic ? 'justify-end' : 'justify-start'}`}>
            {copy.title}
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </CardTitle>
          <CardDescription className="mt-0.5 text-[9px] text-gray-500">
            {copy.description}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-950/40 px-2 py-1 font-mono text-[10px] text-emerald-400">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span>{currencyLabel || 'Wallet'}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-4 pt-3">
        <div ref={containerRef} className="relative flex h-[160px] w-full items-center justify-center">
          {chartData.length > 0 ? (
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="overflow-visible" />
          ) : (
            <>
              <svg ref={svgRef} width={0} height={0} className="hidden" />
              <div className="rounded-2xl border border-emerald-900/30 bg-black/30 px-5 py-4 text-center text-xs text-gray-400">
                {copy.empty}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const financialChartCopy = {
  ar: {
    baseline: 'بداية الرصيد',
    currentBalance: 'الرصيد الحالي',
    description: 'تظهر العمليات هنا بعد وصولها من الخادم.',
    empty: 'لا توجد عمليات مالية لعرضها حالياً.',
    title: 'حركة الرصيد',
  },
  en: {
    baseline: 'Starting balance',
    currentBalance: 'Current balance',
    description: 'Transactions appear here after they arrive from the server.',
    empty: 'No financial transactions to show yet.',
    title: 'Balance activity',
  },
} as const;
