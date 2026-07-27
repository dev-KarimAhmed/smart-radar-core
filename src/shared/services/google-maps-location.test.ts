import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractGoogleMapsPlaceName,
  parseGoogleMapsLocation,
  resolveClipboardMapLocation,
} from './google-maps-location';

test('parses coordinates from a full Google Maps URL without resolving it remotely', async () => {
  let fetchCalls = 0;
  const result = await resolveClipboardMapLocation(
    'https://www.google.com/maps/place/Test/@29.9602,31.2569,16z',
    async () => {
      fetchCalls += 1;
      throw new Error('fetch should not be called');
    },
  );

  assert.deepEqual(result.location, { lat: 29.9602, lng: 31.2569 });
  assert.equal(fetchCalls, 0);
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

test('extracts the place name from the resolved Google Maps URL', () => {
  assert.equal(
    extractGoogleMapsPlaceName(
      'https://www.google.com/maps/place/%D9%85%D8%B1%D9%83%D8%B2+%D9%85%D9%8A%D8%B1%D9%8A%D8%AA/data=!4m2',
    ),
    'مركز ميريت',
  );
});
