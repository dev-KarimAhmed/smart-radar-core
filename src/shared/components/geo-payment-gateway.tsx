"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSovereignWallet } from "@/hooks/use-sovereign-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CreditCard,
  FileImage,
  Loader2,
  ReceiptText,
  Ticket,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";

const styles = {
  style83_1: "fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md",
  style84_2: "flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#14b8a6]/35 bg-[#090e1a] text-right text-white shadow-[0_0_50px_rgba(20,184,166,0.14)]",
  style85_3: "flex-row items-center justify-between border-b border-[#14b8a6]/10 bg-black/35 p-5",
  style86_4: "flex items-center gap-3",
  style87_5: "rounded-2xl border border-[#14b8a6]/25 bg-[#14b8a6]/10 p-2 text-[#14b8a6]",
  style88_6: "h-5 w-5",
  style91_7: "text-base font-black text-white",
  style92_8: "text-xs text-slate-400",
  style99_9: "h-10 w-10 rounded-full text-slate-400 hover:bg-white/5 hover:text-white",
  style101_10: "h-5 w-5",
  style105_11: "flex-1 space-y-5 overflow-y-auto p-6",
  style107_12: "space-y-6 py-8 text-center",
  style108_13: "mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]",
  style109_14: "h-9 w-9",
  style111_15: "space-y-2",
  style112_16: "text-lg font-black text-white",
  style113_17: "text-sm leading-6 text-slate-300",
  style115_18: "h-11 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90",
  style121_19: "grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1",
  style126_20: "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition",
  style127_21: "bg-[#14b8a6] text-black",
  style127_22: "text-slate-300 hover:bg-white/5",
  style130_23: "h-4 w-4",
  style137_24: "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition",
  style138_25: "bg-[#14b8a6] text-black",
  style138_26: "text-slate-300 hover:bg-white/5",
  style141_27: "h-4 w-4",
  style147_28: "space-y-5",
  style148_29: "space-y-2",
  style149_30: "text-xs font-bold text-slate-300",
  style150_31: "grid grid-cols-4 gap-2",
  style157_32: "h-10 rounded-xl border text-sm font-black",
  style159_33: "border-[#14b8a6] bg-[#14b8a6]/20 text-[#14b8a6]",
  style160_34: "border-white/10 bg-black/30 text-slate-300 hover:bg-black/50",
  style167_35: "relative",
  style168_36: "absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500",
  style175_37: "h-11 rounded-xl border-white/10 bg-black pr-3 pl-20 text-right text-white focus:border-[#14b8a6]",
  style180_38: "space-y-3",
  style181_39: "text-xs font-bold text-slate-300",
  style182_40: "grid grid-cols-1 gap-2 sm:grid-cols-3",
  style189_41: "rounded-2xl border p-3 text-right transition",
  style191_42: "border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]",
  style192_43: "border-white/10 bg-black/30 text-slate-300 hover:bg-black/50",
  style195_44: "mb-2 h-4 w-4",
  style196_45: "text-xs font-black",
  style197_46: "mt-1 text-[10px] text-slate-500",
  style203_47: "space-y-2",
  style204_48: "text-xs font-bold text-slate-300",
  style205_49: "flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#14b8a6]/35 bg-black/30 p-4 text-center hover:bg-[#14b8a6]/5",
  style208_50: "mb-2 h-6 w-6 text-[#14b8a6]",
  style209_51: "max-w-full truncate text-xs font-bold text-white",
  style210_52: "mt-1 text-[10px] text-slate-500",
  style214_53: "mb-2 h-7 w-7 text-[#14b8a6]",
  style215_54: "text-xs font-bold text-slate-300",
  style216_55: "mt-1 text-[10px] text-slate-500",
  style222_56: "hidden",
  style231_57: "h-12 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90",
  style233_58: "h-4 w-4 animate-spin",
  style237_59: "space-y-5",
  style238_60: "rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-4 text-sm leading-6 text-slate-300",
  style241_61: "space-y-2",
  style242_62: "text-xs font-bold text-slate-300",
  style247_63: "h-12 rounded-xl border-white/10 bg-black text-center text-white focus:border-[#14b8a6]",
  style253_64: "h-12 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90",
  style255_65: "h-4 w-4 animate-spin",
} as const;


interface GeoPaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_CHANNELS = [
  { id: "cliq", label: "CliQ", description: "تحويل بنكي محلي" },
  { id: "wallet", label: "محفظة إلكترونية", description: "Zain Cash أو Orange Money" },
  { id: "bank", label: "حوالة بنكية", description: "إيصال من البنك" },
] as const;

type PaymentChannel = (typeof PAYMENT_CHANNELS)[number]["id"];
type PaymentMode = "receipt" | "voucher";

export function GeoPaymentGateway({ isOpen, onClose, onSuccess }: GeoPaymentGatewayProps) {
  const { user } = useAuth();
  const { submitWalletReceipt, redeemVoucherCode, loading } = useSovereignWallet(user);
  const [mode, setMode] = useState<PaymentMode>("receipt");
  const [amount, setAmount] = useState("10");
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>("cliq");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");

  const currencyLabel = useMemo(() => user?.currencyAr || user?.currencyEn || "عملة", [user?.currencyAr, user?.currencyEn]);

  if (!isOpen) return null;

  const submitReceipt = async () => {
    const amountValue = Number(amount);
    if (!receiptFile) return;

    const ok = await submitWalletReceipt({
      amount: amountValue,
      channel: selectedChannel,
      receiptFile,
    });

    if (ok) {
      setCompletedMessage("تم إرسال الإيصال للمراجعة.");
      onSuccess?.();
    }
  };

  const submitVoucher = async () => {
    const ok = await redeemVoucherCode(voucherCode);
    if (ok) {
      setCompletedMessage("تم تفعيل كود الشحن.");
      onSuccess?.();
    }
  };

  const resetAndClose = () => {
    setCompletedMessage("");
    setReceiptFile(null);
    setVoucherCode("");
    onClose();
  };

  return (
    <div className={styles.style83_1}>
      <Card className={styles.style84_2} dir="rtl">
        <CardHeader className={styles.style85_3}>
          <div className={styles.style86_4}>
            <div className={styles.style87_5}>
              <Wallet className={styles.style88_6} />
            </div>
            <div>
              <CardTitle className={styles.style91_7}>شحن الرصيد</CardTitle>
              <CardDescription className={styles.style92_8}>أرسل إيصال دفع أو فعّل كود شحن.</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetAndClose}
            className={styles.style99_9}
          >
            <X className={styles.style101_10} />
          </Button>
        </CardHeader>

        <CardContent className={styles.style105_11}>
          {completedMessage ? (
            <div className={styles.style107_12}>
              <div className={styles.style108_13}>
                <CheckCircle2 className={styles.style109_14} />
              </div>
              <div className={styles.style111_15}>
                <h3 className={styles.style112_16}>تمت العملية</h3>
                <p className={styles.style113_17}>{completedMessage}</p>
              </div>
              <Button onClick={resetAndClose} className={styles.style115_18}>
                العودة إلى الرصيد
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.style121_19}>
                <button
                  type="button"
                  onClick={() => setMode("receipt")}
                  className={cn(
                    styles.style126_20,
                    mode === "receipt" ? styles.style127_21 : styles.style127_22,
                  )}
                >
                  <ReceiptText className={styles.style130_23} />
                  إيصال دفع
                </button>
                <button
                  type="button"
                  onClick={() => setMode("voucher")}
                  className={cn(
                    styles.style137_24,
                    mode === "voucher" ? styles.style138_25 : styles.style138_26,
                  )}
                >
                  <Ticket className={styles.style141_27} />
                  كود شحن
                </button>
              </div>

              {mode === "receipt" ? (
                <div className={styles.style147_28}>
                  <div className={styles.style148_29}>
                    <label className={styles.style149_30}>المبلغ</label>
                    <div className={styles.style150_31}>
                      {["1", "5", "10", "20"].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={cn(
                            styles.style157_32,
                            amount === preset
                              ? styles.style159_33
                              : styles.style160_34,
                          )}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                    <div className={styles.style167_35}>
                      <span className={styles.style168_36}>{currencyLabel}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className={styles.style175_37}
                      />
                    </div>
                  </div>

                  <div className={styles.style180_38}>
                    <span className={styles.style181_39}>طريقة الدفع</span>
                    <div className={styles.style182_40}>
                      {PAYMENT_CHANNELS.map((channel) => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setSelectedChannel(channel.id)}
                          className={cn(
                            styles.style189_41,
                            selectedChannel === channel.id
                              ? styles.style191_42
                              : styles.style192_43,
                          )}
                        >
                          <CreditCard className={styles.style195_44} />
                          <div className={styles.style196_45}>{channel.label}</div>
                          <div className={styles.style197_46}>{channel.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.style203_47}>
                    <label className={styles.style204_48}>صورة الإيصال</label>
                    <label className={styles.style205_49}>
                      {receiptFile ? (
                        <>
                          <FileImage className={styles.style208_50} />
                          <span className={styles.style209_51}>{receiptFile.name}</span>
                          <span className={styles.style210_52}>اضغط لتغيير الصورة</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className={styles.style214_53} />
                          <span className={styles.style215_54}>ارفع صورة إيصال الدفع</span>
                          <span className={styles.style216_55}>PNG أو JPG أو PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className={styles.style222_56}
                        onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <Button
                    onClick={submitReceipt}
                    disabled={loading || !receiptFile || !Number.isFinite(Number(amount)) || Number(amount) <= 0}
                    className={styles.style231_57}
                  >
                    {loading ? <Loader2 className={styles.style233_58} /> : "إرسال الإيصال للمراجعة"}
                  </Button>
                </div>
              ) : (
                <div className={styles.style237_59}>
                  <div className={styles.style238_60}>
                    أدخل كود الشحن كما هو مكتوب على البطاقة أو الإيصال. سيتم التحقق منه من الخادم مباشرة.
                  </div>
                  <div className={styles.style241_61}>
                    <label className={styles.style242_62}>كود الشحن</label>
                    <Input
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value)}
                      placeholder="مثال: RADAR-2026"
                      className={styles.style247_63}
                    />
                  </div>
                  <Button
                    onClick={submitVoucher}
                    disabled={loading || !voucherCode.trim()}
                    className={styles.style253_64}
                  >
                    {loading ? <Loader2 className={styles.style255_65} /> : "تفعيل الكود"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
