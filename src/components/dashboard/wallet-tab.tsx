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

interface BalanceDisplayProps {
  balance: number;
  currencyLabel: string;
  walletLoaded: boolean;
  onChargeFunds: () => void;
}

function BalanceDisplay({ balance, currencyLabel, walletLoaded, onChargeFunds }: BalanceDisplayProps) {
  return (
    <Card className="relative overflow-hidden border border-emerald-900/40 bg-[#050D05]/95 shadow-xl">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-emerald-500/5 blur-xl" />
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold text-gray-400">الرصيد</span>
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
          شحن الرصيد
        </Button>
      </CardContent>
    </Card>
  );
}

export function WalletTab() {
  const { user } = useAuth();
  const {
    loading,
    purchaseDriverPackage,
    balanceJD,
    paidHoursMin,
    bonusHoursMin,
    subscriptionHours,
    activePackageName,
    isDriver,
    transactions,
    walletLoaded,
  } = useSovereignWallet(user);

  const [isChargingFunds, setIsChargingFunds] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<'basic' | 'pro' | null>(null);
  const currencyLabel = user?.currencyAr || user?.currencyEn || '';

  const handlePurchasePackage = useCallback(async (pkgType: 'basic' | 'pro') => {
    const success = await purchaseDriverPackage(pkgType);
    if (success) setPurchasingPackage(null);
  }, [purchaseDriverPackage]);

  return (
    <div className="mx-auto w-full max-w-lg pb-10 text-right font-sans" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-emerald-800/20 bg-emerald-950/40 p-2.5 text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">الرصيد</h1>
            <p className="text-xs font-medium text-emerald-500/70">إدارة الرصيد والمدفوعات</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-950/25 font-mono text-[10px] text-emerald-400">
          {isDriver ? 'حساب السائق' : 'حساب الراكب'}
        </Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BalanceDisplay
          balance={balanceJD}
          currencyLabel={currencyLabel}
          walletLoaded={walletLoaded}
          onChargeFunds={() => setIsChargingFunds(true)}
        />

        {isDriver ? (
          <Card className="relative overflow-hidden border border-emerald-500/30 bg-[#071307]/90 shadow-xl">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-gray-300">رصيد ساعات العمل</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="my-3">
                <span className="text-4xl font-black tracking-tighter text-emerald-400">
                  {subscriptionHours.toFixed(1)}
                </span>
                <span className="mr-2 text-xs font-bold text-gray-400">ساعة</span>
              </div>

              <div className="flex items-center justify-between border-t border-emerald-950/40 py-1.5 text-[10px] text-gray-400">
                <span>مدفوع: <span className="font-extrabold text-emerald-300">{(paidHoursMin / 60).toFixed(1)} س</span></span>
                <span>إضافي: <span className="font-extrabold text-amber-400">{(bonusHoursMin / 60).toFixed(1)} س</span></span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>الباقة الحالية: <span className="font-bold text-emerald-400">{activePackageName || 'لا توجد'}</span></span>
                <span>تظهر من الخادم</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-emerald-900/30 bg-[#050D05]/95 shadow-xl">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-gray-400">حالة الرصيد</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="my-3">
                <span className="text-2xl font-black text-white">
                  {walletLoaded ? 'لا توجد باقات نشطة' : 'جاري تحميل الرصيد...'}
                </span>
                <p className="mt-1 text-[10px] text-gray-500">
                  تظهر بيانات الرصيد والعمليات بعد وصولها من الخادم.
                </p>
              </div>

              <div className="flex h-10 items-center justify-start text-[11px] text-emerald-400">
                <span>لا نعرض أرقاماً تجريبية في هذه الصفحة.</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isDriver && (
        <div className="mb-6 space-y-4">
          <div className="px-1 text-right">
            <h2 className="text-sm font-bold text-gray-300">باقات ساعات العمل</h2>
            <p className="mt-0.5 text-[10px] text-gray-500">اختر باقة مناسبة لوقت عملك. تتم عملية الشراء من الخادم فقط.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DriverPackageCard
              badge={`1 ${currencyLabel || 'عملة'}`}
              hours="24 ساعة"
              title="الباقة الأساسية"
              description="مناسبة للتجربة أو العمل الخفيف خلال الأسبوع."
              onPurchase={() => setPurchasingPackage('basic')}
            />
            <DriverPackageCard
              badge={`10 ${currencyLabel || 'عملة'}`}
              hours="100 ساعة"
              title="باقة العمل المكثف"
              description="مناسبة للسائقين النشطين وتمنح ساعات عمل أكثر."
              onPurchase={() => setPurchasingPackage('pro')}
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
                تأكيد شراء باقة العمل
              </h3>
              <p className="mb-5 text-center text-xs leading-relaxed text-gray-300">
                سيتم تنفيذ الشراء من الخادم. إذا لم تكن الصلاحيات جاهزة فلن يتم تعديل الرصيد محلياً.
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => handlePurchasePackage(purchasingPackage)}
                  disabled={loading}
                  className="h-11 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'تأكيد الشراء'}
                </Button>
                <Button
                  onClick={() => setPurchasingPackage(null)}
                  disabled={loading}
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10"
                >
                  تراجع
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
          <CardTitle className="text-sm font-bold text-white">العمليات</CardTitle>
          <CardDescription className="text-right text-[10px] text-gray-500">آخر عمليات الرصيد من الخادم</CardDescription>
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
            <div className="py-6 text-center text-xs text-gray-500">لا توجد عمليات في الرصيد حالياً.</div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4 text-right text-[10px] leading-normal text-gray-400">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p>
          <strong>ملاحظة:</strong> تظهر بيانات الرصيد والعمليات كما تصل من الخادم. إذا لم تظهر بيانات، فهذا يعني أنه لا توجد عمليات مسجلة حتى الآن.
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
  highlight = false,
}: {
  badge: string;
  hours: string;
  title: string;
  description: string;
  onPurchase: () => void;
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
          شراء الباقة
        </Button>
      </div>
    </Card>
  );
}
