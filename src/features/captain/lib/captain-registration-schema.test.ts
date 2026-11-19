import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LICENSE_NUMBER_REGEX,
  getCaptainSmartAppVehicleSchema,
  getCaptainTaxiVehicleSchema,
  getCaptainIndependentVehicleSchema,
  getCaptainPersonalSchema,
  isQuadName,
} from './captain-registration-schema';

const mockT = (key: string) => key;

test('LICENSE_NUMBER_REGEX accepts valid driver license numbers and rejects invalid ones', () => {
  assert.equal(LICENSE_NUMBER_REGEX.test('98765432'), true);
  assert.equal(LICENSE_NUMBER_REGEX.test('AB123456'), true);
  assert.equal(LICENSE_NUMBER_REGEX.test('12'), false, 'Rejects too short');
  assert.equal(LICENSE_NUMBER_REGEX.test('1234 5678'), false, 'Rejects spaces');
});

test('captain smart-app vehicle schema validates with licenseNumber and requires no national ID', async () => {
  const schema = getCaptainSmartAppVehicleSchema(mockT, 'JO');

  const validPayload = {
    companyName: 'Smart Ride Office',
    companyCode: 'SR-101',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    plate: '12-34567',
    year: 2022,
    licenseNumber: '98765432',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schema.validate(validPayload));

  const missingLicense = { ...validPayload, licenseNumber: '' };
  await assert.rejects(schema.validate(missingLicense));
});

test('captain taxi vehicle schema validates with licenseNumber and requires no national ID', async () => {
  const schema = getCaptainTaxiVehicleSchema(mockT, 'JO');

  const validPayload = {
    officeName: 'Amman Central Taxi',
    officePhone: '+962791234567',
    sideId: 'TX-44',
    make: 'Toyota',
    model: 'Prius',
    plate: '10-55443',
    year: 2022,
    licenseNumber: '55443322',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schema.validate(validPayload));
});

test('captain independent vehicle schema validates without companyName, companyCode, or national ID', async () => {
  const schemaJo = getCaptainIndependentVehicleSchema(mockT, 'JO');

  const validPayload = {
    make: 'Hyundai',
    model: 'Elantra',
    color: 'Silver',
    plate: '50-12345',
    year: 2021,
    licenseNumber: '11223344',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schemaJo.validate(validPayload));

  const invalidPayload = { ...validPayload, make: '' };
  await assert.rejects(schemaJo.validate(invalidPayload));
});

test('isQuadName strictly enforces at least 4 legal names and rejects short names', () => {
  assert.equal(isQuadName('محمد أحمد محمود خليل'), true, 'Accepts standard 4-part Arabic name');
  assert.equal(isQuadName('عبد الرحمن محمد خالد يوسف'), true, 'Accepts 5-part Arabic compound name');
  assert.equal(isQuadName('Mohammad Ahmad Mahmoud Khalil'), true, 'Accepts 4-part English name');
  assert.equal(isQuadName('محمد'), false, 'Rejects single name');
  assert.equal(isQuadName('محمد أحمد'), false, 'Rejects 2 names');
  assert.equal(isQuadName('محمد أحمد محمود'), false, 'Rejects 3 names');
  assert.equal(isQuadName('Sss'), false, 'Rejects 3-letter single word');
  assert.equal(isQuadName('علي 123 أحمد محمود'), false, 'Rejects digits');
  assert.equal(isQuadName('م أ م خ'), false, 'Rejects 1-letter abbreviations');
});

test('getCaptainPersonalSchema validates quad name', async () => {
  const schema = getCaptainPersonalSchema(mockT);

  const valid = {
    name: 'محمد أحمد محمود خليل',
    email: 'captain@example.com',
    phone: '+962791234567',
    password: 'password123',
    country: '1',
    governorate: '1',
    district: '1',
    countryIso: 'JO',
  };
  await assert.doesNotReject(schema.validate(valid));

  await assert.rejects(schema.validate({ ...valid, name: 'محمد أحمد محمود' }));
  await assert.rejects(schema.validate({ ...valid, name: 'Sss' }));
});

test('getCaptainPersonalSchema enforces mandatory email and rejects invalid format', async () => {
  const schema = getCaptainPersonalSchema(mockT);

  const base = {
    name: 'محمد أحمد محمود خليل',
    phone: '+962791234567',
    password: 'password123',
    country: '1',
    governorate: '1',
    district: '1',
    countryIso: 'JO',
  };

  await assert.rejects(schema.validate({ ...base, email: '' }));
  await assert.rejects(schema.validate({ ...base, email: undefined }));
  await assert.rejects(schema.validate({ ...base, email: 'not-an-email' }));
  await assert.rejects(schema.validate({ ...base, email: 'captain@' }));
  await assert.doesNotReject(schema.validate({ ...base, email: 'captain@test.com' }));
});
