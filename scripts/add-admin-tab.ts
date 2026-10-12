import fs from 'fs';

const arPath = 'src/messages/ar.json';
const enPath = 'src/messages/en.json';

const delegatesManagementEn = {
  toasts: {
    copySuccess: 'Copied',
    copyDesc: 'Original delegate referral code ({code}) copied to clipboard successfully.',
    duplicatePhoneTitle: 'Security Alert: Duplicate Field Phone',
    duplicatePhoneDesc: 'An already registered delegate carries the same phone number ({phone}). Please use a unique phone number.',
    addSuccessTitle: 'Field Delegate Added',
    addSuccessDesc: 'Delegate "{name}" linked with a referral code and daily target of {target} successfully.',
    addErrorTitle: 'Cloud Action Failed',
    addErrorDesc: 'An error occurred during communication and transferring the delegate file.',
    linkErrorTitle: 'Failed to Create Cloud Link',
    linkErrorDescSession: 'Your session has expired. Log in again and try once more.',
    linkErrorDescServer: 'Server error occurred while generating the link.',
    linkSuccessTitle: 'Magic Link Generated',
    linkSuccessDesc: 'Delegate "{name}" linked with a temporary secured login link for {hours} hours.',
    linkErrorDescUnknown: 'An unexpected error occurred while processing the magic request.',
    revokeSuccessTitle: 'Link Revoked Successfully',
    revokeSuccessDesc: 'Magic link authorization burned and any future access attempts via it are blocked.',
    taskMissingTitle: 'Incomplete Task Protocol',
    taskMissingDesc: 'Please specify the delegate, task title, and deadline before adding.',
    taskAddSuccessTitle: 'Task Added',
    taskAddSuccessDesc: 'Task "{title}" assigned to field associate {name}.',
    taskCloseErrorTitle: 'Failed to Close Task',
    taskCloseErrorDesc: 'Cloud firewall failed to process the action.',
    taskCloseSuccessTitle: 'Task Closed and Archived',
    taskCloseSuccessDesc: 'Field task status converted to closed successfully and verified cloud-wise.',
    statusChangeTitle: 'Field Accreditation Rank Changed',
    statusChangeDescActive: 'Delegate is now: Accredited & Active ●',
    statusChangeDescSuspended: 'Delegate is now: Frozen & Suspended !',
    payoutSuccessTitle: 'Financial Clearance',
    payoutSuccessDesc: 'Action documented and delegate dues cleared with an amount of {amount} JOD in a secured accounting copy successfully.',
    signErrorTitle: 'Signature Protocol Failed',
    signErrorDescServer: 'Error occurred in the server while processing authentication and verification.',
    signSuccessTitle: 'Dual Authentication Successful ✓',
    signSuccessDesc: 'Delegate ({name}) counters synced and closed with historical pixel and signed with a digital seal via security server.',
    signErrorDescUnknown: 'An unexpected error occurred while processing digital authentication.'
  },
  header: {
    title: 'Delegates Army Command',
    desc: 'Unified supervisor portal to control delegates, monitor magic link extensions, and referrals for Jordanian and Iraqi regions.',
    closeBtn: 'Close Registration Window',
    addBtn: 'Recruit Field Delegate +'
  },
  tabs: {
    delegates: 'Delegates Management & Accreditation',
    magicLinks: 'Magic Links',
    tasks: 'Task Tracking & Assignment',
    performance: 'Performance Engine & Stats'
  },
  addForm: {
    title: 'Draft New Recruitment Contract for Field Deployment Forces',
    desc: 'A robust military referral code and fixed daily target will be allocated to track the gain/deficit equation.',
    nameLabel: 'Accredited Delegate Name',
    namePlaceholder: 'Example: Yousef Mamoun Bani Melhem',
    phoneLabel: 'Active Phone Number',
    phonePlaceholder: 'Example: 0797744111',
    regionLabel: 'Geographic Management Governorate & District',
    regions: {
      wadiSeer: 'Wadi Seer (Amman)',
      univ: 'University District (Amman)',
      kasaba: 'Kasaba Amman (Amman)',
      karrada: 'Karrada (Baghdad - Iraq)'
    },
    targetLabel: 'Committed Daily Target',
    targetPlaceholder: 'Example: 10',
    expiryLabel: 'Magic Links Expiry Duration',
    expirations: {
      '24': '24 hours (Full day)',
      '48': '48 hours (Two days)',
      '72': '72 hours (Three days)'
    },
    preCountLabel: 'Pre-registered Numbers',
    subRoleLabel: 'Field Authority Type',
    subRoles: {
      independent: 'Independent Delegate (Silent & Resource Saver)',
      captain: 'Driver Delegate (Active in Field Activity & GPS)'
    },
    fleetActiveLabel: 'Instant Field Activity Status',
    fleetActiveCheck: 'Enable GPS and Motion Sensor',
    cancel: 'Cancel Command',
    submit: 'Create Contract & Prepare Code 🔒'
  },
  delegatesTab: {
    title: 'Field Army Associates & Geographic Coordination Zone',
    desc: 'Track delegate referral codes, set targets, automatic security block, and coordinate revenue liquidation.',
    table: {
      colDelegate: 'Delegate & Region',
      colCode: 'Referral Code',
      colTarget: 'Daily Target',
      colDrivers: 'Registered Drivers',
      colOrganic: 'Organic Association',
      colLinks: 'Links Caps',
      colStatus: 'Accreditation Status',
      colControl: 'Cloud Control'
    },
    badges: {
      captain: '🎖️ Driver Delegate',
      independent: '💼 Independent Delegate',
      activeField: '● Field Active',
      inactiveField: '○ Idle',
      targetSuffix: 'Injector/day',
      driverSuffix: 'Driver',
      sigValid: '✓ Valid Digital Signature',
      sigInvalid: '⚠️ Corrupted or Unsigned',
      discrepancy: '⚠️ Discrepancy: Actual ({count})',
      match: '✓ Match Proven ({count})',
      signBtn: 'Authenticate & Crypto-sign ⚡',
      organicPrefix: '+',
      organicSuffix: ' Organic Growth',
      hourSuffix: ' Hours',
      statusActive: 'Activated & Active ●',
      statusSuspended: 'Temporarily Frozen ||'
    },
    actions: {
      genLink: 'Generate Magic Link',
      freeze: 'Freeze Delegate',
      unfreeze: 'Activate Delegate'
    },
    empty: 'No accredited delegates registered in the system yet.'
  },
  magicLinksTab: {
    title: 'Magic Links & Instant Access Engine',
    desc: 'List of issued links for delegate accounts with security tracking and expiry time limits to prevent infiltration.',
    table: {
      colBeneficiary: 'Beneficiary Delegate',
      colLink: 'Encrypted Access Link',
      colExpiry: 'Expiry Time',
      colValidity: 'One-time Validity',
      colAction: 'Action'
    },
    actions: {
      copySuccessTitle: 'Magic Link Copied',
      copySuccessDesc: 'You can send it to the delegate to login with one click.',
      revokeBtn: 'Revoke & Burn Link'
    },
    status: {
      used: 'Consumed',
      revoked: 'Fully Voided',
      expired: 'Expired',
      active: 'Valid & Active'
    },
    empty: 'No active magic links currently. You can generate a link next to the delegate name above.'
  },
  tasksTab: {
    title: 'Track Open Field Tasks Status',
    table: {
      colTask: 'Task & Delegate',
      colDesc: 'Details & Assignment',
      colDeadline: 'Time Limit',
      colStatus: 'Task Status',
      colAction: 'Behavioral Action'
    },
    cell: {
      delegatePrefix: 'For Delegate: '
    },
    status: {
      pending: 'Awaiting View',
      acknowledged: 'Delegate Reviewed',
      completed: 'Accomplished ✓',
      closed: 'Closed & Archived'
    },
    actions: {
      closeBtn: 'Close & Archive'
    },
    empty: 'No assigned field tasks currently. Use the side panel to create the first task for the field army.',
    createForm: {
      title: 'Draft Field Military Order (Task)',
      desc: 'An instant notification will reach the delegate in their panel obligating them to execute and reply with geographic results.',
      selectLabel: 'Select Target Delegate',
      selectPlaceholder: '-- Quadruple Delegate Name --',
      titleLabel: 'Assignment Title',
      titlePlaceholder: 'Example: Plant 15 drivers in Swaileh area',
      descLabel: 'Behavioral Action Content & Incentives',
      descPlaceholder: 'Please distribute stickers, write referral code JO-SWAILEH.. and help drivers bypass the initial car inspection hurdle.',
      deadlineLabel: 'Time Limit Target',
      submitBtn: 'Send & Assign Field Order Instantly ⚡'
    }
  },
  performanceTab: {
    directGrowth: {
      title: 'Direct Growth Storms',
      suffix: ' Driver',
      desc: 'Positive expansion and strict recruitment capability'
    },
    organicGrowth: {
      title: 'Total Organic Association (Districts)',
      prefix: '+',
      suffix: ' Associate',
      desc: 'Organic growth rate of {index}%'
    },
    churn: {
      title: 'Withdrawal & Loss Ratio',
      desc: 'Total App Deletions: {count} drivers'
    },
    steady: {
      title: 'Steady Drivers (+45 days)',
      suffix: ' Driver',
      desc: 'Proven commitment rate with strong valves'
    },
    comparison: {
      title: 'Efficient Comparison of Capability & Management Districts',
      desc: 'Monthly efficiency and growth chart by tracking field cases and protecting links.',
      regionPrefix: 'Region: ',
      sigValid: '✓ Crypto-verified',
      sigInvalid: '⚠️ Unverified',
      driverSuffix: ' Driver',
      extendedOrganic: 'Extended Organic Growth: +{count}',
      steadyAlerts: 'Steady Alerts (45 days): {count} committed driver'
    }
  }
};

const delegatesManagementAr = {
  toasts: {
    copySuccess: 'تم النسخ ',
    copyDesc: 'تم كود إحالة المندوب الأصلي ({code}) إلى الحافظة بنجاح.',
    duplicatePhoneTitle: 'تنبيه أمني: تكرار الهاتف الميداني',
    duplicatePhoneDesc: 'المندوب المسجل بالفعل يحمل نفس رقم الهاتف ({phone}). يرجى استخدام رقم هاتف فريد.',
    addSuccessTitle: 'تم إضافة المندوب الميداني',
    addSuccessDesc: 'تم ربط المندوب "{name}" بكود إحالة وتارجت يومي يبلغ {target} بنجاح.',
    addErrorTitle: 'فشل الفعالية السحابية',
    addErrorDesc: 'حدث خطأ أثناء الاتصال ونقل ملف المندوب.',
    linkErrorTitle: 'فشل إنشاء الرابط السحابي',
    linkErrorDescSession: 'انتهت جلستك. سجّل الدخول من جديد وحاول مرة أخرى.',
    linkErrorDescServer: 'حدث خطأ في الخادم أثناء توليد الرابط.',
    linkSuccessTitle: 'تم توليد الرابط السحري',
    linkSuccessDesc: 'تم ربط المندوب "{name}" برابط دخول مؤقت ومحمي لـ {hours} ساعة.',
    linkErrorDescUnknown: 'حدث خطأ غير متوقع أثناء معالجة الطلب السحري.',
    revokeSuccessTitle: 'تم إبطال الرابط بنجاح',
    revokeSuccessDesc: 'تم حرق ترخيص الرابط السحري ومنع أي محاولة ولوج مستقبلية عبره.',
    taskMissingTitle: 'بروتوكول المهام ناقص',
    taskMissingDesc: 'يرجى تعيين المندوب وعنوان المهام والسقف الزمني قبل الإضافة.',
    taskAddSuccessTitle: 'تم إضافة المهمة ',
    taskAddSuccessDesc: 'تم إسناد مهمة "{title}" للمنتسب الميداني {name}.',
    taskCloseErrorTitle: 'فشل إغلاق المهمة',
    taskCloseErrorDesc: 'فشل جدار الحماية السحابي في معالجة الإجراء.',
    taskCloseSuccessTitle: 'تم إغلاق المهمة وأرشفتها',
    taskCloseSuccessDesc: 'تم تحويل حالة المهمة الميدانية إلى مغلقة بنجاح ومصادقتها سحابياً.',
    statusChangeTitle: 'تغيير رتبة الاعتماد الميداني',
    statusChangeDescActive: 'المندوب الآن في حالة: معتمد ومفعّل ●',
    statusChangeDescSuspended: 'المندوب الآن في حالة: مجمّد وموقوف !',
    payoutSuccessTitle: 'براءة ذمة مالية ',
    payoutSuccessDesc: 'تم توثيق الفعالية وتصفير مستحقات المندوب بقيمة {amount} د.أ بنسخة محاسبية مؤمنة بنجاح.',
    signErrorTitle: 'فشل بروتوكول التوقيع',
    signErrorDescServer: 'حدث خطأ في الخادر أثناء معالجة المصادقة والتحقق.',
    signSuccessTitle: 'تمت المصادقة الثنائية بنجاح ✓',
    signSuccessDesc: 'تمت مزامنة وإغلاق عدادات المندوب ({name}) بالبكسل التاريخي وتوقيعه بالختم الرقمي من خلال الخادم الأمني.',
    signErrorDescUnknown: 'حدث خطأ غير متوقع أثناء معالجة المصادقة الرقمية.'
  },
  header: {
    title: 'فيلق جيش المندوبين (Delegates Army Command)',
    desc: 'بوابة المشرف الموحدة للتحكم بالمناديب، ومراقبة تمديد الروابط السحرية، وإحالات الأقاليم الأردنية والعراقية.',
    closeBtn: 'إغلاق نافذة التسجيل',
    addBtn: 'تجنيد مندوب ميداني +'
  },
  tabs: {
    delegates: 'إدارة المندوبين والاعتماد',
    magicLinks: 'الروابط السحرية (Magic Links)',
    tasks: 'متابعة وإسناد المهام',
    performance: 'محرك الأداء والإحصائيات د.ط'
  },
  addForm: {
    title: 'صياغة عقد تجنيد جديد لقوات الانتشار الميداني',
    desc: 'سيتم تخصيص كود إحالة عسكري متين، وتارجت يومي ثابت لتتبع معادلة الكسب والعجز.',
    nameLabel: 'اسم المندوب المعتمد',
    namePlaceholder: 'مثال: يوسف مأمون بني ملحم',
    phoneLabel: 'رقم الهاتف النشط',
    phonePlaceholder: 'مثال: 0797744111',
    regionLabel: 'محافظة ومنطقة الإدارة جغرافياً',
    regions: {
      wadiSeer: 'وادي السير (عمان)',
      univ: 'منطقة الجامعة (عمان)',
      kasaba: 'قصبة عمان (عمان)',
      karrada: 'الكرادة (بغداد - العراق)'
    },
    targetLabel: 'التارجت اليومي الملتزم به',
    targetPlaceholder: 'مثال: 10',
    expiryLabel: 'مدة صلاحية الروابط السحرية',
    expirations: {
      '24': '24 ساعة (يوم كامل)',
      '48': '48 ساعة (يومين)',
      '72': '72 ساعة (ثلاثة أيام)'
    },
    preCountLabel: 'أرقام مقيدة مسبقاً',
    subRoleLabel: 'نوع الصلاحيات الميدانية',
    subRoles: {
      independent: 'مندوب مستقل (صامت وموفر للموارد)',
      captain: 'مندوب سائق (نشط بالنشاط الميداني والـ GPS)'
    },
    fleetActiveLabel: 'حالة النشاط الميداني الفوري',
    fleetActiveCheck: 'تفعيل الـ GPS ومستشعر الحركة',
    cancel: 'إلغاء الأمر',
    submit: 'إنشاء العقد وتجهيز الكود 🔒'
  },
  delegatesTab: {
    title: 'منتسبي جيش الميدان ومنطقة التنسيق الجغرافي',
    desc: 'تتبع رموز إحالة المندوبين، تعيين التارجت، حظر الأمان التلقائي، وتنسيق تسييل العوائد.',
    table: {
      colDelegate: 'المندوب والإقليم',
      colCode: 'كود الإحالة',
      colTarget: 'التارجت اليومي',
      colDrivers: 'السائقون المسجلين',
      colOrganic: 'انتساب عضوي',
      colLinks: 'سقوف الروابط',
      colStatus: 'حالة الاعتماد',
      colControl: 'التحكم السحابي'
    },
    badges: {
      captain: '🎖️ مندوب سائق',
      independent: '💼 مندوب مستقل',
      activeField: '● نشط ميدانياً',
      inactiveField: '○ خامل',
      targetSuffix: 'حاقن/يوم',
      driverSuffix: 'سائق',
      sigValid: '✓ توقيع رقمي معتمد',
      sigInvalid: '⚠️ تالف أو غير موقّع',
      discrepancy: '⚠️ تضارب: الفعلي ({count})',
      match: '✓ تطابق مبرهن ({count})',
      signBtn: 'مصادقة وتوقيع تشفيري ⚡',
      organicPrefix: '+',
      organicSuffix: ' نمو عضوي',
      hourSuffix: ' ساعة',
      statusActive: 'مفعّل ونشط ●',
      statusSuspended: 'مجمّد مؤقتاً ||'
    },
    actions: {
      genLink: 'توليد رابط سحري',
      freeze: 'تجميد المندوب',
      unfreeze: 'تنشيط المندوب'
    },
    empty: 'لا يوجد مندوبين معتمدين مسجلين في النظام بعد.'
  },
  magicLinksTab: {
    title: 'محرك الروابط السحرية والولوج الفوري',
    desc: 'قائمة الروابط الصادرة لحسابات المندوبين مع تتبع الأمان والحدود الزمنية لإنهاء الصلاحية تلافياً لأي تسلل.',
    table: {
      colBeneficiary: 'المندوب المستفيد',
      colLink: 'رابط الدخول المشفر',
      colExpiry: 'الانتهاء الزمني',
      colValidity: 'الصلاحية لمرة واحدة',
      colAction: 'إجراء '
    },
    actions: {
      copySuccessTitle: 'تم نسخ الرابط السحري',
      copySuccessDesc: 'يمكنك إرساله للمندوب للدخول بنقرة واحدة.',
      revokeBtn: 'إبطال وحرق الرابط'
    },
    status: {
      used: 'تم الاستهلاك',
      revoked: 'أبطل بالكامل',
      expired: 'منتهي الصلاحية',
      active: 'صالح ونشط'
    },
    empty: 'لا يوجد أي روابط سحرية نشطة حالياً. يمكنك توليد رابط بجانب اسم المندوب في الأعلى.'
  },
  tasksTab: {
    title: 'متابعة حالة المهام الميدانية المفتوحة',
    table: {
      colTask: 'المهمة والمندوب',
      colDesc: 'التفاصيل والتكليف',
      colDeadline: 'السقف الزمني',
      colStatus: 'حالة المهمة',
      colAction: 'الإجراء السلوكي'
    },
    cell: {
      delegatePrefix: 'للمندوب: '
    },
    status: {
      pending: 'بانتظار العرض',
      acknowledged: 'اطّلع المندوب',
      completed: 'أُنجزت ✓',
      closed: 'مغلقة ومؤرشفة'
    },
    actions: {
      closeBtn: 'إغلاق وأرشفة'
    },
    empty: 'لا يوجد مهام ميدانية جارية مسندة حالياً. استخدم اللوحة الجانبية لإنشاء أول مهمة للجيش الميدني.',
    createForm: {
      title: 'صياغة أمر عسكري ميداني (مهمة)',
      desc: 'سيصل إشعار فوري للمندوب في لوحته لإلزامه بالتنفيذ والرد بالنتائج الجغرافية.',
      selectLabel: 'اختر المندوب المستهدف',
      selectPlaceholder: '-- اسم المندوب الرباعي --',
      titleLabel: 'عنوان التكليف',
      titlePlaceholder: 'مثال: غرز 15 سائق في منطقة صويلح',
      descLabel: 'مضمون الإجراء السلوكي والمحفزات',
      descPlaceholder: 'يرجى توزيع الملصقات وكتابة رمز الإحالة JO-SWAILEH.. ومساعدة السائقون في تخطي عقبة الفحص الأولي للسيارات.',
      deadlineLabel: 'مستهدف السقف الزمني',
      submitBtn: 'إرسال وإسناد الأمر الميداني فورا ⚡'
    }
  },
  performanceTab: {
    directGrowth: {
      title: 'عواصف النمو المباشر',
      suffix: ' سائق',
      desc: 'توسّع إيجابي وقدرة تجنيدية صارمة'
    },
    organicGrowth: {
      title: 'إجمالي الانتساب العضوي (الألوية)',
      prefix: '+',
      suffix: ' منتسب',
      desc: 'معدل نمو عضوي بنسبة {index}%'
    },
    churn: {
      title: 'نسبة الانسحاب والخسارة',
      desc: 'إجمالي حذف التطبيق: {count} سائقين'
    },
    steady: {
      title: 'السائقون الثابتين (+45 يوم)',
      suffix: ' سائق',
      desc: 'معدل التزام مبرهن بصمامات قوية'
    },
    comparison: {
      title: 'مقارنة كفوءة لألوية الاقتدار والإدارة',
      desc: 'مخطط الكفاءة والنمو شهرياً بموجب تتبع الحالات الميدانية وحماية الروابط.',
      regionPrefix: 'الإقليم: ',
      sigValid: '✓ موثق تشفيرياً',
      sigInvalid: '⚠️ غير موثق',
      driverSuffix: ' سائق',
      extendedOrganic: 'النمو العضوي المتمدد: +{count}',
      steadyAlerts: 'تنبيهات الثبات (45 يوم): {count} سائق ملتزم'
    }
  }
};

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

arData.adminTab.delegatesManagement = delegatesManagementAr;
enData.adminTab.delegatesManagement = delegatesManagementEn;

fs.writeFileSync(arPath, JSON.stringify(arData, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log('delegatesManagement JSON updated successfully');
