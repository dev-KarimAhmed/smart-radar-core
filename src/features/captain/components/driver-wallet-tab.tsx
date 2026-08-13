'use client';

import React from 'react';
import { Check, Copy, Loader2, MessageCircle, Phone, ReceiptText, Ticket, Upload, Wallet } from 'lucide-react';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { cn } from '@/lib/utils';
import {
  CAPTAIN_PAYMENT_CHANNELS,
  CAPTAIN_WALLET_AMOUNT_PRESETS,
  getCaptainDistrictPaymentInfo,
} from '../lib/wallet-static-config';

const styles = {
  style61_1: "mx-auto max-w-5xl space-y-5 text-white",
  style62_2: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style63_3: "flex flex-wrap items-start justify-between gap-4",
  style65_4: "flex items-center gap-2 text-xs font-black text-[#14B8A6]",
  style66_5: "mt-1 text-2xl font-black",
  style67_6: "mt-2 text-sm text-slate-400",
  style69_7: "h-8 w-8 shrink-0 text-emerald-300",
  style70_1: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black",
  style70_2: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40",
  style70_3: "bg-slate-800 text-slate-300",
  style70_4: "h-1.5 w-1.5 rounded-full bg-current",
  style72_8: "mt-5 grid gap-3 sm:grid-cols-3",
  style81_9: "text-xl font-bold font-mono",
  style91_11: "text-xl font-bold font-mono",
  style96_1: "mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-xs font-black text-[#14F5D5]",
  style100_13: "mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100",
  style101_14: "font-black",
  style102_15: "mt-1 text-amber-100/80",
  style104_16: "mt-2 font-mono text-[11px] text-amber-200/80",
  style112_17: "grid gap-5 lg:grid-cols-2",
  style113_18: "space-y-5 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style114_19: "text-lg font-black",
  style114_hint: "mt-1 text-xs leading-5 text-slate-400",
  style115_20: "grid gap-2 sm:grid-cols-2",
  style117_21: "rounded-2xl border p-3 text-right transition",
  style117_active: "border-[#14B8A6] bg-[#14B8A6]/10",
  style117_inactive: "border-slate-800 bg-black/45 hover:border-slate-600",
  style118_22: "flex items-center justify-between gap-2",
  style120_23: "font-black",
  style121_24: "mt-0.5 text-[11px] text-slate-400",
  style122_1: "mt-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2",
  style122_2: "truncate font-mono text-sm text-slate-200",
  style125_25: "shrink-0 rounded-lg border border-white/10 p-1.5 text-emerald-300 hover:bg-white/10",
  style128_26: "h-3.5 w-3.5",
  style130_1: "mt-3 text-xs font-bold text-slate-300",
  style140_28: "space-y-5 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style141_29: "text-lg font-black",
  style142_30: "space-y-3",
  style145_1: "flex flex-wrap gap-2",
  style145_2: "rounded-xl border px-3 py-2 text-sm font-black transition",
  style145_active: "border-[#14B8A6] bg-[#14B8A6]/15 text-[#14F5D5]",
  style145_inactive: "border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500",
  style148_31: "w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400",
  style150_1: "rounded-2xl border border-slate-800 bg-black/30 p-3 text-sm",
  style150_2: "text-slate-400",
  style150_3: "mt-1 font-black text-[#14F5D5]",
  style156_33: "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-black/45 px-4 py-4 text-sm text-slate-300",
  style157_34: "h-4 w-4",
  style159_35: "hidden",
  style164_36: "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:cursor-not-allowed disabled:opacity-40",
  style166_37: "h-5 w-5 animate-spin",
  style166_38: "h-5 w-5",
  style173_39: "space-y-4 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style174_40: "text-lg font-black",
  style174_hint: "mt-1 text-xs leading-5 text-slate-400",
  style176_1: "flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-black/45 p-4",
  style177_1: "font-black",
  style177_2: "mt-0.5 text-xs text-slate-400",
  style179_1: "flex shrink-0 items-center gap-2",
  style180_1: "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/10",
  style180_2: "inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500",
  style181_1: "h-3.5 w-3.5",
  style190_39: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style191_29: "text-lg font-black",
  style192_41: "mt-4 flex flex-col gap-3 sm:flex-row",
  style193_42: "min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400",
  style194_43: "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40",
  style195_44: "h-5 w-5",
  style198_45: "rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4",
  style199_46: "text-xs text-slate-400",
  style200_47: "mt-2 text-2xl font-black",
} as const;

interface DriverWalletTabProps {
  user: User | null;
  language: 'ar' | 'en';
  isFlightActive?: boolean;
}

function formatMinutes(totalMinutes: number, language: 'ar' | 'en') {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return language === 'ar' ? `${hours} ساعة ${minutes} دقيقة` : `${hours}h ${minutes}m`;
}

export function DriverWalletTab({ user, language, isFlightActive = false }: DriverWalletTabProps) {
  const copy = walletCopy[language];
  const wallet = useSovereignWallet(user);
  const walletIsReady = wallet.walletLoadState === 'ready';
  const walletIsMissing = wallet.walletLoadState === 'missing';
  const walletHasError = wallet.walletLoadState === 'error';
  const [amount, setAmount] = React.useState('');
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
  const [copiedChannelId, setCopiedChannelId] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [voucherCode, setVoucherCode] = React.useState('');

  const districtPaymentInfo = getCaptainDistrictPaymentInfo(user?.district);
  const selectedChannel = CAPTAIN_PAYMENT_CHANNELS.find((channel) => channel.id === selectedChannelId) || null;

  const copyChannelNumber = (channelId: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedChannelId(channelId);
    window.setTimeout(() => setCopiedChannelId((current) => (current === channelId ? null : current)), 1500);
  };

  const submitReceipt = async () => {
    if (!receiptFile || !selectedChannel) return;
    const channelLabel = language === 'ar' ? selectedChannel.labelAr : selectedChannel.labelEn;
    const ok = await wallet.submitWalletReceipt({
      amount: Number(amount),
      channel: channelLabel,
      receiptFile,
    });
    if (ok) {
      setAmount('');
      setSelectedChannelId(null);
      setReceiptFile(null);
    }
  };

  const redeemVoucher = async () => {
    const ok = await wallet.redeemVoucherCode(voucherCode);
    if (ok) setVoucherCode('');
  };

  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;

  return (
    <section className={styles.style61_1}>
      <div className={styles.style62_2}>
        <div className={styles.style63_3}>
          <div>
            <p className={styles.style65_4}>{copy.badge}</p>
            <h1 className={styles.style66_5}>{copy.title}</h1>
            <p className={styles.style67_6}>{copy.subtitle}</p>
            <span className={cn(styles.style70_1, isFlightActive ? styles.style70_2 : styles.style70_3)}>
              <span className={styles.style70_4} />
              {isFlightActive ? copy.flightActiveOn : copy.flightActiveOff}
            </span>
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
            value={walletIsReady ? <span className={styles.style81_9}>{formatMinutes(paidMinutes, language)}</span> : wallet.walletLoaded ? '-' : '...'}
          />
          <Metric
            label={copy.bonusTime}
            value={walletIsReady ? <span className={styles.style91_11}>{formatMinutes(bonusMinutes, language)}</span> : wallet.walletLoaded ? '-' : '...'}
          />
        </div>

        {walletIsReady && wallet.activePackageName ? (
          <div className={styles.style96_1}>{copy.activePackagePrefix} {wallet.activePackageName}</div>
        ) : null}

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
          <div>
            <h2 className={styles.style114_19}>{copy.refillTitle}</h2>
            <p className={styles.style114_hint}>{copy.refillHint}</p>
          </div>

          <div className={styles.style115_20}>
            {CAPTAIN_PAYMENT_CHANNELS.map((channelOption) => {
              const channelNumber = districtPaymentInfo.channelNumbers[channelOption.id] || '';
              const isSelected = selectedChannelId === channelOption.id;
              return (
                <div
                  key={channelOption.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedChannelId(channelOption.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    setSelectedChannelId(channelOption.id);
                  }}
                  className={cn(styles.style117_21, isSelected ? styles.style117_active : styles.style117_inactive)}
                >
                  <div className={styles.style118_22}>
                    <p className={styles.style120_23}>{language === 'ar' ? channelOption.labelAr : channelOption.labelEn}</p>
                  </div>
                  <p className={styles.style121_24}>{language === 'ar' ? channelOption.descriptionAr : channelOption.descriptionEn}</p>
                  <div className={styles.style122_1}>
                    <span className={styles.style122_2}>{channelNumber}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyChannelNumber(channelOption.id, channelNumber);
                      }}
                      className={styles.style125_25}
                      aria-label={copy.copy}
                    >
                      {copiedChannelId === channelOption.id ? <Check className={styles.style128_26} /> : <Copy className={styles.style128_26} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedChannel ? <p className={styles.style130_1}>{copy.chooseChannelHint}</p> : null}

          <h2 className={styles.style141_29}>{copy.uploadReceipt}</h2>
          <div className={styles.style142_30}>
            <div className={styles.style145_1}>
              {CAPTAIN_WALLET_AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={cn(styles.style145_2, amount === String(preset) ? styles.style145_active : styles.style145_inactive)}
                >
                  {preset} {user?.currencyAr || user?.currencyEn || ''}
                </button>
              ))}
            </div>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder={copy.amount}
              className={styles.style148_31}
            />
            <div className={styles.style150_1}>
              <span className={styles.style150_2}>{copy.selectedChannelLabel}</span>
              <p className={styles.style150_3}>{selectedChannel ? (language === 'ar' ? selectedChannel.labelAr : selectedChannel.labelEn) : copy.noChannelSelected}</p>
            </div>
            <label className={styles.style156_33}>
              <Upload className={styles.style157_34} />
              {receiptFile?.name || copy.chooseImage}
              <input type="file" accept="image/*" className={styles.style159_35} onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} />
            </label>
            <button
              onClick={submitReceipt}
              disabled={wallet.loading || !receiptFile || !selectedChannel || !Number.isFinite(Number(amount)) || Number(amount) <= 0}
              className={styles.style164_36}
            >
              {wallet.loading ? <Loader2 className={styles.style166_37} /> : <ReceiptText className={styles.style166_38} />}
              {copy.sendReceipt}
            </button>
          </div>
        </div>

        <div className={styles.style173_39}>
          <div>
            <h2 className={styles.style174_40}>{copy.delegateTitle}</h2>
            <p className={styles.style174_hint}>{copy.delegateHint}</p>
          </div>
          <div className={styles.style176_1}>
            <div>
              <p className={styles.style177_1}>{districtPaymentInfo.delegateName}</p>
              <p className={styles.style177_2}>{user?.district || copy.noDistrict}</p>
            </div>
            <div className={styles.style179_1}>
              <a
                href={`tel:${districtPaymentInfo.delegatePhone}`}
                className={styles.style180_1}
              >
                <Phone className={styles.style181_1} />
                {copy.delegateCall}
              </a>
              <a
                href={`https://wa.me/${districtPaymentInfo.delegatePhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.style180_2}
              >
                <MessageCircle className={styles.style181_1} />
                {copy.delegateWhatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.style190_39}>
        <h2 className={styles.style191_29}>{copy.voucher}</h2>
        <div className={styles.style192_41}>
          <input
            value={voucherCode}
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder={copy.voucherPlaceholder}
            className={styles.style193_42}
          />
          <button
            onClick={redeemVoucher}
            disabled={wallet.loading || !voucherCode.trim()}
            className={styles.style194_43}
          >
            <Ticket className={styles.style195_44} />
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

const walletCopy = {
  ar: {
    badge: 'الرصيد والباقات',
    title: 'محفظة الكابتن',
    subtitle: 'تظهر الأرصدة من قاعدة البيانات فقط. لا يمكن تعديل الرصيد من الواجهة.',
    flightActiveOn: 'متاح الآن لاستقبال الطلبات',
    flightActiveOff: 'غير متاح حالياً',
    balance: 'الرصيد النقدي',
    paidTime: 'وقت مدفوع',
    bonusTime: 'وقت إضافي',
    activePackagePrefix: 'الباقة الحالية:',
    refillTitle: 'قنوات الشحن الرقمية',
    refillHint: 'اختر القناة، حوّل المبلغ إلى الرقم الظاهر، ثم أرسل صورة الإيصال بالأسفل.',
    chooseChannelHint: 'اختر إحدى قنوات الدفع أعلاه أولاً.',
    copy: 'نسخ',
    uploadReceipt: 'إرسال إيصال شحن',
    amount: 'المبلغ',
    selectedChannelLabel: 'القناة المختارة',
    noChannelSelected: 'لم تختر قناة بعد',
    chooseImage: 'اختر صورة الإيصال',
    sendReceipt: 'إرسال الإيصال',
    voucher: 'كود الشحن',
    voucherPlaceholder: 'اكتب كود الشحن',
    redeem: 'تفعيل الكود',
    delegateTitle: 'الدفع عبر المندوب المالي',
    delegateHint: 'بديل عن التحويل الرقمي: تواصل مع مندوبك المعتمد في منطقتك، ادفع نقداً، وسيشحن رصيدك مباشرة.',
    delegateCall: 'اتصال',
    delegateWhatsapp: 'واتساب',
    noDistrict: 'منطقتك غير محددة في حسابك',
    walletMissingTitle: 'لا توجد محفظة مرتبطة بهذا الحساب',
    walletMissingBody: 'أنشئ صفاً في wallet_accounts بنفس profile_id الخاص بالكابتن، ثم ستظهر الأرقام مباشرة وتحدث تلقائياً.',
    walletErrorTitle: 'تعذر تحميل المحفظة',
    walletErrorBody: 'تحقق من صلاحيات القراءة في Supabase أو من اتصال الإنترنت.',
  },
  en: {
    badge: 'Wallet and bundles',
    title: 'Captain wallet',
    subtitle: 'Balances come from the database only. The UI cannot modify wallet values directly.',
    flightActiveOn: 'Online and receiving requests',
    flightActiveOff: 'Currently offline',
    balance: 'Cash balance',
    paidTime: 'Paid time',
    bonusTime: 'Bonus time',
    activePackagePrefix: 'Active package:',
    refillTitle: 'Digital refill channels',
    refillHint: 'Pick a channel, transfer the amount to the number shown, then send the receipt below.',
    chooseChannelHint: 'Choose one of the payment channels above first.',
    copy: 'Copy',
    uploadReceipt: 'Upload payment receipt',
    amount: 'Amount',
    selectedChannelLabel: 'Selected channel',
    noChannelSelected: 'No channel selected yet',
    chooseImage: 'Choose receipt image',
    sendReceipt: 'Send receipt',
    voucher: 'Voucher code',
    voucherPlaceholder: 'Enter voucher code',
    redeem: 'Redeem',
    delegateTitle: 'Pay via financial delegate',
    delegateHint: 'An alternative to digital transfer: contact your accredited local delegate, pay in cash, and they will top up your wallet directly.',
    delegateCall: 'Call',
    delegateWhatsapp: 'WhatsApp',
    noDistrict: 'No district set on your account',
    walletMissingTitle: 'No wallet is linked to this account',
    walletMissingBody: 'Create a wallet_accounts row with this captain profile_id, then the counters will appear and update live.',
    walletErrorTitle: 'Could not load wallet',
    walletErrorBody: 'Check Supabase read permissions or the internet connection.',
  },
} as const;
