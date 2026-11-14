'use client';

import React from 'react';
import { Terminal, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from "next-intl";
import { adminViewStyles as styles } from './admin-view-styles';

interface PendingAdsForensicScannerProps {
  onScan: () => void;
  isScanning: boolean;
  scanResults: string[] | null;
}

export function PendingAdsForensicScanner({
  onScan,
  isScanning,
  scanResults,
}: PendingAdsForensicScannerProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.style504_119}>
      {/* Module 2: Forensic Algorithmic Deep Scanner */}
      <div className={styles.style558_134}>
        <div className={styles.style559_135}>
          <h4 className={styles.style560_136}>
            <Terminal className={styles.style561_137} />
            {tAuto('key_dd25df53')}
          </h4>
          <p className={styles.style564_138}>
            {tAuto('key_677339a8')}
          </p>
        </div>

        <Button
          onClick={onScan}
          disabled={isScanning}
          className={styles.style572_139}
        >
          {isScanning ? (
            <>
              <Loader2 className={styles.style576_140} />
              {tAuto('key_6de7833f')}
            </>
          ) : (
            <>
              <Sparkles className={styles.style581_141} />
              {tAuto('key_cff79ba6')}
            </>
          )}
        </Button>

        {/* LaTeX Equation showing audit integrity function */}
        <div className={styles.style588_142}>
          <span className={styles.style589_143}>{tAuto('key_7006cb7e')}</span>
          <div className={styles.style590_144}>
            {"$$\\Omega_{audit} = \\sum_{i=1}^{N} (\\mathcal{I}_{ad} \\times \\lambda_{sovereign}) \\equiv 1$$"}
          </div>
          <p className={styles.style593_145}>
            {tAuto('key_678a27cf')} {"$\\mathcal{I}_{ad}$"} {tAuto('key_b22fc3aa')} {"$\\lambda_{sovereign}$"} {tAuto('key_ccff1d7f')}
          </p>
        </div>

        {scanResults && (
          <div className={styles.style599_146}>
            <div className={styles.style600_147}>
              <span className={styles.style601_148}>{tAuto('key_c248563a')}</span>
              <span className={styles.style602_149}>{tAuto('key_fac08f76')}</span>
            </div>
            {scanResults.map((line, idx) => (
              <p key={idx} className={styles.style605_150}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
