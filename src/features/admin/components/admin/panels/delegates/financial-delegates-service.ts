import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { DelegateFormData, FinancialDelegate } from './financial-delegates-types';

export async function fetchDelegatesDirectoryApi(): Promise<{
  success: boolean;
  governorates?: Array<{ id: number; name_ar: string; country_id: number }>;
  districts?: Array<{ id: number; name_ar: string; governorate_id: number }>;
}> {
  const res = await adminFetch('/api/admin/financial-delegates?type=directory');
  return res.json();
}

export async function fetchDelegatesListApi(): Promise<{
  success: boolean;
  delegates?: FinancialDelegate[];
  error?: string;
}> {
  const res = await adminFetch('/api/admin/financial-delegates');
  return res.json();
}

export async function saveDelegateApi(
  formData: DelegateFormData,
  editingId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const payload = {
    id: editingId,
    name: formData.name.trim(),
    phone: formData.phone.trim().replace(/^\+/, ''),
    whatsapp: formData.whatsapp.trim() ? formData.whatsapp.trim().replace(/^\+/, '') : null,
    countryId: formData.countryId ? Number(formData.countryId) : 1,
    governorateId: formData.governorateId ? Number(formData.governorateId) : null,
    governorateName: formData.governorateName.trim() || null,
    districtId: formData.districtId ? Number(formData.districtId) : null,
    districtName: formData.districtName.trim() || null,
    notes: formData.notes.trim() || null,
    isActive: formData.isActive,
  };

  const method = editingId ? 'PUT' : 'POST';
  const res = await adminFetch('/api/admin/financial-delegates', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function toggleDelegateStatusApi(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await adminFetch('/api/admin/financial-delegates', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, isActive }),
  });
  return res.json();
}

export async function deleteDelegateApi(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await adminFetch(`/api/admin/financial-delegates?id=${id}`, {
    method: 'DELETE',
  });
  return res.json();
}
