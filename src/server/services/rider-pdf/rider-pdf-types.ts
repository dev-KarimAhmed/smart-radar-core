export interface RiderContractData {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  governorate?: string;
  district?: string;
  acceptedAt?: string;
  contractVersion?: string;
  ipAddress?: string;
}

export interface RiderContractResult {
  pdfBuffer: Buffer;
  contractHash: string;
  contractId: string;
  acceptedAt: string;
  storagePath?: string;
  version?: string;
}

export function formatRiderContractDate(dateStr?: string, lang: 'ar' | 'en' = 'ar'): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (lang === 'en') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Amman',
      });
    }
    return d.toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Amman',
    });
  } catch {
    return dateStr || new Date().toISOString();
  }
}
