import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CountryRow } from '../profile-shared';

export interface ProfilePhoneInputsProps {
  t: any;
  isArabic: boolean;
  phone: string;
  setPhone: (val: string) => void;
  isPhoneValid: boolean;
  phoneValidation: { ok: boolean; message?: string };
  emergencyWhatsappContact: string;
  setEmergencyWhatsappContact: (val: string) => void;
  isEmergencyValid: boolean;
  emergencyValidation: { ok: boolean; message?: string };
}

export function ProfilePhoneInputs({
  t,
  isArabic,
  phone,
  setPhone,
  isPhoneValid,
  phoneValidation,
  emergencyWhatsappContact,
  setEmergencyWhatsappContact,
  isEmergencyValid,
  emergencyValidation,
}: ProfilePhoneInputsProps) {
  return (
    <>
      {/* Phone Number */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Phone className="h-3.5 w-3.5 text-[#14F5D5]" />
          <span>{t('phone')}</span>
        </label>
        <div className="relative">
          <Input
            value={phone}
            dir="ltr"
            onChange={(event) => setPhone(event.target.value)}
            className={cn(
              'h-11 rounded-2xl border-[#14B8A6]/25 bg-black/40 text-white text-sm font-mono focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]',
              isPhoneValid && '!border-emerald-500/70 focus-visible:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isPhoneValid && phone.trim() && '!border-amber-500/60 focus-visible:!border-amber-500'
            )}
            placeholder="+962790000000"
            required
          />
          {isPhoneValid ? (
            <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isPhoneValid ? (
          <p className="text-[11px] text-amber-400/90 font-medium pt-0.5">
            {phone.trim()
              ? phoneValidation.message || t('phoneInvalid')
              : isArabic
              ? 'اكتب رقم هاتفك بالنسق المحلي أو الدولي'
              : 'Enter your phone number'}
          </p>
        ) : null}
      </div>

      {/* Emergency WhatsApp Contact */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <MessageCircle className="h-3.5 w-3.5 text-[#14F5D5]" />
          <span>{t('emergencyWhatsappContact')}</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={emergencyWhatsappContact}
              dir="ltr"
              onChange={(event) => setEmergencyWhatsappContact(event.target.value)}
              className={cn(
                'h-11 rounded-2xl border-[#14B8A6]/25 bg-black/40 text-white text-sm font-mono focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]',
                emergencyWhatsappContact.trim() && isEmergencyValid && '!border-emerald-500/70 focus-visible:!border-emerald-500 ring-1 ring-emerald-500/20',
                emergencyWhatsappContact.trim() && !isEmergencyValid && '!border-amber-500/60 focus-visible:!border-amber-500'
              )}
              placeholder={t('emergencyWhatsappPlaceholder')}
            />
            {emergencyWhatsappContact.trim() && isEmergencyValid ? (
              <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                <Check className="h-4 w-4 stroke-[2.5]" />
              </span>
            ) : null}
          </div>
          {emergencyWhatsappContact ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmergencyWhatsappContact('')}
              className="h-11 shrink-0 rounded-2xl border-rose-500/20 bg-rose-950/20 px-3 text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              aria-label={t('deleteEmergencyContact')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {emergencyWhatsappContact.trim() && !isEmergencyValid ? (
          <p className="text-[11px] text-amber-400/90 font-medium pt-0.5">
            {emergencyValidation.message || (isArabic ? 'رقم الواتساب غير صالح' : 'Invalid WhatsApp phone number')}
          </p>
        ) : null}
      </div>
    </>
  );
}
