import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ShieldCheck, Trash2, Lock, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-shared';
import { HistorySkeleton } from './history-skeleton';

interface HistorySovereignLogsProps {
  sovereignLogs: any[];
  loading: boolean;
  clearSovereignLogs: () => void;
  hideCaptainDiagnostics?: boolean;
  t: any;
}

export function HistorySovereignLogs({
  sovereignLogs,
  loading,
  clearSovereignLogs,
  hideCaptainDiagnostics = false,
  t
}: HistorySovereignLogsProps) {
  return (
    <>
      {hideCaptainDiagnostics ? null : (
        <Card className={styles.style1225_132}>
          <div className={styles.style1226_133} />
          <CardHeader className={styles.style1227_134}>
            <div className={styles.style1228_135}>
              <div>
                <CardTitle className={styles.style1230_136}>
                  <ShieldCheck className={styles.style1231_137} />
                  {t('antiChatTitle')}
                </CardTitle>
                <CardDescription className={styles.style1234_138}>
                  {t('antiChatDesc')}
                </CardDescription>
              </div>
              <Badge variant="outline" className={styles.style1238_139}>
                SECURE-V2.6
              </Badge>
            </div>
          </CardHeader>
          <CardContent className={styles.style1243_140}>
            <div className={styles.style1244_141}>
              <div className={styles.style1245_142}>
                <div className={styles.style1246_143}>
                  <Lock className={styles.style1247_144} />
                </div>
                <div className={styles.style1249_145}>
                  <h5 className={styles.style1250_146}>{t('zeroChatTitle')}</h5>
                  <p className={styles.style1251_147}>
                    {t('zeroChatDesc')}
                  </p>
                </div>
              </div>

              <div className={styles.style1257_148}>
                <div className={styles.style1258_149}>
                  <Activity className={styles.style1259_150} />
                </div>
                <div className={styles.style1261_151}>
                  <h5 className={styles.style1262_152}>{t('financialActivityTitle')}</h5>
                  <p className={styles.style1263_153}>
                    {t('financialActivityDesc')}
                  </p>
                </div>
              </div>

              <div className={styles.style1269_154}>
                <div className={styles.style1270_155}>
                  <Sliders className={styles.style1271_156} />
                </div>
                <div className={styles.style1273_157}>
                  <h5 className={styles.style1274_158}>{t('autoPurgeTitle')}</h5>
                  <p className={styles.style1275_159}>
                    {t('autoPurgeDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.style1282_160}>
              <div className={styles.style1283_161}>
                <div className={styles.style1284_162} />
                <span className={styles.style1285_163}>{t('purityStatus')}</span>
                <span className={styles.style1286_164}>100% PURE & SECURE</span>
              </div>
              <span className={styles.style1288_165}>{t('certifiedDecree')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dedicated Sovereign Logs (سجل خاص به ويكون مرجعًا له) */}
      <Card className={styles.style1294_166}>
        <div className={styles.style1295_167} />
        <CardHeader className={styles.style1296_168}>
          <div>
            <CardTitle className={styles.style1298_169}>
              <Activity className={styles.style1299_170} />
              {t('eventsLogTitle')}
            </CardTitle>
            <CardDescription className={styles.style1302_171}>
              {t('eventsLogDesc')}
            </CardDescription>
          </div>
          <div className={styles.style1306_172}>
            {sovereignLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSovereignLogs}
                className={styles.style1312_173}
              >
                <Trash2 className={styles.style1314_174} />
                {t('clearLog')}
              </Button>
            )}
            <Badge variant="outline" className={styles.style1318_175}>
              {sovereignLogs.length} {t('movement')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={styles.style1324_176}>
          {loading ? (
            <HistorySkeleton />
          ) : sovereignLogs.length === 0 ? (
            <div className={styles.style1328_177}>
              <ShieldCheck className={styles.style1329_178} />
              <p className={styles.style1330_179}>{t('emptyLog')}</p>
              <p className={styles.style1331_180}>
                {t('emptyLogDesc')}
              </p>
            </div>
          ) : (
            <div className={styles.style1336_181}>
              {sovereignLogs.map((log) => {
                let badgeColor: string = styles.logDefault as string;
                let iconEmoji = "🧭";
                if (log.type === 'system_action') {
                  badgeColor = styles.logSystem;
                  iconEmoji = "🤖";
                } else if (log.type === 'district_exit') {
                  badgeColor = styles.logDistrict;
                  iconEmoji = "🗺️";
                }

                return (
                  <div key={log.id} className={styles.style1351_182}>
                    <div className={styles.style1353_183}>
                      <span className={cn(styles.style1354_184, badgeColor)}>
                        {iconEmoji} {t(log.type === 'status_change' ? 'statusChange' : log.type === 'system_action' ? 'systemAction' : 'boundaryCross')}
                      </span>
                      <span className={styles.style1357_185}>
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={styles.style859_18}>{log.message}</p>
                    <div className={styles.style861_20}>
                      <span className={styles.style862_21}>
                        {new Date(log.timestamp).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
