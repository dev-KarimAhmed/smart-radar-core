'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, MapPin, Navigation } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { jordanGovernorates } from '@/lib/data';
import { useTranslations } from 'next-intl';
import { styles } from './pulse-heatmap/pulse-heatmap-styles';
import type { PulseHeatmapProps } from './pulse-heatmap/pulse-heatmap-types';
import { usePulseChart } from './pulse-heatmap/use-pulse-chart';
import { PulseBarChart } from './pulse-heatmap/pulse-bar-chart';
import { PulseCardsGrid } from './pulse-heatmap/pulse-cards-grid';

export function PulseHeatmap({ pulseData, isLoading }: PulseHeatmapProps) {
  const tAuto = useTranslations('auto');
  const {
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
  } = usePulseChart(pulseData, tAuto);

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
      {/* Filters Header Card */}
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

            {/* Selectors */}
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
                    <SelectItem value={tAuto('key_6d08f196')} className={styles.style251_21}>
                      {tAuto('key_0a8d5f35')}
                    </SelectItem>
                    {jordanGovernorates.map((gov) => (
                      <SelectItem key={gov} value={gov} className={styles.style253_22}>
                        {gov}
                      </SelectItem>
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
                    <SelectItem value={tAuto('key_6d08f196')} className={styles.style273_28}>
                      {tAuto('key_45704af2')}
                    </SelectItem>
                    {availableDistricts.map((dist) => (
                      <SelectItem key={dist} value={dist} className={styles.style275_29}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Custom Vertical Bar Chart Section */}
      <PulseBarChart
        chartData={chartData}
        dimensions={dimensions}
        maxVal={maxVal}
        containerRef={containerRef}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        mousePos={mousePos}
        setMousePos={setMousePos}
        tAuto={tAuto}
      />

      {/* Granular Details List */}
      <PulseCardsGrid
        filteredData={filteredData}
        calculatedScores={calculatedScores}
        isProcessingScores={isProcessingScores}
        tAuto={tAuto}
      />
    </div>
  );
}
