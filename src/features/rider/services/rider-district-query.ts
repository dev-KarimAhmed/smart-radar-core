interface DistrictLoadKeyInput {
  selectedGovernorateId: string;
  destinationPinLocation: { lat: number; lng: number } | null;
  externalLocationContext: {
    governorate?: string;
    district?: string;
    placeName?: string;
  } | null;
  selectedGovernorateName?: string;
}

export function buildDistrictLoadKey({
  selectedGovernorateId,
  destinationPinLocation,
  externalLocationContext,
  selectedGovernorateName = '',
}: DistrictLoadKeyInput): string {
  if (!selectedGovernorateId.startsWith('google:')) {
    return `database:${selectedGovernorateId}`;
  }

  return JSON.stringify({
    selectedGovernorateId,
    destinationPinLocation,
    externalLocationContext,
    selectedGovernorateName,
  });
}
