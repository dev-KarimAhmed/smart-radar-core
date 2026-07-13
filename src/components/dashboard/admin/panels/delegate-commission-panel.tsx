'use client';

import React from 'react';
import {
  DollarSign,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DelegateData } from '@/hooks/admin/useSovereignDashboard';

interface DelegateCommissionPanelProps {
  delegates: DelegateData[];
  loadingDelegates: boolean;
  isProcessing: boolean;
  handleClearDelegateDues: (id: string, name: string) => Promise<void>;
  auditedStats: {
    totalDues: number;
    totalPenalties: number;
    totalNet: number;
  };
  auditRepresentativeCommissions: (delegate: DelegateData) => {
    rawDues: number;
    penaltyAmount: number;
    withdrawableBalance: number;
  };
}

export function DelegateCommissionPanel({
  delegates,
  loadingDelegates,
  isProcessing,
  handleClearDelegateDues,
  auditedStats,
  auditRepresentativeCommissions
}: DelegateCommissionPanelProps) {
  return (
    <Card className="bg-radar-black border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
      <CardHeader className="bg-red-950/15 border-b border-red-500/10 p-5">
        <CardTitle className="text-radar-neon text-base font-extrabold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-radar-neon" />
          محرك الجرد المالي المتكامل للمندوبين (Representative Commission Guard)
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs leading-relaxed text-right" dir="rtl">
          يتحكم هذا المحرك في تصفية الإحالات عبر عطل زمني ذكي بمقدار 30 يوماً <code className="text-yellow-400 font-mono text-[10px]">STABILITY_THRESHOLD_MS</code> ويفرض ذعيرة حذف قدرها <code className="text-red-400 font-mono text-[10px]">PENALTY_FACTOR = 40%</code> ضد الحسابات الوهمية أو الزومبي.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-right" dir="rtl">
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-500 block font-bold">العمولات الخام المستحقة للمندوبين</span>
            <span className="text-xl font-black text-gray-300 font-mono block mt-1">{auditedStats.totalDues.toFixed(2)} د.أ</span>
          </div>
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-radar-danger/20">
            <span className="text-[10px] text-red-400 block font-bold">إجمالي غرامات الحذف الكلي</span>
            <span className="text-xl font-black text-radar-danger font-mono block mt-1">-{auditedStats.totalPenalties.toFixed(2)} د.أ</span>
          </div>
          <div className="bg-radar-forest-deep/20 p-4 rounded-xl border border-radar-neon/30">
            <span className="text-[10px] text-radar-neon block font-bold">الرصيد الصافي المصدق القابل للصرف</span>
            <span className="text-xl font-black text-radar-neon font-mono block mt-1">{auditedStats.totalNet.toFixed(2)} د.أ</span>
          </div>
        </div>

        {loadingDelegates ? (
          <div className="flex items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-radar-neon ml-2" />
            <span>جاري محاذاة البيانات الة للمندوبين...</span>
          </div>
        ) : delegates.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <span>لا يوجد مندوبون معتمدون في قواعد البيانات الحالية.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="hover:bg-transparent border-white/5 text-right">
                  <TableHead className="text-right text-gray-400 text-xs">اسم المندوب الميداني</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">رمز الإحالة </TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">إجمالي الإحالات</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">معدل الحذف (الوهمي)</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">العمولة الخام</TableHead>
                  <TableHead className="text-center text-radar-danger text-xs">عقوبة الفرز (40%)</TableHead>
                  <TableHead className="text-center text-radar-neon text-xs font-bold">العمولة المستحقة الصافية</TableHead>
                  <TableHead className="text-left text-gray-400 text-xs">صرف / تصفية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegates.map((del) => {
                  const audit = auditRepresentativeCommissions(del);
                  return (
                    <TableRow key={del.id} className="border-white/5 hover:bg-zinc-950/40 text-right">
                      <TableCell className="font-bold text-white text-xs">{del.name}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-gray-300">{del.referralCode || 'N/A'}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-gray-300">{del.referredCount || 0} إحالة</TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-400 font-mono text-xs">{(del.deletionRate || 0).toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-gray-300">
                        {audit.rawDues.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-red-500">
                        {audit.penaltyAmount.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-radar-neon font-black">
                        {audit.withdrawableBalance.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="text-left font-sans">
                        <Button
                          onClick={() => handleClearDelegateDues(del.id, del.name)}
                          disabled={isProcessing || audit.withdrawableBalance <= 0}
                          className={cn(
                            "h-8 text-[11px] font-black rounded-lg transition-all cursor-pointer",
                            audit.withdrawableBalance <= 0
                              ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                              : "bg-radar-neon hover:bg-radar-neon/80 text-black shadow-[0_0_12px_rgb(var(--radar-neon-rgb)/0.15)]"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                          تصفية وصرف
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
