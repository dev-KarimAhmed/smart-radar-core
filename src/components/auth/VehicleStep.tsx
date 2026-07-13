'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';

export function VehicleStep() {
  const { affiliation, vehicle, setVehicle, handleVehicleSubmit, isSubmitting, setStep, personal, setPersonal } = useRegistration();
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
    <form onSubmit={handleVehicleSubmit} className="space-y-4 text-right animate-fade-in" dir="rtl">
      {isTaxi ? (
        <>
          <div>
            <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
              اسم المكتب
            </label>
            <Input
              placeholder="اسم المكتب"
              value={vehicle.officeName}
              onChange={(e) => setVehicle({ ...vehicle, officeName: e.target.value })}
              className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
              رقم هاتف المكتب
            </label>
            <Input
              type="tel"
              placeholder="رقم هاتف المكتب"
              value={vehicle.officePhone}
              onChange={(e) => setVehicle({ ...vehicle, officePhone: e.target.value })}
              className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                اللوحة الجانبية
              </label>
              <Input
                placeholder="اللوحة الجانبية"
                value={vehicle.sideId}
                onChange={(e) => setVehicle({ ...vehicle, sideId: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                لوحة السيارة
              </label>
              <Input
                placeholder="لوحة السيارة"
                value={vehicle.plate}
                onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
              سنة الصنع
            </label>
            <Input
              type="number"
              placeholder="سنة الصنع"
              value={vehicle.year}
              onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
              className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
              required
              min="1990"
              max="2027"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
              اسم الشركة (أوبر، كريم...)
            </label>
            <Input
              placeholder="اسم الشركة (أوبر، كريم...)"
              value={vehicle.companyName}
              onChange={(e) => setVehicle({ ...vehicle, companyName: e.target.value })}
              className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                نوع السيارة
              </label>
              <Input
                placeholder="نوع السيارة (تويوتا..)"
                value={vehicle.make}
                onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                اللون
              </label>
              <Input
                placeholder="اللون"
                value={vehicle.color}
                onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                لوحة السيارة
              </label>
              <Input
                placeholder="لوحة السيارة"
                value={vehicle.plate}
                onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-radar-text-sub tracking-wider uppercase mb-1 text-right">
                سنة الصنع
              </label>
              <Input
                type="number"
                placeholder="سنة الصنع"
                value={vehicle.year}
                onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                className="w-full bg-radar-bg-deep border border-radar-muted focus:border-radar-teal text-radar-text-bright placeholder-radar-text-sub/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right"
                required
                min="1990"
                max="2027"
              />
            </div>
          </div>
        </>
      )}

      {/* 📥 [معمارية SC55 - وثيقة التحقق المهنية للناقل] */}
      <div className="p-3 rounded-xl bg-radar-bg-deep border border-radar-teal/20 text-right space-y-2">
        <label className="text-[10px] sm:text-[11px] font-black text-radar-teal block">
          🔐 رخصة السوق / رخصة القيادة المهنية:
        </label>
        <div className="relative border border-dashed border-radar-teal/35 rounded-lg p-2.5 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {personal.verificationDoc ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold">✓ تم تشفير وضغط الرخصة بـ SC55</span>
              <span className="text-xs">🛡️</span>
            </div>
          ) : compressing ? (
            <span className="text-[10px] text-gray-400 animate-pulse">جاري فحص وتكثيف رقعة الصورة...</span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-radar-text-sub/80 leading-normal text-center font-medium">اسحب وأسقِط رخصتك هنا لتفعيل المناعة المهنية</span>
              <span className="text-[8px] text-radar-teal/60 block font-mono">تُضغط الصورة تلقائياً لصفر كلفة قراءة</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-radar-teal hover:bg-radar-teal/90 text-radar-bg-deep font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgb(var(--radar-teal-rgb)/0.2)] hover:shadow-[0_4px_25px_rgb(var(--radar-teal-rgb)/0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          disabled={isSubmitting || compressing}
        >
          {isSubmitting ? 'جاري تجهيز البيانات...' : 'الدخول للنظام'}
        </button>
      </div>

      <button
        type="button"
        className="w-full text-xs text-radar-text-sub/60 hover:text-white transition-colors py-2 cursor-pointer"
        onClick={() => setStep('affiliation')}
      >
        العودة لتعديل الانتماء
      </button>
    </form>
  );
}
