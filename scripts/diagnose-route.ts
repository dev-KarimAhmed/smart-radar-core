/**
 * Route diagnostic. Answers one question: when the app's distance is wrong, is it the
 * coordinates or the router?
 *
 *   npx tsx scripts/diagnose-route.ts <originLat> <originLng> <destLat> <destLng> [expectedKm] [expectedMin]
 *
 * Example — a trip to Mall of Arabia, with the Google figures to compare against:
 *   npx tsx scripts/diagnose-route.ts 30.0330 30.9700 30.0067645 30.9761146 16.4 31
 *
 * It calls the SAME fetchRoadRoute the app calls, so what it prints is what the rider gets,
 * not a re-implementation that could drift.
 */

import {
  calculateHaversineKm,
  fetchRoadRoute,
  normalizeTortuosityFactor,
  DEFAULT_TRAFFIC_FACTOR,
} from '../src/lib/road-route';
import { estimateTripMinutes } from '../src/shared/services/trip-duration';

const [originLat, originLng, destLat, destLng, expectedKm, expectedMinutes] =
  process.argv.slice(2).map(Number);

if ([originLat, originLng, destLat, destLng].some((value) => !Number.isFinite(value))) {
  console.error('usage: npx tsx scripts/diagnose-route.ts <originLat> <originLng> <destLat> <destLng> [expectedKm] [expectedMin]');
  process.exit(1);
}

const origin = { lat: originLat, lng: originLng };
const destination = { lat: destLat, lng: destLng };

const straightKm = calculateHaversineKm(origin, destination);
const tortuosity = normalizeTortuosityFactor(NaN);
const fallbackKm = straightKm * tortuosity;

console.log('\nINPUT');
console.log(`  origin        ${originLat}, ${originLng}`);
console.log(`  destination   ${destLat}, ${destLng}`);

console.log('\nGEOMETRY (no network)');
console.log(`  straight line          ${straightKm.toFixed(2)} km   <- a road route can never be shorter than this`);
console.log(`  local fallback         ${fallbackKm.toFixed(2)} km · ${estimateTripMinutes(fallbackKm)} min   (straight x ${tortuosity})`);

console.log('\nROUTERS');
const routed = await fetchRoadRoute(origin, destination, tortuosity, DEFAULT_TRAFFIC_FACTOR);
console.log(`  app result             ${routed.distanceKm.toFixed(2)} km · ${routed.durationMinutes} min   ${routed.isFallback ? '<- FALLBACK: no router answered' : '(routed)'}`);

for (const [name, url, parse] of [
  [
    'Valhalla',
    `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify({
      locations: [{ lat: originLat, lon: originLng }, { lat: destLat, lon: destLng }],
      costing: 'auto',
      directions_options: { units: 'kilometers' },
    }))}`,
    (payload: any) => {
      const summary = payload?.trip?.summary;
      return summary ? { km: Number(summary.length), min: Number(summary.time) / 60 } : null;
    },
  ],
  [
    'OSRM',
    `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`,
    (payload: any) => {
      const route = payload?.routes?.[0];
      return route ? { km: Number(route.distance) / 1000, min: Number(route.duration) / 60 } : null;
    },
  ],
] as const) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const parsed = parse(await response.json());
    if (!parsed) {
      console.log(`  ${name.padEnd(22)} answered, but with no usable route`);
      continue;
    }
    const kmh = parsed.km / (parsed.min / 60);
    console.log(`  ${name.padEnd(22)} ${parsed.km.toFixed(2)} km · ${parsed.min.toFixed(1)} min · ${kmh.toFixed(0)} km/h`);
  } catch (error) {
    console.log(`  ${name.padEnd(22)} UNREACHABLE (${(error as Error).message})`);
  }
}

if (Number.isFinite(expectedKm)) {
  console.log('\nVERDICT (against your reference figure)');
  console.log(`  reference              ${expectedKm} km${Number.isFinite(expectedMinutes) ? ` · ${expectedMinutes} min` : ''}`);

  // A reference road distance shorter than our straight line is geometrically impossible
  // for the same two points, so the coordinates cannot be the ones the reference measured.
  if (expectedKm < straightKm) {
    console.log(`  -> COORDINATES ARE WRONG. The straight line here (${straightKm.toFixed(2)} km) is already`);
    console.log(`     longer than the reference road route (${expectedKm} km). No routing engine and no`);
    console.log('     tortuosity factor can produce that. These are not the same two points.');
  } else if (routed.isFallback) {
    console.log('  -> NO ROUTER ANSWERED. The distance shown is a straight-line guess, not a road');
    console.log('     distance. Fix reachability before judging the numbers.');
  } else {
    const errorPercent = ((routed.distanceKm - expectedKm) / expectedKm) * 100;
    console.log(`  -> routed distance is ${errorPercent >= 0 ? '+' : ''}${errorPercent.toFixed(1)}% vs the reference.`);

    if (Math.abs(errorPercent) <= 8) {
      console.log('     That is measurement noise between two road graphs. Coordinates and router are');
      console.log('     both fine; any remaining gap is route CHOICE, not measurement.');
    } else {
      console.log('     Too large to be graph noise. Both routers here measure the same road network,');
      console.log('     so if they agree with each other and disagree with the reference by this much,');
      console.log('     the two ends being measured are not the same. Check the coordinates first —');
      console.log('     paste the reference route\'s own start and end points and re-run.');
    }
  }
}

console.log('');
