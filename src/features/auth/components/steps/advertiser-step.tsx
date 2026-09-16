'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '../../hooks/use-registration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from "next-intl";

const styles = {
  style13_1: "space-y-4 text-right animate-fade-in",
  style15_2: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style22_3: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right",
  style28_4: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style35_5: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right",
  style41_6: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style48_7: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right",
  style54_8: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style62_9: "h-12 bg-[#0B0F19] border border-[#243249] text-white text-right outline-none focus:border-[#14B8A6] rounded-xl",
  style65_10: "bg-[#161F30] border border-[#243249] text-white",
  style66_11: "text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer",
  style67_12: "text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer",
  style68_13: "text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer",
  style69_14: "text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer",
  style70_15: "text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer",
  style75_16: "pt-2",
  style78_17: "w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer",
  style87_18: "w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer",
} as const;


export function AdvertiserStep() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { advertiserProfile, setAdvertiserProfile, handleAdvertiserSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdvertiserSubmit} className={styles.style13_1} dir="rtl">
      <div>
        <label className={styles.style15_2}>
          {tAuto('key_b931fbf5')}
                          </label>
        <Input
          placeholder={tAuto('key_b1dc2667')}
          value={advertiserProfile.companyName}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, companyName: e.target.value })}
          className={styles.style22_3}
          required
        />
      </div>

      <div>
        <label className={styles.style28_4}>
          {tAuto('key_b8ef81e2')}
                          </label>
        <Input
          placeholder={tAuto('key_157fcb1f')}
          value={advertiserProfile.commercialRegister}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, commercialRegister: e.target.value })}
          className={styles.style35_5}
          required
        />
      </div>

      <div>
        <label className={styles.style41_6}>
          {tAuto('key_4d7fddd8')}
                          </label>
        <Input
          placeholder={tAuto('key_c16a815e')}
          value={advertiserProfile.adLicense}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, adLicense: e.target.value })}
          className={styles.style48_7}
          required
        />
      </div>

      <div>
        <label className={styles.style54_8}>
          {tAuto('key_870b6a6e')}
                          </label>
        <Select
          value={advertiserProfile.businessType}
          onValueChange={(value) => setAdvertiserProfile({ ...advertiserProfile, businessType: value })}
          required
        >
          <SelectTrigger className={styles.style62_9} dir="rtl">
            <SelectValue placeholder={tAuto('key_4d7ab853')} />
          </SelectTrigger>
          <SelectContent className={styles.style65_10}>
            <SelectItem value="commercial" className={styles.style66_11}>{tAuto('key_0875be63')}</SelectItem>
            <SelectItem value="services" className={styles.style67_12}>{tAuto('key_12dbac46')}</SelectItem>
            <SelectItem value="entertainment" className={styles.style68_13}>{tAuto('key_3542d52e')}</SelectItem>
            <SelectItem value="real_estate" className={styles.style69_14}>{tAuto('key_341c9025')}</SelectItem>
            <SelectItem value="e_commerce" className={styles.style70_15}>{tAuto('key_aa119bf7')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={styles.style75_16}>
        <button
          type="submit"
          className={styles.style78_17}
          disabled={isSubmitting}
        >
          {isSubmitting ? tAuto('key_7f87061b') : tAuto('key_1e52c113')}
        </button>
      </div>

      <button
        type="button"
        className={styles.style87_18}
        onClick={() => setStep('personal')}
      >
        {tAuto('key_dfc1d6cc')}
                    </button>
    </form>
  );
}
