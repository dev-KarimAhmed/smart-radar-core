'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Radio,
  Clock,
  BarChart3,
  Users2,
  Database,
  MapPin,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { styles } from './captain-ads-styles';

interface CaptainAdPackageModalProps {
  isOpen: boolean;
  isArabic: boolean;
  onClose: () => void;
  onGoToPayment: () => void;
  onActivatePackage: () => void;
}

export function CaptainAdPackageModal({
  isOpen,
  isArabic,
  onClose,
  onGoToPayment,
  onActivatePackage,
}: CaptainAdPackageModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 pb-4 bg-[#070D19] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
              <Sparkles className="h-5 w-5 text-[#00ffcc]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isArabic ? 'اشتري حصص النشر في محيطك وعلن عن نفسك' : 'Buy Ad Quotas in Your Area'}
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] text-[11px] font-bold">
                  {isArabic ? 'باقة الخدمات / A' : 'Services Package A'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                {isArabic ? 'عند زر الدخول يختار الباقة ثم ينتقل الى وسيلة الدفع واختيار وسيلة' : 'Choose package then proceed to payment channel'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: 8 Exact Specs from Page 6 */}
        <div className="overflow-y-auto p-5 space-y-2.5 flex-1 overscroll-contain">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <Radio className="h-5 w-5 text-[#00ffcc] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'الانتشار:' : 'Coverage:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'عرض البطاقة الإعلانية والتعريفية 500 متر بالمحيط، إدارة الاختيار تصفية فرص.' : 'Display ad card in 500m perimeter, opportunity filter.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'مدة البث الإعلاني:' : 'Duration & Quota:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? '30 يوم / بوست إعلاني العدد 3 (قياس).' : '30 days broadcast / 3 ad posts (standard).'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <BarChart3 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'مؤشرات السوق الاسترشادية:' : 'Market Indicators:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'إظهار قيم العروض ومؤشرات توازن المحيط بدقة عالية.' : 'Display offer values and real-time area balance.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <Users2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'حفظ رصيد الزبائن الدائمين:' : 'Customer Base Retention:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'قوائم الكباتن المفضلين وبناء قاعدة عملاء دائمين.' : 'Favorite captain lists and permanent customer base.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'إدارة الاختيار والرفض المستقل:' : 'Independent Control:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'تصفية فرص التواصل والطلبات بحرية تامة دون قيود.' : 'Filter contact and request opportunities independently.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <Database className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'توفير ذاكرة إحصائية:' : 'Statistical Memory:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'سجل إحصائي كامل للنشاط والتفاعل المحيطي.' : 'Precise activity and engagement records.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <MapPin className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-black text-xs sm:text-sm">
                {isArabic ? 'الظهور الإعلاني المكاني:' : 'Geographical Coverage:'}
              </strong>
              <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                {isArabic ? 'اللواء خارج المحافظة (مكان التواجد الفعلي للكابتن).' : 'District coverage outside the governorate.'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoToPayment}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-[#00ffcc] px-4 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>{isArabic ? 'الانتقال الى وسيلة الدفع واختيار وسيلة' : 'Proceed to Payment Channel'}</span>
          </button>

          <button
            type="button"
            onClick={onActivatePackage}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-3 text-xs sm:text-sm font-black text-emerald-300 transition cursor-pointer"
            title={isArabic ? 'تفعيل فوري للباقة' : 'Activate now'}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isArabic ? 'تأكيد وتفعيل الباقة' : 'Activate Package'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-slate-300 transition cursor-pointer"
          >
            {isArabic ? 'رجوع' : 'Back'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
