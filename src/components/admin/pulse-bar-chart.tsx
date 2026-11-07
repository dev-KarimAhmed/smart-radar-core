'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { styles } from './pulse-heatmap-styles';

export interface PulseChartItem {
  name: string;
  demand: number;
  supply: number;
  density: number;
}

interface PulseBarChartProps {
  chartData: PulseChartItem[];
}

export function PulseBarChart({ chartData }: PulseBarChartProps) {
  const tAuto = useTranslations('auto');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 320 });
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(250, height),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const margin = { top: 30, right: 20, bottom: 50, left: 40 };
  const plotWidth = dimensions.width - margin.left - margin.right;
  const plotHeight = dimensions.height - margin.top - margin.bottom;

  const maxVal = React.useMemo(() => {
    const vals = chartData.flatMap(d => [d.demand, d.supply]);
    const max = Math.max(...vals, 5);
    return Math.ceil(max * 1.15);
  }, [chartData]);

  return (
    <Card className={styles.style286_30}>
      <div className={styles.style287_31}>
        <div className={styles.style288_32}>
          <BarChart3 className={styles.style289_33} />
          <h3 className={styles.style290_34}>{tAuto('key_fdbcd104')}</h3>
        </div>

        {/* 🏷️ Customized Legend */}
        <div className={styles.style294_35}>
          <div className={styles.style295_36}>
            <span className={styles.style296_37}></span>
            <span className={styles.style297_38}>{tAuto('key_396fae76')}</span>
          </div>
          <div className={styles.style299_39}>
            <span className={styles.style300_40}></span>
            <span className={styles.style301_41}>{tAuto('key_3e458216')}</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.style307_42}>
          <Activity className={styles.style308_43} />
          <p className={styles.style309_44}>{tAuto('key_769faef5')}</p>
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
                    onMouseEnter={() => {
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
                  <span>{tAuto('key_4b858334')}</span>
                  <span className={styles.style473_57}>{chartData[hoveredIndex].demand}</span>
                </p>
                <p className={styles.style475_58}>
                  <span>{tAuto('key_a4dbedc2')}</span>
                  <span className={styles.style477_59}>{chartData[hoveredIndex].supply}</span>
                </p>
                <p className={styles.style479_60}>
                  <span>{tAuto('key_8f0a48c3')}</span>
                  <span className={styles.style481_61}>{chartData[hoveredIndex].density}%</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
