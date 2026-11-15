import type {
  CaptainProfileMetadata,
  RiderSupabaseSignUpInput,
} from './supabase-auth-logic';

export interface CaptainSignUpInput extends Omit<RiderSupabaseSignUpInput, 'role' | 'captainProfile'> {
  captainProfile: CaptainProfileMetadata;
  identityFile?: File | null;
  drivingLicenseFile?: File | null;
}

export async function uploadCaptainDocument(userId: string, file: File, kind: 'identity' | 'driving-license') {
  const { supabase } = await import('@/lib/supabase-client');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}`;
  const path = `${userId}/${kind}-${token}.${extension}`;
  const { error } = await supabase.storage.from('captain-documents').upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;
  return path;
}

export async function syncCaptainProfileFromAuthUser(
  authUser: { id: string; user_metadata?: Record<string, unknown> } | null,
  explicitProfile?: CaptainProfileMetadata,
  documents?: { identityFile?: File | null; drivingLicenseFile?: File | null },
) {
  if (!authUser?.id) return;

  const metadata = authUser.user_metadata || {};
  const role = String(metadata.role || '').toUpperCase();
  const metadataProfile = metadata.captain_profile;
  const captainProfile = explicitProfile || (
    metadataProfile && typeof metadataProfile === 'object'
      ? metadataProfile as CaptainProfileMetadata
      : undefined
  );

  if (role !== 'CAPTAIN' || !captainProfile) return;

  const { supabase } = await import('@/lib/supabase-client');
  const identityPath = documents?.identityFile
    ? await uploadCaptainDocument(authUser.id, documents.identityFile, 'identity')
    : captainProfile.identity_url || null;
  const drivingLicensePath = documents?.drivingLicenseFile
    ? await uploadCaptainDocument(authUser.id, documents.drivingLicenseFile, 'driving-license')
    : captainProfile.driving_license_url || null;
  const documentFields = documents
    ? { identity_url: identityPath, driving_license_url: drivingLicensePath }
    : {};
  const { verification_status: _ignoredVerificationStatus, ...safeCaptainProfile } =
    captainProfile as CaptainProfileMetadata & { verification_status?: unknown };
  const { error } = await supabase.from('captain_profiles').upsert(
    {
      id: authUser.id,
      ...safeCaptainProfile,
      ...documentFields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}
