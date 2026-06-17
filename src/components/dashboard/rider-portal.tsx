"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAtomicHandshake } from "@/hooks/use-atomic-handshake";
import {
  MapPin,
  Search,
  Shield,
  Sparkles,
  Lock,
  Timer,
  Car,
  Phone,
  Star,
  RefreshCw,
  AlertTriangle,
  Compass,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RiderPortal() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Simulated GPS Coordinates for Jordan's capital (Amman) by default
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 31.953,
    lng: 35.911,
  });

  const [pickupText, setPickupText] = useState("لواء وادي السير - الدوار الثامن");
  const [dropoffText, setDropoffText] = useState("لواء مأدبا - بوابة السياح");
  const [distance, setDistance] = useState<number>(3.8); // 3.8 KM estimate

  // Bind Atomic Handshake Core
  const {
    nearbyDrivers,
    isScanning,
    isLocked,
    frozenPrice,
    frozenH3,
    countdown,
    scanGeoBubble,
    freezePricing,
    executeAtomicHandshake,
  } = useAtomicHandshake(user, coords);

  // Scan immediately when coordinate loads
  useEffect(() => {
    scanGeoBubble();
  }, [scanGeoBubble]);

  // Handle Freezing pricing
  const handleCalculateAndFreeze = () => {
    const computedPrice = freezePricing(distance);
    if (computedPrice) {
      toast({
        title: "❄️ تم تجميد السعر الجغرافي",
        description: `تم تثبيت قيمة الرحلة بقيمة [${computedPrice} د.أ] بناءً على تذبذب خلية H3 [${frozenH3 || '9-Res'}].`,
      });
    }
  };

  // Trigger atomic handshake
  const handleInitiateRide = async (driverId: string, driverName: string) => {
    if (!frozenPrice) {
      toast({
        variant: "destructive",
        title: "خطأ في السعر",
        description: "يرجى حساب وتجميد السعر مسبقًا لتفعيل مصافحة الخلية السداسية.",
      });
      return;
    }

    const tripId = await executeAtomicHandshake(
      driverId,
      driverName,
      pickupText,
      dropoffText,
      distance
    );

    if (tripId) {
      // Success triggers scan update
      scanGeoBubble();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-right pb-10" dir="rtl">
      {/* Header section with sovereign insignia */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 via-[#090e1a] to-slate-950 p-6 rounded-3xl border border-[#14b8a6]/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="space-y-1.5Packed">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] animate-pulse">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">محطة الركاب السيادية</h1>
          </div>
          <p className="text-xs text-slate-400">إدارة الرادار، المصافحة الذرية، وتجميد السعر في خلية H3 السداسية.</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-[#14b8a6]/30 bg-[#14b8a6]/5 text-[#14b8a6] leading-none uppercase font-mono text-[9px] py-1 px-2.5">
            بروتوكول المصافحة الذرية [075]
          </Badge>
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-500 text-[9px] py-1 px-2.5">
            مستوى الفرز: 1.5 كم
          </Badge>
        </div>
      </div>

      {/* Main Grid layout with Controls & Scan Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Route inputs and H3 freeze engine */}
        <div className="md:col-span-5 space-y-6">
          <Card className="bg-[#090e1a]/95 border border-[#14b8a6]/20 rounded-2xl shadow-xl">
            <CardHeader className="p-5 border-b border-white/[0.04] pb-3">
              <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#14b8a6]" />
                محدد المسار والخلية السداسية
              </CardTitle>
              <CardDescription className="text-[10px] text-gray-500">حساب حركية دقيقة لمنع SURGES العشوائية</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Pickup location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">نقطة الانطلاق (الوتد الملاحي):</label>
                <div className="relative">
                  <Input
                    value={pickupText}
                    onChange={(e) => setPickupText(e.target.value)}
                    className="w-full bg-black/60 border-white/10 text-white rounded-xl pr-3 text-xs text-right focus:border-[#14b8a6]"
                  />
                </div>
              </div>

              {/* Dropoff location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">وجهة العبور النهائية:</label>
                <Input
                  value={dropoffText}
                  onChange={(e) => setDropoffText(e.target.value)}
                  className="w-full bg-black/60 border-white/10 text-white rounded-xl pr-3 text-xs text-right focus:border-[#14b8a6]"
                />
              </div>

              {/* Distance Estimate Input for testing custom mileage */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">المسافة المقدرة بالمتر (KM):</label>
                <Input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDistance(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-black/60 border-white/10 text-white rounded-xl pr-3 font-mono text-center text-xs focus:border-[#14b8a6]"
                />
              </div>

              {/* Pricing Freeze Block containing the H3-level lock countdown */}
              <div className="border border-[#14b8a6]/25 bg-[#14b8a6]/5 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold">تسعير الخلية الملاحية:</span>
                  {frozenPrice ? (
                    <Badge variant="outline" className="border-[#14b8a6] text-[#14b8a6] font-mono">
                      {frozenH3 || "892f1a..."}
                    </Badge>
                  ) : (
                    <span className="text-gray-500 text-[10px]">لم يتم التجميد</span>
                  )}
                </div>

                {frozenPrice ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-white font-mono">{frozenPrice}</span>
                      <span className="text-[10px] text-gray-400 mr-1.5">دينار أردني</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-xs text-amber-500">
                      <Timer className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>{countdown} ثانية</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 leading-normal">
                    اضغط على الزر أدناه لتجميد وحماية السعر من التقلبات العشوائية بمقدار 120 ثانية كاملة.
                  </p>
                )}

                <Button
                  onClick={handleCalculateAndFreeze}
                  className="w-full bg-cyan-950/60 border border-[#14b8a6]/40 hover:bg-[#14b8a6]/25 text-[#14b8a6] text-xs font-bold py-2 h-9 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {frozenPrice ? "تحديث وتجديد التجميد ❄️" : "حساب وتجميد قيمة العبور"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Geodesic scan radar results */}
        <div className="md:col-span-7 space-y-6">
          <Card className="bg-[#090e1a]/95 border border-white/[0.04] rounded-2xl shadow-xl flex-1 flex flex-col">
            <CardHeader className="p-5 border-b border-white/[0.04] flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#14b8a6]" />
                  رادار الفرز الجغرافي (1.5 كم)
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">الكباتن المتواجدين داخل الفقاعة الجيوديسية الحالية</CardDescription>
              </div>

              <Button
                size="sm"
                onClick={scanGeoBubble}
                disabled={isScanning}
                className="bg-black/40 border border-[#14b8a6]/35 text-[#14b8a6] text-xs leading-none h-8 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {isScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                تحديث
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 max-h-[440px] overflow-y-auto">
              {isScanning ? (
                <div className="text-center py-12 space-y-3">
                  <LoaderIcon className="w-8 h-8 text-[#14b8a6] animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 font-mono">يتم فحص الميدان ومقاطعة البيانات الجيوديسية...</p>
                </div>
              ) : nearbyDrivers.length > 0 ? (
                <div className="space-y-3">
                  {nearbyDrivers.map((drv) => (
                    <div
                      key={drv.uid}
                      className="p-4 bg-black/40 hover:bg-black/60 rounded-xl border border-white/[0.05] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                    >
                      {/* Driver visual profiling */}
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6] shrink-0 font-bold">
                          {drv.name.slice(0, 1)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-[12px]">{drv.name}</h4>
                            <Badge className="bg-cyan-950 text-cyan-400 hover:bg-cyan-950 text-[8px] font-bold border border-cyan-800/30 font-sans leading-none py-0.5 px-2">
                              {drv.rank}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-gray-400 leading-none">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {drv.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-600">|</span>
                            <span className="font-mono">تبعد: {drv.distanceKm} كم</span>
                          </div>

                          {/* Vehicle make & Year */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Car className="w-3 h-3 text-gray-400" />
                            <span>
                              {drv.vehicle?.make || "سيارة"} {drv.vehicle?.modelYear || "حديثة"} - لوحة [
                              <strong className="text-gray-300 font-mono">{drv.vehicle?.plate || "سياج-Jordan"}</strong>]
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Connect controls CTA with concurrent block safeguard */}
                      <Button
                        onClick={() => handleInitiateRide(drv.uid, drv.name)}
                        disabled={isLocked}
                        className={cn(
                          "sm:w-auto w-full h-9 px-3 text-[11px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all",
                          isLocked
                            ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5"
                            : "bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                        )}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3 h-3 animate-pulse" />
                            حظر تنفيذي...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 ml-1" />
                            مصافحة وطلب 🤝
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 bg-black/20 rounded-2xl border border-white/[0.02]">
                  <AlertTriangle className="w-6 h-6 text-amber-500/60 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-300">فقاعة الفرز خالية</h4>
                    <p className="text-[10px] text-gray-500 leading-normal max-w-xs mx-auto">
                      لم نجد فرساناً بجوارك حالياً في محيط الـ 1.5 كم. يرجى تجربة النقر على "تحديث" للمحاولة مجدداً.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety and non-proliferation sovereign disclaimer */}
      <div className="p-4 rounded-xl bg-[#090e1a] border border-[#14b8a6]/25 text-[10px] text-gray-400 leading-normal flex items-start text-right gap-2 shadow-sm">
        <Shield className="w-4 h-4 text-[#14b8a6] shrink-0 mt-0.5 animate-pulse" />
        <p>
          <strong>بروتوكول مأمون الموحد:</strong> تخضع رحلات محطة الركاب لمراقبة المقصلة التقنية ونظام النبض الموجه، مع عزل كامل لمعاملات التسعير لمنع المضاربة والسرقات العشوائية للبيانات. يرجى التمسك بالتسعير المجمد للحفاظ على التوازن المالي في الميدان.
        </p>
      </div>
    </div>
  );
}

// Inline Loader component helper
function LoaderIcon(props: React.JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
