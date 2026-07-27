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
    <Card className="bg-[#050505] border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
      <CardHeader className="bg-red-950/15 border-b border-red-500/10 p-5">
        <CardTitle className="text-[#ff3366] text-base font-extrabold flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#ff3366] animate-pulse" />
          منصة تفعيل "الصندوق الأسود" لوقف النواقل الفوري (Black-Box Lethal Strike)
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs leading-relaxed text-right" dir="rtl">
          التحكم الكلي في سلب الحصانة السلوكية للنواقل وبث إشعاعات الوقف وإلغاء الرصيد في الميدان لمنع المضاربات والخرق الجغرافي.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loadingDrivers ? (
          <div className="flex items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff3366] ml-2" />
            <span>جاري محاذاة البيانات الة للنواقل...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <span>لا يوجد سائقون أو نواقل مسجلون حالياً.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="hover:bg-transparent border-white/5 text-right">
                  <TableHead className="text-right text-gray-400 text-xs">اسم الناقل وموقع التسجيل</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">رقم الهاتف</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">الساعات المتبقية</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">حصانة الناقل</TableHead>
                  <TableHead className="text-center text-gray-400 text-xs">الحالة الأمنية</TableHead>
                  <TableHead className="text-left text-gray-400 text-xs">صعق / إعادة فك</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody dir="rtl">
                {drivers.map((drv) => (
                  <TableRow key={drv.uid} className="border-white/5 hover:bg-zinc-950/40 text-right">
                    <TableCell className="font-bold text-white text-xs">{drv.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-gray-300">{drv.phone}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-mono font-bold text-xs",
                        (drv.paidHoursRemaining || 0) > 0 ? "text-[#00ffcc]" : "text-gray-500"
                      )}>
                        {drv.paidHoursRemaining || 0} ساعة
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-1.5 font-sans">
                        <span className={cn(
                          "text-xs font-black",
                          (drv.immunityScore ?? 100.0) === 0 ? "text-[#ff3366]" : "text-emerald-400"
                        )}>
                          {drv.immunityScore ?? 100.0}%
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold">immunity</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {drv.isBanned ? (
                        <Badge className="bg-red-950/40 border border-[#ff3366]/40 text-[#ff3366] text-[10px] font-black h-5">
                          🔴 : مصعوق
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-black h-5">
                          🟢 محصن ونشط
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left font-sans">
                      {drv.isBanned ? (
                        <Button
                          onClick={() => handleReviveDriver(drv.uid, drv.name)}
                          disabled={isProcessing}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          إلغاء الصعق وإحياء
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSovereignKillSwitch(drv.uid, drv.name)}
                          disabled={isProcessing}
                          className="bg-[#ff3366] hover:bg-[#ff3366]/80 text-white font-black text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(255,51,102,0.15)]"
                        >
                          <Ban className="w-3.5 h-3.5 text-white" />
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
