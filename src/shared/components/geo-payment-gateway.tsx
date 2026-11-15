"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSovereignWallet } from "@/hooks/use-sovereign-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ReceiptText,
  Ticket,
  Wallet,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { geoPaymentStyles as styles } from "./geo-payment/geo-payment-styles";
import {
  GeoPaymentReceiptForm,
  type PaymentChannel,
} from "./geo-payment/geo-payment-receipt-form";
import { GeoPaymentVoucherForm } from "./geo-payment/geo-payment-voucher-form";

export interface GeoPaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PaymentMode = "receipt" | "voucher";

export function GeoPaymentGateway({ isOpen, onClose, onSuccess }: GeoPaymentGatewayProps) {
  const tAuto = useTranslations('auto');
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
              <CardTitle className={styles.style91_7}>{tAuto('key_b4a7ae52')}</CardTitle>
              <CardDescription className={styles.style92_8}>{tAuto('key_c4ec66a0')}</CardDescription>
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
                <h3 className={styles.style112_16}>{tAuto('key_84e69e2c')}</h3>
                <p className={styles.style113_17}>{completedMessage}</p>
              </div>
              <Button onClick={resetAndClose} className={styles.style115_18}>
                {tAuto('key_2254945e')}
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
                  {tAuto('key_5742076f')}
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
                  {tAuto('key_8ebc995a')}
                </button>
              </div>

              {mode === "receipt" ? (
                <GeoPaymentReceiptForm
                  amount={amount}
                  setAmount={setAmount}
                  currencyLabel={currencyLabel}
                  selectedChannel={selectedChannel}
                  setSelectedChannel={setSelectedChannel}
                  receiptFile={receiptFile}
                  setReceiptFile={setReceiptFile}
                  loading={loading}
                  onSubmit={submitReceipt}
                />
              ) : (
                <GeoPaymentVoucherForm
                  voucherCode={voucherCode}
                  setVoucherCode={setVoucherCode}
                  loading={loading}
                  onSubmit={submitVoucher}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
