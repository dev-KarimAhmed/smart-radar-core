'use client';

import React from 'react';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { styles } from './permissions-types';

export interface PermissionDetailedInstructionsProps {
  showInstructions: boolean;
  setShowInstructions: React.Dispatch<React.SetStateAction<boolean>>;
  isArabic: boolean;
}

export function PermissionDetailedInstructions({
  showInstructions,
  setShowInstructions,
  isArabic,
}: PermissionDetailedInstructionsProps) {
  return (
    <div>
      <button
        type="button"
        onClick={() => setShowInstructions((prev) => !prev)}
        className={styles.instructionsToggle}
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle className="h-3 w-3 text-[#14F5D5]" />
          {isArabic ? 'شرح فك الحظر بالتفصيل حسب جهازك' : 'Detailed device instructions'}
        </span>
        {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {showInstructions && (
        <div className={styles.instructionsPanel}>
          <p className="font-bold text-[#14F5D5]">
            {isArabic ? '💬 تطبيقات المحادثة (Telegram, Messenger, WhatsApp, Instagram):' : '💬 Chat Apps (Telegram, Messenger, WhatsApp, Instagram):'}
          </p>
          <div className="space-y-1.5 text-slate-300 text-[11px] bg-white/[0.04] p-2 rounded-lg border border-white/10">
            <p className="text-emerald-300 font-bold">
              {isArabic
                ? '🧭 الخيار الأول (الأسهل والأسرع): اضغط أيقونة البوصلة أسفل الشاشة أو زر (•••) وافتحه في Safari أو المتصفح الخارجي.'
                : '🧭 Option 1 (Fastest): Tap the Compass icon at bottom or (•••) to open in Safari or external browser.'}
            </p>
            <p>
              {isArabic
                ? '⚙️ الخيار الثاني (للعمل داخل التطبيق نفسه): ادخل إعدادات الآيفون العامة ➔ ابحث عن اسم التطبيق (Telegram أو Messenger) ➔ الموقع ➔ اختر "أثناء استخدام التطبيق" وفعّل "الموقع الدقيق".'
                : '⚙️ Option 2 (To run inside the app): iPhone Settings ➔ Select the app (Telegram or Messenger) ➔ Location ➔ "While Using the App" & ON "Precise Location".'}
            </p>
          </div>
          <p className="font-bold text-white mt-2">
            {isArabic ? '📱 هواتف iPhone (متصفح Safari):' : '📱 iPhone (Safari):'}
          </p>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <p>
              {isArabic
                ? '1️⃣ داخل سفاري: اضغط زر (aA) أو (•••) بشريط العنوان ➔ إعدادات موقع الويب ➔ الموقع: اختر "السماح".'
                : '1️⃣ In Safari: Tap (aA) or (•••) in address bar ➔ Website Settings ➔ Location: Select "Allow".'}
            </p>
            <p>
              {isArabic
                ? '2️⃣ أو من إعدادات الآيفون ⚙️ ➔ Safari ➔ الموقع ➔ اختر bynkcom.com واجعله "السماح".'
                : '2️⃣ Or in iPhone Settings ⚙️ ➔ Safari ➔ Location ➔ Select bynkcom.com and choose "Allow".'}
            </p>
            <p className="text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed">
              {isArabic
                ? '3️⃣ إعدادات النظام: تأكد من (إعدادات الآيفون ⚙️ ➔ الخصوصية والأمن ➔ خدمات الموقع ➔ مواقع Safari ➔ أثناء استخدام التطبيق مع تفعيل الموقع الدقيق).'
                : '3️⃣ System: Check (Settings ⚙️ ➔ Privacy & Security ➔ Location Services ➔ Safari Websites ➔ While Using App & Precise Location ON).'}
            </p>
          </div>
          <p className="font-bold text-white mt-1">
            {isArabic ? '🤖 هواتف Android (Chrome):' : '🤖 Android (Chrome):'}
          </p>
          <p>
            {isArabic
              ? 'اضغط أيقونة القفل 🔒 بجانب الرابط ➔ الأذونات ➔ فعّل الموقع والحافظة.'
              : 'Tap lock icon 🔒 ➔ Permissions ➔ Allow Location & Clipboard.'}
          </p>
          <p className="font-bold text-white mt-1">
            {isArabic ? '💻 الكمبيوتر (Windows / Chrome):' : '💻 PC (Windows / Chrome):'}
          </p>
          <p>
            {isArabic
              ? 'إعدادات ويندوز ➔ الخصوصية ➔ فعّل "خدمات الموقع". واضغط أيقونة القفل 🔒 بالمتصفح واختر "سماح".'
              : 'Windows Settings ➔ Privacy ➔ Turn ON Location. Click lock 🔒 in Chrome ➔ Allow.'}
          </p>
        </div>
      )}
    </div>
  );
}
