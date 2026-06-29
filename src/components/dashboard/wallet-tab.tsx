'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { 
  Wallet, Sparkles, RefreshCw, Zap, Clock, 
  CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { GeoPaymentGateway } from '@/components/shared/geo-payment-gateway';
import { SovereignFinancialActivityChart } from '@/components/dashboard/financial-chart';

interface Transaction {
  id: string;
  type: 'charge' | 'purchase' | 'trip_deduction';
  amount: number;
  currency: 'د.أ' | 'ساعة';
  description: string;
  createdAt: string;
  status: 'completed' | 'pending';
  timestamp?: number;
}

/**
 * 🛡️ [التعقيم الماسي V2.6-Secured] WalletTab
 * Pure Visual Consumer of financial transactions and subscription state.
 * Absolutely NO local state calculation, database writes, or direct setDoc/updateDoc logic.
 * Conforms to Single Responsibility Principle (SRP).
 */
interface SovereignBalanceDisplayProps {
  balanceJD: number;
  onChargeFunds: () => void;
}

/**
 * 🪙 [التعقيم الماسي V2.6-Secured - مكون عرض الرصيد المستقل]
 * Pure visual consumer for current balance state.
 * Contains absolutely no mathematical computation, mutation, or write logic.
 */
export function SovereignBalanceDisplay({ balanceJD, onChargeFunds }: SovereignBalanceDisplayProps) {
  return (
    <Card className="bg-[#050D05]/95 border border-emerald-900/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-gray-400">الرصيد النقدي للدعم</span>
          <span className="text-xs font-bold text-emerald-400">JD</span>
        </div>
        
        <div className="my-3">
          <span className="text-3xl font-black text-white tracking-tight">
            {balanceJD.toFixed(2)}
          </span>
          <span className="text-sm font-bold text-emerald-500 mr-1.5">دينار أردني</span>
        </div>

        <Button 
          onClick={onChargeFunds}
          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 h-10 rounded-xl text-xs font-bold transition-all"
        >
          <CreditCard className="w-4 h-4 ml-1" />
          تعبئة الرصيد النقدي
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
    transactions
  } = useSovereignWallet(user);
  
  const [isChargingFunds, setIsChargingFunds] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<'pulse' | 'transit' | null>(null);

  // Handle purchasing driver packages (delegate cleanly to hook)
  const handlePurchasePackage = useCallback(async (pkgType: 'pulse' | 'transit') => {
    const success = await purchaseDriverPackage(pkgType);
    if (success) {
      setPurchasingPackage(null);
    }
  }, [purchaseDriverPackage]);

  return (
    <div className="w-full max-w-lg mx-auto pb-10 font-sans text-right" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/20 text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">الخزينة والمحفظة السيادية</h1>
            <p className="text-xs text-emerald-500/60 font-medium">إدارة رصيد الدعم وباقات البث الملاحي</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-950/25 text-emerald-400 font-mono text-[10px]">
          {isDriver ? 'محفظة كابتن' : 'محفظة راكب'}
        </Badge>
      </div>

      {/* Main Stats container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Cash Balance JD Card */}
        <SovereignBalanceDisplay balanceJD={balanceJD} onChargeFunds={() => setIsChargingFunds(true)} />

        {/* Subscription Hours Card (Only visible to Driver) */}
        {isDriver ? (
          <Card className="bg-[#071307]/90 border border-emerald-500/30 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-xl rounded-full animate-pulse-slow" />
            <div className="absolute top-1 left-2">
              <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                بث آمن
              </span>
            </div>
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-300">رصيد البث الملاحي</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              
              <div className="my-3">
                <span className="text-4xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                  {subscriptionHours.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-gray-400 mr-2">ساعة حقيقية</span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-emerald-950/40 pt-1.5 pb-1.5 font-mono">
                <span>باقة مدفوعة: <span className="text-emerald-300 font-extrabold">{(paidHoursMin / 60).toFixed(1)} س</span></span>
                <span>بونص رتب الكباتن: <span className="text-amber-400 font-extrabold">{(bonusHoursMin / 60).toFixed(1)} س</span></span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>الباقة الحالية: <span className="text-emerald-400 font-bold">{activePackageName}</span></span>
                <span>تناقص بالدقائق الفعلية</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Rider loyalty points equivalent for design rhythm */
          <Card className="bg-[#050D05]/95 border border-emerald-900/30 shadow-xl overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400">رتبة ولاء المسافر</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              
              <div className="my-3">
                <span className="text-2xl font-black text-white">النبض الماسي</span>
                <p className="text-[10px] text-gray-500 mt-1">تمنحك الأولوية التكتيكية وقبول أسرع للعروض في رادار اللواء</p>
              </div>

              <div className="h-10 flex items-center justify-start text-[11px] text-emerald-400">
                <span>● حسابك معفى بالكامل من أي اشتراكات شهرية أو عمولات مقطوعة</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Driver Hours Packages */}
      {isDriver && (
        <div className="mb-6 space-y-4">
          <div className="px-1 text-right">
            <h2 className="text-sm font-bold text-gray-300">حزم شحن الساعات وقيمها المعتدلة</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">شراء ساعات بث ملاحي حرة متناسبة مع أوقات فراغك وعملك</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Package 1 */}
            <Card className="bg-black/40 hover:bg-black/60 border border-emerald-900/30 hover:border-emerald-500/20 transition-all rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-emerald-950 text-emerald-400 hover:bg-emerald-950 text-[10px] font-bold">باقة 1 د.أ</Badge>
                  <span className="text-xs font-bold text-emerald-500 font-mono">24 ساعة عمل</span>
                </div>
                <h3 className="text-base font-black text-white mb-2">باقة النبض الأساسية</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  تحتوي على <span className="text-white font-bold">24 ساعة صافية من البث الملاحي المفتوح</span>. يمكنك استهلاكها على مدار أسبوع أو شهر حسب نمط عملك الميداني دون إلزام.
                </p>
              </div>
              <div className="p-5 pt-0">
                <Button 
                  onClick={() => setPurchasingPackage('pulse')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl font-sans"
                >
                  <Zap className="w-3.5 h-3.5 ml-1 animate-pulse" />
                  شراء الباقة (1 دينار أردني)
                </Button>
              </div>
            </Card>

            {/* Package 2 */}
            <Card className="bg-black/40 hover:bg-black/60 border border-emerald-900/30 hover:border-emerald-500/20 transition-all rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-yellow-950 text-yellow-400 hover:bg-yellow-950 text-[10px] font-bold">باقة 10 د.أ</Badge>
                  <span className="text-xs font-bold text-yellow-500 font-mono">100 ساعة عمل</span>
                </div>
                <h3 className="text-base font-black text-white mb-2">باقة العبور الكبرى</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  مصممة <span className="text-white font-bold">للكباتن المحترفين وأصحاب الهمم</span>. تمنحك عبوراً ممتداً فائق القوة، وتظهر لك كـ "رصيد نسيجي آمن" يتناقص فقط بدقائق العمل الفعلية والرحلات المستجابة.
                </p>
              </div>
              <div className="p-5 pt-0">
                <Button 
                  onClick={() => setPurchasingPackage('transit')}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold text-xs h-10 rounded-xl font-sans"
                >
                  <Zap className="w-3.5 h-3.5 ml-1 animate-pulse" />
                  شراء الباقة (10 دنانير أردنية)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Geo Payment Gateway Modal Integration */}
      <GeoPaymentGateway
        isOpen={isChargingFunds}
        onClose={() => setIsChargingFunds(false)}
      />

      {/* Package confirmation overlay */}
      <AnimatePresence>
        {purchasingPackage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <div className="bg-[#091B09] border-2 border-emerald-500/30 p-6 rounded-2xl w-full max-w-sm text-white shadow-2xl relative">
              <h3 className="text-lg font-black text-center text-emerald-400 mb-3 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                تأكيد حجز البث الملاحي
              </h3>
              <p className="text-center text-xs text-gray-300 leading-relaxed mb-5">
                سيقيد مبلغ <span className="text-emerald-400 font-bold">{purchasingPackage === 'pulse' ? '1.00' : '10.00'} د.أ</span> من رصيد محفظتك، مقابل إمداد رصيدك بـ <span className="text-emerald-400 font-extrabold">{purchasingPackage === 'pulse' ? '24' : '100'} ساعة عمل حقيقية</span>.
              </p>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => handlePurchasePackage(purchasingPackage)}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl text-xs"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'موافق، شراء وتفعيل'}
                </Button>
                <Button 
                  onClick={() => setPurchasingPackage(null)}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                >
                  تراجع
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* D3.js Financial Activity Chart Component */}
      <SovereignFinancialActivityChart transactions={transactions} balanceJD={balanceJD} />

      {/* Transaction History Logs */}
      <Card className="bg-[#030903]/95 border border-emerald-900/30 rounded-2xl shadow-xl">
        <CardHeader className="p-4 border-b border-emerald-900/20 pb-2">
          <CardTitle className="text-sm font-bold text-white">الأرشيف الحسابي للنشاطات</CardTitle>
          <CardDescription className="text-[10px] text-gray-500 text-right">رصد لجميع النبضات النقدية ومصروفات العمل</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        if (tx.type === 'charge') {
                          setIsChargingFunds(true);
                        }
                      }}
                      disabled={tx.type !== 'charge'}
                      className={`p-2 rounded-lg transition-all ${
                        tx.type === 'charge' 
                          ? 'bg-emerald-950/50 text-emerald-400 hover:bg-emerald-400 hover:text-black hover:scale-105 active:scale-95 cursor-pointer border border-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                          : tx.type === 'purchase'
                          ? 'bg-blue-950/40 text-blue-400'
                          : 'bg-red-950/30 text-red-400'
                      }`}
                    >
                      {tx.type === 'charge' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </button>
                    {tx.type === 'charge' && (
                      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none transition-all duration-200 origin-bottom-right z-50 w-64 p-3 bg-[#030d06] border border-emerald-500/40 rounded-xl shadow-2xl text-[10px] text-gray-300 font-sans leading-relaxed">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                          <span>شحن فوري ذري عبر CliQ</span>
                        </div>
                        <p>
                          عملية شحن نقدي فورية أحادية النبضة (Single-Write) تلتزم ببروتوكول (88) لمنع هدر الموارد والأداء السحابي. يتم إتمام المعاملة بنقرة واحدة ذرية تمنع الثرثرة الشبكية والصدى المزدوج.
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-emerald-950 flex justify-between text-[8px] text-emerald-500/70 font-mono">
                          <span>PROTOCOL-88 APPROVED</span>
                          <span>ATOMIC SSOT</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-[11px]">{tx.description}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{tx.createdAt}</p>
                  </div>
                </div>

                <div className="font-mono font-bold text-[11px] flex flex-col items-end">
                  <span className={
                    tx.type === 'charge' 
                      ? 'text-emerald-400 font-extrabold' 
                      : 'text-red-400 font-extrabold'
                  }>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(tx.currency === 'ساعة' ? 1 : 2)} {tx.currency}
                  </span>
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{tx.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs">لا توجد عمليات مسجلة بمحفظتك حالياً.</div>
          )}
        </CardContent>
      </Card>
      
      {/* Informative sovereign policy disclaimer */}
      <div className="mt-4 p-4 rounded-xl bg-emerald-950/10 border border-emerald-900/20 text-[10px] text-gray-400 leading-normal gap-2 flex items-start text-right">
        <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p>
          <strong>ميثاق الشحن المعتدل:</strong> يخضع هذا النظام لبنود دستور صفر كلفة سحابية، حيث يتم تفويض الكابتن للعمل برخص وحزم بث ملاحة حرة يتناقص رصيدها بالخصائص التراكمية لدقائق العمل الفعلية، دون فرض أي قيود عمولة خارجية أو حوافز مبيعات ملغومة. القوانين تحمي حرية الكابتن واستدامة معيشته اليومية في قصبات اللواء.
        </p>
      </div>
    </div>
  );
}
