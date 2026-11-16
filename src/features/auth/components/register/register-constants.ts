export type AuthType = 'register' | 'login';
export type GovernorateKey = 'cairo' | 'giza' | 'sohag';

export const roleLabels = {
  rider: { ar: 'مستخدم', en: 'Rider' },
  captain: { ar: 'كابتن معلن', en: 'Captain' },
  advertiser: { ar: 'معلن', en: 'Advertiser' },
  delegate: { ar: 'مندوب تسويق', en: 'Delegate' },
  admin: { ar: 'مشرف', en: 'Admin' },
} as const;

export const governorates: Record<
  GovernorateKey,
  {
    ar: string;
    en: string;
    districts: Array<{ ar: string; en: string }>;
  }
> = {
  cairo: {
    ar: 'القاهرة',
    en: 'Cairo',
    districts: [
      { ar: 'مدينة نصر', en: 'Nasr City' },
      { ar: 'مصر الجديدة', en: 'Heliopolis' },
      { ar: 'المعادي', en: 'Maadi' },
    ],
  },
  giza: {
    ar: 'الجيزة',
    en: 'Giza',
    districts: [
      { ar: 'الدقي', en: 'Dokki' },
      { ar: 'الهرم', en: 'Haram' },
      { ar: '٦ أكتوبر', en: '6th of October' },
    ],
  },
  sohag: {
    ar: 'سوهاج',
    en: 'Sohag',
    districts: [
      { ar: 'مدينة سوهاج', en: 'Sohag City' },
      { ar: 'جرجا', en: 'Girga' },
      { ar: 'أخميم', en: 'Akhmim' },
    ],
  },
};

export const copy = {
  ar: {
    languageButton: 'English',
    languageAria: 'تغيير اللغة إلى الإنجليزية',
    brand: 'بينكم - bynkcom',
    riderContext: 'حساب المستخدم',
    registerTitle: 'حساب جديد للمستخدم',
    loginTitle: 'تسجيل الدخول للمستخدم',
    registerSubtitle: 'املأ بياناتك مرة واحدة، وبعدها تدخل رحلاتك بسرعة.',
    loginSubtitle: '',
    fullName: 'الاسم بالكامل',
    fullNamePlaceholder: 'اكتب اسمك',
    phone: 'رقم الهاتف',
    phonePlaceholder: 'رقم الهاتف',
    governorate: 'المحافظة',
    district: 'المركز أو المنطقة',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    login: 'تسجيل الدخول',
    register: 'إنشاء الحساب',
    submitLogin: 'دخول المستخدم',
    submitRegister: 'ابدأ كمستخدم',
    hasAccount: 'لديك حساب بالفعل؟',
    noAccount: 'لسه جديد؟',
    switchToLogin: 'سجل دخولك',
    switchToRegister: 'اعمل حساب جديد',
    ticker: ['رحلات أقرب', 'دخول آمن', 'اختيار واضح', 'بينكم V5.5', 'تجربة موبايل سهلة'],
  },
  en: {
    languageButton: 'العربية',
    languageAria: 'Switch language to Arabic',
    brand: 'bynkcom',
    riderContext: 'Rider Account',
    registerTitle: 'Create Rider Account',
    loginTitle: 'Rider Login',
    registerSubtitle: 'Add your details once, then reach your rides faster.',
    loginSubtitle: '',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    phone: 'Phone Number',
    phonePlaceholder: 'Phone Number',
    governorate: 'Governorate',
    district: 'District or Town',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    login: 'Login',
    register: 'Register',
    submitLogin: 'Login as Rider',
    submitRegister: 'Start as Rider',
    hasAccount: 'Already have an account?',
    noAccount: 'New here?',
    switchToLogin: 'Login',
    switchToRegister: 'Create an account',
    ticker: ['Closer rides', 'Secure access', 'Clear choice', 'bynkcom V5.5', 'Easy mobile flow'],
  },
} as const;
