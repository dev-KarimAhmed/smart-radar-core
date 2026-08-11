import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findDistrictForGeography,
  findGovernorateForGeography,
  findNearestDistrict,
} from './destination-geography';

const governorates = [
  { id: '1', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { id: '2', nameAr: 'الجيزة', nameEn: 'Giza' },
];

const districts = [
  { id: '10', districtAr: 'المعادي', districtEn: 'Maadi' },
  { id: '11', districtAr: 'مدينة السادس من أكتوبر', districtEn: '6th of October City' },
];

test('matches a confirmed English map location to its database governorate and district', () => {
  assert.equal(
    findGovernorateForGeography(governorates, { governorate: 'Cairo Governorate', city: 'Maadi' })?.id,
    '1',
  );
  assert.equal(
    findDistrictForGeography(districts, { governorate: 'Cairo Governorate', city: 'Maadi' })?.id,
    '10',
  );
});

test('matches Arabic geography despite administrative labels and letter variants', () => {
  assert.equal(
    findGovernorateForGeography(governorates, { governorate: 'مُحَافَظَةُ الجِيْزَة' })?.id,
    '2',
  );
  assert.equal(
    findDistrictForGeography(districts, { district: 'مدينة السادس من اكتوبر' })?.id,
    '11',
  );
});

test('does not choose a different area when geography cannot be matched safely', () => {
  assert.equal(findGovernorateForGeography(governorates, { governorate: 'Alexandria' }), null);
  assert.equal(findDistrictForGeography(districts, { district: 'Heliopolis' }), null);
});

test('matches any select option from the complete reverse-geocoder address hierarchy', () => {
  const arbitraryGovernorates = [
    { id: '21', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
    { id: '22', nameAr: 'البحيرة', nameEn: 'Beheira' },
  ];
  const arbitraryDistricts = [
    { id: '210', districtAr: 'المنتزه', districtEn: 'Montaza' },
    { id: '211', districtAr: 'برج العرب', districtEn: 'Borg El Arab' },
  ];
  const geography = {
    governorateCandidates: ['Alexandria Governorate'],
    districtCandidates: ['Sidi Beshr', 'Montaza District'],
  };

  assert.equal(findGovernorateForGeography(arbitraryGovernorates, geography as never)?.id, '21');
  assert.equal(findDistrictForGeography(arbitraryDistricts, geography as never)?.id, '210');
});

test('matches real reverse-geocoder neighbourhood names instead of falling back to the profile district', () => {
  const cairoDistricts = [
    { id: '11', districtAr: 'مصر الجديدة', districtEn: 'Heliopolis' },
    { id: '13', districtAr: 'المعادي', districtEn: 'Maadi' },
  ];

  assert.equal(
    findDistrictForGeography(cairoDistricts, {
      governorate: 'القاهرة',
      districtCandidates: ['معادي الخبيري', 'الفاروقية', 'القاهرة'],
    })?.id,
    '13',
  );
});

test('uses confirmed coordinates to choose the nearest available district when address labels differ', () => {
  const cairoDistricts = [
    { id: '11', districtAr: 'مصر الجديدة', districtEn: 'Heliopolis', anchor: { lat: 30.0919, lng: 31.3239 } },
    { id: '15', districtAr: 'وسط البلد', districtEn: 'Downtown Cairo', anchor: { lat: 30.0444, lng: 31.2357 } },
  ];

  assert.equal(
    findNearestDistrict(cairoDistricts, { lat: 30.046, lng: 31.238 })?.id,
    '15',
  );
});
