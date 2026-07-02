# Simple Arabic / English Copy Guide

Purpose: keep all user-facing text clear, normal, and easy to understand.

Source of truth in code: `src/lib/i18n/simple-copy.ts`

## Style Rules

| Rule | Arabic | English |
| --- | --- | --- |
| Use simple words | اكتب بلغة يومية واضحة | Use clear everyday wording |
| Avoid dramatic words | لا تستخدم كلمات مثل مقصلة، إعدام، فرسان | Avoid dramatic words like guillotine, execution, knights |
| Keep actions direct | استخدم: حفظ، حذف، إيقاف، موافقة، رفض | Use: save, delete, pause, approve, reject |
| Explain errors calmly | قل للمستخدم ما حدث وماذا يفعل | Tell the user what happened and what to do next |
| Keep role names stable | راكب، كابتن، معلن، مندوب، مشرف، مالك | Rider, Captain, Advertiser, Delegate, Admin, Owner |

## Main Terms

| Old / bad wording | Simple Arabic | English |
| --- | --- | --- |
| الناقل السيادي / الفارس | الكابتن | Captain |
| المسافر / المستخدم | الراكب | Rider |
| السيادة / العهد | النظام / التطبيق | System / App |
| النبض الإعلاني | الإعلان / نشاط الإعلان | Ad / Ad activity |
| المقصلة | إيقاف / حظر | Stop / Block |
| إعدام الإعلان | حذف الإعلان / رفض الإعلان | Delete ad / Reject ad |
| التخليد | حفظ | Save |
| الخزنة السيادية | المحفوظات | Saved items |
| قمرة التحكم | لوحة التحكم | Dashboard |
| الرادار الملاحي | البحث عن رحلة | Ride search |

## Roles

| Arabic | English |
| --- | --- |
| راكب | Rider |
| كابتن | Captain |
| معلن | Advertiser |
| مندوب | Delegate |
| مشرف | Admin |
| مالك | Owner |

## Navigation

| Arabic | English |
| --- | --- |
| الرئيسية | Home |
| السجل | History |
| المحفظة | Wallet |
| المحفوظات | Saved |
| حسابي | Profile |
| لوحة التحكم | Dashboard |
| الإعلانات | Ads |
| المندوبون | Delegates |
| الكباتن | Captains |
| الإعدادات | Settings |

## Common Actions

| Arabic | English |
| --- | --- |
| متابعة | Continue |
| رجوع | Back |
| إلغاء | Cancel |
| حفظ | Save |
| تعديل | Edit |
| حذف | Delete |
| أرشفة | Archive |
| موافقة | Approve |
| رفض | Reject |
| إيقاف مؤقت | Pause |
| تشغيل | Resume |
| تجميد | Freeze |
| تمديد | Extend |
| اتصال | Call |
| واتساب | WhatsApp |
| فتح الخريطة | Open map |

## Statuses

| Arabic | English |
| --- | --- |
| نشط | Active |
| غير نشط | Idle |
| مشغول | Busy |
| بانتظار المراجعة | Pending review |
| مقبول | Approved |
| مرفوض | Rejected |
| متوقف مؤقتاً | Paused |
| مجمّد | Frozen |
| منتهي | Expired |
| مؤرشف | Archived |
| مكتمل | Completed |
| فشل | Failed |

## Error Message Examples

| Bad | Better Arabic | English |
| --- | --- | --- |
| خرق بروتوكول المقصلة التقنية | حدث خطأ في العملية. يرجى المحاولة مرة أخرى. | Something went wrong. Please try again. |
| عطل ملاحي | يرجى تفعيل الموقع لاستخدام هذه الميزة. | Please enable location to use this feature. |
| فشل السيادة على الحالة | تعذر تحديث الحالة. يرجى المحاولة مرة أخرى. | Could not update status. Please try again. |
| تم إعدام الإعلان | تم حذف الإعلان. | The ad was deleted. |
| تم قذف الإعلان إلى النهر | تم نشر الإعلان. | The ad was published. |

## Migration Plan

1. Keep adding all new UI text to `src/lib/i18n/simple-copy.ts`.
2. Replace hardcoded Arabic screen by screen.
3. Fix corrupted Arabic text wherever `Ø`, `Ù`, `ðŸ`, or `â` appears.
4. Remove dramatic wording from buttons, toasts, alerts, and headings.
5. Add a language selector at app level so all screens can switch between Arabic and English.

