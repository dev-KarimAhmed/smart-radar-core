"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreditCard, FileImage, Loader2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { geoPaymentStyles as styles } from "./geo-payment-styles";

export const PAYMENT_CHANNELS = [
  { id: "cliq", label: "CliQ", description: "تحويل بنكي محلي" },
  { id: "wallet", label: "محفظة إلكترونية", description: "Zain Cash أو Orange Money" },
  { id: "bank", label: "حوالة بنكية", description: "إيصال من البنك" },
] as const;

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number]["id"];

export interface GeoPaymentReceiptFormProps {
  amount: string;
  setAmount: (val: string) => void;
  currencyLabel: string;
  selectedChannel: PaymentChannel;
  setSelectedChannel: (channel: PaymentChannel) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  loading: boolean;
  onSubmit: () => void;
}

export function GeoPaymentReceiptForm({
  amount,
  setAmount,
  currencyLabel,
  selectedChannel,
  setSelectedChannel,
  receiptFile,
  setReceiptFile,
  loading,
  onSubmit,
}: GeoPaymentReceiptFormProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.style147_28}>
      <div className={styles.style148_29}>
        <label className={styles.style149_30}>{tAuto('key_faba469e')}</label>
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
        <span className={styles.style181_39}>{tAuto('key_8f31e70d')}</span>
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
              <div className={styles.style196_45}>{tAuto(`paymentChannel_${channel.id}_label` as any)}</div>
              <div className={styles.style197_46}>{tAuto(`paymentChannel_${channel.id}_desc` as any)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.style203_47}>
        <label className={styles.style204_48}>{tAuto('key_7443e408')}</label>
        <label className={styles.style205_49}>
          {receiptFile ? (
            <>
              <FileImage className={styles.style208_50} />
              <span className={styles.style209_51}>{receiptFile.name}</span>
              <span className={styles.style210_52}>{tAuto('key_86ecd2d6')}</span>
            </>
          ) : (
            <>
              <UploadCloud className={styles.style214_53} />
              <span className={styles.style215_54}>{tAuto('key_960aa8c9')}</span>
              <span className={styles.style216_55}>{tAuto('key_0999fd8d')}</span>
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
        onClick={onSubmit}
        disabled={loading || !receiptFile || !Number.isFinite(Number(amount)) || Number(amount) <= 0}
        className={styles.style231_57}
      >
        {loading ? <Loader2 className={styles.style233_58} /> : tAuto('key_1527eb1d')}
      </Button>
    </div>
  );
}
