export interface RiderContractViewData {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  district: string;
  acceptedAt: string;
  acceptedAtRaw?: string;
  contractHash: string;
  version: string;
}

export function formatRiderContractDate(dateInput: string | Date | number | undefined, isArabic: boolean): string {
  const dt = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(dt.getTime())) return '-';
  const day = String(dt.getDate()).padStart(2, '0');
  const months = isArabic
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[dt.getMonth()];
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, '0');
  const period = isArabic ? (hours >= 12 ? 'م' : 'ص') : hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return isArabic
    ? `${day} ${monthName} ${year} - الساعة ${hours}:${mins} ${period}`
    : `${day} ${monthName} ${year} - ${hours}:${mins} ${period}`;
}
