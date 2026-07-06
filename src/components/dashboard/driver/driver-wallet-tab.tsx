'use client';

import React from 'react';
import { Copy, Loader2, ReceiptText, Ticket, Upload, Wallet } from 'lucide-react';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';

interface DriverWalletTabProps {
  user: User | null;
  language: 'ar' | 'en';
}

export function DriverWalletTab({ user, language }: DriverWalletTabProps) {
  const copy = walletCopy[language];
  const wallet = useSovereignWallet(user);
  const walletIsReady = wallet.walletLoadState === 'ready';
  const walletIsMissing = wallet.walletLoadState === 'missing';
  const walletHasError = wallet.walletLoadState === 'error';
  const [amount, setAmount] = React.useState('');
  const [channel, setChannel] = React.useState('');
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [voucherCode, setVoucherCode] = React.useState('');
  const paymentMethods: Array<{ name: string; value: string }> = [];

  const submitReceipt = async () => {
    if (!receiptFile) return;
    const ok = await wallet.submitWalletReceipt({
      amount: Number(amount),
      channel: channel.trim(),
      receiptFile,
    });
    if (ok) {
      setAmount('');
      setChannel('');
      setReceiptFile(null);
    }
  };

  const redeemVoucher = async () => {
    const ok = await wallet.redeemVoucherCode(voucherCode);
    if (ok) setVoucherCode('');
  };

  return (
    <section className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
            <h1 className="mt-1 text-2xl font-black">{copy.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{copy.subtitle}</p>
          </div>
          <Wallet className="h-8 w-8 text-emerald-300" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric
            label={copy.balance}
            value={walletIsReady ? `${wallet.balanceJD.toFixed(2)} ${user?.currencyAr || user?.currencyEn || ''}` : wallet.walletLoaded ? '-' : '...'}
          />
          <Metric
            label={copy.paidTime}
            value={walletIsReady ? formatMinutes(wallet.paidMinutesRemaining, language) : wallet.walletLoaded ? '-' : '...'}
          />
          <Metric
            label={copy.bonusTime}
            value={walletIsReady ? formatMinutes(wallet.bonusMinutesRemaining, language) : wallet.walletLoaded ? '-' : '...'}
          />
        </div>

        {walletIsMissing || walletHasError ? (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            <p className="font-black">{walletIsMissing ? copy.walletMissingTitle : copy.walletErrorTitle}</p>
            <p className="mt-1 text-amber-100/80">{walletIsMissing ? copy.walletMissingBody : copy.walletErrorBody}</p>
            {import.meta.env.DEV ? (
              <p className="mt-2 font-mono text-[11px] text-amber-200/80">
                profile_id: {wallet.walletProfileId || '-'} {wallet.walletError ? ` / ${wallet.walletError}` : ''}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
          <h2 className="text-lg font-black">{copy.paymentMethods}</h2>
          <div className="mt-4 space-y-3">
            {paymentMethods.length > 0 ? paymentMethods.map((method) => (
              <div key={method.name} className="rounded-2xl border border-slate-800 bg-black/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{method.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{method.value}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(method.value)}
                    className="rounded-xl border border-white/10 p-3 text-emerald-300 hover:bg-white/10"
                    aria-label={copy.copy}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-black/35 p-5 text-sm leading-6 text-slate-400">
                {copy.noPaymentMethods}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
          <h2 className="text-lg font-black">{copy.uploadReceipt}</h2>
          <div className="mt-4 space-y-3">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder={copy.amount}
              className="w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
            <input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              placeholder={copy.paymentChannel}
              className="w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-black/45 px-4 py-4 text-sm text-slate-300">
              <Upload className="h-4 w-4" />
              {receiptFile?.name || copy.chooseImage}
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} />
            </label>
            <button
              onClick={submitReceipt}
              disabled={wallet.loading || !receiptFile || !channel.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:opacity-60"
            >
              {wallet.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ReceiptText className="h-5 w-5" />}
              {copy.sendReceipt}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
        <h2 className="text-lg font-black">{copy.voucher}</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={voucherCode}
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder={copy.voucherPlaceholder}
            className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
          <button
            onClick={redeemVoucher}
            disabled={wallet.loading || !voucherCode.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-60"
          >
            <Ticket className="h-5 w-5" />
            {copy.redeem}
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function formatMinutes(totalMinutes: number, language: 'ar' | 'en') {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return language === 'ar' ? `${hours} ساعة ${minutes} دقيقة` : `${hours}h ${minutes}m`;
}

const walletCopy = {
  ar: {
    badge: 'الرصيد والباقات',
    title: 'محفظة الكابتن',
    subtitle: 'تظهر الأرصدة من قاعدة البيانات فقط. لا يمكن تعديل الرصيد من الواجهة.',
    balance: 'الرصيد النقدي',
    paidTime: 'وقت مدفوع',
    bonusTime: 'وقت إضافي',
    paymentMethods: 'طرق الدفع المتاحة',
    copy: 'نسخ',
    uploadReceipt: 'إرسال إيصال شحن',
    amount: 'المبلغ',
    chooseImage: 'اختر صورة الإيصال',
    sendReceipt: 'إرسال الإيصال',
    voucher: 'كود الشحن',
    voucherPlaceholder: 'اكتب كود الشحن',
    redeem: 'تفعيل الكود',
    noPaymentMethods: 'لا توجد طرق دفع مفعلة لهذا البلد حالياً. ستظهر هنا بعد إضافتها من لوحة الإدارة.',
    paymentChannel: 'اكتب طريقة الدفع المستخدمة',
    walletMissingTitle: 'لا توجد محفظة مرتبطة بهذا الحساب',
    walletMissingBody: 'أنشئ صفاً في wallet_accounts بنفس profile_id الخاص بالكابتن، ثم ستظهر الأرقام مباشرة وتحدث تلقائياً.',
    walletErrorTitle: 'تعذر تحميل المحفظة',
    walletErrorBody: 'تحقق من صلاحيات القراءة في Supabase أو من اتصال الإنترنت.',
  },
  en: {
    badge: 'Wallet and bundles',
    title: 'Captain wallet',
    subtitle: 'Balances come from the database only. The UI cannot modify wallet values directly.',
    balance: 'Cash balance',
    paidTime: 'Paid time',
    bonusTime: 'Bonus time',
    paymentMethods: 'Available payment methods',
    copy: 'Copy',
    uploadReceipt: 'Upload payment receipt',
    amount: 'Amount',
    chooseImage: 'Choose receipt image',
    sendReceipt: 'Send receipt',
    voucher: 'Voucher code',
    voucherPlaceholder: 'Enter voucher code',
    redeem: 'Redeem',
    noPaymentMethods: 'No payment methods are configured for this country yet. They will appear here after admin setup.',
    paymentChannel: 'Enter the payment channel used',
    walletMissingTitle: 'No wallet is linked to this account',
    walletMissingBody: 'Create a wallet_accounts row with this captain profile_id, then the counters will appear and update live.',
    walletErrorTitle: 'Could not load wallet',
    walletErrorBody: 'Check Supabase read permissions or the internet connection.',
  },
} as const;
