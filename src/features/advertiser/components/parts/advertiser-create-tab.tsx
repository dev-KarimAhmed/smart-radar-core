import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './styles';
import { MapPin, Target, Eye, Navigation, CheckCircle2, Package as PackageIcon, RefreshCw, Send, Link as LinkIcon, DollarSign, ArrowRight, ShieldCheck, Camera, CreditCard, Sparkles, Clock, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdvertiserCreateAdTab({
  step, setStep,
  openSecs, setOpenSecs,
  governorate, setGovernorate,
  district, setDistrict,
  districts,
  title, setTitle,
  description, setDescription,
  posterUrl, setPosterUrl,
  whatsapp, setWhatsapp,
  phone, setPhone,
  geoLoc, setGeoLoc,
  buttonText, setButtonText,
  targetImpressions, setTargetImpressions,
  paymentChannel, setPaymentChannel,
  isCapacityFull,
  redirectCampaignToNaour,
  calculatedCost,
  currentPackage,
  advertiserBalance,
  runForensicAuditAndLaunch,
  isSimulatingAudit,
  auditProgress,
  auditLogs,
  auditApproved,
  setActiveTab
}: any) {
  const tAuto = useTranslations('auto');
  return (
    <>

    </>
  );
}
