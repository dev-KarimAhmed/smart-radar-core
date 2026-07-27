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

const styles = {
  style42_1: "bg-[#050505] border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden",
  style43_2: "bg-red-950/15 border-b border-red-500/10 p-5",
  style44_3: "text-[#00ffcc] text-base font-extrabold flex items-center gap-2",
  style45_4: "w-5 h-5 text-[#00ffcc]",
  style48_5: "text-gray-400 text-xs leading-relaxed text-right",
  style49_6: "text-yellow-400 font-mono text-[10px]",
  style49_7: "text-red-400 font-mono text-[10px]",
  style52_8: "p-6",
  style53_9: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-right",
  style54_10: "bg-zinc-950/60 p-4 rounded-xl border border-white/5",
  style55_11: "text-[10px] text-gray-500 block font-bold",
  style56_12: "text-xl font-black text-gray-300 font-mono block mt-1",
  style58_13: "bg-zinc-950/80 p-4 rounded-xl border border-[#ff3366]/20",
  style59_14: "text-[10px] text-red-400 block font-bold",
  style60_15: "text-xl font-black text-[#ff3366] font-mono block mt-1",
  style62_16: "bg-[#003322]/20 p-4 rounded-xl border border-[#00ffcc]/30",
  style63_17: "text-[10px] text-[#00ffcc] block font-bold",
  style64_18: "text-xl font-black text-[#00ffcc] font-mono block mt-1",
  style69_19: "flex items-center justify-center p-12 text-gray-400",
  style70_20: "w-8 h-8 animate-spin text-[#00ffcc] ml-2",
  style74_21: "text-center text-gray-500 py-10",
  style75_22: "w-12 h-12 text-amber-500 mx-auto mb-2",
  style79_23: "overflow-x-auto rounded-xl border border-white/5",
  style81_24: "bg-zinc-950",
  style82_25: "hover:bg-transparent border-white/5 text-right",
  style83_26: "text-right text-gray-400 text-xs",
  style84_27: "text-center text-gray-400 text-xs",
  style85_28: "text-center text-gray-400 text-xs",
  style86_29: "text-center text-gray-400 text-xs",
  style87_30: "text-center text-gray-400 text-xs",
  style88_31: "text-center text-[#ff3366] text-xs",
  style89_32: "text-center text-[#00ffcc] text-xs font-bold",
  style90_33: "text-left text-gray-400 text-xs",
  style97_34: "border-white/5 hover:bg-zinc-950/40 text-right",
  style98_35: "font-bold text-white text-xs",
  style99_36: "text-center font-mono text-xs text-gray-300",
  style100_37: "text-center font-mono text-xs text-gray-300",
  style101_38: "text-center",
  style102_39: "text-red-400 font-mono text-xs",
  style104_40: "text-center font-mono text-xs text-gray-300",
  style107_41: "text-center font-mono text-xs text-red-500",
  style110_42: "text-center font-mono text-xs text-[#00ffcc] font-black",
  style113_43: "text-left font-sans",
  style118_44: "h-8 text-[11px] font-black rounded-lg transition-all cursor-pointer",
  style120_45: "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5",
  style121_46: "bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black shadow-[0_0_12px_rgba(0,255,204,0.15)]",
  style124_47: "w-3.5 h-3.5 ml-1",
} as const;


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
    <Card className={styles.style42_1}>
      <CardHeader className={styles.style43_2}>
        <CardTitle className={styles.style44_3}>
          <DollarSign className={styles.style45_4} />
          محرك الجرد المالي المتكامل للمندوبين (Representative Commission Guard)
        </CardTitle>
        <CardDescription className={styles.style48_5} dir="rtl">
          يتحكم هذا المحرك في تصفية الإحالات عبر عطل زمني ذكي بمقدار 30 يوماً <code className={styles.style49_6}>STABILITY_THRESHOLD_MS</code> ويفرض ذعيرة حذف قدرها <code className={styles.style49_7}>PENALTY_FACTOR = 40%</code> ضد الحسابات الوهمية أو الزومبي.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style52_8}>
        <div className={styles.style53_9} dir="rtl">
          <div className={styles.style54_10}>
            <span className={styles.style55_11}>العمولات الخام المستحقة للمندوبين</span>
            <span className={styles.style56_12}>{auditedStats.totalDues.toFixed(2)} د.أ</span>
          </div>
          <div className={styles.style58_13}>
            <span className={styles.style59_14}>إجمالي غرامات الحذف الكلي</span>
            <span className={styles.style60_15}>-{auditedStats.totalPenalties.toFixed(2)} د.أ</span>
          </div>
          <div className={styles.style62_16}>
            <span className={styles.style63_17}>الرصيد الصافي المصدق القابل للصرف</span>
            <span className={styles.style64_18}>{auditedStats.totalNet.toFixed(2)} د.أ</span>
          </div>
        </div>

        {loadingDelegates ? (
          <div className={styles.style69_19}>
            <Loader2 className={styles.style70_20} />
            <span>جاري محاذاة البيانات الة للمندوبين...</span>
          </div>
        ) : delegates.length === 0 ? (
          <div className={styles.style74_21}>
            <AlertTriangle className={styles.style75_22} />
            <span>لا يوجد مندوبون معتمدون في قواعد البيانات الحالية.</span>
          </div>
        ) : (
          <div className={styles.style79_23}>
            <Table>
              <TableHeader className={styles.style81_24}>
                <TableRow className={styles.style82_25}>
                  <TableHead className={styles.style83_26}>اسم المندوب الميداني</TableHead>
                  <TableHead className={styles.style84_27}>رمز الإحالة </TableHead>
                  <TableHead className={styles.style85_28}>إجمالي الإحالات</TableHead>
                  <TableHead className={styles.style86_29}>معدل الحذف (الوهمي)</TableHead>
                  <TableHead className={styles.style87_30}>العمولة الخام</TableHead>
                  <TableHead className={styles.style88_31}>عقوبة الفرز (40%)</TableHead>
                  <TableHead className={styles.style89_32}>العمولة المستحقة الصافية</TableHead>
                  <TableHead className={styles.style90_33}>صرف / تصفية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegates.map((del) => {
                  const audit = auditRepresentativeCommissions(del);
                  return (
                    <TableRow key={del.id} className={styles.style97_34}>
                      <TableCell className={styles.style98_35}>{del.name}</TableCell>
                      <TableCell className={styles.style99_36}>{del.referralCode || 'N/A'}</TableCell>
                      <TableCell className={styles.style100_37}>{del.referredCount || 0} إحالة</TableCell>
                      <TableCell className={styles.style101_38}>
                        <span className={styles.style102_39}>{(del.deletionRate || 0).toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className={styles.style104_40}>
                        {audit.rawDues.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className={styles.style107_41}>
                        {audit.penaltyAmount.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className={styles.style110_42}>
                        {audit.withdrawableBalance.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className={styles.style113_43}>
                        <Button
                          onClick={() => handleClearDelegateDues(del.id, del.name)}
                          disabled={isProcessing || audit.withdrawableBalance <= 0}
                          className={cn(
                            styles.style118_44,
                            audit.withdrawableBalance <= 0
                              ? styles.style120_45
                              : styles.style121_46
                          )}
                        >
                          <CheckCircle2 className={styles.style124_47} />
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
