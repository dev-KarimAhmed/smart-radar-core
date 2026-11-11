import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSaudiPhoneNumber,
  isSaudiCountryCode,
  isSaudiCoordinates,
  isSaudiRequest,
} from './saudi-restriction';

test('isSaudiPhoneNumber detects all Saudi phone formats', () => {
  // Saudi formats
  assert.equal(isSaudiPhoneNumber('+966501234567'), true);
  assert.equal(isSaudiPhoneNumber('00966501234567'), true);
  assert.equal(isSaudiPhoneNumber('966501234567'), true);
  assert.equal(isSaudiPhoneNumber('+966 50 123 4567'), true);
  assert.equal(isSaudiPhoneNumber('+966-54-111-2222'), true);

  // Jordan formats (MUST NOT reject)
  assert.equal(isSaudiPhoneNumber('+962791234567'), false);
  assert.equal(isSaudiPhoneNumber('00962791234567'), false);
  assert.equal(isSaudiPhoneNumber('0791234567'), false);

  // Egypt formats (MUST NOT reject)
  assert.equal(isSaudiPhoneNumber('+201012345678'), false);
  assert.equal(isSaudiPhoneNumber('00201012345678'), false);
  assert.equal(isSaudiPhoneNumber('01012345678'), false);

  // Empty or invalid
  assert.equal(isSaudiPhoneNumber(''), false);
  assert.equal(isSaudiPhoneNumber(null), false);
  assert.equal(isSaudiPhoneNumber(undefined), false);
});

test('isSaudiCountryCode detects Saudi representations', () => {
  assert.equal(isSaudiCountryCode('SA'), true);
  assert.equal(isSaudiCountryCode('sau'), true);
  assert.equal(isSaudiCountryCode('966'), true);
  assert.equal(isSaudiCountryCode('+966'), true);
  assert.equal(isSaudiCountryCode('Saudi Arabia'), true);
  assert.equal(isSaudiCountryCode('المملكة العربية السعودية'), true);

  assert.equal(isSaudiCountryCode('JO'), false);
  assert.equal(isSaudiCountryCode('EG'), false);
  assert.equal(isSaudiCountryCode('Jordan'), false);
  assert.equal(isSaudiCountryCode('مصر'), false);
});

test('isSaudiCoordinates accurately detects Saudi locations without false positives', () => {
  // Riyadh
  assert.equal(isSaudiCoordinates(24.7136, 46.6753), true);
  // Jeddah
  assert.equal(isSaudiCoordinates(21.5433, 39.1728), true);
  // Dammam
  assert.equal(isSaudiCoordinates(26.4207, 50.0888), true);
  // Tabuk
  assert.equal(isSaudiCoordinates(28.3835, 36.5662), true);

  // Amman (Jordan) - MUST NOT block
  assert.equal(isSaudiCoordinates(31.9454, 35.9284), false);
  // Aqaba (Jordan) - MUST NOT block
  assert.equal(isSaudiCoordinates(29.5267, 35.0078), false);
  // Cairo (Egypt) - MUST NOT block
  assert.equal(isSaudiCoordinates(30.0444, 31.2357), false);
  // Alexandria (Egypt) - MUST NOT block
  assert.equal(isSaudiCoordinates(31.2001, 29.9187), false);
});

test('isSaudiRequest detects edge and CDN geo headers', () => {
  const saReq = new Headers();
  saReq.set('cf-ipcountry', 'SA');
  assert.equal(isSaudiRequest(saReq), true);

  const vercelReq = new Headers();
  vercelReq.set('x-vercel-ip-country', 'SA');
  assert.equal(isSaudiRequest(vercelReq), true);

  const joReq = new Headers();
  joReq.set('cf-ipcountry', 'JO');
  assert.equal(isSaudiRequest(joReq), false);

  const egReq = { 'cf-ipcountry': 'EG' };
  assert.equal(isSaudiRequest(egReq), false);
});
