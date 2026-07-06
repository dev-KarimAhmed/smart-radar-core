'use client';

import React, { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { GeoPaymentGateway } from '@/components/shared/geo-payment-gateway';
import { SovereignFinancialActivityChart } from '@/components/dashboard/financial-chart';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface BalanceDisplayProps {
  balance: number;
  currencyLabel: string;
  walletLoaded: boolean;
  onChargeFunds: () => void;
  copy: {
    balance: string;
    chargeBalance: string;
  };
}

function BalanceDisplay({ balance, currencyLabel, walletLoaded, onChargeFunds, copy }: BalanceDisplayProps) {
  return (
    <Card className="relative overflow-hidden border border-emerald-900/40 bg-[#050D05]/95 shadow-xl">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-emerald-500/5 blur-xl" />
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold text-gray-400">{copy.balance}</span>
          <span className="text-xs font-bold text-emerald-400">{currencyLabel || '-'}</span>
        </div>

        <div className="my-3">
          <span className="text-3xl font-black tracking-tight text-white">
            {walletLoaded ? balance.toFixed(2) : '...'}
          </span>
          {currencyLabel && <span className="mr-1.5 text-sm font-bold text-emerald-500">{currencyLabel}</span>}
        </div>

        <Button
          onClick={onChargeFunds}
          className="h-10 w-full rounded-xl border border-emerald-500/30 bg-emerald-600/20 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-600/30"
        >
          <CreditCard className="ml-1 h-4 w-4" />
          {copy.chargeBalance}
        </Button>
      </CardContent>
    </Card>
  );
}

export function WalletTab() {
  const { user } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const copy = walletCopy[language];
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
  const currencyLabel = isArabic ? (user?.currencyAr || user?.currencyEn || '') : (user?.currencyEn || user?.currencyAr || '');

  const handlePurchasePackage = useCallback(async (pkgType: 'basic' | 'pro') => {
    const success = await purchaseDriverPackage(pkgType);
    if (success) setPurchasingPackage(null);
  }, [purchaseDriverPackage]);

  return (
    <div className={`mx-auto w-full max-w-lg pb-10 font-sans ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-emerald-800/20 bg-emerald-950/40 p-2.5 text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{copy.title}</h1>
            <p className="text-xs font-medium text-emerald-500/70">{copy.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-950/25 font-mono text-[10px] text-emerald-400">
          {isDriver ? copy.driverAccount : copy.riderAccount}
        </Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BalanceDisplay
          balance={balanceJD}
          currencyLabel={currencyLabel}
          walletLoaded={walletLoaded}
          onChargeFunds={() => setIsChargingFunds(true)}
          copy={copy}
        />

        {isDriver ? (
          <Card className="relative overflow-hidden border border-emerald-500/30 bg-[#071307]/90 shadow-xl">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-gray-300">{copy.workHoursBalance}</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="my-3">
                <span className="text-4xl font-black tracking-tighter text-emerald-400">
                  {subscriptionHours.toFixed(1)}
                </span>
                <span className="mr-2 text-xs font-bold text-gray-400">{copy.hours}</span>
              </div>

              <div className="flex items-center justify-between border-t border-emerald-950/40 py-1.5 text-[10px] text-gray-400">
                <span>{copy.paid}: <span className="font-extrabold text-emerald-300">{formatMinutes(paidMinutesRemaining, language)}</span></span>
                <span>{copy.bonus}: <span className="font-extrabold text-amber-400">{formatMinutes(bonusMinutesRemaining, language)}</span></span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{copy.currentPackage}: <span className="font-bold text-emerald-400">{activePackageName || copy.none}</span></span>
                <span>{copy.fromServer}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-emerald-900/30 bg-[#050D05]/95 shadow-xl">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-gray-400">{copy.balanceStatus}</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="my-3">
                <span className="text-2xl font-black text-white">
                  {walletLoaded ? copy.noActivePackages : copy.loadingBalance}
                </span>
                <p className="mt-1 text-[10px] text-gray-500">
                  {copy.serverDataHint}
                </p>
              </div>

              <div className="flex h-10 items-center justify-start text-[11px] text-emerald-400">
                <span>{copy.noDemoNumbers}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isDriver && (
        <div className="mb-6 space-y-4">
          <div className="px-1 text-right">
            <h2 className="text-sm font-bold text-gray-300">{copy.workPackages}</h2>
            <p className="mt-0.5 text-[10px] text-gray-500">{copy.workPackagesDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <AnimatePresence>
        {purchasingPackage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-sm rounded-2xl border-2 border-emerald-500/30 bg-[#091B09] p-6 text-white shadow-2xl">
              <h3 className="mb-3 flex items-center justify-center gap-2 text-center text-lg font-black text-emerald-400">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                {copy.confirmPackagePurchase}
              </h3>
              <p className="mb-5 text-center text-xs leading-relaxed text-gray-300">
                {copy.confirmPackageDescription}
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => handlePurchasePackage(purchasingPackage)}
                  disabled={loading}
                  className="h-11 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : copy.confirmPurchase}
                </Button>
                <Button
                  onClick={() => setPurchasingPackage(null)}
                  disabled={loading}
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10"
                >
                  {copy.back}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SovereignFinancialActivityChart
        transactions={transactions}
        balanceJD={balanceJD}
        currencyLabel={currencyLabel}
      />

      <Card className="rounded-2xl border border-emerald-900/30 bg-[#030903]/95 shadow-xl">
        <CardHeader className="border-b border-emerald-900/20 p-4 pb-2">
          <CardTitle className="text-sm font-bold text-white">{copy.transactions}</CardTitle>
          <CardDescription className={`${isArabic ? 'text-right' : 'text-left'} text-[10px] text-gray-500`}>{copy.transactionsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[220px] space-y-2 overflow-y-auto p-4">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${
                    tx.amount >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-red-950/30 text-red-400'
                  }`}>
                    {tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white">{tx.description}</p>
                    <p className="mt-0.5 text-[9px] text-gray-500">{tx.createdAt}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-[11px] font-bold">
                  <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(tx.currency === 'ساعة' ? 1 : 2)} {tx.currency}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-gray-600">{tx.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-gray-500">{copy.noTransactions}</div>
          )}
        </CardContent>
      </Card>

      <div className={`mt-4 flex items-start gap-2 rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4 ${isArabic ? 'text-right' : 'text-left'} text-[10px] leading-normal text-gray-400`}>
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p>
          <strong>{copy.noteTitle}</strong> {copy.noteText}
        </p>
      </div>
    </div>
  );
}

function DriverPackageCard({
  badge,
  hours,
  title,
  description,
  onPurchase,
  purchaseLabel,
  highlight = false,
}: {
  badge: string;
  hours: string;
  title: string;
  description: string;
  onPurchase: () => void;
  purchaseLabel: string;
  highlight?: boolean;
}) {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-900/30 bg-black/40 transition-all hover:border-emerald-500/20 hover:bg-black/60">
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge className={highlight ? 'bg-yellow-950 text-yellow-400' : 'bg-emerald-950 text-emerald-400'}>
            {badge}
          </Badge>
          <span className={highlight ? 'font-mono text-xs font-bold text-yellow-500' : 'font-mono text-xs font-bold text-emerald-500'}>
            {hours}
          </span>
        </div>
        <h3 className="mb-2 text-base font-black text-white">{title}</h3>
        <p className="text-[11px] leading-normal text-gray-400">{description}</p>
      </div>
      <div className="p-5 pt-0">
        <Button
          onClick={onPurchase}
          className={highlight
            ? 'h-10 w-full rounded-xl bg-yellow-600 text-xs font-extrabold text-black hover:bg-yellow-500'
            : 'h-10 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500'
          }
        >
          <Zap className="ml-1 h-3.5 w-3.5" />
          {purchaseLabel}
        </Button>
      </div>
    </Card>
  );
}

function formatMinutes(totalMinutes: number, language: 'ar' | 'en') {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return language === 'ar' ? `${hours} س ${minutes} د` : `${hours}h ${minutes}m`;
}

const walletCopy = {
  ar: {
    back: 'تراجع',
    balance: 'الرصيد',
    balanceStatus: 'حالة الرصيد',
    basicPackage: 'الباقة الأساسية',
    basicPackageDescription: 'مناسبة للتجربة أو العمل الخفيف خلال الأسبوع.',
    bonus: 'إضافي',
    buyPackage: 'شراء الباقة',
    chargeBalance: 'شحن الرصيد',
    confirmPackageDescription: 'سيتم تنفيذ الشراء من الخادم. إذا لم تكن الصلاحيات جاهزة فلن يتم تعديل الرصيد محلياً.',
    confirmPackagePurchase: 'تأكيد شراء باقة العمل',
    confirmPurchase: 'تأكيد الشراء',
    currency: 'عملة',
    currentPackage: 'الباقة الحالية',
    driverAccount: 'حساب السائق',
    fromServer: 'تظهر من الخادم',
    hourShort: 'س',
    hours: 'ساعة',
    loadingBalance: 'جاري تحميل الرصيد...',
    noActivePackages: 'لا توجد باقات نشطة',
    noDemoNumbers: 'لا نعرض أرقاماً تجريبية في هذه الصفحة.',
    none: 'لا توجد',
    noTransactions: 'لا توجد عمليات في الرصيد حالياً.',
    noteText: 'تظهر بيانات الرصيد والعمليات كما تصل من الخادم. إذا لم تظهر بيانات، فهذا يعني أنه لا توجد عمليات مسجلة حتى الآن.',
    noteTitle: 'ملاحظة:',
    paid: 'مدفوع',
    proPackage: 'باقة العمل المكثف',
    proPackageDescription: 'مناسبة للسائقين النشطين وتمنح ساعات عمل أكثر.',
    riderAccount: 'حساب الراكب',
    serverDataHint: 'تظهر بيانات الرصيد والعمليات بعد وصولها من الخادم.',
    subtitle: 'إدارة الرصيد والمدفوعات',
    title: 'الرصيد',
    transactions: 'العمليات',
    transactionsDescription: 'آخر عمليات الرصيد من الخادم',
    workHoursBalance: 'رصيد ساعات العمل',
    workPackages: 'باقات ساعات العمل',
    workPackagesDescription: 'اختر باقة مناسبة لوقت عملك. تتم عملية الشراء من الخادم فقط.',
  },
  en: {
    back: 'Back',
    balance: 'Balance',
    balanceStatus: 'Balance status',
    basicPackage: 'Basic package',
    basicPackageDescription: 'Good for testing or light weekly work.',
    bonus: 'Bonus',
    buyPackage: 'Buy package',
    chargeBalance: 'Add balance',
    confirmPackageDescription: 'The purchase will be processed by the server. If permissions are not ready, no local balance will be changed.',
    confirmPackagePurchase: 'Confirm work package purchase',
    confirmPurchase: 'Confirm purchase',
    currency: 'currency',
    currentPackage: 'Current package',
    driverAccount: 'Driver account',
    fromServer: 'From server',
    hourShort: 'h',
    hours: 'hours',
    loadingBalance: 'Loading balance...',
    noActivePackages: 'No active packages',
    noDemoNumbers: 'No demo numbers are shown on this page.',
    none: 'None',
    noTransactions: 'No balance transactions yet.',
    noteText: 'Balance and transactions are shown exactly as received from the server. If no data appears, there are no recorded transactions yet.',
    noteTitle: 'Note:',
    paid: 'Paid',
    proPackage: 'High activity package',
    proPackageDescription: 'For active drivers who need more working hours.',
    riderAccount: 'Rider account',
    serverDataHint: 'Balance and transaction data appears after it arrives from the server.',
    subtitle: 'Manage balance and payments',
    title: 'Wallet',
    transactions: 'Transactions',
    transactionsDescription: 'Latest balance transactions from the server',
    workHoursBalance: 'Working hours balance',
    workPackages: 'Working hour packages',
    workPackagesDescription: 'Choose a package that fits your working time. Purchases are processed by the server only.',
  },
} as const;
