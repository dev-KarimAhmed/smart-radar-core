'use client';

import React, { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { Clock, HelpCircle, Sparkles, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GeoPaymentGateway } from '@/shared/components/geo-payment-gateway';
import { SovereignFinancialActivityChart } from './financial-chart';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

import { styles } from './wallet/wallet-styles';
import { WalletCopy } from './wallet/wallet-types';
import { formatMinutes } from './wallet/wallet-utils';
import { BalanceDisplay } from './wallet/balance-display';
import { DriverPackageCard } from './wallet/driver-package-card';
import { WalletPurchaseModal } from './wallet/wallet-purchase-modal';
import { WalletTransactionsList } from './wallet/wallet-transactions-list';

export const SHOW_WORK_PACKAGES = false;

export function WalletTab() {
  const { user } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const t = useTranslations('wallet');
  const copy: WalletCopy = {
    title: t('title'),
    subtitle: t('subtitle'),
    driverAccount: t('driverAccount'),
    riderAccount: t('riderAccount'),
    workHoursBalance: t('workHoursBalance'),
    hours: t('hours'),
    paid: t('paid'),
    bonus: t('bonus'),
    currentPackage: t('currentPackage'),
    none: t('none'),
    fromServer: t('fromServer'),
    balanceStatus: t('balanceStatus'),
    noActivePackages: t('noActivePackages'),
    loadingBalance: t('loadingBalance'),
    serverDataHint: t('serverDataHint'),
    noDemoNumbers: t('noDemoNumbers'),
    workPackages: t('workPackages'),
    workPackagesDescription: t('workPackagesDescription'),
    currency: t('currency'),
    basicPackage: t('basicPackage'),
    basicPackageDescription: t('basicPackageDescription'),
    buyPackage: t('buyPackage'),
    proPackage: t('proPackage'),
    proPackageDescription: t('proPackageDescription'),
    confirmPackagePurchase: t('confirmPackagePurchase'),
    confirmPackageDescription: t('confirmPackageDescription'),
    confirmPurchase: t('confirmPurchase'),
    back: t('back'),
    transactions: t('transactions'),
    transactionsDescription: t('transactionsDescription'),
    noTransactions: t('noTransactions'),
    noteTitle: t('noteTitle'),
    noteText: t('noteText'),
    balance: t('balance'),
    chargeBalance: t('chargeBalance'),
  };

  const {
    loading,
    purchaseDriverPackage,
    balanceJD,
    paidMinutesRemaining,
    bonusMinutesRemaining,
    subscriptionHours,
    activePackageName,
    isDriver,
    transactions,
    walletLoaded,
  } = useSovereignWallet(user);

  const [isChargingFunds, setIsChargingFunds] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<'basic' | 'pro' | null>(null);
  const currencyLabel = isArabic
    ? (user?.currencyAr || user?.currencyEn || '')
    : (user?.currencyEn || user?.currencyAr || '');

  const handlePurchasePackage = useCallback(async (pkgType: 'basic' | 'pro') => {
    const success = await purchaseDriverPackage(pkgType);
    if (success) setPurchasingPackage(null);
  }, [purchaseDriverPackage]);

  return (
    <div className={cn(styles.style93_12, isArabic ? styles.style93_13 : styles.style93_14)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.style94_15}>
        <div className={styles.style95_16}>
          <div className={styles.style96_17}>
            <Wallet className={styles.style97_18} />
          </div>
          <div>
            <h1 className={styles.style100_19}>{copy.title}</h1>
            <p className={styles.style101_20}>{copy.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className={styles.style104_21}>
          {isDriver ? copy.driverAccount : copy.riderAccount}
        </Badge>
      </div>

      <div className={styles.style109_22}>
        <BalanceDisplay
          balance={balanceJD}
          currencyLabel={currencyLabel}
          walletLoaded={walletLoaded}
          onChargeFunds={() => setIsChargingFunds(true)}
          copy={copy}
        />

        {isDriver ? (
          <Card className={styles.style119_23}>
            <div className={styles.style120_24} />
            <CardContent className={styles.style121_25}>
              <div className={styles.style122_26}>
                <span className={styles.style123_27}>{copy.workHoursBalance}</span>
                <Clock className={styles.style124_28} />
              </div>

              <div className={styles.style127_29}>
                <span className={styles.style128_30}>
                  {subscriptionHours.toFixed(1)}
                </span>
                <span className={styles.style131_31}>{copy.hours}</span>
              </div>

              <div className={styles.style134_32}>
                <span>{copy.paid}: <span className={styles.style135_33}>{formatMinutes(paidMinutesRemaining, language)}</span></span>
                <span>{copy.bonus}: <span className={styles.style136_34}>{formatMinutes(bonusMinutesRemaining, language)}</span></span>
              </div>

              {SHOW_WORK_PACKAGES && (
                <div className={styles.style139_35}>
                  <span>{copy.currentPackage}: <span className={styles.style140_36}>{activePackageName || copy.none}</span></span>
                  <span>{copy.fromServer}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className={styles.style146_37}>
            <CardContent className={styles.style147_38}>
              <div className={styles.style148_39}>
                <span className={styles.style149_40}>{copy.balanceStatus}</span>
                <Sparkles className={styles.style150_41} />
              </div>

              <div className={styles.style153_42}>
                <span className={styles.style154_43}>
                  {walletLoaded ? (SHOW_WORK_PACKAGES ? copy.noActivePackages : copy.balanceStatus) : copy.loadingBalance}
                </span>
                <p className={styles.style157_44}>
                  {copy.serverDataHint}
                </p>
              </div>

              <div className={styles.style162_45}>
                <span>{copy.noDemoNumbers}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {SHOW_WORK_PACKAGES && isDriver && (
        <div className={styles.style171_46}>
          <div className={styles.style172_47}>
            <h2 className={styles.style173_48}>{copy.workPackages}</h2>
            <p className={styles.style174_49}>{copy.workPackagesDescription}</p>
          </div>

          <div className={styles.style177_50}>
            <DriverPackageCard
              badge={`1 ${currencyLabel || copy.currency}`}
              hours={`24 ${copy.hours}`}
              title={copy.basicPackage}
              description={copy.basicPackageDescription}
              onPurchase={() => setPurchasingPackage('basic')}
              purchaseLabel={copy.buyPackage}
            />
            <DriverPackageCard
              badge={`10 ${currencyLabel || copy.currency}`}
              hours={`100 ${copy.hours}`}
              title={copy.proPackage}
              description={copy.proPackageDescription}
              onPurchase={() => setPurchasingPackage('pro')}
              purchaseLabel={copy.buyPackage}
              highlight
            />
          </div>
        </div>
      )}

      <GeoPaymentGateway
        isOpen={isChargingFunds}
        onClose={() => setIsChargingFunds(false)}
      />

      {SHOW_WORK_PACKAGES && (
        <WalletPurchaseModal
          purchasingPackage={purchasingPackage}
          loading={loading}
          onConfirm={handlePurchasePackage}
          onCancel={() => setPurchasingPackage(null)}
          copy={copy}
        />
      )}

      <SovereignFinancialActivityChart
        transactions={transactions}
        balanceJD={balanceJD}
        currencyLabel={currencyLabel}
      />

      <WalletTransactionsList
        transactions={transactions}
        isArabic={isArabic}
        copy={copy}
      />

      <div className={cn(styles.style284_82, isArabic ? styles.style284_83 : styles.style284_84, styles.style284_85)}>
        <HelpCircle className={styles.style285_86} />
        <p>
          <strong>{copy.noteTitle}</strong> {copy.noteText}
        </p>
      </div>
    </div>
  );
}
