import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Delegate } from './delegates-shared';
import { styles } from './delegates-shared';

interface PerformanceStatsProps {
  t: any;
  delegates: Delegate[];
  verifiedSignatures: Record<string, boolean>;
}

export function PerformanceStats(props: PerformanceStatsProps) {
  const { t, delegates, verifiedSignatures } = props;

  const totalReferred = delegates.reduce((acc, d) => acc + (d.referredCount || 0), 0);
  const totalOrganic = delegates.reduce((acc, d) => acc + (d.organicCount || 0), 0);
  const totalChurn = delegates.reduce((acc, d) => acc + (d.churnCount || 0), 0);
  const totalSteady = delegates.reduce((acc, d) => acc + (d.steadyCount || 0), 0);

  const churnRateAvg = totalReferred > 0 ? Number(((totalChurn / (totalReferred + totalChurn)) * 100).toFixed(1)) : 0;
  const growthIndex = totalReferred > 0 ? Number(((totalOrganic / totalReferred) * 100).toFixed(1)) : 0;

  return (
    <div className={styles.style1245_197}>
      <div className={styles.style1246_198}>
        <Card className={styles.style1247_199}>
          <CardHeader className={styles.style1248_200}>
            <CardDescription className={styles.style1249_201}>{t('performanceTab.directGrowth.title')}</CardDescription>
          </CardHeader>
          <CardContent className={styles.style1251_202}>
            <p className={styles.style1252_203}>{totalReferred}{t('performanceTab.directGrowth.suffix')}</p>
            <div className={styles.style1253_204}>
              <TrendingUp className={styles.style1254_205} />
              <span>{t('performanceTab.directGrowth.desc')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.style1260_206}>
          <CardHeader className={styles.style1261_207}>
            <CardDescription className={styles.style1262_208}>{t('performanceTab.organicGrowth.title')}</CardDescription>
          </CardHeader>
          <CardContent className={styles.style1264_209}>
            <p className={styles.style1265_210}>{t('performanceTab.organicGrowth.prefix')}{totalOrganic}{t('performanceTab.organicGrowth.suffix')}</p>
            <div className={styles.style1266_211}>
              <span>{t('performanceTab.organicGrowth.desc', { index: growthIndex })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.style1272_212}>
          <CardHeader className={styles.style1273_213}>
            <CardDescription className={styles.style1274_214}>{t('performanceTab.churn.title')}</CardDescription>
          </CardHeader>
          <CardContent className={styles.style1276_215}>
            <p className={styles.style1277_216}>{churnRateAvg}%</p>
            <div className={styles.style1278_217}>
              <TrendingDown className={styles.style1279_218} />
              <span>{t('performanceTab.churn.desc', { count: totalChurn })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.style1285_219}>
          <CardHeader className={styles.style1286_220}>
            <CardDescription className={styles.style1287_221}>{t('performanceTab.steady.title')}</CardDescription>
          </CardHeader>
          <CardContent className={styles.style1289_222}>
            <p className={styles.style1290_223}>{totalSteady}{t('performanceTab.steady.suffix')}</p>
            <span className={styles.style1291_224}>
              {t('performanceTab.steady.desc')}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className={styles.style1298_225}>
        <CardHeader>
          <CardTitle className={styles.style1300_226}>
            <Layers className={styles.style1301_227} />
            {t('performanceTab.comparison.title')}
          </CardTitle>
          <CardDescription className={styles.style1304_228}>
            {t('performanceTab.comparison.desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.style1309_229}>
            {delegates.map(d => {
              const percentage = totalReferred > 0 ? Math.round(((d.referredCount || 0) / totalReferred) * 100) : 0;
              const isSigValid = !!verifiedSignatures[d.id];
              return (
                <div key={d.id} className={styles.style1314_230}>
                  <div className={styles.style1315_231}>
                    <span className={styles.style1316_232}>{t('performanceTab.comparison.regionPrefix')}<span className={styles.style1316_233}>{d.district} ({d.name})</span></span>
                    <div className={styles.style1317_234}>
                      {isSigValid ? (
                        <span className={styles.style1319_235}>{t('performanceTab.comparison.sigValid')}</span>
                      ) : (
                        <span className={styles.style1321_236}>{t('performanceTab.comparison.sigInvalid')}</span>
                      )}
                      <span className={styles.style1323_237}>{d.referredCount}{t('performanceTab.comparison.driverSuffix')} ({percentage}%)</span>
                    </div>
                  </div>
                  <div className={styles.style1326_238}>
                    <div
                      className={styles.style1328_239}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className={styles.style1332_240}>
                    <span>{t('performanceTab.comparison.extendedOrganic', { count: d.organicCount || 0 })}</span>
                    <span>{t('performanceTab.comparison.steadyAlerts', { count: d.steadyCount || 0 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
