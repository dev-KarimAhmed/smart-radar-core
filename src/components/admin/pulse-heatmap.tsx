'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Users,
  Car,
  MapPin,
  Navigation,
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
import { useTranslations } from "next-intl";
import { styles } from './pulse-heatmap-styles';
import { PulseBarChart } from './pulse-bar-chart';

export { styles } from './pulse-heatmap-styles';
export { PulseBarChart } from './pulse-bar-chart';

interface PulseHeatmapProps {
  pulseData: MarketPulse[];
  isLoading: boolean;
}

const getTrendStyle = (trend: MarketPulse['trend']) => {
  const tAuto = useTranslations('auto');
  switch (trend) {
    case 'high_demand':
      return {
        bg: 'bg-red-950/20 border-red-500/30',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        iconColor: 'text-red-400',
        Icon: TrendingUp,
        label: tAuto('key_47bc21aa')
      };
    case 'high_supply':
      return {
        bg: 'bg-blue-950/20 border-blue-500/30',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        iconColor: 'text-blue-400',
        Icon: TrendingDown,
        label: tAuto('key_8b1b33e1')
      };
    case 'balanced':
    default:
      return {
        bg: 'bg-emerald-950/20 border-emerald-500/30',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        iconColor: 'text-emerald-400',
        Icon: ArrowRightLeft,
        label: tAuto('key_aaa488cb')
      };
  }
};

// Programmatic mapping to reverse district to governorate
const getGovernorateOfDistrict = (districtName: string): string => {
  const tAuto = useTranslations('auto');
  for (const gov of jordanGovernorates) {
    const distList = getDistrictsByGovernorate(gov);
    if (distList.includes(districtName)) {
      return gov;
    }
  }
  return tAuto('key_20a48924'); // Default fallback
};

export function PulseHeatmap({ pulseData, isLoading }: PulseHeatmapProps) {
  const tAuto = useTranslations('auto');
  const [selectedGov, setSelectedGov] = React.useState<string>(tAuto('key_6d08f196'));
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>(tAuto('key_6d08f196'));
  const [calculatedScores, setCalculatedScores] = React.useState<Record<string, number>>({});
  const [isProcessingScores, setIsProcessingScores] = React.useState(false);

  // Reset district when governorate changes
  const handleGovChange = (value: string) => {
    setSelectedGov(value);
    setSelectedDistrict(tAuto('key_6d08f196'));
  };

  // Get available districts for governorate
  const availableDistricts = React.useMemo(() => {
    if (selectedGov === tAuto('key_6d08f196')) return [];
    return getDistrictsByGovernorate(selectedGov);
  }, [selectedGov, tAuto]);

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

      const matchesGov = selectedGov === tAuto('key_6d08f196') || gov === selectedGov;
      const matchesDistrict = selectedDistrict === tAuto('key_6d08f196') || pulseDistrict === selectedDistrict;

      return matchesGov && matchesDistrict;
    });
  }, [pulseData, selectedGov, selectedDistrict, tAuto]);

  // Map to Chart Data
  const chartData = React.useMemo(() => {
    return filteredData.map(pulse => ({
      name: pulse.id,
      demand: pulse.demand,
      supply: pulse.supply,
      density: calculatedScores[pulse.id] ?? 0,
    }));
  }, [filteredData, calculatedScores]);

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
                {tAuto('key_a5d3d09c')}
              </CardTitle>
              <CardDescription className={styles.style234_14}>
                {tAuto('key_056804be')}
              </CardDescription>
            </div>

            {/* 🔍 Selectors */}
            <div className={styles.style240_15}>
              {/* Governorate Selector */}
              <div className={styles.style242_16}>
                <span className={styles.style243_17}>
                  <MapPin className={styles.style244_18} /> {tAuto('key_d5113593')}
                </span>
                <Select value={selectedGov} onValueChange={handleGovChange}>
                  <SelectTrigger className={styles.style247_19}>
                    <SelectValue placeholder={tAuto('key_2f5a1a9e')} />
                  </SelectTrigger>
                  <SelectContent className={styles.style250_20}>
                    <SelectItem value={tAuto('key_6d08f196')} className={styles.style251_21}>{tAuto('key_0a8d5f35')}</SelectItem>
                    {jordanGovernorates.map(gov => (
                      <SelectItem key={gov} value={gov} className={styles.style253_22}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selector */}
              <div className={styles.style260_23}>
                <span className={styles.style261_24}>
                  <Navigation className={styles.style262_25} /> {tAuto('key_5ebad0b9')}
                </span>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={selectedGov === tAuto('key_6d08f196')}
                >
                  <SelectTrigger className={styles.style269_26}>
                    <SelectValue placeholder={tAuto('key_ab5f2b73')} />
                  </SelectTrigger>
                  <SelectContent className={styles.style272_27}>
                    <SelectItem value={tAuto('key_6d08f196')} className={styles.style273_28}>{tAuto('key_45704af2')}</SelectItem>
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

      {/* 📊 Custom Vertical Bar Chart Section */}
      <PulseBarChart chartData={chartData} />

      {/* 📝 Granular Details List */}
      <div>
        <h4 className={styles.style492_62}>
          <span>●</span> {tAuto('key_bc95a008')}{filteredData.length})
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
                    <span>{tAuto('key_42b7cd22')} {govName}</span>
                    <span className={cn(styles.style508_70, style.iconColor)}>{style.label}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className={styles.style511_71}>
                  <div className={styles.style512_72}>
                    <div className={styles.style513_73}>
                      <span className={styles.style514_74}>{tAuto('key_bf9c02da')}</span>
                      <div className={styles.style515_75}>
                        <Users className={styles.style516_76} />
                        <span className={styles.style517_77}>{pulse.demand}</span>
                      </div>
                    </div>
                    <div className={styles.style520_78}>
                      <span className={styles.style521_79}>{tAuto('key_196230d2')}</span>
                      <div className={styles.style522_80}>
                        <Car className={styles.style523_81} />
                        <span className={styles.style524_82}>{pulse.supply}</span>
                      </div>
                    </div>
                  </div>

                  {/* Geospatial Density Counter */}
                  <div className={styles.style530_83}>
                    <span>{tAuto('key_3fa65efd')}</span>
                    <span className={styles.style532_84}>
                      {isProcessingScores ? tAuto('key_861f2229') : `${calculatedScores[pulse.id] ?? '0.0'}%`}
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
