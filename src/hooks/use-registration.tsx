'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { trackSovereignError } from '@/lib/error-tracker';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import type { AffiliationType } from '@/core/types';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, limit } from 'firebase/firestore';

interface RegistrationContextType {
  step: 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep';
  setStep: (step: 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep') => void;
  role: 'rider' | 'driver' | 'advertiser' | null;
  setRole: (role: 'rider' | 'driver' | 'advertiser' | null) => void;
  personal: { name: string; phone: string; gov: string; district: string; verificationDoc: string };
  setPersonal: (personal: any) => void;
  advertiserProfile: { companyName: string; commercialRegister: string; adLicense: string; businessType: string };
  setAdvertiserProfile: (profile: any) => void;
  affiliation: AffiliationType | null;
  setAffiliation: (affiliation: any) => void;
  vehicle: any;
  setVehicle: (vehicle: any) => void;
  isSubmitting: boolean;
  districts: string[];
  handlePersonalSubmit: (e: React.FormEvent) => void;
  handleVehicleSubmit: (e: React.FormEvent) => void;
  handleAdvertiserSubmit: (e: React.FormEvent) => void;
  adminCreds: any;
  setAdminCreds: (creds: any) => void;
  handleAdminSubmit: (e: React.FormEvent) => void;
  handleLogoTap: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [step, setStep] = useState<'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep'>('role');
  const [role, setRole] = useState<'rider' | 'driver' | 'advertiser' | null>(null);
  const [personal, setPersonal] = useState({ name: '', phone: '', gov: '', district: '', verificationDoc: '' });
  const [advertiserProfile, setAdvertiserProfile] = useState({ companyName: '', commercialRegister: '', adLicense: '', businessType: 'commercial' });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });

  const districts = getDistrictsByGovernorate(personal.gov);

  useEffect(() => {
    if (personal.gov && !districts.includes(personal.district)) {
      setPersonal(p => ({ ...p, district: '' }));
    }
  }, [personal.gov, districts, personal.district]);

  const getSovereignDeviceId = (): string => {
    let deviceId = localStorage.getItem('sovereign_device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 12) + '-' + Date.now();
      localStorage.setItem('sovereign_device_id', deviceId);
    }
    return deviceId;
  };
  
  const submitRegistration = useCallback(async () => {
    if (!role || !personal.name || !personal.phone || !personal.gov || !personal.district) {
      toast({ variant: 'destructive', title: 'الرجاء ملء الحقول', description: 'يرجى ملء جميع الحقول المطلوبة للمتابعة.' });
      return;
    }

    if (role === 'advertiser') {
      if (!advertiserProfile.companyName || !advertiserProfile.commercialRegister || !advertiserProfile.adLicense) {
        toast({
          variant: 'destructive',
          title: 'البيانات التجارية معلقة ⚠️',
          description: 'يرجى ملء كافة تفاصيل السجل والترخيص التجاري لإنجاز خطوة التوثيق المهني.'
        });
        return;
      }
    }
    
    const phoneRegex = /^\+9627[789]\d{7}$/;
    if (!phoneRegex.test(personal.phone)) {
        toast({ 
          variant: 'destructive', 
          title: 'رقم الهاتف غير معتمد', 
          description: 'يرجى إدخال الهاتف بالصيغة الدولية المعتمدة الأردنية مثلاً: +962770000000' 
        });
        return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    try {
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;

        const newUserProfileData: any = {
            uid,
            phone: personal.phone,
            role,
            name: personal.name,
            governorate: personal.gov,
            district: personal.district,
            avatar: `https://picsum.photos/seed/${uid}/100/100`,
            createdAt: serverTimestamp(),
            status: 'active',
            rating: 5.0, // [SCR-AUTH-PROTO-140] رصيد الثقة الموحد المبدئي (5.0 / 5.0) لكل من الراكب والناقل
            verificationDoc: personal.verificationDoc || null, // وثائق التحقق مشفرة ومضغوطة محلياً للحافة
        };

        if (role === 'driver') {
            const deviceId = getSovereignDeviceId();
            // Anti-Sybil Check
            const driverQuery = query(
                collection(db, 'users'),
                where('role', '==', 'driver'),
                where('deviceId', '==', deviceId),
                limit(1)
            );
            const snapshot = await getDocs(driverQuery);
            if (!snapshot.empty) {
                throw new Error('SYBIL_ATTACK_DETECTED');
            }
            newUserProfileData.deviceId = deviceId;

            const vehiclePayload = affiliation === 'office-taxi'
              ? { year: parseInt(vehicle.year) || 2020, plate: vehicle.plate, sideId: vehicle.sideId, make: 'Kia', color: 'Yellow' }
              : { year: parseInt(vehicle.year) || 2020, plate: vehicle.plate, make: vehicle.make, color: vehicle.color };

            const affiliationPayload = affiliation === 'office-taxi'
              ? { type: affiliation, name: vehicle.officeName, phone: vehicle.officePhone }
              : { type: affiliation, name: vehicle.companyName };
            
            Object.assign(newUserProfileData, {
                affiliation: affiliationPayload,
                vehicle: vehiclePayload,
                status: 'idle',
                rank: 'Bronze'
            });
        } else if (role === 'advertiser') {
            newUserProfileData.deviceId = getSovereignDeviceId();
            newUserProfileData.companyName = advertiserProfile.companyName || '';
            newUserProfileData.commercialRegister = advertiserProfile.commercialRegister || '';
            newUserProfileData.adLicense = advertiserProfile.adLicense || '';
            newUserProfileData.businessType = advertiserProfile.businessType || 'commercial';
        } else {
            newUserProfileData.deviceId = getSovereignDeviceId();
        }

        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, newUserProfileData);
    } catch (error: any) {
        trackSovereignError(error, { context: 'DirectRegistration' });
        toast({ variant: 'destructive', title: 'عجز في السجلات السيادية', description: getSovereignErrorMessage(error) });
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            await signOut(auth);
        }
    } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
    }
  }, [role, personal, affiliation, vehicle, advertiserProfile, toast]);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'rider') {
      submitRegistration();
    } else if (role === 'advertiser') {
      setStep('ProfessionalStep');
    } else {
      setStep('affiliation');
    }
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRegistration();
  };

  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRegistration();
  };

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 5) {
      setStep('admin');
      setLogoTapCount(0);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      toast({ title: 'نظام التحكم الرئيسي', description: 'هذا النظام للمشرفين؛ يرجى مراجعة إدارة السيادة ملاحياً.' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'فشل تفعيل لوحة التحكم', description: getSovereignErrorMessage(error) });
    } finally {
        setIsSubmitting(false);
    }
  };

  const value = {
    step, setStep,
    role, setRole,
    personal, setPersonal,
    advertiserProfile, setAdvertiserProfile,
    affiliation, setAffiliation,
    vehicle, setVehicle,
    isSubmitting,
    districts,
    handlePersonalSubmit,
    handleVehicleSubmit,
    handleAdvertiserSubmit,
    adminCreds, setAdminCreds,
    handleAdminSubmit,
    handleLogoTap,
  };

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
