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

const styles = {
  style59_1: "space-y-2",
  style61_2: "h-8 bg-muted/30 rounded-lg animate-pulse",
  style69_3: "text-xs text-center text-muted-foreground py-4",
  style76_4: "mt-2 space-y-2",
  style80_5: "text-sm py-2 px-3 bg-muted/30 rounded-lg border border-white/10 text-white/80 flex justify-between items-center",
  style82_6: "font-bold",
  style83_7: "flex items-center gap-2",
  style84_8: "text-xs capitalize",
  style89_9: "w-2 h-2 rounded-full",
  style135_10: "h-full flex flex-col bg-[#0A0F1D]",
  style137_11: "flex items-center justify-between p-5 bg-[#060B18] border-b border-white/[0.06] shrink-0",
  style140_12: "border-[#14B8A6]/30 text-[#14B8A6] bg-[#14B8A6]/10 font-bold px-3 py-1 shadow-sm",
  style148_13: "flex items-center gap-2",
  style149_14: "text-2xl font-black text-white tracking-widest drop-shadow-md",
  style152_15: "w-7 h-7 text-[#14B8A6]",
  style158_16: "h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full",
  style160_17: "w-6 h-6",
  style165_18: "flex-1 w-full",
  style167_19: "flex flex-col items-center mb-6 pt-6",
  style168_20: "w-20 h-20 rounded-full bg-[#060B18] border-2 border-[#14B8A6]/30 flex items-center justify-center mb-3 shadow-lg shadow-[#14B8A6]/10",
  style169_21: "w-12 h-12 text-[#14B8A6]",
  style171_22: "text-xl font-black text-white tracking-wide",
  style174_23: "text-sm text-[#14B8A6]/80 mt-1 font-mono",
  style180_24: "space-y-6 max-w-sm mx-auto w-full px-5 pb-6 text-right",
  style182_25: "bg-[#060B18] border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-3",
  style183_26: "flex justify-between items-center bg-black/40 p-1.5 rounded-lg",
  style184_27: "text-xs font-black text-gray-300",
  style186_28: "h-2.5 w-2.5 rounded-full animate-pulse",
  style187_29: "bg-[#14b8a6] shadow-[0_0_8px_#14b8a6]",
  style187_30: "bg-red-500 shadow-[0_0_8px_#ef4444]",
  style194_31: "w-full h-11 text-xs font-bold font-sans rounded-xl border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer",
  style196_32: "bg-[#14b8a6]/20 border-[#14b8a6]/40 text-[#14b8a6] hover:bg-[#14b8a6]/30",
  style197_33: "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/30",
  style207_34: "bg-[#060B18] border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-3",
  style208_35: "flex justify-between items-center bg-black/40 p-1.5 rounded-lg",
  style209_36: "text-xs font-black text-white",
  style210_37: "text-[9px] font-mono text-cyan-400",
  style217_38: "w-full h-10 text-xs font-bold border-red-500/30 text-red-400 bg-red-950/10 hover:bg-red-950/20 rounded-xl",
  style222_39: "space-y-2 text-right",
  style223_40: "text-[10px] text-gray-400",
  style228_41: "w-full h-9 bg-black border border-red-500/40 rounded-lg text-xs px-2.5 text-white focus:outline-none focus:border-red-500 text-right",
  style231_42: "grid grid-cols-2 gap-2",
  style235_43: "bg-red-700 hover:bg-red-600 text-white font-bold h-8 text-[11px] rounded-lg cursor-pointer",
  style242_44: "text-gray-400 hover:text-white h-8 text-[11px]",
  style256_45: "space-y-3 px-5 pb-6",
  style257_46: "flex items-center justify-center gap-2 text-white/50 px-1 mb-2",
  style258_47: "text-sm font-bold tracking-wider",
  style262_48: "text-center text-xs text-muted-foreground",
  style270_49: "space-y-6 max-w-sm mx-auto w-full",
  style271_50: "px-4 py-2 bg-[#14B8A6]/10 border-y border-[#14B8A6]/15",
  style272_51: "flex items-center justify-between",
  style273_52: "text-[10px] uppercase tracking-tighter text-[#14B8A6] font-black",
  style278_53: "text-[10px] border-[#14B8A6]/40 text-[#14B8A6]",
  style283_54: "text-xs text-white/70 mt-1",
  style289_55: "mx-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg animate-pulse",
  style290_56: "flex items-center gap-2 mb-2 text-amber-400",
  style291_57: "w-4 h-4",
  style292_58: "text-xs font-bold font-headline",
  style296_59: "text-[10px] text-white/60 mb-2",
  style302_60: "w-full h-7 text-[10px] border-amber-500/50 text-amber-400",
  style312_61: "px-5 space-y-3",
  style313_62: "flex items-center justify-end gap-2 text-white px-1 mb-2",
  style314_63: "text-sm font-bold tracking-wider",
  style318_64: "block w-full",
  style321_65: "w-full justify-end gap-3 text-white hover:text-[#14B8A6] hover:bg-[#14B8A6]/10 border border-transparent hover:border-[#14B8A6]/15 h-14 rounded-xl transition-all shadow-sm",
  style323_66: "font-bold text-base",
  style326_67: "w-5 h-5 text-[#14B8A6]/70",
  style329_68: "block w-full",
  style332_69: "w-full justify-end gap-3 text-white hover:text-[#14B8A6] hover:bg-[#14B8A6]/10 border border-transparent hover:border-[#14B8A6]/15 h-14 rounded-xl relative transition-all shadow-sm",
  style334_70: "font-bold text-base",
  style335_71: "w-5 h-5 text-[#14B8A6]/70",
  style340_72: "px-5 mt-6",
  style341_73: "text-xs text-muted-foreground font-bold flex items-center justify-end gap-2",
  style342_74: "w-4 h-4 text-red-500",
  style351_75: "p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-[#060B18] border-t border-white/[0.06] mt-auto shrink-0 w-full text-center space-y-3",
  style352_76: "text-[#94A3B8] text-xs tracking-wide font-sans text-center",
  style357_77: "w-full flex items-center justify-center gap-3 font-black tracking-widest text-lg h-14 bg-red-600/90 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all rounded-xl cursor-pointer",
  style361_78: "w-5 h-5",
} as const;


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
 <div className={styles.style59_1}>
 {[...Array(2)].map((_, i) => (
 <div key={i} className={styles.style61_2} />
 ))}
 </div>
 );
 }

 if (nearbyFavorites.length === 0) {
 return (
 <p className={styles.style69_3}>
 لا يوجد سائقون مفضلون بالقرب منك حالياً.
 </p>
 );
 }

 return (
 <div className={styles.style76_4}>
 {nearbyFavorites.map((driver) => (
 <div
 key={driver.uid}
 className={styles.style80_5}
 >
 <span className={styles.style82_6}>{driver.name}</span>
 <div className={styles.style83_7}>
 <span className={styles.style84_8}>
 {driver.status || "غير متاح"}
 </span>
 <div
 className={cn(
 styles.style89_9,
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
 <nav className={styles.style135_10}>
 {/* Header - Radar Branding */}
 <div className={styles.style137_11}>
 <Badge
 variant="outline"
 className={styles.style140_12}
 >
 {isDriver
 ? "سائق"
 : isAdmin
 ? "مشرف"
 : "راكب"}
 </Badge>
 <div className={styles.style148_13}>
 <h2 className={styles.style149_14}>
 رادار
 </h2>
 <ShieldCheck className={styles.style152_15} />
 </div>
 <SheetClose asChild>
 <Button
 variant="ghost"
 size="icon"
 className={styles.style158_16}
 >
 <X className={styles.style160_17} />
 </Button>
 </SheetClose>
 </div>

 <ScrollArea className={styles.style165_18} type="scroll">
 {/* Profile Summary */}
 <div className={styles.style167_19}>
 <div className={styles.style168_20}>
 <UserCircle className={styles.style169_21} />
 </div>
 <h3 className={styles.style171_22}>
 {user.name || "مستخدم جديد"}
 </h3>
 <p className={styles.style174_23}>
 {isAdmin ? "مشرف النظام" : user.phone}
 </p>
 </div>

 {isDriver && (
 <div className={styles.style180_24} dir="rtl">
 {/* Online / Offline Sovereign Toggle */}
 <div className={styles.style182_25}>
 <div className={styles.style183_26}>
 <span className={styles.style184_27}>حالة العمل</span>
 <span className={cn(
 styles.style186_28,
 isOnline ? styles.style187_29 : styles.style187_30
 )} />
 </div>

 <Button
 onClick={handleToggleOnline}
 className={cn(
 styles.style194_31,
 isOnline
 ? styles.style196_32
 : styles.style197_33
 )}
 >
 {isOnline ? "متاح لاستقبال الطلبات" : "في وضع الاستراحة"}
 </Button>
 </div>

 <DriverStatsCard user={user} />

 {/* Incident & Location Reporting Button */}
 <div className={styles.style207_34}>
 <div className={styles.style208_35}>
 <span className={styles.style209_36}>مركز السلامة</span>
 <span className={styles.style210_37}>GPS ACTIVE</span>
 </div>

 {!showIncidentForm ? (
 <Button
 onClick={() => setShowIncidentForm(true)}
 variant="outline"
 className={styles.style217_38}
 >
 إرسال بلاغ
 </Button>
 ) : (
 <div className={styles.style222_39}>
 <span className={styles.style223_40}>سبب البلاغ:</span>
 <input
 value={incidentReason}
 onChange={(e) => setIncidentReason(e.target.value)}
 placeholder="اكتب السبب مثل: طريق مغلق أو عطل مفاجئ"
 className={styles.style228_41}
 dir="rtl"
 />
 <div className={styles.style231_42}>
 <Button
 onClick={handleSendIncident}
 disabled={!incidentReason.trim()}
 className={styles.style235_43}
 >
 إرسال البلاغ
 </Button>
 <Button
 onClick={() => { setShowIncidentForm(false); setIncidentReason(""); }}
 variant="ghost"
 className={styles.style242_44}
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
 <div className={styles.style256_45}>
 <div className={styles.style257_46}>
 <span className={styles.style258_47}>
 لوحة التحكم
 </span>
 </div>
 <p className={styles.style262_48}>
 تم دمج جميع أدوات التحكم في الواجهة الرئيسية. استخدم التبويبات
 للتنقل بين شاشات المراقبة والتحكم.
 </p>
 </div>
 )}

 {isRider && (
 <div className={styles.style270_49}>
 <div className={styles.style271_50}>
 <div className={styles.style272_51}>
 <span className={styles.style273_52}>
 تقييم الحساب
 </span>
 <Badge
 variant="outline"
 className={styles.style278_53}
 >
 {calculateRiderRank(user.ratingSum, user.ratingCount)}
 </Badge>
 </div>
 <p className={styles.style283_54}>
 تقييمك جيد كراكب ملتزم.
 </p>
 </div>

 {user?.isBufferActive && user.lastTripBuffer && (
 <div className={styles.style289_55}>
 <div className={styles.style290_56}>
 <Clock className={styles.style291_57} />
 <span className={styles.style292_58}>
 تواصل بعد الرحلة (24 ساعة)
 </span>
 </div>
 <p className={styles.style296_59}>
 يمكنك التواصل مع سائق الرحلة الأخيرة عند الحاجة.
 </p>
 <Button
 size="sm"
 variant="outline"
 className={styles.style302_60}
 asChild
 >
 <a href={`tel:${user.lastTripBuffer?.driverPhone}`}>
 اتصال بالسائق: {user.lastTripBuffer?.driverName}
 </a>
 </Button>
 </div>
 )}

 <div className={styles.style312_61}>
 <div className={styles.style313_62}>
 <span className={styles.style314_63}>
 العمليات
 </span>
 </div>
 <a href="#history" className={styles.style318_64}>
 <Button
 variant="ghost"
 className={styles.style321_65}
 >
 <span className={styles.style323_66}>
 سجل الرحلات السابقة
 </span>
 <History className={styles.style326_67} />
 </Button>
 </a>
 <a href="#messages" className={styles.style329_68}>
 <Button
 variant="ghost"
 className={styles.style332_69}
 >
 <span className={styles.style334_70}>رسائل الرادار</span>
 <MessageSquare className={styles.style335_71} />
 </Button>
 </a>
 </div>

 <div className={styles.style340_72}>
 <span className={styles.style341_73}>
 <Heart className={styles.style342_74} /> السائقون المفضلون
 </span>
 <RiderFavoriteDrivers />
 </div>
 </div>
 )}
 </ScrollArea>

 {/* Footer / Logout */}
 <div className={styles.style351_75}>
 <div className={styles.style352_76}>
 منصة وساطة مستقلة لطلب الرحلات
 </div>
 <Button
 variant="destructive"
 className={styles.style357_77}
 onClick={logout}
 >
 <span>تسجيل الخروج</span>
 <LogOut className={styles.style361_78} />
 </Button>
 </div>
 </nav>
 );
}
