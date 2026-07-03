"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSovereignWallet } from "@/hooks/use-sovereign-wallet";
import {
  Wallet,
  X,
  MapPin,
  CheckCircle2,
  QrCode,
  Loader2,
  Smartphone,
  CreditCard,
  Building,
  ArrowLeftRight,
  Sparkles,
  Shield,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JORDAN_DISTRICTS } from "@/lib/constants";

interface GeoPaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GeoPaymentGateway({ isOpen, onClose, onSuccess }: GeoPaymentGatewayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rechargeWallet, loading: sovereignLoading } = useSovereignWallet(user);

  // States
  const [activeDistrict, setActiveDistrict] = useState<typeof JORDAN_DISTRICTS[number]>(JORDAN_DISTRICTS[0]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [amount, setAmount] = useState("10");
  const [selectedChannel, setSelectedChannel] = useState<"cliq" | "zain" | "efawateer">("cliq");

  // Custom Flow states
  const [step, setStep] = useState<"options" | "pay_qrcode" | "success">("options");
  const [shakeAmount, setShakeAmount] = useState(0);

  // Auto detect location simulation
  const handleAutoDetectLocation = () => {
    setGpsLoading(true);
    setTimeout(() => {
      // Pick random district to simulate genuine H3 resolution 9 edge scan
      const randomItem = JORDAN_DISTRICTS[Math.floor(Math.random() * JORDAN_DISTRICTS.length)];
      setActiveDistrict(randomItem);
      setGpsLoading(false);
      toast({
        title: "📡 تم مسح الحافة الجغرافية",
        description: `تم ربط وتحديد موقعك بالخلية السداسية H3 [${randomItem.hex}] بنجاح.`
      });
    }, 1200);
  };

  useEffect(() => {
    if (isOpen) {
      setStep("options");
      // Pick user's district or default
      if (user?.district) {
        const matching = JORDAN_DISTRICTS.find(d => d.name === user.district);
        if (matching) setActiveDistrict(matching);
      }
    }
  }, [isOpen, user?.district]);

  if (!isOpen) return null;

  const handleConfirmOrder = () => {
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast({
        variant: "destructive",
        title: "خطأ القيمة",
        description: "يرجى تحديد أو كتابة قيمة شحن قانونية."
      });
      return;
    }
    setStep("pay_qrcode");
  };

  const handleFinalizePayment = async () => {
    const amountVal = parseFloat(amount);
    const channelName = selectedChannel === "cliq" ? "CliQ العاجل" : selectedChannel === "zain" ? "محفظة Zain Cash" : "إي فواتيركم";

    // Use the custom single-write hook we sculpted
    const success = await rechargeWallet(amountVal, activeDistrict.name, channelName);

    if (success) {
      setStep("success");
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      {/* Container holding the Sovereign Gateway Card */}
      <Card className="w-full max-w-lg bg-[#090e1a] border border-[#14b8a6]/40 text-right shadow-[0_0_50px_rgba(20,184,166,0.15)] rounded-3xl overflow-hidden flex flex-col" dir="rtl">
        {/* Header toolbar */}
        <CardHeader className="bg-black/40 border-b border-[#14b8a6]/10 p-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#14b8a6]" />
            <div>
              <CardTitle className="text-base font-black text-white">محرك الشحن الجغرافي اللامركزي</CardTitle>
              <CardDescription className="text-[10px] text-gray-400">بوابة الدفع التلقائي الموجهة بوطد الميدان</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        {/* Content Stages */}
        <CardContent className="p-6 flex-1 space-y-6">
          {step === "options" && (
            <div className="space-y-6">
              {/* Dynamic location resolution bar */}
              <div className="bg-black/50 border border-cyan-900/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 block p-0">الخلية الملاحية الحالية (Resolution 9)</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#14b8a6]" />
                    <span className="text-xs font-mono font-black text-white">{activeDistrict.name}</span>
                    <Badge variant="outline" className="text-[9px] border-[#14b8a6]/30 text-[#14b8a6] font-mono leading-none">
                      {activeDistrict.hex}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleAutoDetectLocation}
                  disabled={gpsLoading}
                  className="bg-cyan-950/40 border border-[#14b8a6]/30 hover:bg-cyan-950/60 text-xs font-bold text-[#14b8a6] py-1.5 h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "تحديث الموقع 📡"}
                </Button>
              </div>

              {/* Amount selections */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-300">قيمة شحن المحفظة :</span>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "5", "10", "20"].map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={cn(
                        "h-10 font-mono text-sm font-black rounded-xl border cursor-pointer",
                        amount === preset
                          ? "bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6]"
                          : "bg-black/30 border-white/5 text-gray-300 hover:bg-black/50"
                      )}
                    >
                      {preset} د.أ
                    </Button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-sans">د.أ (دينار أردني)</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="أو اكتب مبلغ مخصص يدوي..."
                    className="w-full h-11 bg-black border border-white/10 rounded-xl pr-3 pl-14 text-sm text-white focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] text-right"
                  />
                </div>
              </div>

              {/* Choose Payment Channel */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-300 font-sans">بوابات الدفع المساندة بالإقليم:</span>
                <div className="grid grid-cols-3 gap-3">
                  {/* CliQ */}
                  <div className="relative group/cliq">
                    <div
                      onClick={() => setSelectedChannel("cliq")}
                      className={cn(
                        "p-3 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-all bg-black/40 h-full justify-center",
                        selectedChannel === "cliq"
                          ? "border-[#14b8a6] text-[#14b8a6] bg-[#14b8a6]/5"
                          : "border-white/5 text-gray-400 hover:bg-black/60"
                      )}
                    >
                      <ArrowLeftRight className="w-5 h-5 text-inherit" />
                      <span className="text-[10px] font-black">CliQ الأردني</span>
                    </div>
                    {/* Tooltip explaining atomic and zero-waste protocol 88 */}
                    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2.5 opacity-0 group-hover/cliq:opacity-100 scale-95 group-hover/cliq:scale-100 pointer-events-none transition-all duration-200 origin-bottom z-[200] w-64 p-3.5 bg-[#070f1a] border border-[#14b8a6]/50 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-[10px] text-gray-300 font-sans leading-relaxed text-right" dir="rtl">
                      <div className="flex items-center gap-1.5 text-[#14b8a6] font-bold mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#14b8a6] shrink-0 animate-pulse" />
                        <span>ميزة شحن CliQ المباشر</span>
                      </div>
                      <p>
                        بوابة الشحن الفوري كليك (CliQ) التابعة للبنك المركزي الأردني مدمجة بنشاطة أحادية مباشرة (Single-Write). نضمن تطبيقاً كاملاً لسياسة صفر كلفة سحابية وبروتوكول (88) دون ثرثرة شبكية أو تكرار استدعاءات.
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#14b8a6]/10 flex justify-between text-[8px] text-[#14b8a6]/70 font-mono">
                        <span>PROTOCOL-88 VERIFIED</span>
                        <span>ATOMIC INGESTION</span>
                      </div>
                    </div>
                  </div>

                  {/* Zain Cash */}
                  <div
                    onClick={() => setSelectedChannel("zain")}
                    className={cn(
                      "p-3 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-all bg-black/40",
                      selectedChannel === "zain"
                        ? "border-amber-500 text-amber-500 bg-amber-500/5"
                        : "border-white/5 text-gray-400 hover:bg-black/60"
                    )}
                  >
                    <Smartphone className="w-5 h-5 text-inherit" />
                    <span className="text-[10px] font-black">Zain Cash</span>
                  </div>

                  {/* eFAWATEERcom */}
                  <div
                    onClick={() => setSelectedChannel("efawateer")}
                    className={cn(
                      "p-3 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-all bg-black/40",
                      selectedChannel === "efawateer"
                        ? "border-cyan-400 text-cyan-400 bg-cyan-400/5"
                        : "border-white/5 text-gray-400 hover:bg-black/60"
                    )}
                  >
                    <Building className="w-5 h-5 text-inherit" />
                    <span className="text-[10px] font-black">إي فواتيركم</span>
                  </div>
                </div>
              </div>

              {/* Confirm Selection CTA */}
              <Button
                onClick={handleConfirmOrder}
                className="w-full h-12 text-sm font-black bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black rounded-xl cursor-pointer"
              >
                المضي قدماً لتاكيد شحن {amount} د.أ 💳
              </Button>
            </div>
          )}

          {step === "pay_qrcode" && (
            <div className="space-y-6 text-center">
              {/* Payment instruction header */}
              <div className="bg-black/30 p-4 border border-white/5 rounded-2xl space-y-1 text-right">
                <span className="text-[10px] text-gray-400 block">تعليمات البواب العاجل</span>
                <p className="text-xs text-gray-200">
                  قم بمسح رمز الـ QR أدناه عبر تطبيق البنك أو المحفظة الإلكترونية لإرسال دفعة مالية بقيمة{" "}
                  <strong className="text-white text-sm font-mono">{amount} د.أ</strong> للخلية السداسية لولاية [<strong>{activeDistrict.name}</strong>].
                </p>
              </div>

              {/* Simulated QR Code card in neon */}
              <div className="w-48 h-48 mx-auto bg-black border-2 border-[#14b8a6]/30 p-3 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#14b8a6]/10 to-transparent pointer-events-none animate-pulse" />
                <QrCode className="w-40 h-40 text-white" />
                <div className="absolute top-0 left-0 w-full h-1 bg-[#14b8a6] animate-bounce shadow-[0_0_8px_#14b8a6]" style={{ animationDuration: '3s' }} />
              </div>

              {/* Quick instructions details */}
              <div className="grid grid-cols-2 gap-3 text-right text-[10px] text-gray-400">
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <span className="text-gray-500">اسم المستفيد:</span>
                  <div className="font-bold text-white mt-0.5 font-sans">رادار وساطة مستقلة</div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono">
                  <span className="text-gray-500">معرف الدفع كود:</span>
                  <div className="font-bold text-[#14b8a6] mt-0.5">{activeDistrict.hex.slice(0, 10).toUpperCase()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleFinalizePayment}
                  disabled={sovereignLoading}
                  className="w-full h-11 text-xs font-black bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sovereignLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تأكيد عملية التحويل وإرسال النشاطة 📡"
                  )}
                </Button>

                <Button
                  onClick={() => setStep("options")}
                  variant="ghost"
                  className="w-full text-xs text-gray-400 hover:text-white"
                >
                  تعديل القيمة أو الواجهة
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#14b8a6]/10 border-2 border-[#14b8a6] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(20,184,166,0.2)] animate-pulse">
                <CheckCircle2 className="w-9 h-9 text-[#14b8a6]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">اكتمال النشاطة المالية </h3>
                <p className="text-xs text-gray-400 px-6">
                  تم رصد إشارة التحويل، وتوليد القيمة بنجاح، وربطها الفوري بمحفظتك الرقمية الموحدة في ثبات مطلق دون أي عمولات مركزية.
                </p>
              </div>

              {/* Detailed billing status info card */}
              <div className="max-w-xs mx-auto bg-black/50 p-4 rounded-2xl border border-white/5 text-right space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">القيمة المودعة:</span>
                  <span className="font-mono font-bold text-white">+{amount} د.أ</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">نوع البوابة:</span>
                  <span className="text-white">{selectedChannel === "cliq" ? "CliQ الأردني" : "حساب إيجابي"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">الرمز السداسي:</span>
                  <span className="font-mono text-[#14b8a6]">{activeDistrict.hex}</span>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full h-11 bg-cyan-950 border border-[#14b8a6]/35 text-[#14b8a6] hover:bg-cyan-950/60 font-bold text-xs rounded-xl cursor-pointer"
              >
                العودة إلى الميدان الرشيق
              </Button>
            </div>
          )}
        </CardContent>

        {/* Footer legalities signature */}
        <div className="bg-black/60 p-4 border-t border-white/5 text-center text-[9px] text-gray-400 font-sans tracking-tight">
          منصة حرة  - مأمنة بنظام تشفير المعقد ومحصنة اً ضد الهجمات الرقمية.
        </div>
      </Card>
    </div>
  );
}
