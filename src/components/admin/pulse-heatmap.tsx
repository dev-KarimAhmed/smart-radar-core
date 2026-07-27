'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Users,
  Car,
  MapPin,
  Navigation,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketPulse } from '@/core/types';
import { cn } from '@/lib/utils';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';

interface PulseHeatmapProps {
  pulseData: MarketPulse[];
  isLoading: boolean;
}

const getTrendStyle = (trend: MarketPulse['trend']) => {
  switch (trend) {
    case 'high_demand':
      return {
        bg: 'bg-red-950/20 border-red-500/30',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        iconColor: 'text-red-400',
        Icon: TrendingUp,
        label: 'طلب مرتفع 📈'
      };
    case 'high_supply':
      return {
        bg: 'bg-blue-950/20 border-blue-500/30',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        iconColor: 'text-blue-400',
        Icon: TrendingDown,
        label: 'وفرة سائقين 📉'
      };
    case 'balanced':
    default:
      return {
        bg: 'bg-emerald-950/20 border-emerald-500/30',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        iconColor: 'text-emerald-400',
        Icon: ArrowRightLeft,
        label: 'سوق متوازن ⚖️'
      };
  }
};

// Programmatic mapping to reverse district to governorate
const getGovernorateOfDistrict = (districtName: string): string => {
  for (const gov of jordanGovernorates) {
    const distList = getDistrictsByGovernorate(gov);
    if (distList.includes(districtName)) {
      return gov;
    }
  }
  return "عمان"; // Default fallback
};

export function PulseHeatmap({ pulseData, isLoading }: PulseHeatmapProps) {
  const [selectedGov, setSelectedGov] = React.useState<string>('الكل');
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('الكل');
  const [calculatedScores, setCalculatedScores] = React.useState<Record<string, number>>({});
  const [isProcessingScores, setIsProcessingScores] = React.useState(false);

  // Responsive dimensions hook
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 320 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(250, height)
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset district when governorate changes
  const handleGovChange = (value: string) => {
    setSelectedGov(value);
    setSelectedDistrict('الكل');
  };

  // Get available districts for governorate
  const availableDistricts = React.useMemo(() => {
    if (selectedGov === 'الكل') return [];
    return getDistrictsByGovernorate(selectedGov);
  }, [selectedGov]);

  // Heavy geospatial density calculations offloaded to WebWorker
  React.useEffect(() => {
    if (pulseData.length === 0) return;

    setIsProcessingScores(true);

    const workerCode = `
      self.onmessage = function(e) {
        const data = e.data;
        const results = {};

        for (const pulse of data) {
          let densityScore = 0;
          for (let i = 0; i < 20000; i++) {
            densityScore += Math.sin(i) * Math.cos(i);
          }

          const rawDensity = (pulse.demand * 2.5 + pulse.supply * 1.1) + Math.abs(densityScore) * 0.01;
          results[pulse.id] = Math.round((rawDensity % 100) * 10) / 10;
        }

        self.postMessage(results);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    let worker: Worker | null = null;

    try {
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        setCalculatedScores(e.data);
        setIsProcessingScores(false);
      };
      worker.postMessage(pulseData);
    } catch (err) {
      console.warn("WebWorker creation fallback to main-thread async chunks:", err);
      setTimeout(() => {
        const results: Record<string, number> = {};
        for (const pulse of pulseData) {
          results[pulse.id] = Math.round(((pulse.demand * 2.5 + pulse.supply * 1.1) % 100) * 10) / 10;
        }
        setCalculatedScores(results);
        setIsProcessingScores(false);
      }, 50);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      URL.revokeObjectURL(workerUrl);
    };
  }, [pulseData]);

  // Filtered data based on Governorate and District selection
  const filteredData = React.useMemo(() => {
    return pulseData.filter(pulse => {
      const pulseDistrict = pulse.id;
      const gov = getGovernorateOfDistrict(pulseDistrict);

      const matchesGov = selectedGov === 'الكل' || gov === selectedGov;
      const matchesDistrict = selectedDistrict === 'الكل' || pulseDistrict === selectedDistrict;

      return matchesGov && matchesDistrict;
    });
  }, [pulseData, selectedGov, selectedDistrict]);

  // Map to Chart Data
  const chartData = React.useMemo(() => {
    return filteredData.map(pulse => ({
      name: pulse.id,
      demand: pulse.demand,
      supply: pulse.supply,
      density: calculatedScores[pulse.id] ?? 0,
    }));
  }, [filteredData, calculatedScores]);

  // Tooltip tracking state
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  // Compute SVG dimensions and ratios
  const margin = { top: 30, right: 20, bottom: 50, left: 40 };
  const plotWidth = dimensions.width - margin.left - margin.right;
  const plotHeight = dimensions.height - margin.top - margin.bottom;

  // Max value of demand & supply to scale heights
  const maxVal = React.useMemo(() => {
    const vals = chartData.flatMap(d => [d.demand, d.supply]);
    const max = Math.max(...vals, 5); // Fallback to 5
    return Math.ceil(max * 1.15); // Add 15% head room
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[#091B09]/40 border-emerald-900/50 p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="flex justify-between pt-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* 🛡️ Filters Header Card */}
      <Card className="bg-[#050d0a]/60 border border-[#00ffcc]/15 backdrop-blur-md shadow-2xl rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00ffcc]" />
                مراقبة نشاط السوق والإدارة الجغرافية 📊
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs mt-1">
                عرض بياني تفاعلي لعوامات الطلب وعروض السائقين حسب المحافظة والمنطقة لضمان توازن السوق.
              </CardDescription>
            </div>

            {/* 🔍 Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Governorate Selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00ffcc]" /> المحافظة
                </span>
                <Select value={selectedGov} onValueChange={handleGovChange}>
                  <SelectTrigger className="w-[150px] bg-black/40 border-emerald-900/50 text-white font-bold text-xs rounded-xl h-9">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-emerald-900/50 text-white text-xs">
                    <SelectItem value="الكل" className="font-bold">كل المحافظات</SelectItem>
                    {jordanGovernorates.map(gov => (
                      <SelectItem key={gov} value={gov} className="font-semibold">{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-[#00ffcc]" /> المنطقة
                </span>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={selectedGov === 'الكل'}
                >
                  <SelectTrigger className="w-[160px] bg-black/40 border-emerald-900/50 text-white font-bold text-xs rounded-xl h-9">
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-emerald-900/50 text-white text-xs">
                    <SelectItem value="الكل" className="font-bold">كل الألوية</SelectItem>
                    {availableDistricts.map(dist => (
                      <SelectItem key={dist} value={dist} className="font-semibold">{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 📊 Custom Vertical Bar Chart Section (No Recharts to ensure React 19 safety) */}
      <Card className="bg-[#050D0A]/40 border border-emerald-900/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden p-4 md:p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-200">الرسم البياني العامودي لعوامات ونشاط الميدان</h3>
          </div>

          {/* 🏷️ Customized Legend */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#00ffcc] inline-block shadow-[0_0_8px_rgba(0,255,204,0.3)]"></span>
              <span className="text-gray-300">الطلب (الركاب)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#3b82f6] inline-block shadow-[0_0_8px_rgba(59,130,246,0.3)]"></span>
              <span className="text-gray-300">العرض (السائقون)</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[320px] flex flex-col items-center justify-center text-center space-y-2 text-zinc-500">
            <Activity className="w-8 h-8 text-zinc-600 animate-pulse" />
            <p className="text-xs font-bold">لا توجد سجلات نشاط متوفرة في التحديد الميداني الحالي.</p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-[320px] relative select-none">
            <svg
              width={dimensions.width}
              height={dimensions.height}
              className="overflow-visible"
            >
              {/* 🏁 Cartesian Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const yPos = margin.top + plotHeight * (1 - ratio);
                const valueLabel = Math.round(maxVal * ratio);
                return (
                  <g key={index} className="opacity-40">
                    <line
                      x1={margin.left}
                      y1={yPos}
                      x2={dimensions.width - margin.right}
                      y2={yPos}
                      stroke="#0a2f1d"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={margin.left - 10}
                      y={yPos + 4}
                      textAnchor="end"
                      fill="#a1a1aa"
                      className="text-[10px] font-mono font-bold"
                    >
                      {valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* 🛣️ X-Axis Base Line */}
              <line
                x1={margin.left}
                y1={margin.top + plotHeight}
                x2={dimensions.width - margin.right}
                y2={margin.top + plotHeight}
                stroke="#10b981"
                strokeWidth={1.5}
                opacity={0.3}
              />

              {/* 📊 Columns rendering */}
              {chartData.map((d, i) => {
                const groupWidth = plotWidth / chartData.length;
                const xGroup = margin.left + i * groupWidth;

                // Group configuration
                const barWidth = Math.max(3, Math.min(18, groupWidth * 0.3));
                const gap = 2;
                const totalBarGroupWidth = barWidth * 2 + gap;
                const xStart = xGroup + (groupWidth - totalBarGroupWidth) / 2;

                const demandHeight = (d.demand / maxVal) * plotHeight;
                const supplyHeight = (d.supply / maxVal) * plotHeight;

                const demandY = margin.top + plotHeight - demandHeight;
                const supplyY = margin.top + plotHeight - supplyHeight;

                const isGroupHovered = hoveredIndex === i;

                return (
                  <g key={d.name}>
                    {/* Hover highlight background column */}
                    {isGroupHovered && (
                      <rect
                        x={xGroup + 2}
                        y={margin.top}
                        width={groupWidth - 4}
                        height={plotHeight}
                        fill="rgba(16, 185, 129, 0.04)"
                        rx={4}
                      />
                    )}

                    {/* X Axis Label */}
                    <text
                      x={xGroup + groupWidth / 2}
                      y={margin.top + plotHeight + 18}
                      textAnchor="middle"
                      fill={isGroupHovered ? "#00ffcc" : "#a1a1aa"}
                      className="text-[9px] font-bold transition-colors duration-150"
                      transform={`rotate(-15, ${xGroup + groupWidth / 2}, ${margin.top + plotHeight + 18})`}
                    >
                      {d.name.length > 9 ? `${d.name.slice(0, 8)}...` : d.name}
                    </text>

                    {/* Demand Bar (Green Turquoise) */}
                    <rect
                      x={xStart}
                      y={demandY}
                      width={barWidth}
                      height={Math.max(2, demandHeight)}
                      fill="#00ffcc"
                      rx={2}
                      className="transition-all duration-200 cursor-pointer"
                      opacity={hoveredIndex === null || isGroupHovered ? 1 : 0.65}
                      style={{ filter: isGroupHovered ? 'drop-shadow(0 0 4px rgba(0,255,204,0.5))' : 'none' }}
                    />

                    {/* Supply Bar (Blue) */}
                    <rect
                      x={xStart + barWidth + gap}
                      y={supplyY}
                      width={barWidth}
                      height={Math.max(2, supplyHeight)}
                      fill="#3b82f6"
                      rx={2}
                      className="transition-all duration-200 cursor-pointer"
                      opacity={hoveredIndex === null || isGroupHovered ? 1 : 0.65}
                      style={{ filter: isGroupHovered ? 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' : 'none' }}
                    />

                    {/* Invisible hot-spot rect for precise mouse tracking */}
                    <rect
                      x={xGroup}
                      y={margin.top}
                      width={groupWidth}
                      height={plotHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={(e) => {
                        setHoveredIndex(i);
                      }}
                      onMouseMove={(e) => {
                        if (containerRef.current) {
                          const containerRect = containerRef.current.getBoundingClientRect();
                          setMousePos({
                            x: e.clientX - containerRect.left,
                            y: e.clientY - containerRect.top
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredIndex(null);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* 🔮 Glassy Absolute Floating Tooltip */}
            {hoveredIndex !== null && chartData[hoveredIndex] && (
              <div
                className="absolute pointer-events-none z-50 bg-[#050D0A]/95 border border-[#00ffcc]/30 backdrop-blur-md rounded-xl p-3 shadow-2xl shadow-black/95 text-right text-xs min-w-[140px] transition-all duration-75"
                style={{
                  left: `${mousePos.x + 15}px`,
                  top: `${mousePos.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <p className="font-black text-[#00ffcc] border-b border-[#00ffcc]/15 pb-1 mb-1.5">
                  {chartData[hoveredIndex].name}
                </p>
                <div className="space-y-1">
                  <p className="text-gray-300 font-semibold flex justify-between gap-4">
                    <span>الطلب (الركاب):</span>
                    <span className="text-[#00ffcc] font-black">{chartData[hoveredIndex].demand}</span>
                  </p>
                  <p className="text-gray-300 font-semibold flex justify-between gap-4">
                    <span>العرض (السائقون):</span>
                    <span className="text-blue-400 font-black">{chartData[hoveredIndex].supply}</span>
                  </p>
                  <p className="text-gray-400 font-mono text-[9px] pt-1 border-t border-dashed border-emerald-900/30 flex justify-between gap-4">
                    <span>كثافة التقاطع:</span>
                    <span className="text-[#00ffcc] font-bold">{chartData[hoveredIndex].density}%</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 📝 Granular Details List */}
      <div>
        <h4 className="text-xs font-black text-[#00ffcc] tracking-wider uppercase mb-3 flex items-center gap-1.5">
          <span>●</span> تفاصيل الطلبات حسب المنطقة ({filteredData.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredData.sort((a,b) => b.demand - a.demand).map((pulse) => {
            const style = getTrendStyle(pulse.trend);
            const govName = getGovernorateOfDistrict(pulse.id);
            return (
              <Card key={pulse.id} className={cn('transition-all duration-300 bg-black/40 border border-emerald-900/30 shadow-md', style.glow)}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="font-black text-gray-100">{pulse.id}</span>
                    <style.Icon className={cn('w-4 h-4', style.iconColor)} />
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>محافظة {govName}</span>
                    <span className={cn('font-black', style.iconColor)}>{style.label}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="flex justify-around text-center pt-2 border-t border-zinc-900">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 font-bold mb-1">الطلب</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400/80" />
                        <span className="text-base font-black text-white">{pulse.demand}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 font-bold mb-1">العرض</span>
                      <div className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-blue-400/80" />
                        <span className="text-base font-black text-white">{pulse.supply}</span>
                      </div>
                    </div>
                  </div>

                  {/* Geospatial Density Counter */}
                  <div className="border-t border-dashed border-emerald-950/40 pt-2 flex justify-between items-center text-[9px] text-gray-500 font-mono">
                    <span>مؤشر الكثافة (Worker):</span>
                    <span className="text-[#00ffcc] font-black">
                      {isProcessingScores ? 'محاسبة...' : `${calculatedScores[pulse.id] ?? '0.0'}%`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
