import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Car } from 'lucide-react';
import type { MarketPulse } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './pulse-heatmap-styles';
import { getTrendStyle, getGovernorateOfDistrict } from './pulse-heatmap-types';

interface PulseCardsGridProps {
  filteredData: MarketPulse[];
  calculatedScores: Record<string, number>;
  isProcessingScores: boolean;
  tAuto: (key: string) => string;
}

export function PulseCardsGrid({
  filteredData,
  calculatedScores,
  isProcessingScores,
  tAuto,
}: PulseCardsGridProps) {
  const fallbackGov = tAuto('key_20a48924');

  return (
    <div>
      <h4 className={styles.style492_62}>
        <span>●</span> {tAuto('key_bc95a008')}{filteredData.length})
      </h4>
      <div className={styles.style495_63}>
        {filteredData
          .slice()
          .sort((a, b) => b.demand - a.demand)
          .map((pulse) => {
            const style = getTrendStyle(pulse.trend, tAuto);
            const govName = getGovernorateOfDistrict(pulse.id, fallbackGov);
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
  );
}
