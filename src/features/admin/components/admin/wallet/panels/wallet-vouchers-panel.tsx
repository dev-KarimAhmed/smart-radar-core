'use client';

import React from 'react';
import { Ticket, Sparkles, Loader2, Check, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VoucherItem } from '../wallet-types';

interface WalletVouchersPanelProps {
  filteredVouchers: VoucherItem[];
  voucherMinutes: number;
  setVoucherMinutes: (m: number) => void;
  voucherCount: number;
  setVoucherCount: (c: number) => void;
  generatingVouchers: boolean;
  copiedCode: string | null;
  onGenerateVouchers: (e: React.FormEvent) => Promise<void>;
  onCopyCode: (code: string) => void;
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function WalletVouchersPanel({
  filteredVouchers,
  voucherMinutes,
  setVoucherMinutes,
  voucherCount,
  setVoucherCount,
  generatingVouchers,
  copiedCode,
  onGenerateVouchers,
  onCopyCode,
  isArabic,
  t,
}: WalletVouchersPanelProps) {
  return (
    <div className="space-y-6">
      {/* Generator Form Card */}
      <Card className={cn("bg-[#0B0F19]/90 border border-indigo-500/20 rounded-3xl p-5 text-white shadow-2xl", isArabic ? "text-right" : "text-left")}>
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Ticket className="w-5 h-5" />
            <CardTitle className="text-base font-black text-white">
              {t('vouchersHeading')}
            </CardTitle>
          </div>
          <CardDescription className="text-slate-400 text-xs mt-1">
            {t('vouchersSubheading')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={onGenerateVouchers} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">{t('voucherValueLabel')}</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { m: 60, l: isArabic ? '1 س' : '1 hr' },
                { m: 300, l: isArabic ? '5 س' : '5 hrs' },
                { m: 600, l: isArabic ? '10 س' : '10 hrs' },
                { m: 1440, l: isArabic ? 'يوم' : '1 day' },
              ].map((p) => (
                <button
                  key={p.m}
                  type="button"
                  onClick={() => setVoucherMinutes(p.m)}
                  className={cn(
                    "py-2 rounded-xl border text-xs font-bold transition cursor-pointer",
                    voucherMinutes === p.m
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-slate-300"
                  )}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">{t('voucherCountLabel')}</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={voucherCount}
              onChange={(e) => setVoucherCount(Number(e.target.value))}
              className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={generatingVouchers}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all cursor-pointer"
          >
            {generatingVouchers ? (
              <>
                <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                {t('generatingCodes')}
              </>
            ) : (
              <>
                <Sparkles className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                {t('generateCodesBtn')}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Vouchers Table */}
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
        <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
              <th className="py-3 px-4 font-bold">{t('colVoucherCode')}</th>
              <th className="py-3 px-4 font-bold">{t('colMinutesValue')}</th>
              <th className="py-3 px-4 font-bold">{t('colVoucherStatus')}</th>
              <th className="py-3 px-4 font-bold">{t('colRedeemedBy')}</th>
              <th className="py-3 px-4 font-bold">{t('colCreatedAt')}</th>
              <th className="py-3 px-4 font-bold text-center">{t('colCopy')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredVouchers.map((v) => (
              <tr key={v.code} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 font-mono font-black text-sm text-indigo-300">
                  {v.code}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-white">
                  {v.minutesValue} {t('flightMinutesUnit')}{' '}
                  <span className="text-slate-500 text-[10px]">({v.hoursValue} {isArabic ? 'س' : 'hrs'})</span>
                </td>
                <td className="py-3 px-4">
                  {v.status === 'UNUSED' ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {t('voucherUnused')}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                      {t('voucherRedeemed')}
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  {v.redeemedBy ? (
                    <div>
                      <p className="font-bold text-white text-xs">{v.redeemedBy.name}</p>
                      <p className="font-mono text-[10px] text-slate-400" dir="ltr">{v.redeemedBy.phone}</p>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px]">-</span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                  {new Date(v.createdAt).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US')}
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onCopyCode(v.code)}
                    className="h-8 px-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 cursor-pointer"
                    title={t('copyCodeTooltip')}
                  >
                    {copiedCode === v.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
