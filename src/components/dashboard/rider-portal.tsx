"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Car,
  Compass,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Star,
  Timer,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useAtomicHandshake } from "@/hooks/use-atomic-handshake";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function RiderPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("riderDashboard.portal");

  const [coords] = useState<{ lat: number; lng: number }>({
    lat: 31.953,
    lng: 35.911,
  });
  const [pickupText, setPickupText] = useState<string>(t('pickupDefault'));
  const [dropoffText, setDropoffText] = useState<string>(t('dropoffDefault'));
  const [distance, setDistance] = useState<number>(3.8);

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

  useEffect(() => {
    scanGeoBubble();
  }, [scanGeoBubble]);

  const handleCalculateAndFreeze = () => {
    const result = freezePricing(distance);
    if (result) {
      toast({
        title: t('frozenToastTitle'),
        description: `${t('frozenToastDescription')}: ${result.price} ${t('currency')}.`,
      });
    }
  };

  const handleInitiateRide = async (driverId: string, driverName: string) => {
    if (!frozenPrice) {
      toast({
        variant: "destructive",
        title: t('priceRequiredTitle'),
        description: t('priceRequiredDescription'),
      });
      return;
    }

    const tripId = await executeAtomicHandshake(driverId, driverName, pickupText, dropoffText, distance);
    if (tripId) {
      scanGeoBubble();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10 text-right" dir="rtl">
      <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/70 backdrop-blur-xl p-5 shadow-xl sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-[#14B8A6]/10 p-1.5 text-[#14B8A6]">
              <Compass className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-white">{t('title')}</h1>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-slate-400">{t('description')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#14B8A6]/30 bg-[#14B8A6]/5 px-2.5 py-1 text-[9px] text-[#14B8A6]">
            {t('protocol')}
          </Badge>
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[9px] text-amber-500">
            {t('range')}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <section className="space-y-6 md:col-span-5">
          <Card className="rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/80 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-white/10 p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black text-white">
                <MapPin className="h-4 w-4 text-[#14B8A6]" />
                {t('routeCard')}
              </CardTitle>
              <CardDescription className="text-[10px] text-gray-500">{t('routeDescription')}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">{t('pickup')}</label>
                <Input
                  value={pickupText}
                  onChange={(event) => setPickupText(event.target.value)}
                  className="w-full rounded-xl border-white/10 bg-black/60 pr-3 text-right text-xs text-white focus:border-[#14B8A6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">{t('dropoff')}</label>
                <Input
                  value={dropoffText}
                  onChange={(event) => setDropoffText(event.target.value)}
                  className="w-full rounded-xl border-white/10 bg-black/60 pr-3 text-right text-xs text-white focus:border-[#14B8A6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">{t('distance')}</label>
                <Input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(event) => {
                    const val = parseFloat(event.target.value);
                    setDistance(Number.isNaN(val) ? 0 : val);
                  }}
                  className="w-full rounded-xl border-white/10 bg-black/60 pr-3 text-center font-mono text-xs text-white focus:border-[#14B8A6]"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/5 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-400">{t('pricing')}</span>
                  {frozenPrice ? (
                    <Badge variant="outline" className="border-[#14B8A6] font-mono text-[#14B8A6]">
                      {frozenH3 || "H3"}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-gray-500">{t('notFrozen')}</span>
                  )}
                </div>

                {frozenPrice ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-white">{frozenPrice}</span>
                      <span className="mr-1.5 text-[10px] text-gray-400">{t('currency')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-xs text-amber-500">
                      <Timer className="h-3.5 w-3.5" />
                      <span>
                        {countdown} {t('seconds')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] leading-normal text-gray-400">{t('freezeHelp')}</p>
                )}

                <Button
                  onClick={handleCalculateAndFreeze}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 py-2 text-xs font-bold text-[#14B8A6] hover:bg-[#14B8A6]/20"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {frozenPrice ? t('refreshFreezeButton') : t('freezeButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6 md:col-span-7">
          <Card className="flex flex-1 flex-col rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/80 backdrop-blur-xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-black text-white">
                  <Search className="h-4 w-4 text-[#14B8A6]" />
                  {t('nearbyDrivers')}
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">{t('nearbyDescription')}</CardDescription>
              </div>

              <Button
                size="sm"
                onClick={scanGeoBubble}
                disabled={isScanning}
                className="flex h-8 items-center gap-1 rounded-lg border border-[#14B8A6]/35 bg-black/40 px-2.5 text-xs text-[#14B8A6]"
              >
                <RefreshCw className={cn("h-3 w-3", isScanning && "animate-spin")} />
                {t('refresh')}
              </Button>
            </CardHeader>

            <CardContent className="max-h-[440px] space-y-4 overflow-y-auto p-5">
              {isScanning ? (
                <div className="space-y-3 py-12 text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#14B8A6]" />
                  <p className="text-xs text-gray-400">{t('scanning')}</p>
                </div>
              ) : nearbyDrivers.length > 0 ? (
                <div className="space-y-3">
                  {nearbyDrivers.map((driver) => (
                    <article
                      key={driver.uid}
                      className="flex flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs transition-all hover:bg-black/60 sm:flex-row sm:items-center"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#14B8A6]/20 bg-[#14B8A6]/10 font-bold text-[#14B8A6]">
                          {driver.name.slice(0, 1)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[12px] font-extrabold text-white">{driver.name}</h4>
                            <Badge className="border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-2 py-0.5 text-[8px] font-bold leading-none text-[#14B8A6] hover:bg-[#14B8A6]/15">
                              {driver.rank}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] leading-none text-gray-400">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {driver.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-600">|</span>
                            <span className="font-mono">
                              {t('distanceLabel')}: {driver.distanceKm} {t('km')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Car className="h-3 w-3 text-gray-400" />
                            <span>
                              {driver.vehicle?.make || t('car')} {driver.vehicle?.modelYear || ""}
                              {" - "}
                              {t('plate')} [
                              <strong className="font-mono text-gray-300">{driver.vehicle?.plate || "-"}</strong>]
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleInitiateRide(driver.uid, driver.name)}
                        disabled={isLocked}
                        className={cn(
                          "flex h-9 w-full items-center justify-center gap-1 rounded-lg px-3 text-[11px] font-black transition-all sm:w-auto",
                          isLocked
                            ? "cursor-not-allowed border border-white/10 bg-slate-800 text-slate-400"
                            : "bg-[#14B8A6] text-black hover:bg-[#14B8A6]/90",
                        )}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="h-3 w-3 animate-pulse" />
                            {t('locked')}
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            {t('request')}
                          </>
                        )}
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 py-12 text-center">
                  <AlertTriangle className="mx-auto h-6 w-6 text-amber-500/70" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-300">{t('emptyTitle')}</h4>
                    <p className="mx-auto max-w-xs text-[10px] leading-normal text-gray-500">{t('emptyDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[#14B8A6]/25 bg-[#0F172A]/60 p-4 text-right text-[10px] leading-normal text-gray-400 shadow-sm">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]" />
        <p>{t('safety')}</p>
      </div>
    </div>
  );
}
