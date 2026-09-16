import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Loader2, MessageCircle, Save, Trash2 } from 'lucide-react';
import { styles, labelFor } from './profile-shared';
import { RecoveryEmailField } from '@/features/auth/components/recovery-email-field';
import type { CountryRow, GovernorateRow, DistrictRow } from './profile-shared';

interface ProfileFormSectionProps {
  t: any;
  language: string;
  isArabic: boolean;
  isLoadingProfile: boolean;
  isLocationLoading: boolean;
  isSaving: boolean;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  emergencyWhatsappContact: string;
  setEmergencyWhatsappContact: (val: string) => void;
  countryId: string;
  handleCountryChange: (val: string) => void;
  countries: CountryRow[];
  isLoadingCountries: boolean;
  governorateId: string;
  handleGovernorateChange: (val: string) => void;
  governorates: GovernorateRow[];
  isLoadingGovernorates: boolean;
  districtId: string;
  setDistrictId: (val: string) => void;
  districts: DistrictRow[];
  isLoadingDistricts: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function ProfileFormSection({
  t,
  language,
  isArabic,
  isLoadingProfile,
  isLocationLoading,
  isSaving,
  fullName,
  setFullName,
  phone,
  setPhone,
  emergencyWhatsappContact,
  setEmergencyWhatsappContact,
  countryId,
  handleCountryChange,
  countries,
  isLoadingCountries,
  governorateId,
  handleGovernorateChange,
  governorates,
  isLoadingGovernorates,
  districtId,
  setDistrictId,
  districts,
  isLoadingDistricts,
  handleSubmit,
}: ProfileFormSectionProps) {
  return (
    <Card className={styles.style631_38}>
      <CardHeader className={styles.style632_39}>
        <CardTitle className={styles.style633_40}>
          <Database className={styles.style634_41} />
          {t('editTitle')}
        </CardTitle>
        <CardDescription className={styles.style637_42}>
          {t('editDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoadingProfile ? (
          <div className={styles.style644_43}>
            <Loader2 className={styles.style645_44} />
            {t('loadingProfile')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.style649_45}>
            <div className={styles.style650_46}>
              <label className={styles.style651_47}>{t('fullName')}</label>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={styles.style655_48}
                placeholder={t('fullNamePlaceholder')}
                required
              />
            </div>

            <div className={styles.style661_49}>
              <label className={styles.style662_50}>{t('phone')}</label>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={styles.style667_51}
                placeholder="+962790000000"
                required
              />
            </div>

            <div className={styles.recoveryEmailSlot}>
              <RecoveryEmailField />
            </div>

            <div className={styles.style673_52}>
              <label className={styles.style674_53}>
                <MessageCircle className={styles.style675_54} />
                {t('emergencyWhatsappContact')}
              </label>
              <div className={styles.style678_55}>
                <Input
                  value={emergencyWhatsappContact}
                  onChange={(event) => setEmergencyWhatsappContact(event.target.value)}
                  className={styles.style682_56}
                  placeholder={t('emergencyWhatsappPlaceholder')}
                />
                {emergencyWhatsappContact ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmergencyWhatsappContact('')}
                    className={styles.style690_57}
                    aria-label={t('deleteEmergencyContact')}
                  >
                    <Trash2 className={styles.style693_58} />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className={styles.style699_59}>
              <div className={styles.style700_60}>
                <label className={styles.style701_61}>{t('country')}</label>
                <Select value={countryId} onValueChange={handleCountryChange} required>
                  <SelectTrigger className={styles.style703_62} dir={isArabic ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={isLoadingCountries ? t('loading') : t('chooseCountry')} />
                  </SelectTrigger>
                  <SelectContent className={styles.style706_63}>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={String(country.id)} className={styles.style708_64}>
                        {labelFor(country, language as 'en' | 'ar')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.style716_65}>
                <label className={styles.style717_66}>{t('governorate')}</label>
                <Select value={governorateId} onValueChange={handleGovernorateChange} disabled={!countryId || isLoadingGovernorates} required>
                  <SelectTrigger className={styles.style719_67} dir={isArabic ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={isLoadingGovernorates ? t('loading') : t('chooseGovernorate')} />
                  </SelectTrigger>
                  <SelectContent className={styles.style722_68}>
                    {governorates.map((governorate) => (
                      <SelectItem key={governorate.id} value={String(governorate.id)} className={styles.style724_69}>
                        {labelFor(governorate, language as 'en' | 'ar')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.style732_70}>
                <label className={styles.style733_71}>{t('district')}</label>
                <Select value={districtId} onValueChange={setDistrictId} disabled={!governorateId || isLoadingDistricts} required>
                  <SelectTrigger className={styles.style735_72} dir={isArabic ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={isLoadingDistricts ? t('loading') : t('chooseDistrict')} />
                  </SelectTrigger>
                  <SelectContent className={styles.style738_73}>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={String(district.id)} className={styles.style740_74}>
                        {labelFor(district, language as 'en' | 'ar')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLocationLoading ? (
              <p className={styles.style750_75}>
                <Loader2 className={styles.style751_76} />
                {t('updatingLists')}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSaving || isLocationLoading}
              className={styles.style759_77}
            >
              {isSaving ? (
                <>
                  <Loader2 className={styles.style763_78} />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className={styles.style768_79} />
                  {t('save')}
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
