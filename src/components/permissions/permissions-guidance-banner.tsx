'use client';

import React, { useState } from 'react';
import { Lock, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { styles, type DetectedEnvironment } from './system-permissions-styles';

interface GuidanceBannerProps {
  hasAnyDenied: boolean;
  detectedEnv: DetectedEnvironment;
  isArabic: boolean;
}

export function PermissionsGuidanceBanner({ hasAnyDenied, detectedEnv, isArabic }: GuidanceBannerProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      {hasAnyDenied && (
        <div className={styles.deniedBanner}>
          <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed text-slate-300 flex-1 space-y-1.5">
            {detectedEnv === 'telegram' && (
              <>
                <p className="font-bold text-[#14F5D5]">
                  {isArabic ? '📱 أنت تتصفح من داخل تطبيق تيليجرام (Telegram):' : '📱 You are browsing inside Telegram:'}
                </p>
                <p>
                  {isArabic
                    ? '🧭 الحل الأسرع: اضغط أيقونة البوصلة أسفل يمين الشاشة لفتح الموقع في متصفح Safari.'
                    : '🧭 Quickest: Tap the Compass icon at bottom-right to open directly in Safari.'}
                </p>
                <p className="text-amber-200">
                  {isArabic
                    ? '⚙️ أو للتشغيل داخل تيليجرام: ادخل (إعدادات الآيفون ➔ تطبيق Telegram ➔ الموقع ➔ أثناء استخدام التطبيق).'
                    : '⚙️ Or to run in Telegram: (iPhone Settings ➔ Telegram app ➔ Location ➔ While Using the App).'}
                </p>
              </>
            )}

            {(detectedEnv === 'messenger' || detectedEnv === 'facebook') && (
              <>
                <p className="font-bold text-[#14F5D5]">
                  {isArabic ? '📱 أنت تتصفح من داخل تطبيق فيسبوك / ماسنجر:' : '📱 Browsing inside Facebook/Messenger:'}
                </p>
                <p>
                  {isArabic
                    ? '🌐 اضغط زر النقاط الثلاث (•••) بالأعلى ➔ اختَر "فتح في المتصفح الخارجي" (Safari / Chrome).'
                    : '🌐 Tap (•••) at top ➔ "Open in External Browser" (Safari / Chrome).'}
                </p>
                <p className="text-amber-200">
                  {isArabic
                    ? '⚙️ أو في إعدادات الهاتف ➔ تطبيق Messenger ➔ الأذونات ➔ تفعيل الموقع الجغرافي.'
                    : '⚙️ Or in Phone Settings ➔ Messenger app ➔ Permissions ➔ Allow Location.'}
                </p>
              </>
            )}

            {detectedEnv === 'instagram' && (
              <>
                <p className="font-bold text-[#14F5D5]">
                  {isArabic ? '📱 أنت تتصفح من داخل تطبيق إنستغرام (Instagram):' : '📱 Browsing inside Instagram:'}
                </p>
                <p>
                  {isArabic
                    ? '🌐 اضغط زر (•••) بأعلى الشاشة ➔ اختَر "فتح في المتصفح الخارجي" (Open in external browser).'
                    : '🌐 Tap (•••) at top ➔ "Open in external browser".'}
                </p>
                <p className="text-amber-200">
                  {isArabic
                    ? '⚙️ أو في إعدادات الهاتف ➔ تطبيق Instagram ➔ الأذونات ➔ تفعيل الموقع الجغرافي.'
                    : '⚙️ Or in Phone Settings ➔ Instagram app ➔ Permissions ➔ Allow Location.'}
                </p>
              </>
            )}

            {detectedEnv === 'whatsapp' && (
              <>
                <p className="font-bold text-[#14F5D5]">
                  {isArabic ? '📱 أنت تتصفح من داخل تطبيق واتساب (WhatsApp):' : '📱 Browsing inside WhatsApp:'}
                </p>
                <p>
                  {isArabic
                    ? '🌐 اضغط خيارات المشاركة أو (•••) وافتحه في المتصفح الخارجي (Safari / Chrome).'
                    : '🌐 Tap share or (•••) and open in external browser (Safari / Chrome).'}
                </p>
              </>
            )}

            {detectedEnv === 'ios-safari' && (
              <>
                <p className="font-bold text-rose-300">
                  {isArabic ? 'طريقة فك الحظر في متصفح Safari (الآيفون):' : 'How to unblock in Safari (iPhone):'}
                </p>
                <p>
                  {isArabic
                    ? '1️⃣ اضغط زر (aA) أو (•••) بشريط الرابط ➔ إعدادات موقع الويب ➔ الموقع: اختر "السماح".'
                    : '1️⃣ Tap (aA) or (•••) in address bar ➔ Website Settings ➔ Location: Select "Allow".'}
                </p>
                <p className="text-amber-200">
                  {isArabic
                    ? '2️⃣ إن استمر الحظر: إعدادات الآيفون ⚙️ ➔ Safari ➔ الموقع ➔ bynkcom.com ➔ السماح.'
                    : '2️⃣ If still blocked: iPhone Settings ⚙️ ➔ Safari ➔ Location ➔ bynkcom.com ➔ Allow.'}
                </p>
              </>
            )}

            {detectedEnv === 'android' && (
              <>
                <p className="font-bold text-rose-300">
                  {isArabic ? 'طريقة فك الحظر في أندرويد (Chrome):' : 'How to unblock on Android (Chrome):'}
                </p>
                <p>
                  {isArabic
                    ? '🔒 اضغط أيقونة القفل أو شريط العنوان ➔ الأذونات ➔ فعّل إذن الموقع الجغرافي.'
                    : '🔒 Tap the lock icon in address bar ➔ Permissions ➔ Allow Location.'}
                </p>
              </>
            )}

            {detectedEnv === 'other' && (
              <>
                <p className="font-bold text-rose-300">
                  {isArabic ? 'الأذونات محظورة في المتصفح أو التطبيق:' : 'Permissions blocked in browser or app:'}
                </p>
                <p>
                  {isArabic
                    ? '🧭 إن كنت داخل تطبيق شات (تيليجرام/ماسنجر): اضغط أيقونة البوصلة 🧭 أو (•••) للفتح في المتصفح الخارجي.'
                    : '🧭 If in chat app (Telegram/Messenger): Tap Compass icon or (•••) to open in Safari/Chrome.'}
                </p>
                <p className="text-amber-200">
                  {isArabic
                    ? '⚙️ أو ادخل إعدادات الهاتف وفعّل إذن الموقع للتطبيق أو المتصفح الذي تستخدمه.'
                    : '⚙️ Or open Phone Settings and enable Location permission for your active app/browser.'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Browser Settings Help Accordion */}
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
              {isArabic
                ? '💬 تطبيقات المحادثة (Telegram, Messenger, WhatsApp, Instagram):'
                : '💬 Chat Apps (Telegram, Messenger, WhatsApp, Instagram):'}
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
    </>
  );
}
