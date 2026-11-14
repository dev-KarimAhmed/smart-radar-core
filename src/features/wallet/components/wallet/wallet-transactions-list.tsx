import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './wallet-styles';
import { WalletCopy } from './wallet-types';
import type { WalletTransaction } from '@/hooks/sovereign-wallet/wallet-types';

interface WalletTransactionsListProps {
  transactions: WalletTransaction[];
  isArabic: boolean;
  copy: Pick<WalletCopy, 'transactions' | 'transactionsDescription' | 'noTransactions'>;
}

export function WalletTransactionsList({
  transactions,
  isArabic,
  copy,
}: WalletTransactionsListProps) {
  const tAuto = useTranslations('auto');

  return (
    <Card className={styles.style249_60}>
      <CardHeader className={styles.style250_61}>
        <CardTitle className={styles.style251_62}>{copy.transactions}</CardTitle>
        <CardDescription className={cn(isArabic ? styles.style252_63 : styles.style252_64, styles.style252_65)}>
          {copy.transactionsDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style254_66}>
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <div key={tx.id} className={styles.style257_67}>
              <div className={styles.style258_68}>
                <div className={cn(styles.style259_69, tx.amount >= 0 ? styles.style260_70 : styles.style260_71)}>
                  {tx.amount >= 0 ? <ArrowDownLeft className={styles.style262_72} /> : <ArrowUpRight className={styles.style262_73} />}
                </div>
                <div className={styles.style264_74}>
                  <p className={styles.style265_75}>{tx.description}</p>
                  <p className={styles.style266_76}>{tx.createdAt}</p>
                </div>
              </div>

              <div className={styles.style270_77}>
                <span className={tx.amount >= 0 ? styles.style271_78 : styles.style271_79}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(tx.currency === tAuto('key_d54c0ef8') ? 1 : 2)} {tx.currency}
                </span>
                <span className={styles.style274_80}>{tx.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.style279_81}>{copy.noTransactions}</div>
        )}
      </CardContent>
    </Card>
  );
}
