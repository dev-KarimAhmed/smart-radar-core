import fs from 'fs';

let content = fs.readFileSync('src/features/admin/components/admin/delegates-management-tab.tsx', 'utf8');

// Add useTranslations import
if (!content.includes(`import { useTranslations } from 'next-intl';`)) {
  content = content.replace(
    `import { useAuth } from '@/hooks/use-auth';`,
    `import { useAuth } from '@/hooks/use-auth';\nimport { useTranslations } from 'next-intl';`
  );
}

// Add hook inside the component
if (!content.includes(`const t = useTranslations('adminTab.delegatesManagement');`)) {
  content = content.replace(
    `export function DelegatesManagementTab() {`,
    `export function DelegatesManagementTab() {\n  const t = useTranslations('adminTab.delegatesManagement');`
  );
}

// Security: require acquireBackendLock & rateLimiterMiddleware
// The component is client side, so we only fetch. Let's see where fetch is used.
// 1. /api/reconcile-and-sign
// Wait, that's already implemented correctly on the client side.

// Dictionary for replacements
const replacements = [
  // Toasts
  { target: /'تم النسخ'/g, replace: `t('toasts.copySuccess')` },
  { target: /'تم كود إحالة المندوب الأصلي \(\$\{code\}\) إلى الحافظة بنجاح\.'/g, replace: `t('toasts.copyDesc', { code })` },
  { target: /'تنبيه أمني: تكرار الهاتف الميداني'/g, replace: `t('toasts.duplicatePhoneTitle')` },
  { target: /'المندوب المسجل بالفعل يحمل نفس رقم الهاتف \(\$\{phone\}\)\. يرجى استخدام رقم هاتف فريد\.'/g, replace: `t('toasts.duplicatePhoneDesc', { phone })` },
  { target: /'تم إضافة المندوب الميداني'/g, replace: `t('toasts.addSuccessTitle')` },
  { target: /\`تم ربط المندوب "\$\{name\}" بكود إحالة وتارجت يومي يبلغ \$\{targetDaily\} بنجاح\.\`/g, replace: `t('toasts.addSuccessDesc', { name, target: targetDaily })` },
  { target: /'فشل الفعالية السحابية'/g, replace: `t('toasts.addErrorTitle')` },
  { target: /'حدث خطأ أثناء الاتصال ونقل ملف المندوب\.'/g, replace: `t('toasts.addErrorDesc')` },
  { target: /'فشل إنشاء الرابط السحابي'/g, replace: `t('toasts.linkErrorTitle')` },
  { target: /'انتهت جلستك\. سجّل الدخول من جديد وحاول مرة أخرى\.'/g, replace: `t('toasts.linkErrorDescSession')` },
  { target: /'حدث خطأ في الخادم أثناء توليد الرابط\.'/g, replace: `t('toasts.linkErrorDescServer')` },
  { target: /'تم توليد الرابط السحري'/g, replace: `t('toasts.linkSuccessTitle')` },
  { target: /\`تم ربط المندوب "\$\{delegate\.name\}" برابط دخول مؤقت ومحمي لـ \$\{hours\} ساعة\.\`/g, replace: `t('toasts.linkSuccessDesc', { name: delegate.name, hours })` },
  { target: /'حدث خطأ غير متوقع أثناء معالجة الطلب السحري\.'/g, replace: `t('toasts.linkErrorDescUnknown')` },
  { target: /'تم إبطال الرابط بنجاح'/g, replace: `t('toasts.revokeSuccessTitle')` },
  { target: /'تم حرق ترخيص الرابط السحري ومنع أي محاولة ولوج مستقبلية عبره\.'/g, replace: `t('toasts.revokeSuccessDesc')` },
  { target: /'بروتوكول المهام ناقص'/g, replace: `t('toasts.taskMissingTitle')` },
  { target: /'يرجى تعيين المندوب وعنوان المهام والسقف الزمني قبل الإضافة\.'/g, replace: `t('toasts.taskMissingDesc')` },
  { target: /'تم إضافة المهمة '/g, replace: `t('toasts.taskAddSuccessTitle')` },
  { target: /\`تم إسناد مهمة "\$\{taskTitle\}" للمنتسب الميداني \$\{target\.name\}\.\`/g, replace: `t('toasts.taskAddSuccessDesc', { title: taskTitle, name: target.name })` },
  { target: /'فشل إغلاق المهمة'/g, replace: `t('toasts.taskCloseErrorTitle')` },
  { target: /'فشل جدار الحماية السحابي في معالجة الإجراء\.'/g, replace: `t('toasts.taskCloseErrorDesc')` },
  { target: /'تم إغلاق المهمة وأرشفتها'/g, replace: `t('toasts.taskCloseSuccessTitle')` },
  { target: /'تم تحويل حالة المهمة الميدانية إلى مغلقة بنجاح ومصادقتها سحابياً\.'/g, replace: `t('toasts.taskCloseSuccessDesc')` },
  { target: /'تغيير رتبة الاعتماد الميداني'/g, replace: `t('toasts.statusChangeTitle')` },
  { target: /\`المندوب الآن في حالة: \$\{newStatus === 'active' \? 'معتمد ومفعّل ●' : 'مجمّد وموقوف !'\}\`/g, replace: `newStatus === 'active' ? t('toasts.statusChangeDescActive') : t('toasts.statusChangeDescSuspended')` },
  { target: /'براءة ذمة مالية '/g, replace: `t('toasts.payoutSuccessTitle')` },
  { target: /\`تم توثيق الفعالية وتصفير مستحقات المندوب بقيمة \$\{amount\} د\.أ بنسخة محاسبية مؤمنة بنجاح\.\`/g, replace: `t('toasts.payoutSuccessDesc', { amount })` },
  { target: /'فشل بروتوكول التوقيع'/g, replace: `t('toasts.signErrorTitle')` },
  { target: /'حدث خطأ في الخادر أثناء معالجة المصادقة والتحقق\.'/g, replace: `t('toasts.signErrorDescServer')` },
  { target: /'تمت المصادقة الثنائية بنجاح ✓'/g, replace: `t('toasts.signSuccessTitle')` },
  { target: /\`تمت مزامنة وإغلاق عدادات المندوب \(\$\{targetDelegate\.name\}\) بالبكسل التاريخي وتوقيعه بالختم الرقمي  من خلال الخادم الأمني\.\`/g, replace: `t('toasts.signSuccessDesc', { name: targetDelegate.name })` },
  { target: /'حدث خطأ غير متوقع أثناء معالجة المصادقة الرقمية\.'/g, replace: `t('toasts.signErrorDescUnknown')` },

  // Header Panel
  { target: /فيلق جيش المندوبين  \(Delegates Army Command\)/g, replace: `{t('header.title')}` },
  { target: /بوابة المشرف الموحدة للتحكم بالمناديب، ومراقبة تمديد الروابط السحرية، وإحالات الأقاليم الأردنية والعراقية\./g, replace: `{t('header.desc')}` },
  { target: /'إغلاق نافذة التسجيل' : 'تجنيد مندوب ميداني \+'/g, replace: `t('header.closeBtn') : t('header.addBtn')` },

  // Sub-navigation Controls
  { target: /إدارة المندوبين والاعتماد/g, replace: `{t('tabs.delegates')}` },
  { target: /الروابط السحرية \(Magic Links\)/g, replace: `{t('tabs.magicLinks')}` },
  { target: /متابعة وإسناد المهام/g, replace: `{t('tabs.tasks')}` },
  { target: /محرك الأداء والإحصائيات د\.ط/g, replace: `{t('tabs.performance')}` },

  // Add New Delegate Panel
  { target: /صياغة عقد تجنيد جديد لقوات الانتشار الميداني/g, replace: `{t('addForm.title')}` },
  { target: /سيتم تخصيص كود إحالة عسكري متين، وتارجت يومي ثابت لتتبع معادلة الكسب والعجز\./g, replace: `{t('addForm.desc')}` },
  { target: /اسم المندوب المعتمد/g, replace: `{t('addForm.nameLabel')}` },
  { target: /"مثال: يوسف مأمون بني ملحم"/g, replace: `{t('addForm.namePlaceholder')}` },
  { target: /رقم الهاتف النشط/g, replace: `{t('addForm.phoneLabel')}` },
  { target: /"مثال: 0797744111"/g, replace: `{t('addForm.phonePlaceholder')}` },
  { target: /محافظة ومنطقة الإدارة جغرافياً/g, replace: `{t('addForm.regionLabel')}` },
  { target: />وادي السير \(عمان\)</g, replace: `>{t('addForm.regions.wadiSeer')}<` },
  { target: />منطقة الجامعة \(عمان\)</g, replace: `>{t('addForm.regions.univ')}<` },
  { target: />قصبة عمان \(عمان\)</g, replace: `>{t('addForm.regions.kasaba')}<` },
  { target: />الكرادة \(بغداد - العراق\)</g, replace: `>{t('addForm.regions.karrada')}<` },
  { target: /التارجت اليومي الملتزم به/g, replace: `{t('addForm.targetLabel')}` },
  { target: /"مثال: 10"/g, replace: `{t('addForm.targetPlaceholder')}` },
  { target: /مدة صلاحية الروابط السحرية/g, replace: `{t('addForm.expiryLabel')}` },
  { target: />24 ساعة \(يوم كامل\)</g, replace: `>{t('addForm.expirations.24')}<` },
  { target: />48 ساعة \(يومين\)</g, replace: `>{t('addForm.expirations.48')}<` },
  { target: />72 ساعة \(ثلاثة أيام\)</g, replace: `>{t('addForm.expirations.72')}<` },
  { target: /أرقام مقيدة مسبقاً/g, replace: `{t('addForm.preCountLabel')}` },
  { target: /نوع الصلاحيات الميدانية/g, replace: `{t('addForm.subRoleLabel')}` },
  { target: />مندوب مستقل \(صامت وموفر للموارد\)</g, replace: `>{t('addForm.subRoles.independent')}<` },
  { target: />مندوب سائق \(نشط بالنشاط الميداني والـ GPS\)</g, replace: `>{t('addForm.subRoles.captain')}<` },
  { target: /حالة النشاط الميداني الفوري/g, replace: `{t('addForm.fleetActiveLabel')}` },
  { target: />تفعيل الـ GPS ومستشعر الحركة</g, replace: `>{t('addForm.fleetActiveCheck')}<` },
  { target: />إلغاء الأمر</g, replace: `>{t('addForm.cancel')}<` },
  { target: />إنشاء العقد وتجهيز الكود 🔒</g, replace: `>{t('addForm.submit')}<` },

  // Delegates subtab
  { target: /منتسبي جيش الميدان ومنطقة التنسيق الجغرافي/g, replace: `{t('delegatesTab.title')}` },
  { target: /تتبع رموز إحالة المندوبين، تعيين التارجت، حظر الأمان التلقائي، وتنسيق تسييل العوائد\./g, replace: `{t('delegatesTab.desc')}` },
  { target: />المندوب والإقليم</g, replace: `>{t('delegatesTab.table.colDelegate')}<` },
  { target: />كود الإحالة</g, replace: `>{t('delegatesTab.table.colCode')}<` },
  { target: />التارجت اليومي</g, replace: `>{t('delegatesTab.table.colTarget')}<` },
  { target: />السائقون المسجلين</g, replace: `>{t('delegatesTab.table.colDrivers')}<` },
  { target: />انتساب عضوي</g, replace: `>{t('delegatesTab.table.colOrganic')}<` },
  { target: />سقوف الروابط</g, replace: `>{t('delegatesTab.table.colLinks')}<` },
  { target: />حالة الاعتماد</g, replace: `>{t('delegatesTab.table.colStatus')}<` },
  { target: />التحكم السحابي</g, replace: `>{t('delegatesTab.table.colControl')}<` },
  { target: /'🎖️ مندوب سائق' : '💼 مندوب مستقل'/g, replace: `t('delegatesTab.badges.captain') : t('delegatesTab.badges.independent')` },
  { target: /'● نشط ميدانياً' : '○ خامل'/g, replace: `t('delegatesTab.badges.activeField') : t('delegatesTab.badges.inactiveField')` },
  { target: / حاقن\/يوم/g, replace: ` {t('delegatesTab.badges.targetSuffix')}` },
  { target: / سائق<([^/]*?)\/div>/g, replace: ` {t('delegatesTab.badges.driverSuffix')}<$1/div>` }, // Be careful here, using replace with string
  { target: />✓ توقيع رقمي معتمد</g, replace: `>{t('delegatesTab.badges.sigValid')}<` },
  { target: />⚠️ تالف أو غير موقّع</g, replace: `>{t('delegatesTab.badges.sigInvalid')}<` },
  { target: /⚠️ تضارب: الفعلي \(\{actualCount\}\)/g, replace: `{t('delegatesTab.badges.discrepancy', { count: actualCount })}` },
  { target: /✓ تطابق مبرهن \(\{actualCount\}\)/g, replace: `{t('delegatesTab.badges.match', { count: actualCount })}` },
  { target: />مصادقة وتوقيع تشفيري ⚡</g, replace: `>{t('delegatesTab.badges.signBtn')}<` },
  { target: /\+\{del\.organicCount \|\| 0\} نمو عضوي/g, replace: `{t('delegatesTab.badges.organicPrefix')}{del.organicCount || 0}{t('delegatesTab.badges.organicSuffix')}` },
  { target: / ساعة</g, replace: ` {t('delegatesTab.badges.hourSuffix')}<` },
  { target: /'مفعّل ونشط ●' : 'مجمّد مؤقتاً \|\|'/g, replace: `t('delegatesTab.badges.statusActive') : t('delegatesTab.badges.statusSuspended')` },
  { target: />توليد رابط سحري</g, replace: `>{t('delegatesTab.actions.genLink')}<` },
  { target: /'تجميد المندوب' : 'تنشيط المندوب'/g, replace: `t('delegatesTab.actions.freeze') : t('delegatesTab.actions.unfreeze')` },
  { target: />لا يوجد مندوبين معتمدين مسجلين في النظام بعد\.</g, replace: `>{t('delegatesTab.empty')}<` },

  // Magic Links subtab
  { target: />محرك الروابط السحرية والولوج الفوري</g, replace: `>{t('magicLinksTab.title')}<` },
  { target: />قائمة الروابط الصادرة لحسابات المندوبين مع تتبع الأمان والحدود الزمنية لإنهاء الصلاحية تلافياً لأي تسلل\.</g, replace: `>{t('magicLinksTab.desc')}<` },
  { target: />المندوب المستفيد</g, replace: `>{t('magicLinksTab.table.colBeneficiary')}<` },
  { target: />رابط الدخول المشفر</g, replace: `>{t('magicLinksTab.table.colLink')}<` },
  { target: />الانتهاء الزمني</g, replace: `>{t('magicLinksTab.table.colExpiry')}<` },
  { target: />الصلاحية لمرة واحدة</g, replace: `>{t('magicLinksTab.table.colValidity')}<` },
  { target: />إجراء <\/TableHead>/g, replace: `>{t('magicLinksTab.table.colAction')}</TableHead>` },
  { target: /title: 'تم نسخ الرابط السحري', description: 'يمكنك إرساله للمندوب للدخول بنقرة واحدة\.'/g, replace: `title: t('magicLinksTab.actions.copySuccessTitle'), description: t('magicLinksTab.actions.copySuccessDesc')` },
  { target: /link\.status === 'used' \? 'تم الاستهلاك' : link\.status === 'revoked' \? 'أبطل بالكامل' : expired \? 'منتهي الصلاحية' : 'صالح ونشط'/g, replace: `link.status === 'used' ? t('magicLinksTab.status.used') : link.status === 'revoked' ? t('magicLinksTab.status.revoked') : expired ? t('magicLinksTab.status.expired') : t('magicLinksTab.status.active')` },
  { target: />إبطال وحرق الرابط</g, replace: `>{t('magicLinksTab.actions.revokeBtn')}<` },
  { target: />لا يوجد أي روابط سحرية نشطة حالياً\. يمكنك توليد رابط بجانب اسم المندوب في الأعلى\.</g, replace: `>{t('magicLinksTab.empty')}<` },

  // Tasks Subtab
  { target: />متابعة حالة المهام الميدانية المفتوحة</g, replace: `>{t('tasksTab.title')}<` },
  { target: />المهمة والمندوب</g, replace: `>{t('tasksTab.table.colTask')}<` },
  { target: />التفاصيل والتكليف</g, replace: `>{t('tasksTab.table.colDesc')}<` },
  { target: />السقف الزمني</g, replace: `>{t('tasksTab.table.colDeadline')}<` },
  { target: />حالة المهمة</g, replace: `>{t('tasksTab.table.colStatus')}<` },
  { target: />الإجراء السلوكي</g, replace: `>{t('tasksTab.table.colAction')}<` },
  { target: /للمندوب: \{task\.delegateName\}/g, replace: `{t('tasksTab.cell.delegatePrefix')}{task.delegateName}` },
  { target: /task\.status === 'pending' \? 'بانتظار العرض' :\s*task\.status === 'acknowledged' \? 'اطّلع المندوب' :\s*task\.status === 'completed' \? 'أُنجزت ✓' : 'مغلقة ومؤرشفة'/g, replace: `task.status === 'pending' ? t('tasksTab.status.pending') :\n                                 task.status === 'acknowledged' ? t('tasksTab.status.acknowledged') :\n                                 task.status === 'completed' ? t('tasksTab.status.completed') : t('tasksTab.status.closed')` },
  { target: />إغلاق وأرشفة</g, replace: `>{t('tasksTab.actions.closeBtn')}<` },
  { target: />لا يوجد مهام ميدانية جارية مسندة حالياً\. استخدم اللوحة الجانبية لإنشاء أول مهمة للجيش الميدني\.</g, replace: `>{t('tasksTab.empty')}<` },
  { target: />صياغة أمر عسكري ميداني \(مهمة\)</g, replace: `>{t('tasksTab.createForm.title')}<` },
  { target: />سيصل إشعار فوري للمندوب في لوحته لإلزامه بالتنفيذ والرد بالنتائج الجغرافية\.</g, replace: `>{t('tasksTab.createForm.desc')}<` },
  { target: />اختر المندوب المستهدف</g, replace: `>{t('tasksTab.createForm.selectLabel')}<` },
  { target: /"-- اسم المندوب الرباعي --"/g, replace: `{t('tasksTab.createForm.selectPlaceholder')}` },
  { target: />عنوان التكليف</g, replace: `>{t('tasksTab.createForm.titleLabel')}<` },
  { target: /"مثال: غرز 15 سائق في منطقة صويلح"/g, replace: `{t('tasksTab.createForm.titlePlaceholder')}` },
  { target: />مضمون الإجراء السلوكي والمحفزات</g, replace: `>{t('tasksTab.createForm.descLabel')}<` },
  { target: /"يرجى توزيع الملصقات وكتابة رمز الإحالة JO-SWAILEH\.\. ومساعدة السائقون في تخطي عقبة الفحص الأولي للسيارات\."/g, replace: `{t('tasksTab.createForm.descPlaceholder')}` },
  { target: />مستهدف السقف الزمني</g, replace: `>{t('tasksTab.createForm.deadlineLabel')}<` },
  { target: />إرسال وإسناد الأمر الميداني فورا ⚡</g, replace: `>{t('tasksTab.createForm.submitBtn')}<` },

  // Analytics Performance Tab
  { target: />عواصف النمو المباشر</g, replace: `>{t('performanceTab.directGrowth.title')}<` },
  { target: /\{totalReferred\} سائق/g, replace: `{totalReferred}{t('performanceTab.directGrowth.suffix')}` },
  { target: />توسّع إيجابي وقدرة تجنيدية صارمة</g, replace: `>{t('performanceTab.directGrowth.desc')}<` },
  { target: />إجمالي الانتساب العضوي \(الألوية\)</g, replace: `>{t('performanceTab.organicGrowth.title')}<` },
  { target: /\+\{totalOrganic\} منتسب/g, replace: `{t('performanceTab.organicGrowth.prefix')}{totalOrganic}{t('performanceTab.organicGrowth.suffix')}` },
  { target: />معدل نمو عضوي بنسبة \{growthIndex\}%</g, replace: `>{t('performanceTab.organicGrowth.desc', { index: growthIndex })}<` },
  { target: />نسبة الانسحاب والخسارة</g, replace: `>{t('performanceTab.churn.title')}<` },
  { target: />إجمالي حذف التطبيق: \{totalChurn\} سائقين</g, replace: `>{t('performanceTab.churn.desc', { count: totalChurn })}<` },
  { target: />السائقون الثابتين \(\+45 يوم\)</g, replace: `>{t('performanceTab.steady.title')}<` },
  { target: /\{totalSteady\} سائق/g, replace: `{totalSteady}{t('performanceTab.steady.suffix')}` },
  { target: /معدل التزام مبرهن بصمامات قوية/g, replace: `{t('performanceTab.steady.desc')}` },
  { target: />مقارنة كفوءة لألوية الاقتدار والإدارة</g, replace: `>{t('performanceTab.comparison.title')}<` },
  { target: />مخطط الكفاءة والنمو شهرياً بموجب تتبع الحالات الميدانية وحماية الروابط\.</g, replace: `>{t('performanceTab.comparison.desc')}<` },
  { target: />الإقليم: /g, replace: `>{t('performanceTab.comparison.regionPrefix')}` },
  { target: />✓ موثق تشفيرياً</g, replace: `>{t('performanceTab.comparison.sigValid')}<` },
  { target: />⚠️ غير موثق</g, replace: `>{t('performanceTab.comparison.sigInvalid')}<` },
  { target: /\{d\.referredCount\} سائق/g, replace: `{d.referredCount}{t('performanceTab.comparison.driverSuffix')}` },
  { target: />النمو العضوي المتمدد: \+\{d\.organicCount\}</g, replace: `>{t('performanceTab.comparison.extendedOrganic', { count: d.organicCount || 0 })}<` },
  { target: />تنبيهات الثبات \(45 يوم\): \{d\.steadyCount\} سائق ملتزم</g, replace: `>{t('performanceTab.comparison.steadyAlerts', { count: d.steadyCount || 0 })}<` }
];

replacements.forEach(r => {
  content = content.replace(r.target, r.replace);
});

// Update driver suffix which had a weird match
content = content.replace(/\{del\.referredCount \|\| 0\} سائق/g, `{del.referredCount || 0}{t('delegatesTab.badges.driverSuffix')}`);

fs.writeFileSync('src/features/admin/components/admin/delegates-management-tab.tsx', content, 'utf8');
console.log('Successfully localized delegates management tab');
