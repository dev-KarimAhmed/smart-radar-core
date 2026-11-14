import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from '@/features/admin/types/hourly-rates';

export interface HourlyRatesDataResponse {
  countries: CountryItem[];
  governorates: GovernorateItem[];
  districts: DistrictItem[];
  customRates: CustomRatesMatrix;
}

export async function fetchHourlyRatesData(): Promise<HourlyRatesDataResponse> {
  const res = await adminFetch('/api/admin/hourly-rates');
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Failed to fetch hourly rates data');
  }
  return {
    countries: data.countries || [],
    governorates: data.governorates || [],
    districts: data.districts || [],
    customRates: data.customRates || { governorates: {}, districts: {} },
  };
}

export async function saveSingleHourlyRate(params: {
  targetType: 'governorate' | 'district';
  targetId: number;
  hourPrice: number | null;
}): Promise<void> {
  const res = await adminFetch('/api/admin/hourly-rates', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_single_rate',
      targetType: params.targetType,
      targetId: params.targetId,
      hourPrice: params.hourPrice,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update hourly rate');
  }
}

export async function resetGovernorateHourlyRate(govId: number): Promise<void> {
  const res = await adminFetch('/api/admin/hourly-rates', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reset_governorate',
      governorateId: govId,
      resetDistricts: false,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reset governorate hourly rate');
  }
}

export async function applyHourlyRateToAllDistricts(
  govId: number,
  hourPrice: number
): Promise<void> {
  const res = await adminFetch('/api/admin/hourly-rates', {
    method: 'POST',
    body: JSON.stringify({
      action: 'apply_to_governorate_districts',
      governorateId: govId,
      hourPrice,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to apply hourly rate to districts');
  }
}

