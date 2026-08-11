'use client';

import React from 'react';
import {
  Flame,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DriverData } from '@/hooks/admin/useSovereignDashboard';

const styles = {
  style34_1: "bg-[#050505] border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8",
  style35_2: "bg-red-950/15 border-b border-red-500/10 p-5",
  style36_3: "text-[#ff3366] text-base font-extrabold flex items-center gap-2",
  style37_4: "w-5 h-5 text-[#ff3366] animate-pulse",
  style40_5: "text-gray-400 text-xs leading-relaxed text-right",
  style44_6: "p-6",
  style46_7: "flex items-center justify-center p-12 text-gray-400",
  style47_8: "w-8 h-8 animate-spin text-[#ff3366] ml-2",
  style51_9: "text-center text-gray-500 py-10",
  style52_10: "w-12 h-12 text-amber-500 mx-auto mb-2",
  style56_11: "overflow-x-auto rounded-xl border border-white/5",
  style58_12: "bg-zinc-950",
  style59_13: "hover:bg-transparent border-white/5 text-right",
  style60_14: "text-right text-gray-400 text-xs",
  style61_15: "text-center text-gray-400 text-xs",
  style62_16: "text-center text-gray-400 text-xs",
  style63_17: "text-center text-gray-400 text-xs",
  style64_18: "text-center text-gray-400 text-xs",
  style65_19: "text-left text-gray-400 text-xs",
  style70_20: "border-white/5 hover:bg-zinc-950/40 text-right",
  style71_21: "font-bold text-white text-xs",
  style72_22: "text-center font-mono text-xs text-gray-300",
  style73_23: "text-center",
  style75_24: "font-mono font-bold text-xs",
  style76_25: "text-[#00ffcc]",
  style76_26: "text-gray-500",
  style81_27: "text-center",
  style82_28: "flex justify-center items-center gap-1.5 font-sans",
  style84_29: "text-xs font-black",
  style85_30: "text-[#ff3366]",
  style85_31: "text-emerald-400",
  style89_32: "text-[10px] text-gray-500 font-bold",
  style92_33: "text-center",
  style94_34: "bg-red-950/40 border border-[#ff3366]/40 text-[#ff3366] text-[10px] font-black h-5",
  style98_35: "bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-black h-5",
  style103_36: "text-left font-sans",
  style108_37: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer",
  style110_38: "w-3.5 h-3.5",
  style117_39: "bg-[#ff3366] hover:bg-[#ff3366]/80 text-white font-black text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(255,51,102,0.15)]",
  style119_40: "w-3.5 h-3.5 text-white",
} as const;


interface DriverBlackBoxPanelProps {
  drivers: DriverData[];
  loadingDrivers: boolean;
  isProcessing: boolean;
  handleSovereignKillSwitch: (uid: string, name: string) => Promise<void>;
  handleReviveDriver: (uid: string, name: string) => Promise<void>;
}

export function DriverBlackBoxPanel({
  drivers,
  loadingDrivers,
  isProcessing,
  handleSovereignKillSwitch,
  handleReviveDriver
}: DriverBlackBoxPanelProps) {
  return (
    <Card className={styles.style34_1}>
      <CardHeader className={styles.style35_2}>
        <CardTitle className={styles.style36_3}>
          <Flame className={styles.style37_4} />
          منصة تفعيل "الصندوق الأسود" لوقف النواقل الفوري (Black-Box Lethal Strike)
        </CardTitle>
        <CardDescription className={styles.style40_5} dir="rtl">
          التحكم الكلي في سلب الحصانة السلوكية للنواقل وبث إشعاعات الوقف وإلغاء الرصيد في الميدان لمنع المضاربات والخرق الجغرافي.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style44_6}>
        {loadingDrivers ? (
          <div className={styles.style46_7}>
            <Loader2 className={styles.style47_8} />
            <span>جاري محاذاة البيانات الة للنواقل...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className={styles.style51_9}>
            <AlertTriangle className={styles.style52_10} />
            <span>لا يوجد سائقون أو نواقل مسجلون حالياً.</span>
          </div>
        ) : (
          <div className={styles.style56_11}>
            <Table>
              <TableHeader className={styles.style58_12}>
                <TableRow className={styles.style59_13}>
                  <TableHead className={styles.style60_14}>اسم الناقل وموقع التسجيل</TableHead>
                  <TableHead className={styles.style61_15}>رقم الهاتف</TableHead>
                  <TableHead className={styles.style62_16}>الساعات المتبقية</TableHead>
                  <TableHead className={styles.style63_17}>حصانة الناقل</TableHead>
                  <TableHead className={styles.style64_18}>الحالة الأمنية</TableHead>
                  <TableHead className={styles.style65_19}>صعق / إعادة فك</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody dir="rtl">
                {drivers.map((drv) => (
                  <TableRow key={drv.uid} className={styles.style70_20}>
                    <TableCell className={styles.style71_21}>{drv.name}</TableCell>
                    <TableCell className={styles.style72_22}>{drv.phone}</TableCell>
                    <TableCell className={styles.style73_23}>
                      <span className={cn(
                        styles.style75_24,
                        (drv.paidHoursRemaining || 0) > 0 ? styles.style76_25 : styles.style76_26
                      )}>
                        {drv.paidHoursRemaining || 0} ساعة
                      </span>
                    </TableCell>
                    <TableCell className={styles.style81_27}>
                      <div className={styles.style82_28}>
                        <span className={cn(
                          styles.style84_29,
                          (drv.immunityScore ?? 100.0) === 0 ? styles.style85_30 : styles.style85_31
                        )}>
                          {drv.immunityScore ?? 100.0}%
                        </span>
                        <span className={styles.style89_32}>immunity</span>
                      </div>
                    </TableCell>
                    <TableCell className={styles.style92_33}>
                      {drv.isBanned ? (
                        <Badge className={styles.style94_34}>
                          🔴 : مصعوق
                        </Badge>
                      ) : (
                        <Badge className={styles.style98_35}>
                          🟢 محصن ونشط
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={styles.style103_36}>
                      {drv.isBanned ? (
                        <Button
                          onClick={() => handleReviveDriver(drv.uid, drv.name)}
                          disabled={isProcessing}
                          className={styles.style108_37}
                        >
                          <RotateCcw className={styles.style110_38} />
                          إلغاء الصعق وإحياء
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSovereignKillSwitch(drv.uid, drv.name)}
                          disabled={isProcessing}
                          className={styles.style117_39}
                        >
                          <Ban className={styles.style119_40} />
                          صعق أمني فوري 💥
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
