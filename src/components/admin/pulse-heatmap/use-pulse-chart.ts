import React from 'react';
import type { MarketPulse } from '@/core/types';
import { getDistrictsByGovernorate } from '@/lib/data';
import { type ChartDataItem, getGovernorateOfDistrict } from './pulse-heatmap-types';

export function usePulseChart(
  pulseData: MarketPulse[],
  tAuto: (key: string) => string,
) {
  const [selectedGov, setSelectedGov] = React.useState<string>(tAuto('key_6d08f196'));
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>(tAuto('key_6d08f196'));
  const [calculatedScores, setCalculatedScores] = React.useState<Record<string, number>>({});
  const [isProcessingScores, setIsProcessingScores] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 320 });

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

  const handleGovChange = (value: string) => {
    setSelectedGov(value);
    setSelectedDistrict(tAuto('key_6d08f196'));
  };

  const availableDistricts = React.useMemo(() => {
    if (selectedGov === tAuto('key_6d08f196')) return [];
    return getDistrictsByGovernorate(selectedGov);
  }, [selectedGov, tAuto]);

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

  const defaultFallbackGov = tAuto('key_20a48924');
  const filteredData = React.useMemo(() => {
    return pulseData.filter((pulse) => {
      const pulseDistrict = pulse.id;
      const gov = getGovernorateOfDistrict(pulseDistrict, defaultFallbackGov);

      const matchesGov = selectedGov === tAuto('key_6d08f196') || gov === selectedGov;
      const matchesDistrict = selectedDistrict === tAuto('key_6d08f196') || pulseDistrict === selectedDistrict;

      return matchesGov && matchesDistrict;
    });
  }, [pulseData, selectedGov, selectedDistrict, defaultFallbackGov, tAuto]);

  const chartData: ChartDataItem[] = React.useMemo(() => {
    return filteredData.map((pulse) => ({
      name: pulse.id,
      demand: pulse.demand,
      supply: pulse.supply,
      density: calculatedScores[pulse.id] ?? 0,
    }));
  }, [filteredData, calculatedScores]);

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const maxVal = React.useMemo(() => {
    const vals = chartData.flatMap((d) => [d.demand, d.supply]);
    const max = Math.max(...vals, 5);
    return Math.ceil(max * 1.15);
  }, [chartData]);

  return {
    selectedGov,
    selectedDistrict,
    setSelectedDistrict,
    handleGovChange,
    availableDistricts,
    filteredData,
    calculatedScores,
    isProcessingScores,
    chartData,
    maxVal,
    containerRef,
    dimensions,
    hoveredIndex,
    setHoveredIndex,
    mousePos,
    setMousePos,
  };
}
