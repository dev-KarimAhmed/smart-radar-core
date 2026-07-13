"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
 ShieldAlert,
 PlaySquare,
 Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetClose } from "@/components/ui/sheet";
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
 لا يوجد سائقون مفضلون بالقرب منك حالياً.
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
 {driver.status || "غير متاح"}
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
 const { toast } = useToast();
 const [isOnline, setIsOnline] = useState(true);
 const [showIncidentForm, setShowIncidentForm] = useState(false);
 const [incidentReason, setIncidentReason] = useState("");

 if (!user) return null;

 const handleToggleOnline = () => {
 const nextState = !isOnline;
 setIsOnline(nextState);
 toast({
 title: nextState ? "أنت متاح الآن" : "تم تفعيل وضع الاستراحة",
 description: nextState
 ? "سيظهر حسابك لاستقبال الطلبات القريبة."
 : "لن تظهر في الطلبات الجديدة حتى تعود للعمل."
 });
 };

 const handleSendIncident = () => {
 if (!incidentReason.trim()) return;
 toast({
 title: "تم إرسال البلاغ",
 description: `تم إرسال البلاغ إلى فريق الدعم. السبب: ${incidentReason}`
 });
 setIncidentReason("");
 setShowIncidentForm(false);
 };

 const isDriver = user.role === "driver";
 const isAdmin = user.role === "admin";
 const isRider = user.role === "rider";

 return (
 <nav className="h-full flex flex-col bg-radar-bg">
 {/* Header - Radar Branding */}
 <div className="flex items-center justify-between p-5 bg-radar-abyss border-b border-white/[0.06] shrink-0">
 <Badge
 variant="outline"
 className="border-radar-teal/30 text-radar-teal bg-radar-teal/10 font-bold px-3 py-1 shadow-sm"
 >
 {isDriver
 ? "سائق"
 : isAdmin
 ? "مشرف"
 : "راكب"}
 </Badge>
 <div className="flex items-center gap-2">
 <h2 className="text-2xl font-black text-white tracking-widest drop-shadow-md">
 رادار
 </h2>
 <ShieldCheck className="w-7 h-7 text-radar-teal" />
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
 <div className="w-20 h-20 rounded-full bg-radar-abyss border-2 border-radar-teal/30 flex items-center justify-center mb-3 shadow-lg shadow-radar-teal/10">
 <UserCircle className="w-12 h-12 text-radar-teal" />
 </div>
 <h3 className="text-xl font-black text-white tracking-wide">
 {user.name || "مستخدم جديد"}
 </h3>
 <p className="text-sm text-radar-teal/80 mt-1 font-mono">
 {isAdmin ? "مشرف النظام" : user.phone}
 </p>
 </div>

 {isDriver && (
 <div className="space-y-6 max-w-sm mx-auto w-full px-5 pb-6 text-right" dir="rtl">
 {/* Online / Offline Sovereign Toggle */}
 <div className="bg-radar-abyss border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-3">
 <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-lg">
 <span className="text-xs font-black text-gray-300">حالة العمل</span>
 <span className={cn(
 "h-2.5 w-2.5 rounded-full animate-pulse",
 isOnline ? "bg-radar-teal shadow-[0_0_8px_var(--color-radar-teal)]" : "bg-red-500 shadow-[0_0_8px_var(--color-radar-red)]"
 )} />
 </div>

 <Button
 onClick={handleToggleOnline}
 className={cn(
 "w-full h-11 text-xs font-bold font-sans rounded-xl border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer",
 isOnline
 ? "bg-radar-teal/20 border-radar-teal/40 text-radar-teal hover:bg-radar-teal/30"
 : "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/30"
 )}
 >
 {isOnline ? "متاح لاستقبال الطلبات" : "في وضع الاستراحة"}
 </Button>
 </div>

 <DriverStatsCard user={user} />

 {/* Incident & Location Reporting Button */}
 <div className="bg-radar-abyss border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-3">
 <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-lg">
 <span className="text-xs font-black text-white">مركز السلامة</span>
 <span className="text-[9px] font-mono text-cyan-400">GPS ACTIVE</span>
 </div>

 {!showIncidentForm ? (
 <Button
 onClick={() => setShowIncidentForm(true)}
 variant="outline"
 className="w-full h-10 text-xs font-bold border-red-500/30 text-red-400 bg-red-950/10 hover:bg-red-950/20 rounded-xl"
 >
 إرسال بلاغ
 </Button>
 ) : (
 <div className="space-y-2 text-right">
 <span className="text-[10px] text-gray-400">سبب البلاغ:</span>
 <input
 value={incidentReason}
 onChange={(e) => setIncidentReason(e.target.value)}
 placeholder="اكتب السبب مثل: طريق مغلق أو عطل مفاجئ"
 className="w-full h-9 bg-black border border-red-500/40 rounded-lg text-xs px-2.5 text-white focus:outline-none focus:border-red-500 text-right"
 dir="rtl"
 />
 <div className="grid grid-cols-2 gap-2">
 <Button
 onClick={handleSendIncident}
 disabled={!incidentReason.trim()}
 className="bg-red-700 hover:bg-red-600 text-white font-bold h-8 text-[11px] rounded-lg cursor-pointer"
 >
 إرسال البلاغ
 </Button>
 <Button
 onClick={() => { setShowIncidentForm(false); setIncidentReason(""); }}
 variant="ghost"
 className="text-gray-400 hover:text-white h-8 text-[11px]"
 >
 إلغاء
 </Button>
 </div>
 </div>
 )}
 </div>

 <DriverActions />
 </div>
 )}

 {isAdmin && (
 <div className="space-y-3 px-5 pb-6">
 <div className="flex items-center justify-center gap-2 text-white/50 px-1 mb-2">
 <span className="text-sm font-bold tracking-wider">
 لوحة التحكم
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
 <div className="px-4 py-2 bg-radar-teal/10 border-y border-radar-teal/15">
 <div className="flex items-center justify-between">
 <span className="text-[10px] uppercase tracking-tighter text-radar-teal font-black">
 تقييم الحساب
 </span>
 <Badge
 variant="outline"
 className="text-[10px] border-radar-teal/40 text-radar-teal"
 >
 {calculateRiderRank(user.ratingSum, user.ratingCount)}
 </Badge>
 </div>
 <p className="text-xs text-white/70 mt-1">
 تقييمك جيد كراكب ملتزم.
 </p>
 </div>

 {user?.isBufferActive && user.lastTripBuffer && (
 <div className="mx-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg animate-pulse">
 <div className="flex items-center gap-2 mb-2 text-amber-400">
 <Clock className="w-4 h-4" />
 <span className="text-xs font-bold font-headline">
 تواصل بعد الرحلة (24 ساعة)
 </span>
 </div>
 <p className="text-[10px] text-white/60 mb-2">
 يمكنك التواصل مع سائق الرحلة الأخيرة عند الحاجة.
 </p>
 <Button
 size="sm"
 variant="outline"
 className="w-full h-7 text-[10px] border-amber-500/50 text-amber-400"
 asChild
 >
 <a href={`tel:${user.lastTripBuffer?.driverPhone}`}>
 اتصال بالسائق: {user.lastTripBuffer?.driverName}
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
 className="w-full justify-end gap-3 text-white hover:text-radar-teal hover:bg-radar-teal/10 border border-transparent hover:border-radar-teal/15 h-14 rounded-xl transition-all shadow-sm"
 >
 <span className="font-bold text-base">
 سجل الرحلات السابقة
 </span>
 <History className="w-5 h-5 text-radar-teal/70" />
 </Button>
 </a>
 <a href="#messages" className="block w-full">
 <Button
 variant="ghost"
 className="w-full justify-end gap-3 text-white hover:text-radar-teal hover:bg-radar-teal/10 border border-transparent hover:border-radar-teal/15 h-14 rounded-xl relative transition-all shadow-sm"
 >
 <span className="font-bold text-base">رسائل الرادار</span>
 <MessageSquare className="w-5 h-5 text-radar-teal/70" />
 </Button>
 </a>
 </div>

 <div className="px-5 mt-6">
 <span className="text-xs text-muted-foreground font-bold flex items-center justify-end gap-2">
 <Heart className="w-4 h-4 text-red-500" /> السائقون المفضلون
 </span>
 <RiderFavoriteDrivers />
 </div>
 </div>
 )}
 </ScrollArea>

 {/* Footer / Logout */}
 <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-radar-abyss border-t border-white/[0.06] mt-auto shrink-0 w-full text-center space-y-3">
 <div className="text-radar-text-sub text-xs tracking-wide font-sans text-center">
 منصة وساطة مستقلة لطلب الرحلات
 </div>
 <Button
 variant="destructive"
 className="w-full flex items-center justify-center gap-3 font-black tracking-widest text-lg h-14 bg-red-600/90 hover:bg-red-500 shadow-[0_0_15px_rgb(var(--radar-red-rgb)/0.3)] transition-all rounded-xl cursor-pointer"
 onClick={logout}
 >
 <span>تسجيل الخروج</span>
 <LogOut className="w-5 h-5" />
 </Button>
 </div>
 </nav>
 );
}
