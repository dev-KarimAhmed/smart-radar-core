import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Search, AlertCircle, Lock, Coins, Compass, Megaphone, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-shared';
import { useTranslations } from "next-intl";

interface HistoryErrorExplorerProps {
  errorSearch: string;
  setErrorSearch: (val: string) => void;
  errorCategory: string;
  setErrorCategory: (val: string) => void;
  expandedErrorCode: string | null;
  setExpandedErrorCode: (val: string | null) => void;
  filteredErrors: any[];
}

export function HistoryErrorExplorer({
  errorSearch,
  setErrorSearch,
  errorCategory,
  setErrorCategory,
  expandedErrorCode,
  setExpandedErrorCode,
  filteredErrors
}: HistoryErrorExplorerProps) {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  return (
    <Card id="ssot-error-explorer-card" className={styles.style1378_189}>
      <div className={styles.style1379_190} />
      <CardHeader className={styles.style1380_191}>
        <div className={styles.style1381_192}>
          <div>
            <CardTitle className={styles.style1383_193}>
              <ShieldAlert className={styles.style1384_194} />
              {tAuto('key_9c90eafa')}
                                      </CardTitle>
            <CardDescription className={styles.style1387_195}>
              {tAuto('key_84c42d08')}
                                      </CardDescription>
          </div>
          <Badge variant="outline" className={styles.style1391_196}>
            V5.5-Secured
          </Badge>
        </div>

        {/* البحث و الفلترة */}
        <div className={styles.style1397_197}>
          <div className={styles.style1398_198}>
            <Search className={styles.style1399_199} />
            <input
              type="text"
              placeholder={tAuto('key_8e9e141a')}
              value={errorSearch}
              onChange={(e) => setErrorSearch(e.target.value)}
              className={styles.style1405_200}
            />
          </div>

          <div className={styles.style1409_201}>
            <Button
              variant={errorCategory === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ALL')}
              className={cn(styles.style1414_202, errorCategory === 'ALL' ? styles.style1414_203 : styles.style1414_204)}
            >
              {tAuto('key_6d08f196')}
                                      </Button>
            <Button
              variant={errorCategory === 'ERR-SOV' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ERR-SOV')}
              className={cn(styles.style1422_205, errorCategory === 'ERR-SOV' ? styles.style1422_206 : styles.style1422_207)}
            >
              {tAuto('key_d5b2b79a')}
                                      </Button>
            <Button
              variant={errorCategory === 'ERR-FIN' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ERR-FIN')}
              className={cn(styles.style1430_208, errorCategory === 'ERR-FIN' ? styles.style1430_209 : styles.style1430_210)}
            >
              {tAuto('key_dd06bdf8')}
                                      </Button>
            <Button
              variant={errorCategory === 'ERR-MAP' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ERR-MAP')}
              className={cn(styles.style1438_211, errorCategory === 'ERR-MAP' ? styles.style1438_212 : styles.style1438_213)}
            >
              {tAuto('key_5e095665')}
                                      </Button>
            <Button
              variant={errorCategory === 'ERR-ADV' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ERR-ADV')}
              className={cn(styles.style1446_214, errorCategory === 'ERR-ADV' ? styles.style1446_215 : styles.style1446_216)}
            >
              {tAuto('key_bf91d5ec')}
                                      </Button>
            <Button
              variant={errorCategory === 'ERR-KNL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setErrorCategory('ERR-KNL')}
              className={cn(styles.style1454_217, errorCategory === 'ERR-KNL' ? styles.style1454_218 : styles.style1454_219)}
            >
              {tAuto('key_8e9c483f')}
                                      </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={styles.style1462_220}>
        {filteredErrors.length === 0 ? (
          <div className={styles.style1464_221}>
            <AlertCircle className={styles.style1465_222} />
            <p className={styles.style1466_223}>{tAuto('key_b1d4cff0')}</p>
          </div>
        ) : (
          <div className={styles.style1469_224}>
            {filteredErrors.map((err) => {
              const isExpanded = expandedErrorCode === err.code;
              let categoryIcon = <Lock className={styles.style1472_225} />;
              let label = tAuto('key_a0e2968e');
              if (err.code.startsWith('ERR-FIN')) {
                categoryIcon = <Coins className={styles.style1475_226} />;
                label = tAuto('key_39b6e039');
              } else if (err.code.startsWith('ERR-MAP')) {
                categoryIcon = <Compass className={styles.style1478_227} />;
                label = tAuto('key_d8868093');
              } else if (err.code.startsWith('ERR-ADV')) {
                categoryIcon = <Megaphone className={styles.style1481_228} />;
                label = tAuto('key_11c911c5');
              } else if (err.code.startsWith('ERR-KNL')) {
                categoryIcon = <Sliders className={styles.style1484_229} />;
                label = tAuto('key_3e931179');
              }

              return (
                <div
                  key={err.code}
                  onClick={() => setExpandedErrorCode(isExpanded ? null : err.code)}
                  className={cn(styles.style1492_230, isExpanded
                      ? styles.style1494_231
                      : styles.style1495_232)}
                >
                  <div className={styles.style1498_233}>
                    <div className={styles.style1499_234}>
                      {categoryIcon}
                      <span className={styles.style1501_235}>
                        {err.code}
                      </span>
                    </div>
                    <span className={styles.style1505_236}>
                      {label}
                    </span>
                  </div>

                  <div className={styles.style1510_237}>
                    <h4 className={styles.style1511_238}>
                      {err.name}
                    </h4>
                  </div>

                  {isExpanded && (
                    <div className={styles.style1517_239}>
                      <div className={styles.style1518_240}>
                        <span className={styles.style1519_241}>{tAuto('key_f8deb079')}</span>
                        <p className={styles.style1520_242}>
                          {err.description}
                        </p>
                      </div>
                      <div className={styles.style1524_243}>
                        <span className={styles.style1525_244}>{tAuto('key_a6b82bc5')}</span>
                        <p className={styles.style1526_245}>
                          {err.action}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
