import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { styles } from './wallet-styles';
import { BalanceDisplayProps } from './wallet-types';

export function BalanceDisplay({ balance, currencyLabel, walletLoaded, onChargeFunds, copy }: BalanceDisplayProps) {
  return (
    <Card className={styles.style39_1}>
      <div className={styles.style40_2} />
      <CardContent className={styles.style41_3}>
        <div className={styles.style42_4}>
          <span className={styles.style43_5}>{copy.balance}</span>
          <span className={styles.style44_6}>{currencyLabel || '-'}</span>
        </div>

        <div className={styles.style47_7}>
          <span className={styles.style48_8}>
            {walletLoaded ? balance.toFixed(2) : '...'}
          </span>
          {currencyLabel && <span className={styles.style51_9}>{currencyLabel}</span>}
        </div>

        <Button
          onClick={onChargeFunds}
          className={styles.style56_10}
        >
          <CreditCard className={styles.style58_11} />
          {copy.chargeBalance}
        </Button>
      </CardContent>
    </Card>
  );
}
