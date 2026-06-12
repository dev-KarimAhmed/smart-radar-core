'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates } from '@/lib/data';

export function PersonalStep() {
  const { personal, setPersonal, handlePersonalSubmit, districts, isSubmitting, role, setStep } = useRegistration();
  const [compressing, setCompressing] = React.useState(false);

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

        // Haptic feedback confirming successful compression
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handlePersonalSubmit} className="space-y-4 text-right animate-fade-in" dir="rtl">
      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          الاسم الكامل
        </label>
        <Input
          placeholder="الاسم الكامل"
          value={personal.name}
          onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-right"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          رقم الهاتف (النسق الدولي المعتمد)
        </label>
        <Input
          type="tel"
          dir="ltr"
          placeholder="+962790000000"
          value={personal.phone}
          onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(20,184,166,0.1)] text-left"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
            المحافظة
          </label>
          <Select
            value={personal.gov}
            onValueChange={(value) => setPersonal({ ...personal, gov: value, district: '' })}
            required
          >
            <SelectTrigger className="h-12 bg-[#0B0F19] border border-[#243249] text-white text-right outline-none focus:border-[#14B8A6] rounded-xl" dir="rtl">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent className="bg-[#161F30] border border-[#243249] text-white">
              {jordanGovernorates.map((gov) => (
                <SelectItem key={gov} value={gov} className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">{gov}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
            اللواء
          </label>
          <Select
            value={personal.district}
            onValueChange={(value) => setPersonal({ ...personal, district: value })}
            disabled={!personal.gov}
            required
          >
            <SelectTrigger className="h-12 bg-[#0B0F19] border border-[#243249] text-white text-right outline-none focus:border-[#14B8A6] rounded-xl" dir="rtl">
              <SelectValue placeholder="اختر اللواء" />
            </SelectTrigger>
            <SelectContent className="bg-[#161F30] border border-[#243249] text-white">
              {districts.map((dist) => (
                <SelectItem key={dist} value={dist} className="text-right justify-end hover:bg-[#14B8A6]/20 cursor-pointer">{dist}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 📥 [معمارية SC55 - وثيقة التحقق والهوية الشخصية المكبوسة حافلياً] */}
      {role === 'rider' && (
        <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#14B8A6]/20 text-right space-y-2">
          <label className="text-[10px] sm:text-[11px] font-black text-[#14B8A6] block">
            📥 الهوية الأحوال الأردنية ( وتد الأمان الرقمي ):
          </label>
          <div className="relative border border-dashed border-[#14B8A6]/30 rounded-lg p-2.5 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {personal.verificationDoc ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold">✓ تم ضغط وحقن الهوية سيادياً</span>
                <span className="text-xs">💳</span>
              </div>
            ) : compressing ? (
              <span className="text-[10px] text-gray-400 animate-pulse">جاري ضغط النواة والمغنطة...</span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-[#94A3B8]/80 leading-normal text-center">ارفِق صورة الهوية لحقن المناعة الجينية</span>
                <span className="text-[8px] text-[#14B8A6]/50 block font-mono">JPG / PNG - مضغوطة للغاية</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button 
          type="submit" 
          className="w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          disabled={isSubmitting || compressing}
        >
          {isSubmitting ? 'جاري التحضير...' : role === 'rider' ? 'الدخول الآمن للنظام' : 'متابعة'}
        </button>
      </div>

      <button 
        type="button" 
        className="w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer" 
        onClick={() => setStep('role')}
      >
        العودة لتعديل الصفة
      </button>
    </form>
  );
}
