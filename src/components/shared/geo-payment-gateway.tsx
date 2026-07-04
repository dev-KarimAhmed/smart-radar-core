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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <Card className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#14b8a6]/35 bg-[#090e1a] text-right text-white shadow-[0_0_50px_rgba(20,184,166,0.14)]" dir="rtl">
        <CardHeader className="flex-row items-center justify-between border-b border-[#14b8a6]/10 bg-black/35 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#14b8a6]/25 bg-[#14b8a6]/10 p-2 text-[#14b8a6]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-white">شحن الرصيد</CardTitle>
              <CardDescription className="text-xs text-slate-400">أرسل إيصال دفع أو فعّل كود شحن.</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetAndClose}
            className="h-10 w-10 rounded-full text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 space-y-5 overflow-y-auto p-6">
          {completedMessage ? (
            <div className="space-y-6 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">تمت العملية</h3>
                <p className="text-sm leading-6 text-slate-300">{completedMessage}</p>
              </div>
              <Button onClick={resetAndClose} className="h-11 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90">
                العودة إلى الرصيد
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
                <button
                  type="button"
                  onClick={() => setMode("receipt")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition",
                    mode === "receipt" ? "bg-[#14b8a6] text-black" : "text-slate-300 hover:bg-white/5",
                  )}
                >
                  <ReceiptText className="h-4 w-4" />
                  إيصال دفع
                </button>
                <button
                  type="button"
                  onClick={() => setMode("voucher")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition",
                    mode === "voucher" ? "bg-[#14b8a6] text-black" : "text-slate-300 hover:bg-white/5",
                  )}
                >
                  <Ticket className="h-4 w-4" />
                  كود شحن
                </button>
              </div>

              {mode === "receipt" ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">المبلغ</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["1", "5", "10", "20"].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={cn(
                            "h-10 rounded-xl border text-sm font-black",
                            amount === preset
                              ? "border-[#14b8a6] bg-[#14b8a6]/20 text-[#14b8a6]"
                              : "border-white/10 bg-black/30 text-slate-300 hover:bg-black/50",
                          )}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">{currencyLabel}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="h-11 rounded-xl border-white/10 bg-black pr-3 pl-20 text-right text-white focus:border-[#14b8a6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300">طريقة الدفع</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {PAYMENT_CHANNELS.map((channel) => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setSelectedChannel(channel.id)}
                          className={cn(
                            "rounded-2xl border p-3 text-right transition",
                            selectedChannel === channel.id
                              ? "border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]"
                              : "border-white/10 bg-black/30 text-slate-300 hover:bg-black/50",
                          )}
                        >
                          <CreditCard className="mb-2 h-4 w-4" />
                          <div className="text-xs font-black">{channel.label}</div>
                          <div className="mt-1 text-[10px] text-slate-500">{channel.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">صورة الإيصال</label>
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#14b8a6]/35 bg-black/30 p-4 text-center hover:bg-[#14b8a6]/5">
                      {receiptFile ? (
                        <>
                          <FileImage className="mb-2 h-6 w-6 text-[#14b8a6]" />
                          <span className="max-w-full truncate text-xs font-bold text-white">{receiptFile.name}</span>
                          <span className="mt-1 text-[10px] text-slate-500">اضغط لتغيير الصورة</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mb-2 h-7 w-7 text-[#14b8a6]" />
                          <span className="text-xs font-bold text-slate-300">ارفع صورة إيصال الدفع</span>
                          <span className="mt-1 text-[10px] text-slate-500">PNG أو JPG أو PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <Button
                    onClick={submitReceipt}
                    disabled={loading || !receiptFile || !Number.isFinite(Number(amount)) || Number(amount) <= 0}
                    className="h-12 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الإيصال للمراجعة"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-4 text-sm leading-6 text-slate-300">
                    أدخل كود الشحن كما هو مكتوب على البطاقة أو الإيصال. سيتم التحقق منه من الخادم مباشرة.
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">كود الشحن</label>
                    <Input
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value)}
                      placeholder="مثال: RADAR-2026"
                      className="h-12 rounded-xl border-white/10 bg-black text-center text-white focus:border-[#14b8a6]"
                    />
                  </div>
                  <Button
                    onClick={submitVoucher}
                    disabled={loading || !voucherCode.trim()}
                    className="h-12 w-full rounded-xl bg-[#14b8a6] text-sm font-black text-black hover:bg-[#14b8a6]/90"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تفعيل الكود"}
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
