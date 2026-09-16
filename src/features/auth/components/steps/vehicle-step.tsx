'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '../../hooks/use-registration';
import { useTranslations } from "next-intl";

const styles = {
  style72_1: "space-y-4  animate-fade-in",
  style74_2: "rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-3 ",
  style78_3: "w-full rounded-xl bg-[#14B8A6] py-3 text-sm font-black text-[#0B0F19] hover:bg-[#14B8A6]/90",
  style82_4: "mt-2 text-[10px] font-medium leading-5 text-[#94A3B8]",
  style91_5: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style98_6: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style103_7: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style111_8: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style115_9: "grid grid-cols-2 gap-2",
  style117_10: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style124_11: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style129_12: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style136_13: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style142_14: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style150_15: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style160_16: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style167_17: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style171_18: "grid grid-cols-2 gap-2",
  style173_19: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style180_20: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style185_21: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style192_22: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style197_23: "grid grid-cols-2 gap-2",
  style199_24: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style206_25: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style211_26: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ",
  style219_27: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ",
  style230_28: "p-3 rounded-xl bg-[#0B0F19] border border-[#14B8A6]/20  space-y-2",
  style231_29: "text-[10px] sm:text-[11px] font-black text-[#14B8A6] block",
  style234_30: "relative border border-dashed border-[#14B8A6]/35 rounded-lg p-2.5 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer",
  style239_31: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
  style242_32: "flex items-center gap-2",
  style243_33: "text-[10px] text-emerald-400 font-bold",
  style244_34: "text-xs",
  style247_35: "text-[10px] text-gray-400 animate-pulse",
  style249_36: "flex flex-col items-center",
  style250_37: "text-[9px] text-[#94A3B8]/80 leading-normal text-center font-medium",
  style251_38: "text-[8px] text-[#14B8A6]/60 block font-mono",
  style257_39: "pt-2",
  style260_40: "w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer",
  style269_41: "w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer",
} as const;


export function VehicleStep() {
    const t = useTranslations('auto');
  const {
    affiliation,
    vehicle,
    setVehicle,
    handleVehicleSubmit,
    isSubmitting,
    setStep,
    personal,
    setPersonal,
    fillCaptainRegistrationData,
  } = useRegistration();
  const [compressing, setCompressing] = React.useState(false);
  const isTaxi = affiliation === 'office-taxi';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
        setPersonal({ ...personal, verificationDoc: compressedBase64 });
        setCompressing(false);

        // Haptic feel
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleVehicleSubmit} className={styles.style72_1} dir="rtl">
      {
        <div className={styles.style74_2}>
          <Button
            type="button"
            onClick={fillCaptainRegistrationData}
            className={styles.style78_3}
          >
            {t('key_f06c06a0')}
                                </Button>
          <p className={styles.style82_4}>
            {t('key_1e9d34e7')}
                                </p>
        </div>
      }

      {isTaxi ? (
        <>
          <div>
            <label className={styles.style91_5}>
              {t('key_d36e572a')}
                                      </label>
            <Input
              placeholder={t('key_d36e572a')}
              value={vehicle.officeName}
              onChange={(e) => setVehicle({ ...vehicle, officeName: e.target.value })}
              className={styles.style98_6}
              required
            />
          </div>
          <div>
            <label className={styles.style103_7}>
              {t('key_d9162751')}
                                      </label>
            <Input
              type="tel"
              placeholder={t('key_d9162751')}
              value={vehicle.officePhone}
              onChange={(e) => setVehicle({ ...vehicle, officePhone: e.target.value })}
              className={styles.style111_8}
              required
            />
          </div>
          <div className={styles.style115_9}>
            <div>
              <label className={styles.style117_10}>
                {t('key_f0cafb7c')}
                                            </label>
              <Input
                placeholder={t('key_f0cafb7c')}
                value={vehicle.sideId}
                onChange={(e) => setVehicle({ ...vehicle, sideId: e.target.value })}
                className={styles.style124_11}
                required
              />
            </div>
            <div>
              <label className={styles.style129_12}>
                {t('key_ddc5f6b0')}
                                            </label>
              <Input
                placeholder={t('key_ddc5f6b0')}
                value={vehicle.plate}
                onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                className={styles.style136_13}
                required
              />
            </div>
          </div>
          <div>
            <label className={styles.style142_14}>
              {t('key_19c502e1')}
                                      </label>
            <Input
              type="number"
              placeholder={t('key_19c502e1')}
              value={vehicle.year}
              onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
              className={styles.style150_15}
              required
              min="1990"
              max="2027"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className={styles.style160_16}>
              {t('key_ae69bf11')}
                                          </label>
            <Input
              placeholder={t('key_ae69bf11')}
              value={vehicle.companyName}
              onChange={(e) => setVehicle({ ...vehicle, companyName: e.target.value })}
              className={styles.style167_17}
              required
            />
          </div>
          <div className={styles.style171_18}>
            <div>
              <label className={styles.style173_19}>
                {t('key_5db84e2e')}
                                                </label>
              <Input
                placeholder={t('key_7fd1a36c')}
                value={vehicle.make}
                onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                className={styles.style180_20}
                required
              />
            </div>
            <div>
              <label className={styles.style185_21}>
                {t('key_4851a7c0')}
                                                </label>
              <Input
                placeholder={t('key_4851a7c0')}
                value={vehicle.color}
                onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                className={styles.style192_22}
                required
              />
            </div>
          </div>
          <div className={styles.style197_23}>
            <div>
              <label className={styles.style199_24}>
                {t('key_ddc5f6b0')}
                                                </label>
              <Input
                placeholder={t('key_ddc5f6b0')}
                value={vehicle.plate}
                onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                className={styles.style206_25}
                required
              />
            </div>
            <div>
              <label className={styles.style211_26}>
                {t('key_19c502e1')}
                                                </label>
              <Input
                type="number"
                placeholder={t('key_19c502e1')}
                value={vehicle.year}
                onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                className={styles.style219_27}
                required
                min="1990"
                max="2027"
              />
            </div>
          </div>
        </>
      )}

      {/* 📥 [معمارية SC55 - وثيقة التحقق المهنية للناقل] */}
      <div className={styles.style230_28}>
        <label className={styles.style231_29}>
          {t('key_dcb56e26')}
                          </label>
        <div className={styles.style234_30}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.style239_31}
          />
          {personal.verificationDoc ? (
            <div className={styles.style242_32}>
              <span className={styles.style243_33}>{t('key_bfaaf7e3')}</span>
              <span className={styles.style244_34}>🛡️</span>
            </div>
          ) : compressing ? (
            <span className={styles.style247_35}>{t('key_724eadce')}</span>
          ) : (
            <div className={styles.style249_36}>
              <span className={styles.style250_37}>{t('key_d174be37')}</span>
              <span className={styles.style251_38}>{t('key_b5d786bc')}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.style257_39}>
        <button
          type="submit"
          className={styles.style260_40}
          disabled={isSubmitting || compressing}
        >
          {isSubmitting ? t('key_9e20ee28') : t('key_210d395b')}
        </button>
      </div>

      <button
        type="button"
        className={styles.style269_41}
        onClick={() => setStep('affiliation')}
      >
        {t('key_16c42f71')}
                    </button>
    </form>
  );
}
