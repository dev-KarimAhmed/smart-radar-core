'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdvertiserStep() {
  const { advertiserProfile, setAdvertiserProfile, handleAdvertiserSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdvertiserSubmit} className="space-y-4 text-right animate-fade-in" dir="rtl">
      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          اسم المنشأة / العلامة التجارية (اسم معلن فريد)
        </label>
        <Input
          placeholder="رنين للمبيعات، سيف بلس، إلخ..."
          value={advertiserProfile.companyName}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, companyName: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          رقم السجل التجاري المعمتد
        </label>
        <Input
          placeholder="مثال: CR-88294-A"
          value={advertiserProfile.commercialRegister}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, commercialRegister: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          رقم رخصة الإعلان الحكومي / الأمانة
        </label>
        <Input
          placeholder="مثال: LIC-990-2026"
          value={advertiserProfile.adLicense}
          onChange={(e) => setAdvertiserProfile({ ...advertiserProfile, adLicense: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          التخصص والنشاط التجاري الرئيسي
        </label>
        <Select
          value={advertiserProfile.businessType}
          onValueChange={(value) => setAdvertiserProfile({ ...advertiserProfile, businessType: value })}
          required
        >
          <SelectTrigger className="h-12 bg-[#0B0F19] border border-[#243249] text-white text-right outline-none focus:border-[#14B8A6] rounded-xl" dir="rtl">
            <SelectValue placeholder="اختر تخصص المنشأة" />
          </SelectTrigger>
          <SelectContent className="bg-[#161F30] border border-[#243249] text-white">
            <SelectItem value="commercial" className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">تجاري / بيع بالتجزئة</SelectItem>
            <SelectItem value="services" className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">خدمات وصيانة</SelectItem>
            <SelectItem value="entertainment" className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">مطاعم وترفيه ونشاطات</SelectItem>
            <SelectItem value="real_estate" className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">عقارات ونقل</SelectItem>
            <SelectItem value="e_commerce" className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">تجارة إلكترونية ودعم رقمي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري حفظ البيانات...' : 'تأكيد البيانات'}
        </button>
      </div>

      <button
        type="button"
        className="w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer"
        onClick={() => setStep('personal')}
      >
        العودة لتعديل البيانات الشخصية
      </button>
    </form>
  );
}
