'use client';

import React from 'react';
import { Check, Eye, EyeOff, LockKeyhole, MapPin, Phone, UserRound } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { styles } from './register-styles';
import { RegisterField } from './register-field';
import { governorates, type AuthType, type GovernorateKey } from './register-constants';

interface RegisterFormProps {
  authType: AuthType;
  language: 'ar' | 'en';
  isArabic: boolean;
  t: (typeof import('./register-constants').copy)['ar'] | (typeof import('./register-constants').copy)['en'];
  phone: string;
  setPhone: (phone: string) => void;
  isPhoneValid: boolean;
  phoneValidation: { ok: boolean; message?: string };
  governorate: GovernorateKey;
  setGovernorate: (gov: GovernorateKey) => void;
  districtOptions: Array<{ ar: string; en: string }>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: () => void;
}

export function RegisterForm({
  authType,
  language,
  isArabic,
  t,
  phone,
  setPhone,
  isPhoneValid,
  phoneValidation,
  governorate,
  setGovernorate,
  districtOptions,
  showPassword,
  setShowPassword,
  onSubmit,
}: RegisterFormProps) {
  return (
    <form
      key={authType}
      className={styles.style237_21}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {authType === 'register' ? (
        <RegisterField label={t.fullName} icon={<UserRound className={styles.style244_22} />}>
          <input
            suppressHydrationWarning
            type="text"
            placeholder={t.fullNamePlaceholder}
            className={styles.input}
            autoComplete="name"
          />
        </RegisterField>
      ) : null}

      <RegisterField label={t.phone} icon={<Phone className={styles.style255_23} />}>
        <div className="relative">
          <input
            suppressHydrationWarning
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder={t.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(
              styles.input,
              isPhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isPhoneValid && phone.trim() && '!border-amber-500/60 focus:!border-amber-500'
            )}
            autoComplete="tel"
          />
          {isPhoneValid ? (
            <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isPhoneValid ? (
          <p className="text-[11px] text-[#94A3B8] font-medium mt-1">
            {phone.trim()
              ? phoneValidation.message || t.phonePlaceholder
              : isArabic
              ? 'اكتب رقم هاتفك بالنسق المحلي أو الدولي'
              : 'Enter your phone number'}
          </p>
        ) : null}
      </RegisterField>

      {authType === 'register' ? (
        <div className={styles.style267_24}>
          <RegisterField label={t.governorate} icon={<MapPin className={styles.style268_25} />}>
            <Select
              value={governorate}
              onValueChange={(value) => setGovernorate(value as GovernorateKey)}
            >
              <SelectTrigger className={styles.customSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                {(Object.keys(governorates) as GovernorateKey[]).map((key) => (
                  <SelectItem key={key} value={key} className={styles.customSelectItem}>
                    {governorates[key][language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </RegisterField>

          <RegisterField label={t.district} icon={<MapPin className={styles.style286_29} />}>
            <Select>
              <SelectTrigger className={styles.customSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                {districtOptions.map((district) => (
                  <SelectItem key={district.en} value={district.en} className={styles.customSelectItem}>
                    {district[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </RegisterField>
        </div>
      ) : null}

      <RegisterField label={t.password} icon={<LockKeyhole className={styles.style301_33} />}>
        <div className={styles.style302_34}>
          <input
            suppressHydrationWarning
            type={showPassword ? 'text' : 'password'}
            placeholder={t.passwordPlaceholder}
            className={cn(styles.input, styles.style307_35)}
            autoComplete={authType === 'register' ? 'new-password' : 'current-password'}
          />
          <button
            type="button"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className={styles.style314_36}
          >
            {showPassword ? <EyeOff className={styles.style316_37} /> : <Eye className={styles.style316_38} />}
          </button>
        </div>
      </RegisterField>

      <button type="submit" className={styles.style325_39}>
        {authType === 'register' ? t.submitRegister : t.submitLogin}
      </button>
    </form>
  );
}
