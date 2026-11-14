import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { styles } from './wallet-styles';
import { DriverPackageCardProps } from './wallet-types';

export function DriverPackageCard({
  badge,
  hours,
  title,
  description,
  onPurchase,
  purchaseLabel,
  highlight = false,
}: DriverPackageCardProps) {
  return (
    <Card className={styles.style312_87}>
      <div className={styles.style313_88}>
        <div className={styles.style314_89}>
          <Badge className={highlight ? styles.style315_90 : styles.style315_91}>
            {badge}
          </Badge>
          <span className={highlight ? styles.style318_92 : styles.style318_93}>
            {hours}
          </span>
        </div>
        <h3 className={styles.style322_94}>{title}</h3>
        <p className={styles.style323_95}>{description}</p>
      </div>
      <div className={styles.style325_96}>
        <Button
          onClick={onPurchase}
          className={highlight
            ? styles.style329_97
            : styles.style330_98
          }
        >
          <Zap className={styles.style333_99} />
          {purchaseLabel}
        </Button>
      </div>
    </Card>
  );
}
