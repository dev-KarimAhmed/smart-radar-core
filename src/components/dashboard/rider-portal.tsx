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

const styles = {
  style83_1: "mx-auto w-full max-w-4xl space-y-6 pb-10 text-right",
  style84_2: "flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/70 backdrop-blur-xl p-5 shadow-xl sm:flex-row sm:items-center",
  style85_3: "space-y-1.5",
  style86_4: "flex items-center gap-2",
  style87_5: "rounded-xl bg-[#14B8A6]/10 p-1.5 text-[#14B8A6]",
  style88_6: "h-5 w-5",
  style90_7: "text-xl font-extrabold tracking-tight text-white",
  style92_8: "max-w-xl text-xs leading-relaxed text-slate-400",
  style95_9: "flex flex-wrap items-center gap-2",
  style96_10: "border-[#14B8A6]/30 bg-[#14B8A6]/5 px-2.5 py-1 text-[9px] text-[#14B8A6]",
  style99_11: "border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[9px] text-amber-500",
  style105_12: "grid grid-cols-1 gap-6 md:grid-cols-12",
  style106_13: "space-y-6 md:col-span-5",
  style107_14: "rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/80 backdrop-blur-xl shadow-xl",
  style108_15: "border-b border-white/10 p-5 pb-3",
  style109_16: "flex items-center gap-2 text-sm font-black text-white",
  style110_17: "h-4 w-4 text-[#14B8A6]",
  style113_18: "text-[10px] text-gray-500",
  style116_19: "space-y-4 p-5",
  style117_20: "space-y-1",
  style118_21: "text-xs font-bold text-gray-400",
  style122_22: "w-full rounded-xl border-white/10 bg-black/60 pr-3 text-right text-xs text-white focus:border-[#14B8A6]",
  style126_23: "space-y-1",
  style127_24: "text-xs font-bold text-gray-400",
  style131_25: "w-full rounded-xl border-white/10 bg-black/60 pr-3 text-right text-xs text-white focus:border-[#14B8A6]",
  style135_26: "space-y-1",
  style136_27: "text-xs font-bold text-gray-400",
  style145_28: "w-full rounded-xl border-white/10 bg-black/60 pr-3 text-center font-mono text-xs text-white focus:border-[#14B8A6]",
  style149_29: "space-y-3 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/5 p-4",
  style150_30: "flex items-center justify-between text-xs",
  style151_31: "font-bold text-gray-400",
  style153_32: "border-[#14B8A6] font-mono text-[#14B8A6]",
  style157_33: "text-[10px] text-gray-500",
  style162_34: "flex items-center justify-between",
  style164_35: "font-mono text-2xl font-black text-white",
  style165_36: "mr-1.5 text-[10px] text-gray-400",
  style168_37: "flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-xs text-amber-500",
  style169_38: "h-3.5 w-3.5",
  style176_39: "text-[10px] leading-normal text-gray-400",
  style181_40: "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 py-2 text-xs font-bold text-[#14B8A6] hover:bg-[#14B8A6]/20",
  style183_41: "h-3.5 w-3.5",
  style191_42: "space-y-6 md:col-span-7",
  style192_43: "flex flex-1 flex-col rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/80 backdrop-blur-xl shadow-xl",
  style193_44: "flex flex-row items-center justify-between gap-4 border-b border-white/10 p-5",
  style195_45: "flex items-center gap-2 text-sm font-black text-white",
  style196_46: "h-4 w-4 text-[#14B8A6]",
  style199_47: "text-[10px] text-gray-500",
  style206_48: "flex h-8 items-center gap-1 rounded-lg border border-[#14B8A6]/35 bg-black/40 px-2.5 text-xs text-[#14B8A6]",
  style208_49: "h-3 w-3",
  style208_50: "animate-spin",
  style213_51: "max-h-[440px] space-y-4 overflow-y-auto p-5",
  style215_52: "space-y-3 py-12 text-center",
  style216_53: "mx-auto h-8 w-8 animate-spin text-[#14B8A6]",
  style217_54: "text-xs text-gray-400",
  style220_55: "space-y-3",
  style224_56: "flex flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs transition-all hover:bg-black/60 sm:flex-row sm:items-center",
  style226_57: "flex gap-3",
  style227_58: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#14B8A6]/20 bg-[#14B8A6]/10 font-bold text-[#14B8A6]",
  style231_59: "space-y-1",
  style232_60: "flex items-center gap-2",
  style233_61: "text-[12px] font-extrabold text-white",
  style234_62: "border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-2 py-0.5 text-[8px] font-bold leading-none text-[#14B8A6] hover:bg-[#14B8A6]/15",
  style239_63: "flex items-center gap-3 text-[10px] leading-none text-gray-400",
  style240_64: "flex items-center gap-1",
  style241_65: "h-3 w-3 fill-amber-500 text-amber-500",
  style244_66: "text-gray-600",
  style245_67: "font-mono",
  style250_68: "flex items-center gap-1 text-[10px] text-gray-500",
  style251_69: "h-3 w-3 text-gray-400",
  style256_70: "font-mono text-gray-300",
  style266_71: "flex h-9 w-full items-center justify-center gap-1 rounded-lg px-3 text-[11px] font-black transition-all sm:w-auto",
  style268_72: "cursor-not-allowed border border-white/10 bg-slate-800 text-slate-400",
  style269_73: "bg-[#14B8A6] text-black hover:bg-[#14B8A6]/90",
  style274_74: "h-3 w-3 animate-pulse",
  style279_75: "h-3.5 w-3.5",
  style288_76: "space-y-3 rounded-2xl border border-white/10 bg-black/20 py-12 text-center",
  style289_77: "mx-auto h-6 w-6 text-amber-500/70",
  style290_78: "space-y-1",
  style291_79: "text-xs font-bold text-gray-300",
  style292_80: "mx-auto max-w-xs text-[10px] leading-normal text-gray-500",
  style301_81: "flex items-start gap-2 rounded-xl border border-[#14B8A6]/25 bg-[#0F172A]/60 p-4 text-right text-[10px] leading-normal text-gray-400 shadow-sm",
  style302_82: "mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]",
} as const;


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
    <div className={styles.style83_1} dir="rtl">
      <header className={styles.style84_2}>
        <div className={styles.style85_3}>
          <div className={styles.style86_4}>
            <span className={styles.style87_5}>
              <Compass className={styles.style88_6} />
            </span>
            <h1 className={styles.style90_7}>{t('title')}</h1>
          </div>
          <p className={styles.style92_8}>{t('description')}</p>
        </div>

        <div className={styles.style95_9}>
          <Badge variant="outline" className={styles.style96_10}>
            {t('protocol')}
          </Badge>
          <Badge variant="outline" className={styles.style99_11}>
            {t('range')}
          </Badge>
        </div>
      </header>

      <div className={styles.style105_12}>
        <section className={styles.style106_13}>
          <Card className={styles.style107_14}>
            <CardHeader className={styles.style108_15}>
              <CardTitle className={styles.style109_16}>
                <MapPin className={styles.style110_17} />
                {t('routeCard')}
              </CardTitle>
              <CardDescription className={styles.style113_18}>{t('routeDescription')}</CardDescription>
            </CardHeader>

            <CardContent className={styles.style116_19}>
              <div className={styles.style117_20}>
                <label className={styles.style118_21}>{t('pickup')}</label>
                <Input
                  value={pickupText}
                  onChange={(event) => setPickupText(event.target.value)}
                  className={styles.style122_22}
                />
              </div>

              <div className={styles.style126_23}>
                <label className={styles.style127_24}>{t('dropoff')}</label>
                <Input
                  value={dropoffText}
                  onChange={(event) => setDropoffText(event.target.value)}
                  className={styles.style131_25}
                />
              </div>

              <div className={styles.style135_26}>
                <label className={styles.style136_27}>{t('distance')}</label>
                <Input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(event) => {
                    const val = parseFloat(event.target.value);
                    setDistance(Number.isNaN(val) ? 0 : val);
                  }}
                  className={styles.style145_28}
                />
              </div>

              <div className={styles.style149_29}>
                <div className={styles.style150_30}>
                  <span className={styles.style151_31}>{t('pricing')}</span>
                  {frozenPrice ? (
                    <Badge variant="outline" className={styles.style153_32}>
                      {frozenH3 || "H3"}
                    </Badge>
                  ) : (
                    <span className={styles.style157_33}>{t('notFrozen')}</span>
                  )}
                </div>

                {frozenPrice ? (
                  <div className={styles.style162_34}>
                    <div>
                      <span className={styles.style164_35}>{frozenPrice}</span>
                      <span className={styles.style165_36}>{t('currency')}</span>
                    </div>

                    <div className={styles.style168_37}>
                      <Timer className={styles.style169_38} />
                      <span>
                        {countdown} {t('seconds')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.style176_39}>{t('freezeHelp')}</p>
                )}

                <Button
                  onClick={handleCalculateAndFreeze}
                  className={styles.style181_40}
                >
                  <Lock className={styles.style183_41} />
                  {frozenPrice ? t('refreshFreezeButton') : t('freezeButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className={styles.style191_42}>
          <Card className={styles.style192_43}>
            <CardHeader className={styles.style193_44}>
              <div>
                <CardTitle className={styles.style195_45}>
                  <Search className={styles.style196_46} />
                  {t('nearbyDrivers')}
                </CardTitle>
                <CardDescription className={styles.style199_47}>{t('nearbyDescription')}</CardDescription>
              </div>

              <Button
                size="sm"
                onClick={scanGeoBubble}
                disabled={isScanning}
                className={styles.style206_48}
              >
                <RefreshCw className={cn(styles.style208_49, isScanning && styles.style208_50)} />
                {t('refresh')}
              </Button>
            </CardHeader>

            <CardContent className={styles.style213_51}>
              {isScanning ? (
                <div className={styles.style215_52}>
                  <RefreshCw className={styles.style216_53} />
                  <p className={styles.style217_54}>{t('scanning')}</p>
                </div>
              ) : nearbyDrivers.length > 0 ? (
                <div className={styles.style220_55}>
                  {nearbyDrivers.map((driver) => (
                    <article
                      key={driver.uid}
                      className={styles.style224_56}
                    >
                      <div className={styles.style226_57}>
                        <div className={styles.style227_58}>
                          {driver.name.slice(0, 1)}
                        </div>

                        <div className={styles.style231_59}>
                          <div className={styles.style232_60}>
                            <h4 className={styles.style233_61}>{driver.name}</h4>
                            <Badge className={styles.style234_62}>
                              {driver.rank}
                            </Badge>
                          </div>

                          <div className={styles.style239_63}>
                            <span className={styles.style240_64}>
                              <Star className={styles.style241_65} />
                              {driver.rating.toFixed(1)}
                            </span>
                            <span className={styles.style244_66}>|</span>
                            <span className={styles.style245_67}>
                              {t('distanceLabel')}: {driver.distanceKm} {t('km')}
                            </span>
                          </div>

                          <div className={styles.style250_68}>
                            <Car className={styles.style251_69} />
                            <span>
                              {driver.vehicle?.make || t('car')} {driver.vehicle?.modelYear || ""}
                              {" - "}
                              {t('plate')} [
                              <strong className={styles.style256_70}>{driver.vehicle?.plate || "-"}</strong>]
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleInitiateRide(driver.uid, driver.name)}
                        disabled={isLocked}
                        className={cn(
                          styles.style266_71,
                          isLocked
                            ? styles.style268_72
                            : styles.style269_73,
                        )}
                      >
                        {isLocked ? (
                          <>
                            <Lock className={styles.style274_74} />
                            {t('locked')}
                          </>
                        ) : (
                          <>
                            <UserCheck className={styles.style279_75} />
                            {t('request')}
                          </>
                        )}
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.style288_76}>
                  <AlertTriangle className={styles.style289_77} />
                  <div className={styles.style290_78}>
                    <h4 className={styles.style291_79}>{t('emptyTitle')}</h4>
                    <p className={styles.style292_80}>{t('emptyDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className={styles.style301_81}>
        <Shield className={styles.style302_82} />
        <p>{t('safety')}</p>
      </div>
    </div>
  );
}
