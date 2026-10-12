import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JORDAN_NATIONAL_ID_REGEX,
  GENERAL_NATIONAL_ID_REGEX,
  getCaptainSmartAppVehicleSchema,
  getCaptainTaxiVehicleSchema,
  getCaptainIndependentVehicleSchema,
} from './captain-registration-schema';

const mockT = (key: string) => key;

test('JORDAN_NATIONAL_ID_REGEX enforces strictly 10 digits', () => {
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('1234567890'), true);
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('9876543210'), true);
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('123456789'), false, 'Rejects 9 digits');
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('12345678901'), false, 'Rejects 11 digits');
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('12345abcde'), false, 'Rejects alphabets');
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('1234 56789'), false, 'Rejects spaces');
});

test('captain vehicle schemas enforce 10-digit national ID for Jordan', async () => {
  const schemaJo = getCaptainSmartAppVehicleSchema(mockT, 'JO');
  
  // Valid 10-digit payload
  const validPayload = {
    companyName: 'Smart Ride Office',
    companyCode: 'SR-101',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    plate: '12-34567',
    year: 2022,
    nationalIdNumber: '2001123456',
    licenseNumber: '98765432',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schemaJo.validate(validPayload));

  // Invalid payload with 8 digits
  const invalidPayload = {
    ...validPayload,
    nationalIdNumber: '12345678',
  };

  await assert.rejects(schemaJo.validate(invalidPayload));
});

test('captain vehicle schema allows general national ID format for foreign countries', async () => {
  const schemaForeign = getCaptainSmartAppVehicleSchema(mockT, 'EG');

  const validPayload = {
    companyName: 'Smart Ride Office',
    companyCode: 'SR-101',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    plate: '12-34567',
    year: 2022,
    nationalIdNumber: '29812345678901', // 14-digit Egyptian national ID
    licenseNumber: '98765432',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schemaForeign.validate(validPayload));
});

test('captain independent vehicle schema validates without companyName and companyCode', async () => {
  const schemaJo = getCaptainIndependentVehicleSchema(mockT, 'JO');

  // Valid independent payload: no companyName or companyCode needed
  const validPayload = {
    make: 'Hyundai',
    model: 'Elantra',
    color: 'Silver',
    plate: '50-12345',
    year: 2021,
    nationalIdNumber: '2001987654',
    licenseNumber: '11223344',
    facebookUrl: '',
    instagramUrl: '',
  };

  await assert.doesNotReject(schemaJo.validate(validPayload));

  // Invalid payload: missing required make
  const invalidPayload = {
    ...validPayload,
    make: '',
  };

  await assert.rejects(schemaJo.validate(invalidPayload));
});

