import React from 'react';
import type { User } from '@/core/types';

export function useDriverProfileFields(user: User | null) {
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null);
  const [fullName, setFullName] = React.useState(user?.name || '');
  const [nickname, setNickname] = React.useState('');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [vehiclePlate, setVehiclePlate] = React.useState('');
  const [vehicleMake, setVehicleMake] = React.useState('');
  const [vehicleModel, setVehicleModel] = React.useState('');
  const [vehicleColor, setVehicleColor] = React.useState('');
  const [vehicleYear, setVehicleYear] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [officePhone, setOfficePhone] = React.useState('');
  const [sideId, setSideId] = React.useState('');
  const [companyCode, setCompanyCode] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const [instagramUrl, setInstagramUrl] = React.useState('');
  const [baseFare, setBaseFare] = React.useState('');
  const [pricePerKm, setPricePerKm] = React.useState('');
  const [pricePerMin, setPricePerMin] = React.useState('');
  const [includedKm, setIncludedKm] = React.useState('');
  const [minBaseFare, setMinBaseFare] = React.useState(1);
  const [tariffError, setTariffError] = React.useState('');
  const initialAffiliation = (user?.affiliation?.type as string) || 'independent';
  const [affiliationType, setAffiliationType] = React.useState(initialAffiliation);
  const isTaxi = affiliationType === 'office-taxi';

  const [editingFields, setEditingFields] = React.useState<Set<string>>(new Set());
  const startEditingField = React.useCallback((key: string) => {
    setEditingFields((current) => new Set(current).add(key));
  }, []);
  const stopEditingField = React.useCallback((key: string) => {
    setEditingFields((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const savedSnapshotRef = React.useRef<Record<string, string>>({
    fullName: '', nickname: '', phone: '', vehiclePlate: '', vehicleMake: '', vehicleModel: '',
    vehicleColor: '', vehicleYear: '', businessName: '', officePhone: '', sideId: '', companyCode: '',
    facebookUrl: '', instagramUrl: '', baseFare: '', includedKm: '', pricePerKm: '', pricePerMin: '',
    affiliationType: initialAffiliation,
  });

  return {
    profile, setProfile,
    fullName, setFullName,
    nickname, setNickname,
    phone, setPhone,
    licenseNumber, setLicenseNumber,
    vehiclePlate, setVehiclePlate,
    vehicleMake, setVehicleMake,
    vehicleModel, setVehicleModel,
    vehicleColor, setVehicleColor,
    vehicleYear, setVehicleYear,
    businessName, setBusinessName,
    officePhone, setOfficePhone,
    sideId, setSideId,
    companyCode, setCompanyCode,
    facebookUrl, setFacebookUrl,
    instagramUrl, setInstagramUrl,
    baseFare, setBaseFare,
    pricePerKm, setPricePerKm,
    pricePerMin, setPricePerMin,
    includedKm, setIncludedKm,
    minBaseFare, setMinBaseFare,
    tariffError, setTariffError,
    affiliationType, setAffiliationType,
    isTaxi,
    editingFields, setEditingFields,
    startEditingField, stopEditingField,
    savedSnapshotRef,
  };
}
