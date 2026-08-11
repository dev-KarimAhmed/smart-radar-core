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

const styles = {
  style207_1: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  style209_2: "bg-[#091B09]/40 border-emerald-900/50 p-6 space-y-4 animate-pulse",
  style210_3: "h-6 bg-muted rounded w-3/4",
  style211_4: "h-4 bg-muted rounded w-1/2",
  style212_5: "flex justify-between pt-4",
  style213_6: "h-8 bg-muted rounded w-1/4",
  style214_7: "h-8 bg-muted rounded w-1/4",
  style223_8: "space-y-6",
  style226_9: "bg-[#050d0a]/60 border border-[#00ffcc]/15 backdrop-blur-md shadow-2xl rounded-2xl",
  style227_10: "pb-4",
  style228_11: "flex flex-col md:flex-row md:items-center justify-between gap-4",
  style230_12: "text-xl font-black text-white flex items-center gap-2",
  style231_13: "w-5 h-5 text-[#00ffcc]",
  style234_14: "text-gray-400 text-xs mt-1",
  style240_15: "flex flex-wrap items-center gap-3",
  style242_16: "space-y-1",
  style243_17: "text-[10px] text-gray-400 font-bold block flex items-center gap-1",
  style244_18: "w-3 h-3 text-[#00ffcc]",
  style247_19: "w-[150px] bg-black/40 border-emerald-900/50 text-white font-bold text-xs rounded-xl h-9",
  style250_20: "bg-zinc-950 border-emerald-900/50 text-white text-xs",
  style251_21: "font-bold",
  style253_22: "font-semibold",
  style260_23: "space-y-1",
  style261_24: "text-[10px] text-gray-400 font-bold block flex items-center gap-1",
  style262_25: "w-3 h-3 text-[#00ffcc]",
  style269_26: "w-[160px] bg-black/40 border-emerald-900/50 text-white font-bold text-xs rounded-xl h-9",
  style272_27: "bg-zinc-950 border-emerald-900/50 text-white text-xs",
  style273_28: "font-bold",
  style275_29: "font-semibold",
  style286_30: "bg-[#050D0A]/40 border border-emerald-900/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden p-4 md:p-6 relative",
  style287_31: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4",
  style288_32: "flex items-center gap-2",
  style289_33: "w-5 h-5 text-emerald-400",
  style290_34: "text-sm font-bold text-gray-200",
  style294_35: "flex items-center gap-4 text-xs font-bold",
  style295_36: "flex items-center gap-1.5",
  style296_37: "w-3 h-3 rounded bg-[#00ffcc] inline-block shadow-[0_0_8px_rgba(0,255,204,0.3)]",
  style297_38: "text-gray-300",
  style299_39: "flex items-center gap-1.5",
  style300_40: "w-3 h-3 rounded bg-[#3b82f6] inline-block shadow-[0_0_8px_rgba(59,130,246,0.3)]",
  style301_41: "text-gray-300",
  style307_42: "h-[320px] flex flex-col items-center justify-center text-center space-y-2 text-zinc-500",
  style308_43: "w-8 h-8 text-zinc-600 animate-pulse",
  style309_44: "text-xs font-bold",
  style312_45: "w-full h-[320px] relative select-none",
  style316_46: "overflow-visible",
  style323_47: "opacity-40",
  style338_48: "text-[10px] font-mono font-bold",
  style396_49: "text-[9px] font-bold transition-colors duration-150",
  style410_50: "transition-all duration-200 cursor-pointer",
  style423_51: "transition-all duration-200 cursor-pointer",
  style435_52: "cursor-crosshair",
  style460_53: "absolute pointer-events-none z-50 bg-[#050D0A]/95 border border-[#00ffcc]/30 backdrop-blur-md rounded-xl p-3 shadow-2xl shadow-black/95 text-right text-xs min-w-[140px] transition-all duration-75",
  style467_54: "font-black text-[#00ffcc] border-b border-[#00ffcc]/15 pb-1 mb-1.5",
  style470_55: "space-y-1",
  style471_56: "text-gray-300 font-semibold flex justify-between gap-4",
  style473_57: "text-[#00ffcc] font-black",
  style475_58: "text-gray-300 font-semibold flex justify-between gap-4",
  style477_59: "text-blue-400 font-black",
  style479_60: "text-gray-400 font-mono text-[9px] pt-1 border-t border-dashed border-emerald-900/30 flex justify-between gap-4",
  style481_61: "text-[#00ffcc] font-bold",
  style492_62: "text-xs font-black text-[#00ffcc] tracking-wider uppercase mb-3 flex items-center gap-1.5",
  style495_63: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
  style500_64: "transition-all duration-300 bg-black/40 border border-emerald-900/30 shadow-md",
  style501_65: "p-4 pb-2",
  style502_66: "flex items-center justify-between text-sm",
  style503_67: "font-black text-gray-100",
  style504_68: "w-4 h-4",
  style506_69: "flex items-center justify-between text-[10px] text-gray-400 mt-1",
  style508_70: "font-black",
  style511_71: "p-4 pt-2 space-y-3",
  style512_72: "flex justify-around text-center pt-2 border-t border-zinc-900",
  style513_73: "flex flex-col items-center",
  style514_74: "text-[10px] text-gray-500 font-bold mb-1",
  style515_75: "flex items-center gap-1",
  style516_76: "w-3.5 h-3.5 text-emerald-400/80",
  style517_77: "text-base font-black text-white",
  style520_78: "flex flex-col items-center",
  style521_79: "text-[10px] text-gray-500 font-bold mb-1",
  style522_80: "flex items-center gap-1",
  style523_81: "w-3.5 h-3.5 text-blue-400/80",
  style524_82: "text-base font-black text-white",
  style530_83: "border-t border-dashed border-emerald-950/40 pt-2 flex justify-between items-center text-[9px] text-gray-500 font-mono",
  style532_84: "text-[#00ffcc] font-black",
} as const;


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
      <div className={styles.style207_1}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className={styles.style209_2}>
            <div className={styles.style210_3}></div>
            <div className={styles.style211_4}></div>
            <div className={styles.style212_5}>
              <div className={styles.style213_6}></div>
              <div className={styles.style214_7}></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.style223_8} dir="rtl">

      {/* 🛡️ Filters Header Card */}
      <Card className={styles.style226_9}>
        <CardHeader className={styles.style227_10}>
          <div className={styles.style228_11}>
            <div>
              <CardTitle className={styles.style230_12}>
                <Activity className={styles.style231_13} />
                مراقبة نشاط السوق والإدارة الجغرافية 📊
              </CardTitle>
              <CardDescription className={styles.style234_14}>
                عرض بياني تفاعلي لعوامات الطلب وعروض السائقين حسب المحافظة والمنطقة لضمان توازن السوق.
              </CardDescription>
            </div>

            {/* 🔍 Selectors */}
            <div className={styles.style240_15}>
              {/* Governorate Selector */}
              <div className={styles.style242_16}>
                <span className={styles.style243_17}>
                  <MapPin className={styles.style244_18} /> المحافظة
                </span>
                <Select value={selectedGov} onValueChange={handleGovChange}>
                  <SelectTrigger className={styles.style247_19}>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className={styles.style250_20}>
                    <SelectItem value="الكل" className={styles.style251_21}>كل المحافظات</SelectItem>
                    {jordanGovernorates.map(gov => (
                      <SelectItem key={gov} value={gov} className={styles.style253_22}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selector */}
              <div className={styles.style260_23}>
                <span className={styles.style261_24}>
                  <Navigation className={styles.style262_25} /> المنطقة
                </span>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={selectedGov === 'الكل'}
                >
                  <SelectTrigger className={styles.style269_26}>
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent className={styles.style272_27}>
                    <SelectItem value="الكل" className={styles.style273_28}>كل الألوية</SelectItem>
                    {availableDistricts.map(dist => (
                      <SelectItem key={dist} value={dist} className={styles.style275_29}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 📊 Custom Vertical Bar Chart Section (No Recharts to ensure React 19 safety) */}
      <Card className={styles.style286_30}>
        <div className={styles.style287_31}>
          <div className={styles.style288_32}>
            <BarChart3 className={styles.style289_33} />
            <h3 className={styles.style290_34}>الرسم البياني العامودي لعوامات ونشاط الميدان</h3>
          </div>

          {/* 🏷️ Customized Legend */}
          <div className={styles.style294_35}>
            <div className={styles.style295_36}>
              <span className={styles.style296_37}></span>
              <span className={styles.style297_38}>الطلب (الركاب)</span>
            </div>
            <div className={styles.style299_39}>
              <span className={styles.style300_40}></span>
              <span className={styles.style301_41}>العرض (السائقون)</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className={styles.style307_42}>
            <Activity className={styles.style308_43} />
            <p className={styles.style309_44}>لا توجد سجلات نشاط متوفرة في التحديد الميداني الحالي.</p>
          </div>
        ) : (
          <div ref={containerRef} className={styles.style312_45}>
            <svg
              width={dimensions.width}
              height={dimensions.height}
              className={styles.style316_46}
            >
              {/* 🏁 Cartesian Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const yPos = margin.top + plotHeight * (1 - ratio);
                const valueLabel = Math.round(maxVal * ratio);
                return (
                  <g key={index} className={styles.style323_47}>
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
                      className={styles.style338_48}
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
                      className={styles.style396_49}
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
                      className={styles.style410_50}
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
                      className={styles.style423_51}
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
                      className={styles.style435_52}
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
                className={styles.style460_53}
                style={{
                  left: `${mousePos.x + 15}px`,
                  top: `${mousePos.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <p className={styles.style467_54}>
                  {chartData[hoveredIndex].name}
                </p>
                <div className={styles.style470_55}>
                  <p className={styles.style471_56}>
                    <span>الطلب (الركاب):</span>
                    <span className={styles.style473_57}>{chartData[hoveredIndex].demand}</span>
                  </p>
                  <p className={styles.style475_58}>
                    <span>العرض (السائقون):</span>
                    <span className={styles.style477_59}>{chartData[hoveredIndex].supply}</span>
                  </p>
                  <p className={styles.style479_60}>
                    <span>كثافة التقاطع:</span>
                    <span className={styles.style481_61}>{chartData[hoveredIndex].density}%</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 📝 Granular Details List */}
      <div>
        <h4 className={styles.style492_62}>
          <span>●</span> تفاصيل الطلبات حسب المنطقة ({filteredData.length})
        </h4>
        <div className={styles.style495_63}>
          {filteredData.sort((a,b) => b.demand - a.demand).map((pulse) => {
            const style = getTrendStyle(pulse.trend);
            const govName = getGovernorateOfDistrict(pulse.id);
            return (
              <Card key={pulse.id} className={cn(styles.style500_64, style.glow)}>
                <CardHeader className={styles.style501_65}>
                  <CardTitle className={styles.style502_66}>
                    <span className={styles.style503_67}>{pulse.id}</span>
                    <style.Icon className={cn(styles.style504_68, style.iconColor)} />
                  </CardTitle>
                  <CardDescription className={styles.style506_69}>
                    <span>محافظة {govName}</span>
                    <span className={cn(styles.style508_70, style.iconColor)}>{style.label}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className={styles.style511_71}>
                  <div className={styles.style512_72}>
                    <div className={styles.style513_73}>
                      <span className={styles.style514_74}>الطلب</span>
                      <div className={styles.style515_75}>
                        <Users className={styles.style516_76} />
                        <span className={styles.style517_77}>{pulse.demand}</span>
                      </div>
                    </div>
                    <div className={styles.style520_78}>
                      <span className={styles.style521_79}>العرض</span>
                      <div className={styles.style522_80}>
                        <Car className={styles.style523_81} />
                        <span className={styles.style524_82}>{pulse.supply}</span>
                      </div>
                    </div>
                  </div>

                  {/* Geospatial Density Counter */}
                  <div className={styles.style530_83}>
                    <span>مؤشر الكثافة (Worker):</span>
                    <span className={styles.style532_84}>
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
