'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { GeoLookup } from '../geo-filter-bar';
import { requestTranslation } from '@/shared/utils/notification-i18n';
import { RiderUser } from './riders-types';

export function useRidersManagement() {
  const t = useTranslations('adminRiders');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  const [riders, setRiders] = useState<RiderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [immunityFilter, setImmunityFilter] = useState<string>('ALL');

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
    if (val !== 'ALL') {
      const gov = geoLookup.governorates.find((g) => String(g.id) === val);
      if (gov) {
        setSelectedCountry(String(gov.country_id));
      }
    }
  }, [geoLookup.governorates]);

  const handleDistrictChange = useCallback((val: string) => {
    setSelectedDistrict(val);
    if (val !== 'ALL') {
      const dist = geoLookup.districts.find((d) => String(d.id) === val);
      if (dist) {
        const gov = geoLookup.governorates.find((g) => g.id === dist.governorate_id);
        if (gov) {
          setSelectedGovernorate(String(gov.id));
          setSelectedCountry(String(gov.country_id));
        }
      }
    }
  }, [geoLookup.districts, geoLookup.governorates]);

  const handleResetGeo = useCallback(() => {
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  // Multi-selection state
  const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());

  // Modals state
  const [inspectRider, setInspectRider] = useState<RiderUser | null>(null);
  const [securityRider, setSecurityRider] = useState<RiderUser | null>(null);

  // Inactivity simulation state
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationRiderId, setSimulationRiderId] = useState<string | null>(null);

  const handleOpenSimulationForRider = (rider: RiderUser) => {
    setSimulationRiderId(rider.id);
    setIsSimulationOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct Message modal inputs
  const [messageRider, setMessageRider] = useState<RiderUser | null>(null);
  const [messageTitle, setMessageTitle] = useState(
    isArabic ? 'رسالة من إدارة المنظومة' : 'Message from Platform Administration'
  );
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
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.' : 'You can review or edit the translated text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed',
        description: isArabic ? 'يرجى إدخال النص الإنجليزي يدوياً.' : 'Please enter English text manually.',
      });
    } finally {
      setIsTranslatingDirect(false);
    }
  };

  // Bulk Broadcast modal inputs
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'selected' | 'filtered'>('all');
  const [bulkMsgTitle, setBulkMsgTitle] = useState(
    isArabic ? 'إشعار توجيهي من إدارة المنظومة' : 'Directive Notification from System Administration'
  );
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgTitleEn, setBulkMsgTitleEn] = useState('');
  const [bulkMsgBodyEn, setBulkMsgBodyEn] = useState('');
  const [isTranslatingBulk, setIsTranslatingBulk] = useState(false);
  const [bulkMsgType, setBulkMsgType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMessage, setSubmittingBulkMessage] = useState(false);

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
        title: isArabic ? '🌐 تم إنشاء الترجمة الإنجليزية بنجاح' : '🌐 English Translation Generated',
        description: isArabic ? 'يمكنك مراجعة النص الإنجليزي المترجم أو تعديله قبل الإرسال.' : 'You can review or edit the translated text before sending.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر توليد الترجمة' : 'Translation Failed',
        description: isArabic ? 'يرجى إدخال النص الإنجليزي يدوياً.' : 'Please enter English text manually.',
      });
    } finally {
      setIsTranslatingBulk(false);
    }
  };

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRiders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users?role=RIDER');
      const data = await res.json();
      if (data?.success && Array.isArray(data.users)) {
        setRiders(data.users);
        if (data.geo) {
          setGeoLookup({
            countries: Array.isArray(data.geo.countries) ? data.geo.countries : [],
            governorates: Array.isArray(data.geo.governorates) ? data.geo.governorates : [],
            districts: Array.isArray(data.geo.districts) ? data.geo.districts : [],
          });
        }
      } else {
        throw new Error(data?.error || (isArabic ? 'فشل تحميل بيانات المستخدمين' : 'Failed to load riders data'));
      }
    } catch (err: any) {
      console.warn('[RidersManagementPanel] fetch error:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ استدعاء المستخدمين' : 'Riders Fetch Error',
        description: err.message || (isArabic ? 'تعذر جلب بيانات المستخدمين من قاعدة البيانات' : 'Could not fetch riders from database'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isArabic]);

  useEffect(() => {
    void fetchRiders();
  }, [fetchRiders]);

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
        throw new Error(result.error || (isArabic ? 'حدث خطأ أثناء معالجة الإجراء' : 'An error occurred while processing action'));
      }

      toast({
        title: isArabic ? '⚡ تم تنفيذ الإجراء بنجاح' : '⚡ Action Executed Successfully',
        description: result.message || successMsg,
      });

      await fetchRiders(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل العملية' : 'Operation Failed',
        description: err.message || (isArabic ? 'تعذر تطبيق الإجراء' : 'Could not apply action'),
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered riders
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.serial_id.toLowerCase().includes(q) ||
        (r.governorate && r.governorate.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.country_name && r.country_name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      let matchesImmunity = true;
      if (immunityFilter === 'HIGH') matchesImmunity = r.trust_score >= 4.5;
      else if (immunityFilter === 'WARNING') matchesImmunity = r.trust_score >= 4.2 && r.trust_score < 4.5;
      else if (immunityFilter === 'CRITICAL') matchesImmunity = r.trust_score < 4.2;

      // Geo Filtering: Country
      const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === selectedCountry);
      const matchesCountry =
        selectedCountry === 'ALL' ||
        r.country_id === Number(selectedCountry) ||
        (targetCountry && (r.country_name === targetCountry.name_ar || (targetCountry.country_code && r.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

      // Geo Filtering: Governorate
      const targetGov = geoLookup.governorates.find((g) => String(g.id) === selectedGovernorate);
      const matchesGov =
        selectedGovernorate === 'ALL' ||
        r.governorate_id === Number(selectedGovernorate) ||
        (targetGov && r.governorate === targetGov.name_ar);

      // Geo Filtering: District
      const targetDist = geoLookup.districts.find((d) => String(d.id) === selectedDistrict);
      const matchesDist =
        selectedDistrict === 'ALL' ||
        r.district_id === Number(selectedDistrict) ||
        (targetDist && r.district === targetDist.name_ar);

      return matchesSearch && matchesStatus && matchesImmunity && matchesCountry && matchesGov && matchesDist;
    });
  }, [
    riders,
    searchQuery,
    statusFilter,
    immunityFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
  ]);

  // Multi-selection helpers
  const handleSelectAll = () => {
    if (selectedRiderIds.size === filteredRiders.length) {
      setSelectedRiderIds(new Set());
    } else {
      setSelectedRiderIds(new Set(filteredRiders.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRiderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = riders.length;
    const online = riders.filter((r) => r.status === 'ACTIVE' || r.status === 'BUSY').length;
    const idle = riders.filter((r) => r.status === 'IDLE').length;
    const suspended = riders.filter((r) => r.status === 'SUSPENDED' || r.status === 'BANNED').length;
    const atRisk = riders.filter((r) => r.trust_score < 4.2 || r.consecutive_cancellations >= 3).length;
    const completedTrips = riders.reduce((acc, r) => acc + (r.completed_trips_count || 0), 0);
    return { total, online, idle, suspended, atRisk, completedTrips };
  }, [riders]);

  return {
    t,
    direction,
    isArabic,
    riders,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    immunityFilter,
    setImmunityFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    selectedRiderIds,
    setSelectedRiderIds,
    inspectRider,
    setInspectRider,
    securityRider,
    setSecurityRider,
    isSimulationOpen,
    setIsSimulationOpen,
    simulationRiderId,
    setSimulationRiderId,
    handleOpenSimulationForRider,
    messageRider,
    setMessageRider,
    messageTitle,
    setMessageTitle,
    messageBody,
    setMessageBody,
    messageTitleEn,
    setMessageTitleEn,
    messageBodyEn,
    setMessageBodyEn,
    isTranslatingDirect,
    handleTranslateDirect,
    messageType,
    setMessageType,
    submittingMessage,
    setSubmittingMessage,
    isBulkMessageOpen,
    setIsBulkMessageOpen,
    bulkScope,
    setBulkScope,
    bulkMsgTitle,
    setBulkMsgTitle,
    bulkMsgBody,
    setBulkMsgBody,
    bulkMsgTitleEn,
    setBulkMsgTitleEn,
    bulkMsgBodyEn,
    setBulkMsgBodyEn,
    isTranslatingBulk,
    handleTranslateBulk,
    bulkMsgType,
    setBulkMsgType,
    submittingBulkMessage,
    setSubmittingBulkMessage,
    targetStatus,
    setTargetStatus,
    submittingAction,
    fetchRiders,
    executeAdminAction,
    filteredRiders,
    handleSelectAll,
    handleToggleSelect,
    stats,
  };
}
