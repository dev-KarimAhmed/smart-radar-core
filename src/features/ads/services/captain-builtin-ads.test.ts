import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { filterAdsByAudience } from './ad-audience';
import { buildCaptainAdPublicPath, getCaptainBuiltinAds } from './captain-builtin-ads';

const arAds = getCaptainBuiltinAds('ar');
const enAds = getCaptainBuiltinAds('en');

assert.equal(arAds.length, 5, 'Should include all 5 images from public/captain_ads');
assert.equal(enAds.length, 5, 'Should include all 5 English variants');

// Audience isolation: strictly captain-only, zero leakage to riders
assert.equal(filterAdsByAudience(arAds, 'captain').length, 5);
assert.equal(filterAdsByAudience(arAds, 'rider').length, 0);

// Verify every built-in ad maps to a real file in public/captain_ads and uses poster-only clean framing
for (let index = 0; index < arAds.length; index++) {
  const ad = arAds[index];
  const enAd = enAds[index];

  assert.equal(ad.isPosterOnly, true);
  assert.equal(ad.isBuiltinCaptainPromo, true);
  assert.equal(ad.forDriver, true);
  assert.equal(ad.adType, 'CAPTAIN_PROFESSIONAL');
  assert.equal(ad.posterUrl, ad.content.posterUrl);
  assert.equal(ad.imageUrl, ad.bannerUrl);
  assert.ok(ad.title.length > 0 && enAd.title.length > 0 && ad.title !== enAd.title);

  const decodedRelativePath = decodeURIComponent(ad.posterUrl).replace(/^\/+/, '');
  const fullPath = path.resolve(process.cwd(), 'public', decodedRelativePath);
  assert.equal(fs.existsSync(fullPath), true, `Expected asset to exist at ${fullPath}`);
}

assert.equal(
  buildCaptainAdPublicPath('موجل.png'),
  '/captain_ads/%D9%85%D9%88%D8%AC%D9%84.png',
);

console.log('captain-builtin-ads: all assertions passed');

