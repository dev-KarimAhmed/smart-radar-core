import * as d3 from 'd3';

export interface ChartDataPoint {
  timestamp: number;
  amount: number;
  balance: number;
  description: string;
  type: string;
}

export interface RenderFinancialD3ChartParams {
  svgElement: SVGSVGElement;
  chartData: ChartDataPoint[];
  dimensions: { width: number; height: number };
  currencyLabel: string;
  isArabic: boolean;
}

export function renderFinancialD3Chart({
  svgElement,
  chartData,
  dimensions,
  currencyLabel,
  isArabic,
}: RenderFinancialD3ChartParams): void {
  const { width, height } = dimensions;
  const margin = { top: 15, right: 15, bottom: 25, left: 35 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = d3.select(svgElement);
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
}
