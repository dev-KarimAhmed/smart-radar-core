"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { geoPaymentStyles as styles } from "./geo-payment-styles";

export interface GeoPaymentVoucherFormProps {
  voucherCode: string;
  setVoucherCode: (val: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export function GeoPaymentVoucherForm({
  voucherCode,
  setVoucherCode,
  loading,
  onSubmit,
}: GeoPaymentVoucherFormProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.style237_59}>
      <div className={styles.style238_60}>
        {tAuto('key_e183ebed')}
      </div>
      <div className={styles.style241_61}>
        <label className={styles.style242_62}>{tAuto('key_7b94eeef')}</label>
        <Input
          value={voucherCode}
          onChange={(event) => setVoucherCode(event.target.value)}
          placeholder={tAuto('key_b24b85fc')}
          className={styles.style247_63}
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={loading || !voucherCode.trim()}
        className={styles.style253_64}
      >
        {loading ? <Loader2 className={styles.style255_65} /> : tAuto('key_c78f1ec3')}
      </Button>
    </div>
  );
}
