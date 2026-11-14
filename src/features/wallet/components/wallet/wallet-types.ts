export interface WalletCopy {
  title: string;
  subtitle: string;
  driverAccount: string;
  riderAccount: string;
  workHoursBalance: string;
  hours: string;
  paid: string;
  bonus: string;
  currentPackage: string;
  none: string;
  fromServer: string;
  balanceStatus: string;
  noActivePackages: string;
  loadingBalance: string;
  serverDataHint: string;
  noDemoNumbers: string;
  workPackages: string;
  workPackagesDescription: string;
  currency: string;
  basicPackage: string;
  basicPackageDescription: string;
  buyPackage: string;
  proPackage: string;
  proPackageDescription: string;
  confirmPackagePurchase: string;
  confirmPackageDescription: string;
  confirmPurchase: string;
  back: string;
  transactions: string;
  transactionsDescription: string;
  noTransactions: string;
  noteTitle: string;
  noteText: string;
  balance: string;
  chargeBalance: string;
}

export interface BalanceDisplayProps {
  balance: number;
  currencyLabel: string;
  walletLoaded: boolean;
  onChargeFunds: () => void;
  copy: Pick<WalletCopy, 'balance' | 'chargeBalance'>;
}

export interface DriverPackageCardProps {
  badge: string;
  hours: string;
  title: string;
  description: string;
  onPurchase: () => void;
  purchaseLabel: string;
  highlight?: boolean;
}
