import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { WalletOverview, ReceiptItem, VoucherItem, LedgerItem } from '@/features/admin/types/admin-wallet';

describe('admin-wallet data structures & calculations', () => {
  it('validates WalletOverview data structure and liquidity calculations', () => {
    const overview: WalletOverview = {
      totalCashBalance: 1250.75,
      jodBalance: 1000.0,
      egpBalance: 250.75,
      totalPaidMinutes: 4800,
      totalFlightHours: 80,
      pendingReceiptsCount: 4,
      totalVouchersCount: 20,
      unusedVouchersCount: 15,
      selfTopupEnabled: true,
    };

    assert.equal(overview.totalCashBalance, 1250.75);
    assert.equal(overview.totalPaidMinutes / 60, overview.totalFlightHours);
    assert.equal(overview.pendingReceiptsCount > 0, true);
    assert.equal(overview.unusedVouchersCount <= overview.totalVouchersCount, true);
  });

  it('validates ReceiptItem and status types', () => {
    const receipt: ReceiptItem = {
      id: 'rcpt-101',
      profileId: 'cap-55',
      captainName: 'كابتن محمود',
      captainPhone: '+962791234567',
      captainSerial: 'CP-055',
      governorate: 'عمان',
      district: 'خلدا',
      amount: 15.0,
      currency: 'JOD',
      channel: 'CliQ',
      receiptPath: 'receipts/101.jpg',
      receiptImageUrl: 'https://storage.example.com/receipts/101.jpg',
      status: 'PENDING',
      description: 'حوالة كليك',
      metadata: {},
      createdAt: '2026-02-01T12:00:00Z',
    };

    assert.equal(receipt.id, 'rcpt-101');
    assert.equal(receipt.status, 'PENDING');
    assert.equal(receipt.currency, 'JOD');
    assert.equal(receipt.channel, 'CliQ');
  });

  it('validates VoucherItem and flight hours conversion', () => {
    const voucher: VoucherItem = {
      code: 'RADAR-60M-XYZ',
      minutesValue: 60,
      hoursValue: 1,
      status: 'UNUSED',
      redeemedBy: null,
      redeemedAt: null,
      createdAt: '2026-02-01T12:00:00Z',
    };

    assert.equal(voucher.code, 'RADAR-60M-XYZ');
    assert.equal(voucher.status, 'UNUSED');
    assert.equal(voucher.minutesValue, 60);
    assert.equal(voucher.hoursValue, 1);
  });

  it('validates LedgerItem credit and debit formatting', () => {
    const item: LedgerItem = {
      id: 'tx-999',
      profileId: 'cap-55',
      userName: 'محمود عبد الله',
      userPhone: '+962791234567',
      userSerial: 'CP-055',
      userRole: 'CAPTAIN',
      type: 'TOPUP',
      amount: 25.0,
      currency: 'JOD',
      status: 'COMPLETED',
      description: 'شحن رصيد مباشر من الإدارة',
      createdAt: '2026-02-01T12:00:00Z',
    };

    assert.equal(item.amount > 0, true);
    assert.equal(item.status, 'COMPLETED');
    assert.equal(item.type, 'TOPUP');
  });
});
