'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, TrendingUp, DollarSign } from 'lucide-react';

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
}

export function SovereignFinancialActivityChart({ transactions, balanceJD }: FinancialChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 180 });

  // 🛡️ [التعقيم الماسي V2.6-Secured - مصفاة تحضير بيانات D3 المتسلسلة زمنياً]
  // إعادة بناء التغييرات الحسابية زمنياً بطريقة تراكمية للحفاظ على وحدة الحقيقة (SSOT)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sorted = [...transactions]
      .filter(tx => tx.status === 'completed')
      .sort((a, b) => a.timestamp - b.timestamp);

    // حساب الرصيد التراكمي التاريخي بناءً على المعاملات
    let accum = 0;
    const points: ChartDataPoint[] = [];

    // إضافة نقطة بداية كمعيار أساسي قبل 24 ساعة من أول معاملة
    if (sorted.length > 0) {
      const firstTs = sorted[0].timestamp;
      points.push({
        timestamp: firstTs - 12 * 3600 * 1000, // 12 hours earlier
        amount: 0,
        balance: 0,
        description: 'تأسيس الخزينة',
        type: 'baseline'
      });
    } else {
      // رصيد افتراضي في حال خلو السجلات للرندرة المرئية المستقرة
      const now = Date.now();
      return [
        { timestamp: now - 72 * 3600 * 1000, amount: 0, balance: 0, description: 'تأسيس الخزينة السيادية', type: 'baseline' },
        { timestamp: now - 48 * 3600 * 1000, amount: 10, balance: 10, description: 'شحن رصيد طوارئ', type: 'charge' },
        { timestamp: now - 24 * 3600 * 1000, amount: -3.5, balance: 6.5, description: 'استهلاك تشغيلي', type: 'trip_deduction' },
        { timestamp: now, amount: balanceJD - 6.5, balance: balanceJD, description: 'الرصيد الفعلي الحالي', type: 'current' }
      ];
    }

    sorted.forEach((tx) => {
      // نحتسب القيمة النقدية الفعلية (في حال كانت ساعات، نضرب بمعامل تقريبي لتوحيد الرسم البياني)
      const value = tx.currency === 'ساعة' ? tx.amount * 0.5 : tx.amount;
      accum += value;
      points.push({
        timestamp: tx.timestamp,
        amount: value,
        balance: Math.max(0, accum),
        description: tx.description,
        type: tx.type
      });
    });

    // إذا كانت النقطة الأخيرة لا تطابق الرصيد الفعلي الحالي، نقوم بمواءمتها
    if (points.length > 0 && Math.abs(points[points.length - 1].balance - balanceJD) > 0.01) {
      points.push({
        timestamp: Date.now(),
        amount: 0,
        balance: balanceJD,
        description: 'الرصيد الفعلي الموحد',
        type: 'current'
      });
    }

    return points;
  }, [transactions, balanceJD]);

  // 📐 [مراقب الأبعاد التفاعلي - ResizeObserver]
  // يتكيف حجم الرسم البياني بمرونة تامة مع أحجام الشاشات المختلفة دون كسر الأبعاد الهندسية
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // نحدد أقصى عرض متناسب مع حاوية الأجهزة المحمولة
      setDimensions({
        width: Math.max(280, width),
        height: 160
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 🎨 [محرك الرندرة الأساسي لـ D3.js]
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // تنظيف كلي لعناصر الـ SVG لمنع الرندرة المتكررة (Prevent Double-Render Conflict)
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // إنشاء حاوية الرسم الأساسية
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // نطاقات القياس (Scales)
    const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yValMin = d3.min(chartData, d => d.balance) || 0;
    const yValMax = d3.max(chartData, d => d.balance) || 10;
    const y = d3.scaleLinear()
      .domain([0, yValMax * 1.15]) // إضافة هامش مرئي علوي
      .range([chartHeight, 0]);

    // تعريف التدرج اللوني الماسي (Turquoise Glowing Gradient)
    const defs = svg.append('defs');
    
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'sovereign-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.28);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');

    glowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // رسم مساحة التدرج الخلفي (Area Path)
    const areaGenerator = d3.area<ChartDataPoint>()
      .x(d => x(new Date(d.timestamp)))
      .y0(chartHeight)
      .y1(d => y(d.balance))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('class', 'area')
      .attr('fill', 'url(#sovereign-area-gradient)')
      .attr('d', areaGenerator);

    // رسم الخط الأساسي (Line Path)
    const lineGenerator = d3.line<ChartDataPoint>()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.balance))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#glow)')
      .attr('d', lineGenerator);

    // محور السينات (X-Axis) - محاذاة التوقيت العربي البسيط
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(chartData.length, 4))
      .tickFormat((d) => {
        const date = d as Date;
        return date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
      });

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('.domain').remove();
    xAxisGroup.selectAll('line').attr('stroke', '#064e3b').attr('stroke-opacity', 0.5);
    xAxisGroup.selectAll('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Inter, sans-serif')
      .attr('dy', '10px');

    // محور الصادات (Y-Axis)
    const yAxis = d3.axisLeft(y)
      .ticks(3)
      .tickFormat(d => `${d} د`);

    const yAxisGroup = g.append('g')
      .call(yAxis);

    yAxisGroup.selectAll('.domain').remove();
    yAxisGroup.selectAll('line')
      .attr('stroke', '#064e3b')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-opacity', 0.5)
      .attr('x2', chartWidth); // شبكة خلفية سريعة

    yAxisGroup.selectAll('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('dx', '-4px');

    // نقاط تفاعلية دائرية للمخطط (Data Nodes)
    g.selectAll('.dot')
      .data(chartData.filter(d => d.type !== 'baseline'))
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.timestamp)))
      .attr('cy', d => y(d.balance))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#022c22')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6.5)
          .attr('fill', '#34d399');

        // رسم بطاقة إرشاد متطايرة سريعة (Tooltip)
        const tooltipG = g.append('g')
          .attr('id', 'chart-tooltip')
          .attr('transform', `translate(${x(new Date(d.timestamp))}, ${y(d.balance) - 22})`);

        tooltipG.append('rect')
          .attr('x', -60)
          .attr('y', -14)
          .attr('width', 120)
          .attr('height', 24)
          .attr('rx', 6)
          .attr('fill', '#022c22')
          .attr('stroke', '#10b981')
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', 1);

        tooltipG.append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .attr('font-weight', 'black')
          .attr('y', 1)
          .text(`${d.balance.toFixed(2)} د.أ`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 4)
          .attr('fill', '#10b981');
        
        g.select('#chart-tooltip').remove();
      });

  }, [chartData, dimensions]);

  return (
    <Card className="bg-[#030903]/95 border border-emerald-900/30 rounded-2xl shadow-xl overflow-hidden mb-6">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-emerald-900/20">
        <div className="text-right">
          <CardTitle className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
            منحنى النشاط المالي اللامركزي
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </CardTitle>
          <CardDescription className="text-[9px] text-gray-500 mt-0.5">
            رسم بياني زمني يعكس نبضات الاستهلاك والشحن لآخر المعاملات عبر D3.js
          </CardDescription>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded-lg text-emerald-400 text-[10px] font-mono flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>SSOT Live</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex flex-col items-center">
        <div ref={containerRef} className="w-full relative h-[160px] flex items-center justify-center">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible"
          />
        </div>
      </CardContent>
    </Card>
  );
}
