'use client';

import React from 'react';
import { Copy, Loader2, ReceiptText, Ticket, Upload, Wallet } from 'lucide-react';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';

const styles = {
  style61_1: "mx-auto max-w-5xl space-y-5 text-white",
  style62_2: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style63_3: "flex items-start justify-between gap-4",
  style65_4: "text-xs font-black text-[#14B8A6]",
  style66_5: "mt-1 text-2xl font-black",
  style67_6: "mt-2 text-sm text-slate-400",
  style69_7: "h-8 w-8 text-emerald-300",
  style72_8: "mt-5 grid gap-3 md:grid-cols-3",
  style81_9: "text-xl font-bold font-mono",
  style83_10: "text-xl font-bold font-mono",
  style91_11: "text-xl font-bold font-mono",
  style93_12: "text-xl font-bold font-mono",
  style100_13: "mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100",
  style101_14: "font-black",
  style102_15: "mt-1 text-amber-100/80",
  style104_16: "mt-2 font-mono text-[11px] text-amber-200/80",
  style112_17: "grid gap-5 lg:grid-cols-2",
  style113_18: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style114_19: "text-lg font-black",
  style115_20: "mt-4 space-y-3",
  style117_21: "rounded-2xl border border-slate-800 bg-black/45 p-4",
  style118_22: "flex items-center justify-between gap-3",
  style120_23: "font-black",
  style121_24: "mt-1 text-sm text-slate-400",
  style125_25: "rounded-xl border border-white/10 p-3 text-emerald-300 hover:bg-white/10",
  style128_26: "h-4 w-4",
  style133_27: "rounded-2xl border border-dashed border-slate-700 bg-black/35 p-5 text-sm leading-6 text-slate-400",
  style140_28: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style141_29: "text-lg font-black",
  style142_30: "mt-4 space-y-3",
  style148_31: "w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400",
  style154_32: "w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400",
  style156_33: "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-black/45 px-4 py-4 text-sm text-slate-300",
  style157_34: "h-4 w-4",
  style159_35: "hidden",
  style164_36: "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:opacity-60",
  style166_37: "h-5 w-5 animate-spin",
  style166_38: "h-5 w-5",
  style173_39: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style174_40: "text-lg font-black",
  style175_41: "mt-4 flex flex-col gap-3 sm:flex-row",
  style180_42: "min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400",
  style185_43: "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-60",
  style187_44: "h-5 w-5",
  style198_45: "rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4",
  style199_46: "text-xs text-slate-400",
  style200_47: "mt-2 text-2xl font-black",
} as const;


const TEST_PRICE_PER_HOUR = 200; // Change to 20 for production simulation (e.g. 1000 EGP = 5 or 50 Hours)
const TEST_PRICE_PER_MINUTE = TEST_PRICE_PER_HOUR / 60;

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

  // MODULE 2: TIME DERIVATION UTILITY LOGIC
  const currentBalance = walletIsReady ? wallet.balanceJD : 0;

  // Paid Time Calculation
  const totalPaidHours = currentBalance / TEST_PRICE_PER_HOUR;
  const paidHours = Math.floor(totalPaidHours);
  const paidMinutes = Math.round((totalPaidHours - paidHours) * 60);

  // Extra Time Simulation
  const totalExtraHours = currentBalance > 0 ? paidHours * 0.4 : 0;
  const extraHours = Math.floor(totalExtraHours);
  const extraMinutes = Math.round((totalExtraHours - extraHours) * 60);

  return (
    <section className={styles.style61_1}>
      <div className={styles.style62_2}>
        <div className={styles.style63_3}>
          <div>
            <p className={styles.style65_4}>{copy.badge}</p>
            <h1 className={styles.style66_5}>{copy.title}</h1>
            <p className={styles.style67_6}>{copy.subtitle}</p>
          </div>
          <Wallet className={styles.style69_7} />
        </div>

        <div className={styles.style72_8}>
          <Metric
            label={copy.balance}
            value={walletIsReady ? `${wallet.balanceJD.toFixed(2)} ${user?.currencyAr || user?.currencyEn || ''}` : wallet.walletLoaded ? '-' : '...'}
          />
          <Metric
            label={copy.paidTime}
            value={walletIsReady ? (
              language === 'ar' ? (
                <span className={styles.style81_9}>{paidHours} ساعة {paidMinutes} دقيقة</span>
              ) : (
                <span className={styles.style83_10}>{paidHours}h {paidMinutes}m</span>
              )
            ) : wallet.walletLoaded ? '-' : '...'}
          />
          <Metric
            label={copy.bonusTime}
            value={walletIsReady ? (
              language === 'ar' ? (
                <span className={styles.style91_11}>{extraHours} ساعة {extraMinutes} دقيقة</span>
              ) : (
                <span className={styles.style93_12}>{extraHours}h {extraMinutes}m</span>
              )
            ) : wallet.walletLoaded ? '-' : '...'}
          />
        </div>

        {walletIsMissing || walletHasError ? (
          <div className={styles.style100_13}>
            <p className={styles.style101_14}>{walletIsMissing ? copy.walletMissingTitle : copy.walletErrorTitle}</p>
            <p className={styles.style102_15}>{walletIsMissing ? copy.walletMissingBody : copy.walletErrorBody}</p>
            {(process.env.NODE_ENV !== 'production') ? (
              <p className={styles.style104_16}>
                profile_id: {wallet.walletProfileId || '-'} {wallet.walletError ? ` / ${wallet.walletError}` : ''}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={styles.style112_17}>
        <div className={styles.style113_18}>
          <h2 className={styles.style114_19}>{copy.paymentMethods}</h2>
          <div className={styles.style115_20}>
            {paymentMethods.length > 0 ? paymentMethods.map((method) => (
              <div key={method.name} className={styles.style117_21}>
                <div className={styles.style118_22}>
                  <div>
                    <p className={styles.style120_23}>{method.name}</p>
                    <p className={styles.style121_24}>{method.value}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(method.value)}
                    className={styles.style125_25}
                    aria-label={copy.copy}
                  >
                    <Copy className={styles.style128_26} />
                  </button>
                </div>
              </div>
            )) : (
              <div className={styles.style133_27}>
                {copy.noPaymentMethods}
              </div>
            )}
          </div>
        </div>

        <div className={styles.style140_28}>
          <h2 className={styles.style141_29}>{copy.uploadReceipt}</h2>
          <div className={styles.style142_30}>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder={copy.amount}
              className={styles.style148_31}
            />
            <input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              placeholder={copy.paymentChannel}
              className={styles.style154_32}
            />
            <label className={styles.style156_33}>
              <Upload className={styles.style157_34} />
              {receiptFile?.name || copy.chooseImage}
              <input type="file" accept="image/*" className={styles.style159_35} onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} />
            </label>
            <button
              onClick={submitReceipt}
              disabled={wallet.loading || !receiptFile || !channel.trim()}
              className={styles.style164_36}
            >
              {wallet.loading ? <Loader2 className={styles.style166_37} /> : <ReceiptText className={styles.style166_38} />}
              {copy.sendReceipt}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.style173_39}>
        <h2 className={styles.style174_40}>{copy.voucher}</h2>
        <div className={styles.style175_41}>
          <input
            value={voucherCode}
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder={copy.voucherPlaceholder}
            className={styles.style180_42}
          />
          <button
            onClick={redeemVoucher}
            disabled={wallet.loading || !voucherCode.trim()}
            className={styles.style185_43}
          >
            <Ticket className={styles.style187_44} />
            {copy.redeem}
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.style198_45}>
      <p className={styles.style199_46}>{label}</p>
      <div className={styles.style200_47}>{value}</div>
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
