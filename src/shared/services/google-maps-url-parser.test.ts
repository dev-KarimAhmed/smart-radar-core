import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decodePlusCode,
  extractGoogleMapsPlaceName,
  isInvalidPlaceName,
  isMapsLink,
  parseGoogleMapsLocation,
  recoverNearestPlusCode,
  sanitizeGoogleMapsUrl,
} from './google-maps-location';

test('extracts the place name from the resolved Google Maps URL', () => {
  assert.equal(
    extractGoogleMapsPlaceName(
      'https://www.google.com/maps/place/%D9%85%D8%B1%D9%83%D8%B2+%D9%85%D9%8A%D8%B1%D9%8A%D8%AA/data=!4m2',
    ),
    'مركز ميريت',
  );
});

test('extracts the destination name from a directions URL (no dedicated place segment)', () => {
  assert.equal(
    extractGoogleMapsPlaceName(
      'https://www.google.com/maps/dir/29.9577206,30.897213/El-Gamaleya,+El+Gamaliya,+Cairo+Governorate/@29.9881343,30.9089937,11z/am=t/data=!4m10!4m9!1m1!4e1!1m5!1m1!1s0x14583f657d3592dd:0x75f84ddcae9fdc64!2m2!1d31.2712203!2d30.0473948!5i1',
    ),
    'El-Gamaleya, El Gamaliya, Cairo Governorate',
  );
});

test('strips leading Google Plus Code from extracted place name', () => {
  const name = extractGoogleMapsPlaceName(
    'https://www.google.com/maps/place/XXJ5%2B99G+Saiyeda+Khadija+Bint+Khuwelid+Mosque,+Unnamed+Road,+First+6th+of+October/data=!4m2',
  );
  assert.equal(name, 'Saiyeda Khadija Bint Khuwelid Mosque, Unnamed Road, First 6th of October');
});

test('sanitizeGoogleMapsUrl strips mobile tracking parameters from short links', () => {
  const clean = sanitizeGoogleMapsUrl('https://maps.app.goo.gl/1H2GgVvVAkAw1wgM9?g_st=ac');
  assert.equal(clean, 'https://maps.app.goo.gl/1H2GgVvVAkAw1wgM9');

  const cleanIos = sanitizeGoogleMapsUrl('https://maps.app.goo.gl/1H2GgVvVAkAw1wgM9?g_st=ic&feature=shared');
  assert.equal(cleanIos, 'https://maps.app.goo.gl/1H2GgVvVAkAw1wgM9');
});

test('sanitizeGoogleMapsUrl strips tracking params while preserving search params on full links', () => {
  const sanitized = sanitizeGoogleMapsUrl(
    'https://www.google.com/maps/search/?api=1&query=30.04,30.99&g_st=ac&utm_source=share',
  );
  assert.equal(sanitized, 'https://www.google.com/maps/search/?api=1&query=30.04%2C30.99');
});

test('isMapsLink identifies Google Maps and OpenStreetMap URLs', () => {
  assert.equal(isMapsLink('https://maps.app.goo.gl/1H2GgVvVAkAw1wgM9?g_st=ac'), true);
  assert.equal(isMapsLink('https://www.google.com/maps/place/test'), true);
  assert.equal(isMapsLink('https://www.openstreetmap.org/#map=16/30.04/30.99'), true);
  assert.equal(isMapsLink('Cairo Festival City'), false);
});

test('prefers the destination waypoint over origin when directions URL has multiple waypoints in data', () => {
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps/dir/Origin/Destination/@26.572,31.754,13z/data=!4m14!4m13!1m5!1m1!1s0x1!2m2!1d31.695!2d26.556!1m5!1m1!1s0x2!2m2!1d31.81375!2d26.58894!3e0',
  );
  assert.deepEqual(location, { lat: 26.58894, lng: 31.81375 });
});

test('recovers Plus Code from directions URL path instead of returning camera midpoint', () => {
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps/dir/%D9%85%D9%88%D9%82%D8%B9%D9%83/%D9%85%D9%82%D8%A7%D8%A8%D8%B1+%D8%A7%D9%84%D8%AD%D9%88%D8%A7%D9%88%D9%8A%D8%B4+%D8%A7%D9%84%D8%A3%D8%AB%D8%B1%D9%8A%D8%A9%D8%8C+HRQ7%2BHGG%D8%8C+%D8%B7%D8%B1%D9%8A%D9%82+%D8%A7%D9%84%D8%AC%D9%8A%D8%B4%D8%8C+%D8%B3%D9%88%D9%87%D8%A7%D8%AC/@26.57247,31.75437,13z',
  );
  assert.ok(location);
  assert.ok(Math.abs(location.lat - 26.5889) < 0.001);
  assert.ok(Math.abs(location.lng - 31.8138) < 0.001);
});

test('refuses to return camera center for directions URL without waypoints or plus code', () => {
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps/dir/%D9%85%D9%88%D9%82%D8%B9%D9%83/%D9%85%D9%82%D8%A7%D8%A8%D8%B1+%D8%A7%D9%84%D8%AD%D9%88%D8%A7%D9%88%D9%8A%D8%B4/@26.57247,31.75437,13z',
  );
  assert.equal(location, null);
});

test('decodes and recovers full and short Plus Codes accurately', () => {
  const full = decodePlusCode('7GRHHRQ7+HGG');
  assert.ok(full);
  assert.ok(Math.abs(full.lat - 26.5889) < 0.001);
  assert.ok(Math.abs(full.lng - 31.8138) < 0.001);

  const short = recoverNearestPlusCode('HRQ7+HGG', 26.56, 31.70);
  assert.ok(short);
  assert.ok(Math.abs(short.lat - 26.5889) < 0.001);
  assert.ok(Math.abs(short.lng - 31.8138) < 0.001);
});

test('extracts destination place name from directions URL with daddr', () => {
  const name = extractGoogleMapsPlaceName(
    'https://www.google.com/maps?saddr=32.0279,36.0552&daddr=Universal+Civilizations+Academy+UCA,+Amman',
  );
  assert.equal(name, 'Universal Civilizations Academy UCA, Amman');
});

test('parses explicit destination coordinates from daddr in directions URL', () => {
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps?saddr=32.0279,36.0552&daddr=31.8876,35.8868',
  );
  assert.deepEqual(location, { lat: 31.8876, lng: 35.8868 });
});

test('refuses to return origin saddr when daddr is a place name in directions URL', () => {
  const location = parseGoogleMapsLocation(
    'https://maps.google.com/?geocode=xxx&daddr=Universal+Civilizations+Academy+UCA,+Amman&saddr=32.0279426,36.0552927&dirflg=d',
  );
  assert.equal(location, null, 'Must return null so resolver can fetch HTML or geocode daddr, never saddr');
});

test('prefers destination !3d!4d marker over origin in directions HTML payload', () => {
  const html = '<html><body>!3d32.027943!4d36.055293<div>...</div>!3d31.887619!4d35.886854</body></html>';
  const location = parseGoogleMapsLocation(html);
  assert.deepEqual(location, { lat: 31.887619, lng: 35.886854 });
});

test('isInvalidPlaceName flags protobuf data strings, coordinates, and origin labels as invalid', () => {
  assert.equal(isInvalidPlaceName('data=!4m12!4m11!1m1!4e1!1m5!1m4!1s0x15...'), true);
  assert.equal(isInvalidPlaceName('!4m12!4m11!1m1!4e1'), true);
  assert.equal(isInvalidPlaceName('am=t'), true);
  assert.equal(isInvalidPlaceName('@31.8876,35.8867,17z'), true);
  assert.equal(isInvalidPlaceName('31.8876,35.8868'), true);
  assert.equal(isInvalidPlaceName('31°53\'15.5"N 35°53\'12.5"E'), true);
  assert.equal(isInvalidPlaceName('Current Location'), true);
  assert.equal(isInvalidPlaceName('Current+Location'), true);
  assert.equal(isInvalidPlaceName('موقعي'), true);
  assert.equal(isInvalidPlaceName('0x151ca7e4b:0x1234'), true);

  assert.equal(isInvalidPlaceName('Universal Civilizations Academy'), false);
  assert.equal(isInvalidPlaceName('City Mall'), false);
  assert.equal(isInvalidPlaceName('مول العرب'), false);
  assert.equal(isInvalidPlaceName('البنيات الشمالي'), false);
});

test('extractGoogleMapsPlaceName refuses to return data=! protobuf segment from directions URL', () => {
  const url = 'https://www.google.com/maps/dir/Current+Location/data=!4m12!4m11!1m1!4e1!1m5!1m4!1s0x15...';
  const name = extractGoogleMapsPlaceName(url);
  assert.equal(name, null, 'Protobuf data= segment must never be returned as a destination place name');
});

test('extractGoogleMapsPlaceName refuses to return DMS coordinate strings as a place name', () => {
  const url = 'https://www.google.com/maps/place/31%C2%B053\'15.5%22N+35%C2%B053\'12.5%22E/@31.8876389,35.8842224,17z/data=!3m1!4b1';
  const name = extractGoogleMapsPlaceName(url);
  assert.equal(name, null, 'DMS coordinates must never be returned as a destination place name');
});
