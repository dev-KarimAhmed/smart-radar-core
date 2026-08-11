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
import { GeoPaymentGateway } from '@/shared/components/geo-payment-gateway';
import { SovereignFinancialActivityChart } from './financial-chart';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { cn } from '@/lib/utils';
const styles = {
  style39_1: "relative overflow-hidden border border-[#14B8A6]/20 bg-[#0F172A]/90 backdrop-blur-md shadow-xl",
  style40_2: "absolute right-0 top-0 h-16 w-16 rounded-full bg-[#14B8A6]/5 blur-xl",
  style41_3: "flex h-full flex-col justify-between p-5",
  style42_4: "flex items-start justify-between",
  style43_5: "text-xs font-bold text-gray-400",
  style44_6: "text-xs font-bold text-[#14B8A6]",
  style47_7: "my-3",
  style48_8: "text-3xl font-black tracking-tight text-white",
  style51_9: "mr-1.5 text-sm font-bold text-[#14B8A6]",
  style56_10: "h-10 w-full rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-xs font-bold text-[#14B8A6] transition-all hover:bg-[#14B8A6]/20",
  style58_11: "ml-1 h-4 w-4",
  style93_12: "mx-auto w-full max-w-lg pb-10 font-sans",
  style93_13: "text-right",
  style93_14: "text-left",
  style94_15: "mb-6 flex items-center justify-between",
  style95_16: "flex items-center gap-2",
  style96_17: "rounded-2xl border border-emerald-800/20 bg-emerald-950/40 p-2.5 text-emerald-400",
  style97_18: "h-6 w-6",
  style100_19: "text-xl font-black text-white",
  style101_20: "text-xs font-medium text-emerald-500/70",
  style104_21: "border-emerald-500/20 bg-emerald-950/25 font-mono text-[10px] text-emerald-400",
  style109_22: "mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2",
  style119_23: "relative overflow-hidden border border-[#14B8A6]/20 bg-[#0F172A]/90 backdrop-blur-md shadow-xl",
  style120_24: "absolute right-0 top-0 h-20 w-20 rounded-full bg-[#14B8A6]/10 blur-xl",
  style121_25: "flex h-full flex-col justify-between p-5",
  style122_26: "flex items-start justify-between",
  style123_27: "text-xs font-bold text-gray-300",
  style124_28: "h-4 w-4 text-[#14B8A6]",
  style127_29: "my-3",
  style128_30: "text-4xl font-black tracking-tighter text-[#14B8A6]",
  style131_31: "mr-2 text-xs font-bold text-gray-400",
  style134_32: "flex items-center justify-between border-t border-white/[0.06] py-1.5 text-[10px] text-gray-400",
  style135_33: "font-extrabold text-emerald-300",
  style136_34: "font-extrabold text-amber-400",
  style139_35: "flex items-center justify-between text-[10px] text-gray-400",
  style140_36: "font-bold text-[#14B8A6]",
  style146_37: "overflow-hidden border border-[#14B8A6]/20 bg-[#0F172A]/90 backdrop-blur-md shadow-xl",
  style147_38: "flex h-full flex-col justify-between p-5",
  style148_39: "flex items-start justify-between",
  style149_40: "text-xs font-bold text-gray-400",
  style150_41: "h-4 w-4 text-[#14B8A6]",
  style153_42: "my-3",
  style154_43: "text-2xl font-black text-white",
  style157_44: "mt-1 text-[10px] text-gray-500",
  style162_45: "flex h-10 items-center justify-start text-[11px] text-emerald-400",
  style171_46: "mb-6 space-y-4",
  style172_47: "px-1 text-right",
  style173_48: "text-sm font-bold text-gray-300",
  style174_49: "mt-0.5 text-[10px] text-gray-500",
  style177_50: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  style210_51: "fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm",
  style212_52: "relative w-full max-w-sm rounded-2xl border-2 border-[#14B8A6]/20 bg-[#0A0F1D] p-6 text-white shadow-2xl",
  style213_53: "mb-3 flex items-center justify-center gap-2 text-center text-lg font-black text-[#14B8A6]",
  style214_54: "h-5 w-5 text-[#14B8A6]",
  style217_55: "mb-5 text-center text-xs leading-relaxed text-gray-300",
  style221_56: "flex justify-center gap-3",
  style225_57: "h-11 flex-1 rounded-xl bg-[#14B8A6] text-xs font-bold text-[#031315] hover:bg-[#2DD4BF]",
  style227_58: "h-4 w-4 animate-spin",
  style233_59: "h-11 flex-1 rounded-xl border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10",
  style249_60: "rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/90 backdrop-blur-md shadow-xl",
  style250_61: "border-b border-white/[0.06] p-4 pb-2",
  style251_62: "text-sm font-bold text-white",
  style252_63: "text-right",
  style252_64: "text-left",
  style252_65: "text-[10px] text-gray-500",
  style254_66: "max-h-[220px] space-y-2 overflow-y-auto p-4",
  style257_67: "flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3 text-xs",
  style258_68: "flex items-center gap-3",
  style259_69: "rounded-lg p-2",
  style260_70: "bg-[#14B8A6]/10 text-[#14B8A6]",
  style260_71: "bg-red-950/30 text-red-400",
  style262_72: "h-4 w-4",
  style262_73: "h-4 w-4",
  style264_74: "text-right",
  style265_75: "text-[11px] font-bold text-white",
  style266_76: "mt-0.5 text-[9px] text-gray-500",
  style270_77: "flex flex-col items-end text-[11px] font-bold",
  style271_78: "text-[#14B8A6]",
  style271_79: "text-red-400",
  style274_80: "text-[8px] uppercase tracking-widest text-gray-600",
  style279_81: "py-6 text-center text-xs text-gray-500",
  style284_82: "mt-4 flex items-start gap-2 rounded-xl border border-[#14B8A6]/15 bg-[#14B8A6]/5 p-4",
  style284_83: "text-right",
  style284_84: "text-left",
  style284_85: "text-[10px] leading-normal text-gray-400",
  style285_86: "mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]",
  style312_87: "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F172A]/40 transition-all hover:border-[#14B8A6]/30 hover:bg-[#0F172A]/60",
  style313_88: "p-5",
  style314_89: "mb-3 flex items-center justify-between",
  style315_90: "bg-yellow-950 text-yellow-400",
  style315_91: "bg-[#14B8A6]/10 text-[#14B8A6]",
  style318_92: "font-mono text-xs font-bold text-yellow-500",
  style318_93: "font-mono text-xs font-bold text-[#14B8A6]",
  style322_94: "mb-2 text-base font-black text-white",
  style323_95: "text-[11px] leading-normal text-gray-400",
  style325_96: "p-5 pt-0",
  style329_97: "h-10 w-full rounded-xl bg-yellow-600 text-xs font-extrabold text-black hover:bg-yellow-500",
  style330_98: "h-10 w-full rounded-xl bg-[#14B8A6] text-xs font-bold text-[#031315] hover:bg-[#2DD4BF]",
  style333_99: "ml-1 h-3.5 w-3.5",
} as const;


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

              <div className={styles.style139_35}>
                <span>{copy.currentPackage}: <span className={styles.style140_36}>{activePackageName || copy.none}</span></span>
                <span>{copy.fromServer}</span>
              </div>
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
                  {walletLoaded ? copy.noActivePackages : copy.loadingBalance}
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

      {isDriver && (
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

      <AnimatePresence>
        {purchasingPackage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.style210_51}
          >
            <div className={styles.style212_52}>
              <h3 className={styles.style213_53}>
                <CheckCircle2 className={styles.style214_54} />
                {copy.confirmPackagePurchase}
              </h3>
              <p className={styles.style217_55}>
                {copy.confirmPackageDescription}
              </p>

              <div className={styles.style221_56}>
                <Button
                  onClick={() => handlePurchasePackage(purchasingPackage)}
                  disabled={loading}
                  className={styles.style225_57}
                >
                  {loading ? <RefreshCw className={styles.style227_58} /> : copy.confirmPurchase}
                </Button>
                <Button
                  onClick={() => setPurchasingPackage(null)}
                  disabled={loading}
                  variant="outline"
                  className={styles.style233_59}
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

      <Card className={styles.style249_60}>
        <CardHeader className={styles.style250_61}>
          <CardTitle className={styles.style251_62}>{copy.transactions}</CardTitle>
          <CardDescription className={cn(isArabic ? styles.style252_63 : styles.style252_64, styles.style252_65)}>{copy.transactionsDescription}</CardDescription>
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
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(tx.currency === 'ساعة' ? 1 : 2)} {tx.currency}
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

      <div className={cn(styles.style284_82, isArabic ? styles.style284_83 : styles.style284_84, styles.style284_85)}>
        <HelpCircle className={styles.style285_86} />
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
