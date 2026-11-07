export function mapRiderMarketplaceError(error: unknown): string {
  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('ride_offer_id_required') || message.includes('offer_id_required')) {
    return 'بيانات العرض غير مكتملة. انتظر تحديث العروض ثم حاول مرة أخرى.';
  }

  if (message.includes('ride_offer_not_found')) {
    return 'هذا العرض لم يعد متاحاً. انتظر وصول عرض جديد ثم حاول مرة أخرى.';
  }

  if (message.includes('ride_offer_not_pending')) {
    return 'هذا العرض تم التعامل معه بالفعل. اختر عرضاً آخر إذا كان متاحاً.';
  }

  if (message.includes('ride_request_not_accepting_offers')) {
    return 'لا يمكن قبول العرض الآن لأن حالة الرحلة تغيرت. حدّث العروض ثم حاول مرة أخرى.';
  }

  if (message.includes('not_request_owner')) {
    return 'لا يمكنك تنفيذ هذه العملية لهذا الطلب. سجّل الدخول بالحساب الصحيح ثم حاول مرة أخرى.';
  }

  if (
    message.includes('42501') ||
    message.includes('row-level security') ||
    message.includes('rls') ||
    message.includes('permission denied') ||
    message.includes('permission')
  ) {
    return 'تعذر إنشاء طلب الرحلة بسبب صلاحيات قاعدة البيانات. تأكد من تفعيل سياسة إدخال طلبات الرحلات للمستخدم.';
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return 'لا يمكنك إنشاء هذا الطلب حالياً. يرجى تسجيل الدخول مرة أخرى.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return 'فشل الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مرة أخرى.';
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return 'تعذر حساب السعر من الخادم. حاول اختيار الوجهة مرة أخرى.';
  }

  if (
    message.includes('42703') ||
    message.includes('column') ||
    message.includes('destination_address_ar') ||
    message.includes('origin_h3') ||
    message.includes('destination_h3')
  ) {
    return 'جدول طلبات الرحلات لا يحتوي على كل الأعمدة المطلوبة. طبّق تحديث قاعدة البيانات ثم حاول مرة أخرى.';
  }

  if (
    message.includes('22p02') ||
    message.includes('invalid input value for enum') ||
    message.includes('ride_request_status') ||
    message.includes('pending')
  ) {
    return 'قيمة حالة الطلب غير متطابقة مع قاعدة البيانات. تأكد أن حالة الطلب تدعم PENDING بالحروف الكبيرة.';
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return 'بيانات الدولة أو المستخدم غير متطابقة مع قاعدة البيانات. حدّث الحساب أو اختر الوجهة مرة أخرى.';
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return 'يوجد طلب رحلة نشط بالفعل لهذا الحساب. أنهِ الطلب الحالي أو ألغِه ثم حاول مرة أخرى.';
  }

  return 'تعذر إرسال طلب الرحلة. حاول مرة أخرى بعد قليل.';
}
