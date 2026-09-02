import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractGoogleMapsPlaceName,
  parseGoogleMapsLocation,
  resolveClipboardMapLocation,
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
