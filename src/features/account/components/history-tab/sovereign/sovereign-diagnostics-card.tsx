import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, Activity, Sliders } from 'lucide-react';
import { sovereignLogsStyles as styles } from './sovereign-logs-styles';

interface SovereignDiagnosticsCardProps {
  t: any;
}

export function SovereignDiagnosticsCard({ t }: SovereignDiagnosticsCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.accentBar} />
      <CardHeader className={styles.header}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={styles.iconBox}>
              <ShieldCheck className={styles.icon} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className={styles.title}>{t('antiChatTitle')}</CardTitle>
              <CardDescription className={styles.descDesktop}>{t('antiChatDesc')}</CardDescription>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0">
            <CardDescription className={styles.descMobile}>{t('antiChatDesc')}</CardDescription>
            <Badge variant="outline" className={styles.countBadge}>
              SECURE-V2.6
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className={styles.content}>
        <div className={styles.diagContentBox}>
          <div className={styles.diagItem}>
            <div className={styles.diagIconBox}>
              <Lock className={styles.diagIcon} />
            </div>
            <div className={styles.diagTextBox}>
              <h5 className={styles.diagItemTitle}>{t('zeroChatTitle')}</h5>
              <p className={styles.diagItemDesc}>{t('zeroChatDesc')}</p>
            </div>
          </div>

          <div className={styles.diagBorderTop}>
            <div className={styles.diagIconBox}>
              <Activity className={styles.diagIcon} />
            </div>
            <div className={styles.diagTextBox}>
              <h5 className={styles.diagItemTitle}>{t('financialActivityTitle')}</h5>
              <p className={styles.diagItemDesc}>{t('financialActivityDesc')}</p>
            </div>
          </div>

          <div className={styles.diagBorderTop}>
            <div className={styles.diagIconBox}>
              <Sliders className={styles.diagIcon} />
            </div>
            <div className={styles.diagTextBox}>
              <h5 className={styles.diagItemTitle}>{t('autoPurgeTitle')}</h5>
              <p className={styles.diagItemDesc}>{t('autoPurgeDesc')}</p>
            </div>
          </div>
        </div>

        <div className={styles.diagStatusBox}>
          <div className={styles.diagStatusInner}>
            <div className={styles.diagStatusDot} />
            <span className={styles.diagStatusLabel}>{t('purityStatus')}</span>
            <span className={styles.diagStatusValue}>100% PURE & SECURE</span>
          </div>
          <span className={styles.diagStatusDecree}>{t('certifiedDecree')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

