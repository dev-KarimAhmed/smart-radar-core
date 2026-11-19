export interface CaptainContractData {
  captainId: string;
  fullName: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  plateNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  country?: string;
  governorate?: string;
  district?: string;
  acceptedAt?: string;
  contractVersion?: string;
  ipAddress?: string;
}

export interface ContractResult {
  pdfBuffer: Buffer;
  contractHash: string;
  contractId: string;
  storagePath: string;
  version: string;
  acceptedAt: string;
}

/**
 * Standard, universal Arabic date and time formatter using Western Arabic digits
 * and pan-Arab Gregorian month names (avoiding confusing Eastern numerals or regional Syriac names).
 */
export function formatContractDate(dateInput?: string | Date | number, lang: 'ar' | 'en' = 'ar'): string {
  const dt = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(dt.getTime())) return '-';
  const day = String(dt.getDate()).padStart(2, '0');
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, '0');

  if (lang === 'en') {
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthsEn[dt.getMonth()];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${monthName} ${year} at ${String(hours).padStart(2, '0')}:${mins} ${period}`;
  }

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthName = months[dt.getMonth()];
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  return `${day} ${monthName} ${year} - الساعة ${hours}:${mins} ${period}`;
}
