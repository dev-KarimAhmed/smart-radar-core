export interface FinancialDelegate {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  countryId?: number | null;
  governorateId?: number | null;
  governorateName?: string | null;
  districtId?: number | null;
  districtName?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface DelegateFormData {
  name: string;
  phone: string;
  whatsapp: string;
  countryId: string;
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  notes: string;
  isActive: boolean;
}

export const financialDelegatesCopy = {
  ar: {
    title: 'المناديب المالية وشحن الرصيد (بناءً على المحافظة والمنطقة)',
    subtitle: 'إضافة وتعديل وحذف أرقام المناديب المالية الميدانيين وتعيين تغطيتهم الجغرافية لكل محافظة أو منطقة لظهورها التلقائي للكابتن.',
    refresh: 'تحديث',
    addNew: 'إضافة مندوب مالي جديد',
    totalDelegates: 'إجمالي المناديب المسجلين',
    activeDelegates: 'المناديب الفاعلون (يظهرون للكباتن)',
    coveredGovs: 'المحافظات المغطاة',
    govsUnit: 'محافظات',
    searchPh: 'بحث بالاسم، الهاتف، المحافظة...',
    allCountries: 'كل الدول',
    jordan: 'الأردن',
    egypt: 'مصر',
    allGovs: 'كل المحافظات',
    loading: 'جاري تحميل دليل المناديب المالية...',
    emptySearch: 'لا توجد مناديب تطابق معايير البحث',
    emptySearchDesc: 'اضغط على زر "إضافة مندوب مالي جديد" لإضافة مندوب لمنطقة أو محافظة معينة.',
    addNow: 'إضافة مندوب الآن',
    districtLabel: 'منطقة:',
    govLabel: 'محافظة:',
    generalDelegate: 'مندوب عام لكافة المناطق',
    active: 'مفعل',
    inactive: 'معطل',
    phoneLabel: 'رقم الهاتف والتواصل:',
    call: 'اتصال',
    whatsapp: 'واتساب',
    directCall: 'اتصال مباشر',
    whatsappChat: 'محادثة واتساب',
    toggleAria: 'تفعيل أو تعطيل المندوب',
    visibleToCaptain: 'ظاهر في بطاقة الكابتن',
    hiddenFromCaptain: 'مخفي',
    edit: 'تعديل',
    delete: 'حذف',
    editModalTitle: 'تعديل بيانات المندوب المالي',
    addModalTitle: 'إضافة مندوب مالي جديد',
    modalDesc: 'عيّن المندوب ومحافظته أو منطقته ليظهر تلقائياً لكباتن تلك المنطقة في بطاقة الشحن المالي.',
    delegateName: 'اسم المندوب المالي *',
    delegateNamePh: 'مثال: أبو محمد - مندوب وادي السير',
    phoneInput: 'رقم الهاتف (للاتصال) *',
    whatsappInput: 'رقم الواتساب',
    whatsappPh: 'نفس الهاتف إن ترك فارغاً',
    country: 'الدولة',
    jordanOption: 'الأردن (Jordan)',
    egyptOption: 'مصر (Egypt)',
    gov: 'المحافظة',
    allGovsOption: 'عام (كل المحافظات)',
    district: 'المنطقة / اللواء',
    wholeGovOption: 'كامل المحافظة',
    notesLabel: 'ملاحظات / ساعات العمل والتواجد',
    notesPh: 'مثال: متواجد يومياً من 10 صباحاً حتى 10 مساءً للشحن المباشر نقداً.',
    activateNow: 'تفعيل المندوب فوراً لكباتن المنطقة',
    saveUpdate: 'تحديث وحفظ',
    addDelegate: 'إضافة المندوب',
    cancel: 'إلغاء',
    confirmDeleteTitle: 'تأكيد حذف المندوب المالي',
    confirmDeleteDesc: (name: string) => `هل أنت متأكد من حذف المندوب "${name}"؟ لن يظهر في بطاقة التواصل لكباتن منطقته.`,
    confirmDeleteBtn: 'نعم، حذف المندوب',
    back: 'تراجع',
    fetchFailTitle: 'فشل جلب المناديب',
    networkErrorTitle: 'خطأ شبكي',
    networkErrorDesc: 'تعذر الاتصال بالخادم',
    incompleteDataTitle: 'بيانات غير مكتملة',
    incompleteDataDesc: 'يرجى إدخال اسم المندوب ورقم هاتفه',
    opSuccess: 'نجاح العملية',
    saveFailTitle: 'فشل الحفظ',
    errorTitle: 'خطأ',
    saveErrorDesc: 'حدث خطأ أثناء حفظ التغييرات',
    updated: 'تم التحديث',
    toggleError: 'تعذر تعديل حالة المندوب',
    deleted: 'تم الحذف',
    deleteFail: 'فشل الحذف',
    deleteError: 'تعذر حذف المندوب',
  },
  en: {
    title: 'Financial Delegates & Cash Recharge (By Governorate & Sector)',
    subtitle: 'Manage on-field financial delegates and their geographic coverage for automatic display in captain recharge vouchers.',
    refresh: 'Refresh',
    addNew: 'Add New Financial Delegate',
    totalDelegates: 'Total Registered Delegates',
    activeDelegates: 'Active Delegates (Visible to Captains)',
    coveredGovs: 'Covered Governorates',
    govsUnit: 'governorates',
    searchPh: 'Search by name, phone, governorate...',
    allCountries: 'All Countries',
    jordan: 'Jordan',
    egypt: 'Egypt',
    allGovs: 'All Governorates',
    loading: 'Loading financial delegates directory...',
    emptySearch: 'No delegates match search criteria',
    emptySearchDesc: 'Click "Add New Financial Delegate" to assign a delegate to a specific sector or city.',
    addNow: 'Add Delegate Now',
    districtLabel: 'District:',
    govLabel: 'Gov:',
    generalDelegate: 'Universal Delegate (All Regions)',
    active: 'Active',
    inactive: 'Inactive',
    phoneLabel: 'Phone & Contact:',
    call: 'Call',
    whatsapp: 'WhatsApp',
    directCall: 'Direct Phone Call',
    whatsappChat: 'WhatsApp Chat',
    toggleAria: 'Toggle delegate status',
    visibleToCaptain: 'Visible to Captains',
    hiddenFromCaptain: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    editModalTitle: 'Edit Financial Delegate',
    addModalTitle: 'Add New Financial Delegate',
    modalDesc: 'Assign delegate and target coverage area to appear automatically for local captains.',
    delegateName: 'Delegate Full Name *',
    delegateNamePh: 'e.g. Abu Mohammad - Wadi Al Seer Agent',
    phoneInput: 'Phone Number (Calls) *',
    whatsappInput: 'WhatsApp Number',
    whatsappPh: 'Same as phone if left empty',
    country: 'Country',
    jordanOption: 'Jordan (Jordan)',
    egyptOption: 'Egypt (Egypt)',
    gov: 'Governorate',
    allGovsOption: 'Universal (All Governorates)',
    district: 'District / Area',
    wholeGovOption: 'Entire Governorate',
    notesLabel: 'Notes / Working Hours & Location',
    notesPh: 'e.g. Available daily 10 AM to 10 PM for direct cash recharge.',
    activateNow: 'Activate delegate immediately for captains',
    saveUpdate: 'Save Changes',
    addDelegate: 'Add Delegate',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Confirm Delegate Deletion',
    confirmDeleteDesc: (name: string) => `Are you sure you want to delete delegate "${name}"? They will no longer appear for local captains.`,
    confirmDeleteBtn: 'Yes, Delete Delegate',
    back: 'Go Back',
    fetchFailTitle: 'Failed to load delegates',
    networkErrorTitle: 'Network Error',
    networkErrorDesc: 'Could not reach server',
    incompleteDataTitle: 'Incomplete Details',
    incompleteDataDesc: 'Please enter delegate name and phone number',
    opSuccess: 'Operation Successful',
    saveFailTitle: 'Save Failed',
    errorTitle: 'Error',
    saveErrorDesc: 'An error occurred while saving changes',
    updated: 'Updated',
    toggleError: 'Could not toggle delegate status',
    deleted: 'Deleted',
    deleteFail: 'Deletion Failed',
    deleteError: 'Could not delete delegate',
  },
} as const;

export type DelegatesCopy = {
  [K in keyof typeof financialDelegatesCopy['ar']]: (typeof financialDelegatesCopy['ar'])[K] extends Function
    ? (name: string) => string
    : string;
};
