"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { SheetClose } from "@/components/ui/sheet";
import {
  ShieldCheck,
  LogOut,
  History,
  MessageSquare,
  UserCircle,
  X,
  Fuel,
  LayoutDashboard,
  Star,
  Heart,
  Users,
  Phone,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DriverStatsCard } from "./dashboard/driver/driver-stats-card";
import { DriverActions } from "./dashboard/driver/driver-actions";
import type { User } from "@/core/types";
import { calculateRiderRank } from "@/core/utils";
import { useRiderSidebarRadar } from "@/hooks/use-rider-sidebar-radar";
import { cn } from "@/lib/utils";

// ============================================================================
// 🏛️ [SCR-CMD-P16-STERILIZE] - The Purified Component
// ============================================================================

const getStatusClass = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "busy":
      return "bg-yellow-500";
    case "rating":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

function RiderFavoriteDrivers() {
  const { nearbyFavorites, isLoading } = useRiderSidebarRadar();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-8 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (nearbyFavorites.length === 0) {
    return (
      <p className="text-xs text-center text-muted-foreground py-4">
        لا يوجد أي من كباتنك المفضلين في نطاقك الحالي (1.5 كم).
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {nearbyFavorites.map((driver) => (
        <div
          key={driver.uid}
          className="text-sm py-2 px-3 bg-muted/30 rounded-lg border border-white/10 text-white/80 flex justify-between items-center"
        >
          <span className="font-bold">{driver.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs capitalize">
              {driver.status || "خامل"}
            </span>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                getStatusClass(driver.status),
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isDriver = user.role === "driver";
  const isAdmin = user.role === "admin";
  const isRider = user.role === "rider";

  return (
    <nav className="h-full flex flex-col bg-[#091B09]">
      {/* Header - Radar Branding */}
      <div className="flex items-center justify-between p-5 bg-[#050D05] border-b border-emerald-900/40 shrink-0">
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 font-bold px-3 py-1 shadow-sm"
        >
          {isDriver
            ? "V4.5 - كابتن"
            : isAdmin
              ? "V4.5 - قيادة"
              : "V4.5 - مسافر"}
        </Badge>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-widest drop-shadow-md">
            رادار
          </h2>
          <ShieldCheck className="w-7 h-7 text-emerald-500" />
        </div>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </SheetClose>
      </div>

      <ScrollArea className="flex-1 w-full" type="scroll">
        {/* Profile Summary */}
        <div className="flex flex-col items-center mb-6 pt-6">
          <div className="w-20 h-20 rounded-full bg-[#050D05] border-2 border-emerald-500/40 flex items-center justify-center mb-3 shadow-lg shadow-emerald-900/20">
            <UserCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide">
            {user.name || "مستخدم السيادة"}
          </h3>
          <p className="text-sm text-emerald-400/80 mt-1 font-mono">
            {isAdmin ? "القيادة العليا" : user.phone}
          </p>
        </div>

        {isDriver && (
          <div className="space-y-8 max-w-sm mx-auto w-full px-5 pb-6">
            <DriverStatsCard user={user} />
            <DriverActions />
          </div>
        )}

        {isAdmin && (
          <div className="space-y-3 px-5 pb-6">
            <div className="flex items-center justify-center gap-2 text-white/50 px-1 mb-2">
              <span className="text-sm font-bold tracking-wider">
                لوحة القيادة السيادية
              </span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              تم دمج جميع أدوات التحكم في الواجهة الرئيسية. استخدم التبويبات
              للتنقل بين شاشات المراقبة والتحكم.
            </p>
          </div>
        )}

        {isRider && (
          <div className="space-y-6 max-w-sm mx-auto w-full">
            <div className="px-4 py-2 bg-emerald-950/30 border-y border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-tighter text-emerald-400 font-black">
                  النبض الشخصي
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/50 text-emerald-400"
                >
                  {calculateRiderRank(user.ratingSum, user.ratingCount)}
                </Badge>
              </div>
              <p className="text-xs text-white/70 mt-1">
                الميدان يثق بك كراكب ملتزم.
              </p>
            </div>

            {user?.isBufferActive && user.lastTripBuffer && (
              <div className="mx-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg animate-pulse">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold font-headline">
                    نافذة الاستدراك (24h)
                  </span>
                </div>
                <p className="text-[10px] text-white/60 mb-2">
                  يمكنك التواصل مع كابتن الرحلة الأخيرة لأي طارئ.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[10px] border-amber-500/50 text-amber-400"
                  asChild
                >
                  <a href={`tel:${user.lastTripBuffer?.driverPhone}`}>
                    اتصال بالكابتن: {user.lastTripBuffer?.driverName}
                  </a>
                </Button>
              </div>
            )}

            <div className="px-5 space-y-3">
              <div className="flex items-center justify-end gap-2 text-white px-1 mb-2">
                <span className="text-sm font-bold tracking-wider">
                  العمليات
                </span>
              </div>
              <a href="#history" className="block w-full">
                <Button
                  variant="ghost"
                  className="w-full justify-end gap-3 text-white hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 h-14 rounded-xl transition-all shadow-sm"
                >
                  <span className="font-bold text-base">
                    سجل الرحلات السابقة
                  </span>
                  <History className="w-5 h-5 text-emerald-500/70" />
                </Button>
              </a>
              <a href="#messages" className="block w-full">
                <Button
                  variant="ghost"
                  className="w-full justify-end gap-3 text-white hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 h-14 rounded-xl relative transition-all shadow-sm"
                >
                  <span className="font-bold text-base">رسائل الرادار</span>
                  <MessageSquare className="w-5 h-5 text-emerald-500/70" />
                </Button>
              </a>
            </div>

            <div className="px-5 mt-6">
              <span className="text-xs text-muted-foreground font-bold flex items-center justify-end gap-2">
                <Heart className="w-4 h-4 text-red-500" /> رادار الكتيبة الخاصة
              </span>
              <RiderFavoriteDrivers />
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer / Logout */}
      <div className="p-5 bg-[#050D05] border-t border-emerald-900/30 mt-auto shrink-0 w-full">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-3 font-black tracking-widest text-lg h-14 bg-red-600/90 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all rounded-xl"
          onClick={logout}
        >
          <span>إغلاق المنصة</span>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}
