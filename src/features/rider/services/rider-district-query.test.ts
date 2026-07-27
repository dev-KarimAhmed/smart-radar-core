import assert from 'node:assert/strict';
import { buildDistrictLoadKey } from './rider-district-query';

const initialKey = buildDistrictLoadKey({
  selectedGovernorateId: '14',
  destinationPinLocation: null,
  externalLocationContext: null,
});

const keyAfterSelectingDistrict = buildDistrictLoadKey({
  selectedGovernorateId: '14',
  destinationPinLocation: { lat: 31.9539, lng: 35.9106 },
  externalLocationContext: null,
});

assert.equal(
  keyAfterSelectingDistrict,
  initialKey,
  'selecting a district must not trigger another database load for the same governorate',
);

assert.notEqual(
  buildDistrictLoadKey({
    selectedGovernorateId: 'google:amman',
    destinationPinLocation: { lat: 31.9539, lng: 35.9106 },
    externalLocationContext: {
      governorate: 'Amman',
      district: 'Wadi Al Seer',
      placeName: 'Wadi Al Seer',
    },
  }),
  buildDistrictLoadKey({
    selectedGovernorateId: 'google:amman',
    destinationPinLocation: { lat: 31.9639, lng: 35.9206 },
    externalLocationContext: {
      governorate: 'Amman',
      district: 'Wadi Al Seer',
      placeName: 'Wadi Al Seer',
    },
  }),
  'external map locations must reload when their coordinates change',
);

console.log('rider district query checks passed');
