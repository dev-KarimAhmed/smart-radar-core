'use client';

import React from 'react';
import { Fingerprint, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { adminViewStyles as styles } from './admin-view-styles';

export interface InjectedThreat {
  id: string;
  timestamp: string;
  district: string;
  severity: string;
  message: string;
  actionLabel: string;
  resolved: boolean;
}

interface PendingAdsThreatRegisterProps {
  injectedThreats: InjectedThreat[];
  activeThreatsCount: number;
  onResolveThreat: (id: string, message: string) => void;
  onClearResolved: () => void;
}

export function PendingAdsThreatRegister({
  injectedThreats,
  activeThreatsCount,
  onResolveThreat,
  onClearResolved,
}: PendingAdsThreatRegisterProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.style416_91}>
      <div className={styles.style417_92}>
        <div>
          <h4 className={styles.style419_93}>
            <Fingerprint className={styles.style420_94} />
            {tAuto('key_84293290')}
          </h4>
          <p className={styles.style423_95}>
            {tAuto('key_9990d005')}
          </p>
        </div>
        <div className={styles.style427_96}>
          {injectedThreats.some(t => t.resolved) && (
            <Button
              onClick={onClearResolved}
              variant="outline"
              className={styles.style432_97}
            >
              <Trash2 className={styles.style434_98} />
              {tAuto('key_fbefe958')}
            </Button>
          )}
          <Badge variant="outline" className={styles.style438_99}>
            {activeThreatsCount} {tAuto('key_edbed039')}
          </Badge>
        </div>
      </div>

      <div className={styles.style444_100}>
        {injectedThreats.length === 0 ? (
          <div className={styles.style446_101}>
            {tAuto('key_7e571d77')}
          </div>
        ) : (
          injectedThreats.map(threat => (
            <div
              key={threat.id}
              className={cn(
                styles.style454_102,
                threat.resolved ? styles.style455_103 : styles.style455_104
              )}
            >
              <div className={styles.style458_105}>
                <div className={styles.style459_106}>
                  <span className={cn(
                    styles.style461_107,
                    threat.severity === 'severe'
                      ? styles.style463_108
                      : styles.style464_109,
                    threat.resolved && styles.style465_110
                  )}>
                    {threat.resolved ? tAuto('key_46a6f86e') : threat.severity === 'severe' ? tAuto('key_888d4095') : tAuto('key_5bfde6d0')}
                  </span>
                  <span className={styles.style469_111}>
                    📍 {threat.district}
                  </span>
                  <span className={styles.style472_112}>{threat.timestamp}</span>
                </div>
                <p className={cn(
                  styles.style475_113,
                  threat.resolved ? styles.style476_114 : styles.style476_115
                )}>
                  {threat.message}
                </p>
              </div>

              {!threat.resolved ? (
                <Button
                  onClick={() => onResolveThreat(threat.id, threat.message)}
                  className={styles.style485_116}
                >
                  {threat.actionLabel}
                </Button>
              ) : (
                <span className={styles.style490_117}>
                  <ShieldCheck className={styles.style491_118} />
                  {tAuto('key_f0db1966')}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
