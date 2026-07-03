# Simple Arabic / English Copy Guide

Purpose: keep all user-facing text clear, normal, and easy to understand.

Tone target: **Uber / inDrive style** in simple Modern Standard Arabic. Short words, direct actions, no local dialect, and no dramatic system language.

Source of truth in code: `src/lib/i18n/simple-copy.ts`

## Style Rules

| Rule | Simple Arabic | English |
| --- | --- | --- |
| Use simple standard Arabic | اكتب بعربية واضحة ومحايدة. | Write clear neutral Arabic. |
| Keep buttons short | اطلب الآن، حفظ، رجوع، تسجيل الدخول. | Request now, Save, Back, Sign in. |
| Avoid dramatic words | لا تستخدم: سيادي، نبض، مقصلة، إعدام، فرسان. | Avoid dramatic or ceremonial words. |
| Say the next step | وضح للمستخدم ماذا يفعل الآن. | Tell the user what to do next. |
| Use one word for one thing | لا تغيّر الاسم بين شاشة وشاشة. | Keep labels consistent. |

## Main Replacements

| Avoid | Use | English |
| --- | --- | --- |
| الرادار / رادار الرحلة | طلب الرحلة / الخريطة | Ride request / Map |
| نهر الإعلانات | إعلانات قريبة منك | Ads near you |
| نبض ميداني | إعلان قريب | Nearby ad |
| الكابتن / الكباتن | السائق / السائقون | Driver / Drivers |
| المحفوظات / الخزنة | المفضلة | Favorites |
| المحفظة | الرصيد | Balance |
| السجل | رحلاتي | My trips |
| إغلاق المنصة | تسجيل الخروج | Log out |
| طلب جديد | اطلب رحلة | Request a ride |
| رحلة نشطة | الرحلة بدأت | Trip started |
| السعر النهائي | السعر | Price |
| بروتوكول / سيادة / عهد | النظام / التطبيق | System / App |

## Rider Navigation

| Arabic | English |
| --- | --- |
| الرئيسية | Home |
| رحلاتي | My trips |
| الرصيد | Balance |
| المفضلة | Favorites |
| حسابي | Profile |
| اطلب رحلة | Request a ride |
| التنبيهات | Notifications |

## Rider Flow Copy

| Situation | Arabic | English |
| --- | --- | --- |
| Main card title | إلى أين تريد الذهاب؟ | Where to? |
| Main card helper | اختر وجهتك وسنبحث عن سائق قريب. | Choose a destination and we will look for a nearby driver. |
| Open destination | اطلب رحلة | Request a ride |
| Destination screen | حدد وجهتك | Choose your destination |
| Send request | اطلب الآن | Request now |
| Waiting | نبحث عن سائق قريب | Looking for a nearby driver |
| Offers arrived | وصلت عروض | Offers arrived |
| Offers helper | اختر العرض المناسب لك. | Choose the offer that works for you. |
| Active trip | الرحلة بدأت | Trip started |
| Active trip helper | السائق في الطريق إليك. | Your driver is on the way. |
| Complete test trip | إنهاء الرحلة | Complete trip |
| Rating | قيّم الرحلة | Rate the trip |
| Favorite driver | أضف للمفضلة | Add to favorites |
| No drivers | لا يوجد سائقون قريبون الآن. حاول مرة أخرى بعد قليل. | No nearby drivers right now. Try again shortly. |

## Auth Copy

| Situation | Arabic | English |
| --- | --- | --- |
| Welcome | أهلا بك | Welcome |
| Signup tab | حساب جديد | New account |
| Login tab | تسجيل الدخول | Sign in |
| Full name | الاسم الكامل | Full name |
| Phone | رقم الهاتف | Phone number |
| Password | كلمة المرور | Password |
| Country | الدولة | Country |
| Governorate | المحافظة | Governorate |
| District | المنطقة | District |
| Remember me | تذكرني | Remember me |
| Forgot password | نسيت كلمة المرور؟ | Forgot password? |
| Login error | رقم الهاتف أو كلمة المرور غير صحيحة. | Phone or password is incorrect. |
| Signup duplicate | رقم الهاتف مسجل بالفعل. سجل الدخول بدلا من إنشاء حساب جديد. | This phone already exists. Sign in instead. |
| Network error | تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى. | Could not connect. Check your internet and try again. |

## Ads Copy

| Situation | Arabic | English |
| --- | --- | --- |
| Section title | إعلانات قريبة منك | Ads near you |
| Empty state | لا توجد إعلانات في منطقتك الآن. | No ads in your area right now. |
| Badge default | إعلان قريب | Nearby ad |
| Rider badge | للركاب | For riders |
| Driver badge | للسائقين | For drivers |
| CTA fallback | عرض التفاصيل | View details |
| Save ad | حفظ الإعلان | Save ad |
| Previous | الإعلان السابق | Previous ad |
| Next | الإعلان التالي | Next ad |

## Error Message Examples

| Bad | Better Arabic | English |
| --- | --- | --- |
| تعذر تنفيذ البروتوكول | حدث خطأ. حاول مرة أخرى. | Something went wrong. Try again. |
| فشل السيادة على الحالة | تعذر تحديث الحالة. حاول مرة أخرى. | Could not update the status. Try again. |
| عطل ملاحي | فعّل الموقع لاستخدام هذه الميزة. | Enable location to use this feature. |
| تم إعدام الإعلان | تم حذف الإعلان. | The ad was deleted. |
| تم قذف الإعلان إلى النهر | تم نشر الإعلان. | The ad was published. |

## Migration Plan

1. Keep new UI text short and direct.
2. Replace hardcoded Arabic screen by screen.
3. Remove corrupted Arabic text wherever broken Latin-looking characters appear.
4. Replace heavy product words with the table above.
5. Test mobile screens because Arabic line length changes layout quickly.
