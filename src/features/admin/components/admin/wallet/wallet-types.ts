export interface WalletOverview {
  totalCashBalance: number;
  jodBalance?: number;
  egpBalance?: number;
  totalPaidMinutes: number;
  totalFlightHours: number;
  pendingReceiptsCount: number;
  unusedVouchersCount: number;
  totalVouchersCount: number;
  selfTopupEnabled: boolean;
}

export interface ReceiptItem {
  id: string;
  profileId: string;
  captainName: string;
  captainPhone: string;
  captainSerial: string;
  governorate: string;
  district: string;
  amount: number;
  currency: string;
  channel: string;
  receiptPath: string | null;
  receiptImageUrl: string | null;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  description: string;
  metadata: any;
  createdAt: string;
}

export interface VoucherItem {
  code: string;
  minutesValue: number;
  hoursValue: number;
  status: 'UNUSED' | 'REDEEMED';
  redeemedBy: {
    name: string;
    phone: string;
    serial: string;
  } | null;
  redeemedAt: string | null;
  createdAt: string;
}

export interface LedgerItem {
  id: string;
  profileId: string;
  userName: string;
  userPhone: string;
  userSerial: string;
  userRole: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface CaptainOption {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  governorate: string;
  country_id?: number;
  currency?: string;
  currency_ar?: string;
  currency_code?: string;
  wallet: {
    balance: number;
    total_minutes: number;
    currency_code?: string;
    currency_ar?: string;
  };
}

export type WalletSubTab = 'receipts' | 'direct' | 'vouchers' | 'ledger' | 'rates' | 'channels' | 'delegates';
