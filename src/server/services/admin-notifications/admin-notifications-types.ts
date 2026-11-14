export interface AdminNotificationItem {
  id: string;
  category: 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM';
  title: string;
  description: string;
  createdAt: string;
  severity: 'urgent' | 'warning' | 'info';
  targetTab: 'wallet' | 'captains' | 'riders' | 'admins';
  targetSubtab?: string;
  isRead: boolean;
  payload: {
    transactionId?: string;
    profileId?: string;
    amount?: number;
    currency?: string;
    currencyCode?: string;
    channel?: string;
    receiptPath?: string;
    receiptImageUrl?: string | null;
    captainName?: string;
    captainPhone?: string;
    captainSerial?: string;
    governorate?: string;
    district?: string;
    captainId?: string;
    plateNumber?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    claimedPhone?: string;
    adminNote?: string;
  };
}

export interface AdminNotificationsSummary {
  totalUnread: number;
  pendingReceiptsCount: number;
  pendingCaptainsCount: number;
  pendingResetsCount: number;
  unreadSystemCount: number;
}
