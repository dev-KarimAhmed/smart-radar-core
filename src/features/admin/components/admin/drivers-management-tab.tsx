'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import {
  Users,
  Search,
  Star,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Clock,
  Car,
  CheckCircle2,
  Check,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  Eye,
  FileText,
  Filter,
  Loader2,
  ExternalLink,
  PlusCircle,
  Award,
  ChevronDown,
  RefreshCw,
  BadgeAlert,
  DollarSign,
  MessageSquare,
  Send,
  MessageCircle,
  MapPin,
  Globe,
  Languages,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getRankTheme } from '@/core/utils';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { GeoFilterBar, GeoLookup } from './geo-filter-bar';
import { requestTranslation } from '@/shared/utils/notification-i18n';

export interface CaptainUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rating: number;
  rating_count: number;
  heart_count: number;
  penalty_count: number;
  trust_score: number;
  country_id?: number;
  country_name?: string;
  governorate_id?: number;
  district_id?: number;
  governorate: string;
  district: string;
  created_at: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    type: string;
    affiliation_type: string;
    office_phone: string;
    side_id: string;
  };
  verification_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  documents: {
    identity_url: string | null;
    driving_license_url: string | null;
    vehicle_registration_url: string | null;
    criminal_record_url: string | null;
  };
  wallet: {
    balance: number;
    paid_minutes_remaining: number;
    bonus_minutes_remaining: number;
    total_minutes: number;
    active_package_name: string | null;
    time_bundle_expires_at: string | null;
    currency_code: string;
    currency_ar?: string;
  };
  currency?: string;
}

export const getCaptainCurrency = (cap?: CaptainUser | null, isArabic = true): string => {
  if (!cap) return isArabic ? 'د.أ' : 'JOD';
  const isEgypt = cap.wallet?.currency_code === 'EGP' || cap.phone?.startsWith('+20');
  if (isEgypt) return isArabic ? 'ج.م' : 'EGP';
  return isArabic ? 'د.أ' : 'JOD';
};

const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
  searchContainer: "relative w-full sm:w-80",
  searchInput: "bg-black/70 border-white/15 text-white pl-3 pr-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-start font-medium placeholder:text-slate-500",
  searchIcon: "absolute right-3 top-3 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
  avatar: "flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/15 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm",
} as const;

export function DriversManagementTab() {
  const t = useTranslations('adminCaptains');
  const { isArabic, direction } = useDashboardLanguage();
  const { toast } = useToast();
  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');

  // Geographic filtering state
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [geoLookup, setGeoLookup] = useState<GeoLookup>({
    countries: [],
    governorates: [],
    districts: [],
  });

  const handleCountryChange = useCallback((val: string) => {
    setSelectedCountry(val);
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  const handleGovernorateChange = useCallback((val: string) => {
    setSelectedGovernorate(val);
    setSelectedDistrict('ALL');
  }, []);

  const handleDistrictChange = useCallback((val: string) => {
    setSelectedDistrict(val);
  }, []);

  const handleResetGeo = useCallback(() => {
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  // Modals state
  const [inspectCaptain, setInspectCaptain] = useState<CaptainUser | null>(null);
  const [topupCaptain, setTopupCaptain] = useState<CaptainUser | null>(null);
  const [securityCaptain, setSecurityCaptain] = useState<CaptainUser | null>(null);
  const [messageCaptain, setMessageCaptain] = useState<CaptainUser | null>(null);

  // Message modal inputs
  const [messageTitle, setMessageTitle] = useState('رسالة من إدارة المنظومة');
  const [messageBody, setMessageBody] = useState('');
  const [messageTitleEn, setMessageTitleEn] = useState('');
  const [messageBodyEn, setMessageBodyEn] = useState('');
  const [isTranslatingDirect, setIsTranslatingDirect] = useState(false);
  const [messageType, setMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  const handleTranslateDirect = async () => {
    setIsTranslatingDirect(true);
    try {
      const [tTitle, tBody] = await Promise.all([
        messageTitle.trim() ? requestTranslation(messageTitle.trim(), 'en') : Promise.resolve(''),
        messageBody.trim() ? requestTranslation(messageBody.trim(), 'en') : Promise.resolve(''),
      ]);
      setMessageTitleEn(tTitle);
      setMessageBodyEn(tBody);
      toast({
        title: '🌐 تم إنشاء الترجمة الإنجليزية بنجاح',
        description: 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر توليد الترجمة',
        description: 'يرجى كتابة النص الإنجليزي يدوياً أو المحاولة لاحقاً.',
      });
    } finally {
      setIsTranslatingDirect(false);
    }
  };

  // Topup modal inputs
  const [minutesToAdd, setMinutesToAdd] = useState<number>(60);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [cashBalanceToAdd, setCashBalanceToAdd] = useState<number>(10);
  const [topupMode, setTopupMode] = useState<'minutes' | 'cash'>('minutes');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [targetTier, setTargetTier] = useState<string>('SILVER');
  const [securityReason, setSecurityReason] = useState<string>('');

  // Multi-selection state
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<Set<string>>(new Set());

  // Bulk Modals state
  const [isBulkTopupOpen, setIsBulkTopupOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'selected' | 'filtered'>('all');

  // Bulk Topup inputs
  const [bulkTopupType, setBulkTopupType] = useState<'minutes' | 'cash'>('minutes');
  const [bulkMinutes, setBulkMinutes] = useState<number>(60);
  const [bulkExtendDays, setBulkExtendDays] = useState<number>(30);
  const [bulkCashAmount, setBulkCashAmount] = useState<number>(10);
  const [submittingBulkTopup, setSubmittingBulkTopup] = useState(false);

  // Bulk Message inputs
  const [bulkMsgTitle, setBulkMsgTitle] = useState('إشعار من إدارة المنظومة');
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgTitleEn, setBulkMsgTitleEn] = useState('');
  const [bulkMsgBodyEn, setBulkMsgBodyEn] = useState('');
  const [isTranslatingBulk, setIsTranslatingBulk] = useState(false);
  const [bulkMsgType, setBulkMsgType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMsg, setSubmittingBulkMsg] = useState(false);

  const handleTranslateBulk = async () => {
    setIsTranslatingBulk(true);
    try {
      const [tTitle, tBody] = await Promise.all([
        bulkMsgTitle.trim() ? requestTranslation(bulkMsgTitle.trim(), 'en') : Promise.resolve(''),
        bulkMsgBody.trim() ? requestTranslation(bulkMsgBody.trim(), 'en') : Promise.resolve(''),
      ]);
      setBulkMsgTitleEn(tTitle);
      setBulkMsgBodyEn(tBody);
      toast({
        title: '🌐 تم إنشاء الترجمة الإنجليزية بنجاح',
        description: 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر توليد الترجمة',
        description: 'يرجى كتابة النص الإنجليزي يدوياً أو المحاولة لاحقاً.',
      });
    } finally {
      setIsTranslatingBulk(false);
    }
  };

  const fetchCaptains = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users?role=CAPTAIN');
      const data = await res.json();
      if (data?.success && Array.isArray(data.users)) {
        setCaptains(data.users);
        if (data.geo) {
          setGeoLookup({
            countries: Array.isArray(data.geo.countries) ? data.geo.countries : [],
            governorates: Array.isArray(data.geo.governorates) ? data.geo.governorates : [],
            districts: Array.isArray(data.geo.districts) ? data.geo.districts : [],
          });
        }
      } else {
        throw new Error(data?.error || 'فشل تحميل بيانات الكباتن المعلنين');
      }
    } catch (err: any) {
      console.warn('[DriversManagementTab] fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ استدعاء الأسطول',
        description: err.message || 'تعذر جلب بيانات الكباتن المعلنين من قاعدة البيانات',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchCaptains();
  }, [fetchCaptains]);

  // Execute admin action helper
  const executeAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    setSubmittingAction(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'حدث خطأ أثناء معالجة الإجراء');
      }

      toast({
        title: '⚡ تم تنفيذ الإجراء بنجاح',
        description: result.message || successMsg,
      });

      await fetchCaptains(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'فشل العملية',
        description: err.message || 'تعذر تطبيق الإجراء',
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered captains
  const filteredCaptains = useMemo(() => {
    return captains.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.serial_id.toLowerCase().includes(q) ||
        c.vehicle.plate.toLowerCase().includes(q) ||
        c.vehicle.brand.toLowerCase().includes(q) ||
        c.vehicle.model.toLowerCase().includes(q) ||
        (c.governorate && c.governorate.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.country_name && c.country_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(c.status || '').toUpperCase() === statusFilter.toUpperCase();

      const matchesVerification =
        verificationFilter === 'ALL' ||
        (verificationFilter === 'APPROVED'
          ? c.verification_status === 'APPROVED'
          : c.verification_status !== 'APPROVED');

      const matchesRank =
        rankFilter === 'ALL' ||
        String(c.tier || '').toUpperCase() === rankFilter.toUpperCase();

      // Geo Filtering: Country
      const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === selectedCountry);
      const matchesCountry =
        selectedCountry === 'ALL' ||
        c.country_id === Number(selectedCountry) ||
        (targetCountry && (c.country_name === targetCountry.name_ar || (targetCountry.country_code && c.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

      // Geo Filtering: Governorate
      const targetGov = geoLookup.governorates.find((g) => String(g.id) === selectedGovernorate);
      const matchesGov =
        selectedGovernorate === 'ALL' ||
        c.governorate_id === Number(selectedGovernorate) ||
        (targetGov && c.governorate === targetGov.name_ar);

      // Geo Filtering: District
      const targetDist = geoLookup.districts.find((d) => String(d.id) === selectedDistrict);
      const matchesDist =
        selectedDistrict === 'ALL' ||
        c.district_id === Number(selectedDistrict) ||
        (targetDist && c.district === targetDist.name_ar);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVerification &&
        matchesRank &&
        matchesCountry &&
        matchesGov &&
        matchesDist
      );
    });
  }, [
    captains,
    searchQuery,
    statusFilter,
    verificationFilter,
    rankFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
  ]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = captains.length;
    const active = captains.filter(c => c.status === 'ACTIVE' || c.status === 'BUSY').length;
    const pendingVerification = captains.filter(c => c.verification_status === 'PENDING').length;
    const flagged = captains.filter(c => c.status === 'SUSPENDED' || c.status === 'BANNED' || c.penalty_count > 0).length;
    return { total, active, pendingVerification, flagged };
  }, [captains]);

  // Multi-selection helpers
  const toggleSelectOne = (id: string) => {
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredCaptains.length === 0) return;
    const allFilteredSelected = filteredCaptains.every((c) => selectedCaptainIds.has(c.id));
    if (allFilteredSelected) {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedCaptainIds(new Set());
  };

  const getTargetUserIds = (scope: 'all' | 'selected' | 'filtered'): string[] | undefined => {
    if (scope === 'all') {
      return undefined; // backend targets all captains in profiles
    }
    if (scope === 'selected') {
      return Array.from(selectedCaptainIds);
    }
    if (scope === 'filtered') {
      return filteredCaptains.map((c) => c.id);
    }
    return undefined;
  };

  const getTargetCount = (scope: 'all' | 'selected' | 'filtered'): number => {
    if (scope === 'all') return captains.length;
    if (scope === 'selected') return selectedCaptainIds.size;
    if (scope === 'filtered') return filteredCaptains.length;
    return 0;
  };

  const handleBulkTopup = async () => {
    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.',
      });
      return;
    }

    setSubmittingBulkTopup(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_topup',
        topupType: bulkTopupType,
        userIds: targetIds,
      };

      if (bulkTopupType === 'minutes') {
        payload.minutes = bulkMinutes;
        payload.extendDays = bulkExtendDays;
      } else {
        payload.amount = bulkCashAmount;
      }

      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'فشلت عملية الشحن الجماعي');
      }

      toast({
        title: '⚡ تم الشحن بنجاح',
        description: result.message || 'تم تحديث أرصدة الكباتن المعلنين وإشعارهم بنجاح.',
      });

      setIsBulkTopupOpen(false);
      await fetchCaptains(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في الشحن الجماعي',
        description: err.message || 'تعذر إتمام عملية الشحن الجماعي',
      });
    } finally {
      setSubmittingBulkTopup(false);
    }
  };

  const handleBulkSendMessage = async () => {
    if (!bulkMsgBody.trim()) {
      toast({
        variant: 'destructive',
        title: 'نص الرسالة مطلوب',
        description: 'يرجى كتابة نص الإشعار قبل الإرسال.',
      });
      return;
    }

    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'يرجى تحديد كابتن معلن واحد على الأقل أولاً.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'لا يوجد كباتن معلنين مطابقين للفلاتر الحالية.',
      });
      return;
    }

    setSubmittingBulkMsg(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_send_message',
        title: bulkMsgTitle.trim(),
        message: bulkMsgBody.trim(),
        titleEn: bulkMsgTitleEn.trim(),
        messageEn: bulkMsgBodyEn.trim(),
        type: bulkMsgType,
        userIds: targetIds,
      };

      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'فشلت عملية إرسال الإشعار الجماعي');
      }

      toast({
        title: '📢 تم إرسال الإشعار اللحظي',
        description: result.message || 'تم بث الإشعار بنجاح إلى جميع الكباتن المعلنين المحددين.',
      });

      setIsBulkMessageOpen(false);
      setBulkMsgBody('');
      setBulkMsgTitleEn('');
      setBulkMsgBodyEn('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إرسال الإشعار الجماعي',
        description: err.message || 'تعذر إرسال الإشعار الجماعي',
      });
    } finally {
      setSubmittingBulkMsg(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={cn(styles.statusBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('statusBadgeActive')}
          </span>
        );
      case 'BUSY':
        return (
          <span className={cn(styles.statusBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {t('statusBadgeBusy')}
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className={cn(styles.statusBadge, "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {t('statusBadgeSuspended')}
          </span>
        );
      case 'BANNED':
        return (
          <span className={cn(styles.statusBadge, "bg-red-950/80 text-red-300 border-red-500/40")}>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            {t('statusBadgeBanned')}
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className={cn(styles.statusBadge, "bg-slate-800/80 text-slate-200 border-slate-700")}>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {t('statusBadgeIdle')}
          </span>
        );
    }
  };

  const getVerificationBadge = (ver: string) => {
    switch (ver) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <CheckCircle2 className={cn("w-3.5 h-3.5 text-emerald-400", isArabic ? "ml-1" : "mr-1")} />
            {t('verBadgeApproved')}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <XCircle className={cn("w-3.5 h-3.5 text-rose-400", isArabic ? "ml-1" : "mr-1")} />
            {t('verBadgeRejected')}
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <AlertTriangle className={cn("w-3.5 h-3.5 text-amber-400", isArabic ? "ml-1" : "mr-1")} />
            {t('verBadgeAuto')}
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#14B8A6]" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Bulk Topup Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
              setIsBulkTopupOpen(true);
            }}
            className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#14B8A6]/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkTopupTooltip')}
          >
            <Zap className="w-4 h-4" />
            <span>{t('bulkTopupBtn')}</span>
          </Button>

          {/* Global Bulk Message / Notification Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
              setIsBulkMessageOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkMessageTooltip')}
          >
            <Send className={cn("w-4 h-4", isArabic ? "ml-0.5" : "mr-0.5")} />
            <span>{t('bulkMessageBtn')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fetchCaptains()}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#14B8A6]", loading && "animate-spin")} />
            <span>{t('refreshBtn')}</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
            {t('kpiTotal')}
          </p>
          <p className={styles.kpiValue}>{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiTotalSub')}</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            {t('kpiActive')}
          </p>
          <p className={cn(styles.kpiValue, "text-emerald-400")}>{stats.active}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiActiveSub')}</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            {t('kpiPending')}
          </p>
          <p className={cn(styles.kpiValue, "text-amber-400")}>{stats.pendingVerification}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiPendingSub')}</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            {t('kpiFlagged')}
          </p>
          <p className={cn(styles.kpiValue, "text-rose-400")}>{stats.flagged}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiFlaggedSub')}</span>
        </div>
      </div>

      {/* 3. Search and Multi-filter Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={styles.searchInput}
            />
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
              <span className="text-slate-400 px-2 font-bold">{t('filterStatus')}</span>
              {[
                { key: 'ALL', label: t('statusAll') },
                { key: 'ACTIVE', label: t('statusActive') },
                { key: 'IDLE', label: t('statusIdle') },
                { key: 'BUSY', label: t('statusBusy') },
                { key: 'SUSPENDED', label: t('statusSuspended') },
                { key: 'BANNED', label: t('statusBanned') },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                    statusFilter === st.key
                      ? "bg-[#14B8A6] text-[#0B0F19]"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Verification filter */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
              <span className="text-slate-400 px-2 font-bold">{t('filterVerification')}</span>
              {[
                { key: 'ALL', label: t('statusAll') },
                { key: 'APPROVED', label: t('verApproved') },
                { key: 'PENDING', label: t('verPending') },
              ].map((ver) => (
                <button
                  key={ver.key}
                  type="button"
                  onClick={() => setVerificationFilter(ver.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                    verificationFilter === ver.key
                      ? "bg-[#14B8A6] text-[#0B0F19]"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {ver.label}
                </button>
              ))}
            </div>

            {/* Rank Tier filter */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
              <span className="text-slate-400 px-2 font-bold">{t('filterRank')}</span>
              {[
                { key: 'ALL', label: t('statusAll') },
                { key: 'PLATINUM', label: t('rankPlatinum') },
                { key: 'GOLD', label: t('rankGold') },
                { key: 'SILVER', label: t('rankSilver') },
                { key: 'BRONZE', label: t('rankBronze') },
              ].map((rk) => (
                <button
                  key={rk.key}
                  type="button"
                  onClick={() => setRankFilter(rk.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                    rankFilter === rk.key
                      ? "bg-[#14B8A6] text-[#0B0F19]"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {rk.label}
                </button>
              ))}
            </div>

            {/* Reset Filters button if any filter is active */}
            {(statusFilter !== 'ALL' ||
              verificationFilter !== 'ALL' ||
              rankFilter !== 'ALL' ||
              selectedCountry !== 'ALL' ||
              selectedGovernorate !== 'ALL' ||
              selectedDistrict !== 'ALL' ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setVerificationFilter('ALL');
                  setRankFilter('ALL');
                  setSelectedCountry('ALL');
                  setSelectedGovernorate('ALL');
                  setSelectedDistrict('ALL');
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
                title={t('resetFiltersTooltip')}
              >
                <RotateCcw className="w-3 h-3 text-[#14B8A6]" />
                <span>{t('resetFilters')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Geographic Filtering Bar */}
        <GeoFilterBar
          geoLookup={geoLookup}
          selectedCountry={selectedCountry}
          selectedGovernorate={selectedGovernorate}
          selectedDistrict={selectedDistrict}
          onCountryChange={handleCountryChange}
          onGovernorateChange={handleGovernorateChange}
          onDistrictChange={handleDistrictChange}
          onResetGeo={handleResetGeo}
          isArabic={isArabic}
        />
      </div>

      {/* Floating / Sticky Bulk Action Bar for Selected Captains */}
      {selectedCaptainIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#14B8A6]/20 via-[#0B0F19]/95 to-indigo-950/40 border border-[#14B8A6]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14B8A6]"></span>
            </span>
            <div className="text-xs font-bold text-white">
              {t('selectedCaptainAlert', { count: selectedCaptainIds.size })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBulkScope('selected');
                setIsBulkTopupOpen(true);
              }}
              className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('bulkTopupSelected', { count: selectedCaptainIds.size })}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBulkScope('selected');
                setIsBulkMessageOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('bulkMessageSelected', { count: selectedCaptainIds.size })}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8 px-3 rounded-xl transition-all cursor-pointer"
            >
              <span>{t('clearSelection')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 4. Fleet Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              <p className="text-xs font-bold">{t('loadingTable')}</p>
            </div>
          ) : filteredCaptains.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Car className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">{t('noCaptainsFound')}</p>
              <p className="text-xs text-slate-500">{t('noCaptainsFoundSub')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead className={styles.tableHead}>
                  <tr>
                    {/* Master Checkbox Header */}
                    <th className="py-4 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                            : filteredCaptains.some(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6]/30 border-[#14B8A6] text-[#14B8A6]"
                            : "border-white/20 bg-black/40 hover:border-white/40"
                        )}
                        title={
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? t('deselectAllTooltip')
                            : t('selectAllTooltip')
                        }
                      >
                        {filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id)) ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : filteredCaptains.some(c => selectedCaptainIds.has(c.id)) ? (
                          <div className="w-2 h-0.5 bg-[#14B8A6] rounded" />
                        ) : null}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colIdentity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVehicle')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colFlightMinutes')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colRankRating')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVerification')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colOperational')}</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaptains.map((captain) => {
                    const rankTheme = getRankTheme(captain.tier?.toLowerCase() || 'silver');
                    const hasMinutes = captain.wallet.total_minutes > 0;
                    const isSelected = selectedCaptainIds.has(captain.id);

                    return (
                      <tr
                        key={captain.id}
                        className={cn(
                          styles.tableRow,
                          isSelected && "bg-[#14B8A6]/[0.08] border-[#14B8A6]/30 hover:bg-[#14B8A6]/[0.12]"
                        )}
                      >
                        {/* Row Checkbox */}
                        <td className="py-4 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(captain.id)}
                            className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                              isSelected
                                ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                                : "border-white/20 bg-black/40 hover:border-white/40"
                            )}
                            title={isSelected ? t('unselectCaptainTooltip') : t('selectCaptainTooltip')}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        </td>
                        {/* 1. Identity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-[#14B8A6]/40 rounded-xl shadow-sm">
                              <AvatarFallback className="bg-[#14B8A6]/15 text-[#14B8A6] font-black text-xs">
                                {captain.full_name ? captain.full_name.substring(0, 2) : 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm tracking-wide">{captain.full_name}</span>
                                <Badge variant="outline" className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md">
                                  {captain.serial_id}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold" dir="ltr">
                                <Phone className="h-3 w-3 text-[#14B8A6]" />
                                <span>{captain.phone}</span>
                              </div>
                              {(captain.governorate || captain.country_name) && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-0.5">
                                  <MapPin className="h-3 w-3 text-[#14B8A6] shrink-0" />
                                  <span className="truncate max-w-[180px]" title={`${captain.country_name ? `${captain.country_name} • ` : ''}${captain.governorate}${captain.district ? ` - ${captain.district}` : ''}`}>
                                    {captain.country_name ? `${captain.country_name} • ` : ''}{captain.governorate}{captain.district ? ` - ${captain.district}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Vehicle */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-white text-xs">
                              <Car className="h-4 w-4 text-[#14B8A6] shrink-0" />
                              <bdi className="font-black text-white text-xs tracking-wide">
                                {captain.vehicle.brand || t('vehicleDefault')} {captain.vehicle.model}
                              </bdi>
                              {captain.vehicle.year ? (
                                <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                                  {captain.vehicle.year}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-[11px] bg-slate-900 border border-slate-700/80 px-2.5 py-0.5 rounded-md text-amber-300 tracking-wider inline-flex items-center gap-1 shadow-sm" dir="ltr">
                                <span>{captain.vehicle.plate || t('noPlate')}</span>
                              </span>
                              {captain.vehicle.color && (
                                <span className="text-[11px] text-slate-300 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                  {captain.vehicle.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Flight Minutes */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 font-mono">
                            {hasMinutes ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-emerald-400" />
                                  <span className="font-black text-sm text-emerald-400">
                                    {captain.wallet.total_minutes}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200">{t('minuteUnit')}</span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-400/90 font-mono block">
                                  {t('flightHoursEst', { hours: (captain.wallet.total_minutes / 60).toFixed(1) })}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-rose-400" />
                                  <span className="font-black text-sm text-rose-400">0</span>
                                  <span className="text-xs font-bold text-rose-300">{t('minuteUnit')}</span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded inline-block">
                                  {t('minutesExpired')}
                                </span>
                              </>
                            )}

                            {/* Cash Balance */}
                            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold pt-1 border-t border-white/5">
                              <span className="text-slate-400 text-[10px] font-normal">{t('cashPrefix')}</span>
                              <span>{(captain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(captain, isArabic)}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Rank & Rating */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs font-black px-2.5 py-0.5 rounded-lg border", rankTheme.bg, rankTheme.color, rankTheme.border, rankTheme.glow)}>
                                {isArabic ? rankTheme.label : (captain.tier || 'Silver')}
                              </Badge>
                              <div className="flex items-center gap-1 font-black font-mono text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span>{captain.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            {captain.penalty_count > 0 && (
                              <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                {t('penaltiesLogged', { count: captain.penalty_count })}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* 5. Verification status */}
                        <td className="py-4 px-4">
                          {getVerificationBadge(captain.verification_status)}
                        </td>

                        {/* 6. Operational status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(captain.status)}
                        </td>

                        {/* 7. Action buttons */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Inspect */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectCaptain(captain)}
                              className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title={t('btnInspectTooltip')}
                            >
                              <Eye className="h-3.5 w-3.5 text-cyan-400" />
                              <span>{t('btnInspect')}</span>
                            </Button>

                            {/* Top-up flight minutes */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setTopupCaptain(captain);
                                setMinutesToAdd(60);
                                setExtendDays(30);
                                setCashBalanceToAdd(0);
                              }}
                              className="h-8 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title={t('btnTopupTooltip')}
                            >
                              <Zap className="h-3.5 w-3.5 text-emerald-400" />
                              <span>{t('btnTopup')}</span>
                            </Button>

                            {/* Security & Anti-Cheat */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSecurityCaptain(captain);
                                setTargetStatus(captain.status);
                                setTargetTier((captain.tier || 'SILVER').toUpperCase());
                                setSecurityReason('');
                              }}
                              className="h-8 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title={t('btnSecurityTooltip')}
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                              <span>{t('btnSecurity')}</span>
                            </Button>

                            {/* Direct Message / Notification */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMessageCaptain(captain);
                                setMessageTitle(t('msgSubjectDefault'));
                                setMessageBody('');
                                setMessageType('admin_message');
                              }}
                              className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title={t('btnMessageTooltip')}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                              <span>{t('btnMessage')}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: Inspect Captain Full Profile & Documents                         */}
      {/* ========================================================================= */}
      <Dialog open={!!inspectCaptain} onOpenChange={(open) => !open && setInspectCaptain(null)}>
        <DialogContent className={cn("max-w-2xl bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {inspectCaptain && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-[#14B8A6]/40 rounded-2xl">
                      <AvatarFallback className="bg-[#14B8A6]/20 text-[#14B8A6] font-black text-sm">
                        {inspectCaptain.full_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                        {inspectCaptain.full_name}
                        <Badge className="font-mono text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {inspectCaptain.serial_id}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-400 mt-0.5">
                        {t('joinedDate', { date: new Date(inspectCaptain.created_at).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US') })}
                      </DialogDescription>
                    </div>
                  </div>
                  <div>
                    {getVerificationBadge(inspectCaptain.verification_status)}
                  </div>
                </div>
              </DialogHeader>

              {/* Identity & Contact Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">{t('phoneLabel')}</span>
                  <span className="font-mono font-bold text-white block mt-0.5" dir="ltr">{inspectCaptain.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">{t('locationLabel')}</span>
                  <span className="font-bold text-white block mt-0.5">{inspectCaptain.governorate} - {inspectCaptain.district}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">{t('emailLabel')}</span>
                  <span className="font-mono text-slate-300 block mt-0.5 truncate">{inspectCaptain.email || '-'}</span>
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="border border-white/10 bg-[#161F30]/40 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Car className="h-4 w-4 text-[#14B8A6]" />
                    {t('vehicleSpecsTitle')}
                  </h4>
                  <span className="text-[10px] bg-black/60 px-2.5 py-0.5 rounded border border-white/10 text-cyan-400 font-bold">
                    {inspectCaptain.vehicle.affiliation_type === 'office-taxi' ? t('officeTaxi') : inspectCaptain.vehicle.affiliation_type === 'smart-app' ? t('smartApp') : t('independent')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">{t('vehicleLabel')}</span>
                    <span className="font-bold text-white">{inspectCaptain.vehicle.brand} {inspectCaptain.vehicle.model}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">{t('manufacturingYear')}</span>
                    <span className="font-mono font-bold text-white">{inspectCaptain.vehicle.year || '-'}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">{t('plateNumber')}</span>
                    <span className="font-mono font-bold text-amber-300">{inspectCaptain.vehicle.plate || '-'}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">{t('vehicleColor')}</span>
                    <span className="font-bold text-white">{inspectCaptain.vehicle.color || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Document verification items */}
              <div className="border border-white/10 bg-black/30 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  {t('documentsTitle')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Identity Document */}
                  <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{t('idCard')}</p>
                      <p className="text-[10px] text-slate-500">
                        {inspectCaptain.documents.identity_url ? t('docUploaded') : t('docNotUploaded')}
                      </p>
                    </div>
                    {inspectCaptain.documents.identity_url ? (
                      <a
                        href={inspectCaptain.documents.identity_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                      >
                        {t('docPreview')} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600">{t('docUnavailable')}</span>
                    )}
                  </div>

                  {/* Driving License */}
                  <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{t('driverLicense')}</p>
                      <p className="text-[10px] text-slate-500">
                        {inspectCaptain.documents.driving_license_url ? t('docUploaded') : t('docNotUploaded')}
                      </p>
                    </div>
                    {inspectCaptain.documents.driving_license_url ? (
                      <a
                        href={inspectCaptain.documents.driving_license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                      >
                        {t('docPreview')} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600">{t('docUnavailable')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons in Modal Footer */}
              <DialogFooter className="flex flex-row items-center justify-end gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  disabled={submittingAction}
                  onClick={async () => {
                    const ok = await executeAdminAction({
                      action: 'update_verification',
                      userId: inspectCaptain.id,
                      verificationStatus: 'APPROVED',
                    }, isArabic ? 'تم اعتماد وتوثيق الكابتن المعلن بنجاح' : 'Captain successfully verified and approved');
                    if (ok) setInspectCaptain(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-9 rounded-xl px-5 shadow-lg shadow-emerald-600/20"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 ml-1" />}
                  {t('approveCaptainFull')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: Radar Flight Minutes Allocation & Top-Up                         */}
      {/* ========================================================================= */}
      <Dialog open={!!topupCaptain} onOpenChange={(open) => !open && setTopupCaptain(null)}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-[#14B8A6]/40 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {topupCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#14B8A6]" />
                  {t('topupTitle', { name: topupCaptain.full_name })}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  {t('topupDesc')}
                </DialogDescription>
              </DialogHeader>

              {/* Current Wallet status */}
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">{t('remainingRadarMinutes')}</span>
                  <span className="text-base font-black text-[#14B8A6]">{topupCaptain.wallet.total_minutes} {t('minuteUnit')}</span>
                  <span className="text-[10px] text-slate-400 block">≈ {((topupCaptain.wallet.total_minutes || 0) / 60).toFixed(1)} {isArabic ? 'س' : 'h'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{t('currentCashBalance')}</span>
                  <span className="text-base font-black text-amber-400">
                    {(topupCaptain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(topupCaptain, isArabic)}
                  </span>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTopupMode('minutes')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                    topupMode === 'minutes'
                      ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('minutesMode')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopupMode('cash')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                    topupMode === 'cash'
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{t('cashMode')} ({getCaptainCurrency(topupCaptain, isArabic)})</span>
                </button>
              </div>

              {/* Topup Mode: Minutes */}
              {topupMode === 'minutes' ? (
                <>
                  {/* Quick Packages */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">{t('quickMinutesPackLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { m: 60, label: `+60 ${t('minuteUnit')}`, sub: isArabic ? 'ساعة رادار' : '1 Flight Hour' },
                        { m: 300, label: `+300 ${t('minuteUnit')}`, sub: isArabic ? '5 ساعات' : '5 Flight Hours' },
                        { m: 600, label: `+600 ${t('minuteUnit')}`, sub: isArabic ? '10 ساعات' : '10 Flight Hours' },
                        { m: 1440, label: `+1440 ${t('minuteUnit')}`, sub: isArabic ? '24 ساعة (يوم)' : '24 Hours (Full Day)' },
                      ].map((pkg) => (
                        <button
                          key={pkg.m}
                          type="button"
                          onClick={() => setMinutesToAdd(pkg.m)}
                          className={cn(
                            "p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between",
                            isArabic ? "text-right" : "text-left",
                            minutesToAdd === pkg.m
                              ? "border-[#14B8A6] bg-[#14B8A6]/10 text-white"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          )}
                        >
                          <span className="font-mono font-black text-sm">{pkg.label}</span>
                          <span className="text-[10px] text-slate-400">{pkg.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Minutes Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('orEnterMinutesManually')}</label>
                    <Input
                      type="number"
                      min="1"
                      value={minutesToAdd}
                      onChange={(e) => setMinutesToAdd(Number(e.target.value))}
                      className={cn("bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-[#14B8A6]", isArabic ? "text-right" : "text-left")}
                    />
                  </div>
                </>
              ) : (
                /* Topup Mode: Cash */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    {t('quickCashPackLabel', { currency: getCaptainCurrency(topupCaptain, isArabic) })}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashBalanceToAdd(amt)}
                        className={cn(
                          "py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                          cashBalanceToAdd === amt
                            ? "border-amber-500 bg-amber-500/20 text-amber-300"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        +{amt} {getCaptainCurrency(topupCaptain, isArabic)}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {t('orEnterCashManually', { currency: getCaptainCurrency(topupCaptain, isArabic) })}
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={cashBalanceToAdd}
                      onChange={(e) => setCashBalanceToAdd(Number(e.target.value))}
                      className={cn("bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-amber-500", isArabic ? "text-right" : "text-left")}
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopupCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
                >
                  {t('cancelBtn')}
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction || (topupMode === 'minutes' ? minutesToAdd <= 0 : cashBalanceToAdd <= 0)}
                  onClick={async () => {
                    const capCurr = getCaptainCurrency(topupCaptain, isArabic);
                    if (topupMode === 'minutes') {
                      const ok = await executeAdminAction({
                        action: 'topup_minutes',
                        userId: topupCaptain.id,
                        minutes: minutesToAdd,
                        extendDays,
                      }, isArabic ? `تم شحن ${minutesToAdd} دقيقة رادار بنجاح.` : `Successfully added ${minutesToAdd} radar minutes.`);
                      if (ok) setTopupCaptain(null);
                    } else {
                      const ok = await executeAdminAction({
                        action: 'adjust_balance',
                        userId: topupCaptain.id,
                        amount: cashBalanceToAdd,
                      }, isArabic ? `تم إيداع ${cashBalanceToAdd} ${capCurr} في محفظة الكابتن المعلن بنجاح.` : `Successfully deposited ${cashBalanceToAdd} ${capCurr} into captain wallet.`);
                      if (ok) setTopupCaptain(null);
                    }
                  }}
                  className={cn(
                    "font-black text-xs h-10 px-5 rounded-xl shadow-lg transition-all cursor-pointer",
                    topupMode === 'minutes'
                      ? "bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] shadow-[#14B8A6]/20"
                      : "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                  )}
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Zap className="h-4 w-4 ml-1" />}
                  {topupMode === 'minutes' ? t('confirmMinutesTopup') : t('confirmCashDeposit')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: Status, Penalties & Sovereign Anti-Cheat                         */}
      {/* ========================================================================= */}
      <Dialog open={!!securityCaptain} onOpenChange={(open) => !open && setSecurityCaptain(null)}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-amber-500/40 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {securityCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  {t('securityModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  {t('securityModalDesc', { name: securityCaptain.full_name })}
                </DialogDescription>
              </DialogHeader>

              {/* Status Change Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">{t('changeOperationalStatus')}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { st: 'ACTIVE', label: t('activateNow'), cl: 'text-emerald-400 border-emerald-500/30' },
                    { st: 'IDLE', label: t('statusIdle'), cl: 'text-slate-300 border-slate-500/30' },
                    { st: 'SUSPENDED', label: t('freezeAction'), cl: 'text-amber-400 border-amber-500/30' },
                    { st: 'BANNED', label: t('banAction'), cl: 'text-rose-400 border-rose-500/30' },
                  ].map((s) => (
                    <button
                      key={s.st}
                      type="button"
                      onClick={() => setTargetStatus(s.st)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold transition",
                        targetStatus === s.st
                          ? `bg-white/10 ${s.cl} font-black ring-1 ring-white/20`
                          : "border-white/5 bg-black/40 text-slate-500 hover:text-white"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Sovereign Rank Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">{t('sovereignTier')}</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTargetTier(tier)}
                      className={cn(
                        "py-2 rounded-xl border font-bold text-center transition",
                        targetTier === tier
                          ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                          : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-click Reset Penalties */}
              <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-300">{t('penaltiesRecord')}</p>
                  <p className="text-[10px] text-slate-400">
                    {t('currentlyRecorded')} <span className="font-bold text-amber-400 font-mono">{t('penaltiesLogged', { count: securityCaptain.penalty_count })}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingAction}
                  onClick={async () => {
                    await executeAdminAction({
                      action: 'reset_penalties',
                      userId: securityCaptain.id,
                    }, isArabic ? 'تم تصفير المخالفات وإعادة التقييم بنجاح.' : 'Penalties successfully reset.');
                  }}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] h-8 rounded-xl font-bold cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 ml-1" />
                  {t('resetPenaltiesBtn')}
                </Button>
              </div>

              {/* Stuck trip release button */}
              {securityCaptain.status === 'BUSY' && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-300">{t('releaseStuckTripTitle')}</p>
                    <p className="text-[10px] text-slate-400">{t('releaseStuckTripDesc')}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submittingAction}
                    onClick={async () => {
                      await executeAdminAction({
                        action: 'force_clear_trip',
                        userId: securityCaptain.id,
                      }, isArabic ? 'تم تحرير الكابتن المعلن وإعادته لوضع الجاهزية IDLE.' : 'Captain trip cleared, reverted to IDLE status.');
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] h-8 rounded-xl font-bold cursor-pointer"
                  >
                    {t('releaseStuckTripBtn')}
                  </Button>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecurityCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
                >
                  {t('cancelBtn')}
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction}
                  onClick={async () => {
                    let ok = true;
                    if (targetStatus !== securityCaptain.status) {
                      ok = await executeAdminAction({
                        action: 'update_status',
                        userId: securityCaptain.id,
                        status: targetStatus,
                      }, isArabic ? `تم تحديث حالة الكابتن المعلن إلى ${targetStatus}` : `Captain status updated to ${targetStatus}`);
                    }
                    if (String(targetTier).toUpperCase() !== String(securityCaptain.tier).toUpperCase()) {
                      ok = await executeAdminAction({
                        action: 'update_tier',
                        userId: securityCaptain.id,
                        tier: targetTier,
                      }, isArabic ? `تم ترقية الرتبة إلى ${targetTier}` : `Tier upgraded to ${targetTier}`);
                    }
                    if (ok) setSecurityCaptain(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <ShieldCheck className="h-4 w-4 ml-1" />}
                  {t('saveSecurityActions')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: Send Direct Message & Administrative Directive                   */}
      {/* ========================================================================= */}
      <Dialog open={!!messageCaptain} onOpenChange={(open) => !open && setMessageCaptain(null)}>
        <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl", isArabic ? "text-right" : "text-left")} dir={direction}>
          {messageCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>{t('sendMessageModalTitle')}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  {t('sendMessageModalDesc')}
                </DialogDescription>
              </DialogHeader>

              {/* Captain Target Profile Banner */}
              <div className="bg-[#161F30]/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-teal-500/40 rounded-xl">
                    <AvatarFallback className="bg-teal-500/20 text-teal-300 font-bold text-xs">
                      {messageCaptain.full_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{messageCaptain.full_name}</span>
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                        {messageCaptain.serial_id}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {messageCaptain.phone} • {messageCaptain.governorate}
                    </p>
                  </div>
                </div>

                {/* Direct WhatsApp Action */}
                {messageCaptain.phone && (
                  <a
                    href={`https://wa.me/${messageCaptain.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isArabic ? `مرحباً كابتن معلن ${messageCaptain.full_name}، نتواصل معك من إدارة بينكم - bynkcom.` : `Hello Captain ${messageCaptain.full_name}, contacting you from bynkcom Administration.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    title={isArabic ? "فتح محادثة واتساب فورية" : "Open instant WhatsApp chat"}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('whatsappBtn')}</span>
                  </a>
                )}
              </div>

              {/* Message Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t('msgTypePriority')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageType('admin_message')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                      messageType === 'admin_message'
                        ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    {t('msgTypeAdmin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('warning')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                      messageType === 'warning'
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    {t('msgTypeWarning')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('urgent')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                      messageType === 'urgent'
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    {t('msgTypeUrgent')}
                  </button>
                </div>
              </div>

              {/* Message Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t('msgSubjectLabel')}</label>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder={t('msgTitlePlaceholder')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500", isArabic ? "text-right" : "text-left")}
                />
              </div>

              {/* Fast Quick Templates */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">{t('quickTemplatesLabel')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {(isArabic ? [
                    "يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب تعليق الحساب.",
                    "تمت مراجعة حسابك واعتماد بياناتك ووثائقك بنجاح.",
                    "تنبيه إداري: نرجو الالتزام بعدم إلغاء الرحلات بعد قبولها لضمان استقرار حسابك.",
                    "شكر وتقدير من إدارة الرادار لأدائك المتميز والتزامك العالي.",
                    "يرجى التأكد من تشغيل محدد الموقع (GPS) بدقة عالية أثناء فترات العمل."
                  ] : [
                    "Please renew driving license or vehicle documents to avoid account suspension.",
                    "Your account has been audited and verified successfully.",
                    "Administrative notice: Please avoid canceling accepted trips to preserve your account stability.",
                    "Appreciation from Radar Administration for your exemplary service and commitment.",
                    "Please ensure GPS high-accuracy mode is enabled during active duty."
                  ]).map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageBody(tpl)}
                      className={cn("text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer", isArabic ? "text-right" : "text-left")}
                    >
                      {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">{t('msgContentLabel')}</label>
                  <button
                    type="button"
                    disabled={isTranslatingDirect || !messageBody.trim()}
                    onClick={handleTranslateDirect}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                    title={isArabic ? 'توليد الترجمة الإنجليزية تلقائياً' : 'Auto-generate English translation'}
                  >
                    {isTranslatingDirect ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                    <span>{isArabic ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}</span>
                  </button>
                </div>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder={t('msgBodyPlaceholder')}
                  rows={3}
                  className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
                  required
                />
              </div>

              {/* English Version (Optional / Auto-generated) */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>{isArabic ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)' : 'English Version (Delivered if user UI is in English)'}</span>
                  </label>
                  {messageBodyEn && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      {isArabic ? 'مترجم ✓' : 'Ready ✓'}
                    </span>
                  )}
                </div>
                <Input
                  value={messageTitleEn}
                  onChange={(e) => setMessageTitleEn(e.target.value)}
                  placeholder="English Subject (Optional, auto-generated)"
                  className="bg-black/60 border-white/10 text-white text-xs h-8 rounded-lg focus:border-teal-500 text-left font-sans"
                  dir="ltr"
                />
                <textarea
                  value={messageBodyEn}
                  onChange={(e) => setMessageBodyEn(e.target.value)}
                  placeholder="English message content (Auto-fills when clicking 'Auto-Translate to English')"
                  rows={2}
                  className="w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg focus:border-teal-500 outline-none resize-none font-sans leading-relaxed text-left"
                  dir="ltr"
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMessageCaptain(null)}
                  disabled={submittingMessage}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
                >
                  {t('cancelBtn')}
                </Button>

                <Button
                  type="button"
                  disabled={submittingMessage || !messageBody.trim()}
                  onClick={async () => {
                    setSubmittingMessage(true);
                    try {
                      const ok = await executeAdminAction({
                        action: 'send_message',
                        userId: messageCaptain.id,
                        title: messageTitle.trim(),
                        message: messageBody.trim(),
                        titleEn: messageTitleEn.trim(),
                        messageEn: messageBodyEn.trim(),
                        type: messageType,
                      }, isArabic ? 'تم إرسال الرسالة إلى الكابتن المعلن بنجاح عبر الإشعار اللحظي.' : 'Notification sent to captain successfully.');

                      if (ok) {
                        setMessageCaptain(null);
                        setMessageBody('');
                        setMessageTitleEn('');
                        setMessageBodyEn('');
                      }
                    } finally {
                      setSubmittingMessage(false);
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  {submittingMessage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-1" />
                      {t('sendInstantNotification')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: Bulk Top-Up (Fleet / Selected / Filtered)                        */}
      {/* ========================================================================= */}
      <Dialog open={isBulkTopupOpen} onOpenChange={setIsBulkTopupOpen}>
        <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#14B8A6]" />
                {t('bulkTopupTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                {t('bulkTopupSubtitle')}
              </DialogDescription>
            </DialogHeader>

            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{t('targetScopeLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkScope('all')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'all'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeAllCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({captains.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('selected')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'selected'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeSelectedCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({selectedCaptainIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('filtered')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'filtered'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeFilteredCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({filteredCaptains.length})</span>
                </button>
              </div>

              {bulkScope === 'selected' && selectedCaptainIds.size === 0 && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                  {t('noCaptainsSelectedWarning')}
                </p>
              )}
            </div>

            {/* Topup Type Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{t('topupTypeLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkTopupType('minutes')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                    bulkTopupType === 'minutes'
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{t('radarMinutesType')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkTopupType('cash')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                    bulkTopupType === 'cash'
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>{t('cashBalanceType')}</span>
                </button>
              </div>
            </div>

            {/* Minutes inputs */}
            {bulkTopupType === 'minutes' && (
              <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('chooseMinutesCount')}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { m: 30, label: `+30 ${t('minuteUnit')}` },
                      { m: 60, label: `+60 ${t('minuteUnit')}` },
                      { m: 120, label: `+120 ${t('minuteUnit')}` },
                      { m: 300, label: `+300 ${t('minuteUnit')}` },
                    ].map((p) => (
                      <button
                        key={p.m}
                        type="button"
                        onClick={() => setBulkMinutes(p.m)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                          bulkMinutes === p.m
                            ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                            : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 shrink-0">{t('orCustomMinutes')}</span>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={bulkMinutes}
                      onChange={(e) => setBulkMinutes(Math.max(1, Number(e.target.value)))}
                      className={cn("bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-emerald-500 text-xs", isArabic ? "text-right" : "text-left")}
                      placeholder={t('minuteUnit')}
                    />
                    <span className="text-xs text-slate-400">{t('minuteUnit')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cash inputs */}
            {bulkTopupType === 'cash' && (
              <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <label className="text-xs font-bold text-slate-300">{t('chooseCashDeposit')}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBulkCashAmount(amt)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                        bulkCashAmount === amt
                          ? "bg-amber-500/30 border-amber-400 text-amber-200"
                          : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400 shrink-0">{t('orCustomCash')}</span>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={bulkCashAmount}
                    onChange={(e) => setBulkCashAmount(Math.max(0.5, Number(e.target.value)))}
                    className={cn("bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-amber-500 text-xs", isArabic ? "text-right" : "text-left")}
                    placeholder="0.0"
                  />
                </div>
              </div>
            )}

            {/* Impact Summary */}
            <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                <span>{t('topupSummaryHeader')}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {t('topupSummaryText', {
                  amount: bulkTopupType === 'minutes' ? `${bulkMinutes} ${t('minuteUnit')}` : `${bulkCashAmount}`,
                  count: getTargetCount(bulkScope),
                })}
              </p>
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkTopupOpen(false)}
                disabled={submittingBulkTopup}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
              >
                {t('cancelBtn')}
              </Button>

              <Button
                type="button"
                disabled={
                  submittingBulkTopup ||
                  getTargetCount(bulkScope) === 0 ||
                  (bulkTopupType === 'minutes' ? bulkMinutes <= 0 : bulkCashAmount <= 0)
                }
                onClick={handleBulkTopup}
                className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-[#14B8A6]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {submittingBulkTopup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    {t('charging')}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 ml-1" />
                    {t('confirmBulkTopupBtn', { count: getTargetCount(bulkScope) })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: Bulk Send Message / Broadcast Notification                       */}
      {/* ========================================================================= */}
      <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
        <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-400" />
                {t('bulkBroadcastHeader')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                {t('bulkBroadcastSubtitle')}
              </DialogDescription>
            </DialogHeader>

            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{t('targetScopeMessageLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkScope('all')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'all'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeAllCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({captains.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('selected')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'selected'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeSelectedCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({selectedCaptainIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('filtered')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'filtered'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>{t('scopeFilteredCaptains')}</span>
                  <span className="text-[11px] font-mono opacity-80">({filteredCaptains.length})</span>
                </button>
              </div>

              {bulkScope === 'selected' && selectedCaptainIds.size === 0 && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                  {t('noCaptainsSelectedWarning')}
                </p>
              )}
            </div>

            {/* Message Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{t('msgTypePriority')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkMsgType('admin_message')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'admin_message'
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {t('msgTypeAdmin')}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMsgType('warning')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'warning'
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {t('msgTypeWarning')}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMsgType('urgent')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'urgent'
                      ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {t('msgTypeUrgent')}
                </button>
              </div>
            </div>

            {/* Message Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{t('msgSubjectLabel')}</label>
              <Input
                value={bulkMsgTitle}
                onChange={(e) => setBulkMsgTitle(e.target.value)}
                placeholder={t('msgTitlePlaceholder')}
                className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-indigo-500", isArabic ? "text-right" : "text-left")}
              />
            </div>

            {/* Fast Quick Templates */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">{t('quickTemplatesLabel')}</label>
              <div className="flex flex-wrap gap-1.5">
                {(isArabic ? [
                  "بشرى سارة: تم شحن دقائق إضافية لحسابكم بمناسبة نهاية الأسبوع!",
                  "تنبيه هام: يرجى تفعيل وضع الاتصال، الطلبات في منطقتك مرتفعة الآن!",
                  "إشعار تشغيلي: يرجى التأكد من استقرار إشارة GPS وتحديث التطبيق لأحدث إصدار.",
                  "شكر وتقدير: إدارة المنظومة تشكركم على التزامكم العالي وخدمتكم الممتازة.",
                  "تنويه أمني: نذكركم بالالتزام بالتسعيرة الرسمية وعدم إلغاء الرحلات بعد قبولها."
                ] : [
                  "Good news: Extra flight minutes have been credited to your account for the weekend!",
                  "Important alert: Please go online, order demand in your area is surging right now!",
                  "Operational notice: Please ensure high GPS accuracy and update app to the latest version.",
                  "Appreciation: System administration thanks you for your outstanding commitment and excellence.",
                  "Security notice: Reminder to adhere to official fare formulas and avoid trip cancellations."
                ]).map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBulkMsgBody(tpl)}
                    className={cn("text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer", isArabic ? "text-right" : "text-left")}
                  >
                    {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">{t('msgContentLabel')}</label>
                <button
                  type="button"
                  disabled={isTranslatingBulk || !bulkMsgBody.trim()}
                  onClick={handleTranslateBulk}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  title={isArabic ? 'توليد الترجمة الإنجليزية تلقائياً' : 'Auto-generate English translation'}
                >
                  {isTranslatingBulk ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  <span>{isArabic ? 'ترجمة تلقائية للإنجليزية' : 'Auto-Translate to English'}</span>
                </button>
              </div>
              <textarea
                value={bulkMsgBody}
                onChange={(e) => setBulkMsgBody(e.target.value)}
                placeholder={t('msgBodyPlaceholder')}
                rows={3}
                className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-indigo-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
                required
              />
            </div>

            {/* English Version (Optional / Auto-generated) */}
            <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isArabic ? 'النسخة الإنجليزية (تصل للمستخدم إذا كانت واجهته بالإنجليزية)' : 'English Version (Delivered if user UI is in English)'}</span>
                </label>
                {bulkMsgBodyEn && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    {isArabic ? 'مترجم ✓' : 'Ready ✓'}
                  </span>
                )}
              </div>
              <Input
                value={bulkMsgTitleEn}
                onChange={(e) => setBulkMsgTitleEn(e.target.value)}
                placeholder="English Broadcast Subject (Optional, auto-generated)"
                className="bg-black/60 border-white/10 text-white text-xs h-8 rounded-lg focus:border-indigo-500 text-left font-sans"
                dir="ltr"
              />
              <textarea
                value={bulkMsgBodyEn}
                onChange={(e) => setBulkMsgBodyEn(e.target.value)}
                placeholder="English broadcast message (Auto-fills when clicking 'Auto-Translate to English')"
                rows={2}
                className="w-full bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-lg focus:border-indigo-500 outline-none resize-none font-sans leading-relaxed text-left"
                dir="ltr"
              />
            </div>

            {/* Broadcast Summary */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>{t('broadcastSummaryHeader')}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {t('broadcastSummaryText', { count: getTargetCount(bulkScope) })}
              </p>
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkMessageOpen(false)}
                disabled={submittingBulkMsg}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
              >
                {t('cancelBtn')}
              </Button>

              <Button
                type="button"
                disabled={submittingBulkMsg || getTargetCount(bulkScope) === 0 || !bulkMsgBody.trim()}
                onClick={handleBulkSendMessage}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {submittingBulkMsg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-1" />
                    {t('confirmBulkBroadcastBtn', { count: getTargetCount(bulkScope) })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
