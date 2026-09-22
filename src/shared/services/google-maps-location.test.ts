import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractGoogleMapsPlaceName,
  isMapsLink,
  parseGoogleMapsLocation,
  resolveClipboardMapLocation,
  sanitizeGoogleMapsUrl,
} from './google-maps-location';

test('resolves geography for a full Google Maps URL after parsing its coordinates', async () => {
  let fetchCalls = 0;
  const result = await resolveClipboardMapLocation(
    'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
    async (input) => {
      fetchCalls += 1;
      assert.match(String(input), /^\/api\/maps\/resolve\?url=/);
      return new Response(JSON.stringify({
        resolvedUrl: 'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
        location: { lat: 29.9602, lng: 31.2569 },
        geography: { governorate: 'Cairo Governorate', city: 'Maadi' },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );

  assert.deepEqual(result.location, { lat: 29.9602, lng: 31.2569 });
  assert.deepEqual(result.geography, { governorate: 'Cairo Governorate', city: 'Maadi' });
  assert.equal(fetchCalls, 1);
});

test('keeps direct coordinates usable when geography resolution is unavailable', async () => {
  const result = await resolveClipboardMapLocation(
    'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
    async () => {
      throw new Error('offline');
    },
  );

  assert.deepEqual(result, {
    location: { lat: 29.9602, lng: 31.2569 },
    resolvedUrl: 'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
  });
});

test('resolves a shortened Google Maps URL through the same-origin resolver', async () => {
  const result = await resolveClipboardMapLocation(
    'https://maps.app.goo.gl/ZzvfrfAXKRAJY1PT6',
    async (input) => {
      assert.match(String(input), /^\/api\/maps\/resolve\?url=/);
      return new Response(JSON.stringify({
        resolvedUrl: 'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
        location: { lat: 29.9602, lng: 31.2569 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );

  assert.deepEqual(result.location, { lat: 29.9602, lng: 31.2569 });
  assert.match(result.resolvedUrl, /google\.com\/maps/);
});

test('normalizes an Android clipboard value with a label and no scheme', async () => {
  const result = await resolveClipboardMapLocation(
    'موقع الوجهة: maps.app.goo.gl/ZzvfrfAXKRAJY1PT6',
    async () => new Response(JSON.stringify({
      resolvedUrl: 'https://www.google.com/maps/place/Test/@26.5651,31.7511,17z',
      location: { lat: 26.5651, lng: 31.7511 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );

  assert.deepEqual(result.location, { lat: 26.5651, lng: 31.7511 });
});

test('parses Google Maps data coordinates', () => {
  assert.deepEqual(
    parseGoogleMapsLocation('https://www.google.com/maps/place/Test/data=!3d30.0444!4d31.2357'),
    { lat: 30.0444, lng: 31.2357 },
  );
});

test('prefers the precise place marker over the map-framing viewport center in a place-page URL', () => {
  // Real shape of a resolved `/maps/place/{name}/@{viewCenter}z/data=...!3d{lat}!4d{lng}...`
  // URL: the `@lat,lng` segment is the viewport center used to frame the place on screen —
  // close to the pin but not the same point — while the actual place lives in the `data=`
  // payload's `!3d{lat}!4d{lng}` marker and must win even though `@lat,lng` appears first.
  assert.deepEqual(
    parseGoogleMapsLocation(
      'https://www.google.com/maps/place/%D8%B4%D8%A8%D8%B1%D8%A7%D8%8C+%D9%85%D8%AD%D8%A7%D9%81%D8%B8%D8%A9+%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9/@30.071381,31.2605433,15z/data=!3m1!4b1!4m6!3m5!1s0x1458406385434489:0x8f5991a6319a75cd!8m2!3d30.0725361!4d31.24976!16s%2Fm%2F03qhv1m',
    ),
    { lat: 30.0725361, lng: 31.24976 },
  );
});

test('parses coordinates from Google place bootstrap payloads', () => {
  assert.deepEqual(
    parseGoogleMapsLocation('https://www.google.com/maps/preview/place?pb=!2d31.5031552!3d26.6698752'),
    { lat: 26.6698752, lng: 31.5031552 },
  );
});

test('parses percent-encoded place coordinates from a Google Maps page', () => {
  assert.deepEqual(
    parseGoogleMapsLocation('...%212d31.503155200000002%213d26.6698752...'),
    { lat: 26.6698752, lng: 31.503155200000002 },
  );
});

test('prefers the destination waypoint over the map-framing viewport center in a directions URL', () => {
  // Real shape of a resolved `/maps/dir/{origin}/{destination}/@{viewCenter}z/data=...` URL:
  // the `@lat,lng` segment is the viewport center used to frame both points on screen, not
  // the destination pin. The destination lives in the `data=` payload's `!2m2!1d{lng}!2d{lat}`
  // marker instead, and must win even though `@lat,lng` appears earlier in the string.
  assert.deepEqual(
    parseGoogleMapsLocation(
      'https://www.google.com/maps/dir/29.9577439,30.8972244/Al-Hosary+Mosque,+%D9%85%D9%8A%D8%AF%D8%A7%D9%86+%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A%D8%8C+First+6th+of+October,+Giza+Governorate+12563/@29.9673815,30.8786135,13z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x145856f78386e6a9:0x5024fd9866839e3d!2m2!1d30.943892!2d29.9725619',
    ),
    { lat: 29.9725619, lng: 30.943892 },
  );
});

test('extracts the place name from the resolved Google Maps URL', () => {
  assert.equal(
    extractGoogleMapsPlaceName(
      'https://www.google.com/maps/place/%D9%85%D8%B1%D9%83%D8%B2+%D9%85%D9%8A%D8%B1%D9%8A%D8%AA/data=!4m2',
    ),
    'مركز ميريت',
  );
});

test('extracts the destination name from a directions URL (no dedicated place segment)', () => {
  // Sharing a place via "Directions" instead of "Share" produces
  // `/maps/dir/{origin}/{destination}/@{viewCenter}/...` — the destination name sits as a
  // plain path segment with no `place`/`search` marker of its own.
  assert.equal(
    extractGoogleMapsPlaceName(
      'https://www.google.com/maps/dir/29.9577206,30.897213/El-Gamaleya,+El+Gamaliya,+Cairo+Governorate/@29.9881343,30.9089937,11z/am=t/data=!4m10!4m9!1m1!4e1!1m5!1m1!1s0x14583f657d3592dd:0x75f84ddcae9fdc64!2m2!1d31.2712203!2d30.0473948!5i1',
    ),
    'El-Gamaleya, El Gamaliya, Cairo Governorate',
  );
});

test('prefers the place pin over the map camera in a /maps/place URL', () => {
  // Illustrative coordinates: the camera (@, downtown Cairo) sits far from the pin
  // (!3d/!4d, 6th of October). Taking the camera quotes a trip to the wrong point.
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps/place/Mall+of+Arabia/@30.0444,31.2357,12z/data=!3m1!4b1!4m6!3m5!1s0x14584!8m2!3d29.9931!4d30.9714!16s%2Fg%2F123',
  );

  assert.deepEqual(location, { lat: 29.9931, lng: 30.9714 });
});

test('still reads the camera when a bare /maps/@ link carries no pin', () => {
  const location = parseGoogleMapsLocation('https://www.google.com/maps/@29.9602,31.2569,16z');

  assert.deepEqual(location, { lat: 29.9602, lng: 31.2569 });
});

test('prefers an explicit q= target over the camera', () => {
  const location = parseGoogleMapsLocation(
    'https://www.google.com/maps?q=29.9931,30.9714&ll=30.0444,31.2357',
  );

  assert.deepEqual(location, { lat: 29.9931, lng: 30.9714 });
});

test('parses staticmap preview center coordinates from place page HTML', () => {
  const html = `
    <html>
      <head>
        <meta content="https://maps.google.com/maps/api/staticmap?center=30.0384256%2C30.9886976&amp;zoom=12" property="og:image">
      </head>
      <body><div>random content 37.2962, -121.8158</div></body>
    </html>
  `;
  const location = parseGoogleMapsLocation(html);
  assert.deepEqual(location, { lat: 30.0384256, lng: 30.9886976 });
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

