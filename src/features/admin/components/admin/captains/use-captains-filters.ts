import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import type { CaptainUser } from './captains-types';
import { fetchCaptainsApi, updateCaptainLanguageApi } from './captain-api-actions';

export function useCaptainsFilters() {
  const { isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<'ALL' | 'ar' | 'en'>('ALL');

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

  const handleResetAllFilters = useCallback(() => {
    setStatusFilter('ALL');
    setVerificationFilter('ALL');
    setRankFilter('ALL');
    setLanguageFilter('ALL');
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
    setSearchQuery('');
  }, []);

  // Multi-selection state
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<Set<string>>(new Set());

  const fetchCaptains = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await fetchCaptainsApi();
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

      const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === selectedCountry);
      const matchesCountry =
        selectedCountry === 'ALL' ||
        c.country_id === Number(selectedCountry) ||
        (targetCountry && (c.country_name === targetCountry.name_ar || (targetCountry.country_code && c.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

      const targetGov = geoLookup.governorates.find((g) => String(g.id) === selectedGovernorate);
      const matchesGov =
        selectedGovernorate === 'ALL' ||
        c.governorate_id === Number(selectedGovernorate) ||
        (targetGov && c.governorate === targetGov.name_ar);

      const targetDist = geoLookup.districts.find((d) => String(d.id) === selectedDistrict);
      const matchesDist =
        selectedDistrict === 'ALL' ||
        c.district_id === Number(selectedDistrict) ||
        (targetDist && c.district === targetDist.name_ar);

      const matchesLanguage =
        languageFilter === 'ALL' ||
        (c.preferred_language || 'ar').toLowerCase() === languageFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVerification &&
        matchesRank &&
        matchesLanguage &&
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
    languageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
  ]);

  const stats = useMemo(() => {
    const total = captains.length;
    const active = captains.filter(c => c.status === 'ACTIVE' || c.status === 'BUSY').length;
    const pendingVerification = captains.filter(c => c.verification_status === 'PENDING').length;
    const flagged = captains.filter(c => c.status === 'SUSPENDED' || c.status === 'BANNED' || c.penalty_count > 0).length;
    return { total, active, pendingVerification, flagged };
  }, [captains]);

  const toggleSelectOne = (id: string) => {
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const handleToggleCaptainLanguage = async (captainId: string, currentLang?: string) => {
    const nextLang = (currentLang || 'ar').toLowerCase() === 'en' ? 'ar' : 'en';
    setCaptains((prev) =>
      prev.map((c) => (c.id === captainId ? { ...c, preferred_language: nextLang } : c))
    );
    try {
      await updateCaptainLanguageApi(captainId, nextLang);
      toast({
        title: isArabic ? 'تم تحديث لغة الكابتن' : 'Language updated',
        description: isArabic
          ? `تم ضبط لغة الكابتن إلى ${nextLang === 'en' ? 'الإنجليزية 🇬🇧' : 'العربية 🇸🇦'}`
          : `Captain language set to ${nextLang === 'en' ? 'English 🇬🇧' : 'Arabic 🇸🇦'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر تحديث لغة الكابتن' : 'Failed to update captain language',
        description: err?.message || (isArabic ? 'حدث خطأ' : 'An error occurred'),
      });
      setCaptains((prev) =>
        prev.map((c) => (c.id === captainId ? { ...c, preferred_language: currentLang || 'ar' } : c))
      );
    }
  };

  return {
    captains,
    setCaptains,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    verificationFilter,
    setVerificationFilter,
    rankFilter,
    setRankFilter,
    languageFilter,
    setLanguageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    handleResetAllFilters,
    filteredCaptains,
    stats,
    selectedCaptainIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
    fetchCaptains,
    handleToggleCaptainLanguage,
  };
}
