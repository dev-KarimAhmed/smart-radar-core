import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  consumeRateLimit,
  getClientIp,
  verifyTrackingToken,
} from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLOSED_TRIP_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`trip-track:${ip}`, 120, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.retryAfterSeconds),
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestId = (searchParams.get('id') || searchParams.get('trip') || '').trim();
    const token = (searchParams.get('t') || searchParams.get('token') || '').trim();

    if (!requestId || !UUID_PATTERN.test(requestId)) {
      return NextResponse.json(
        { success: false, error: 'valid_request_id_required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const tokenCheck = verifyTrackingToken(requestId, token);
    if (!tokenCheck.valid) {
      return NextResponse.json(
        { success: false, error: tokenCheck.reason || 'invalid_or_expired_tracking_token' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { data: trip, error: tripErr } = await supabaseAdmin
      .from('ride_requests')
      .select(
        'id, status, destination_address_ar, origin_address, origin_lat, origin_lng, accepted_captain_id, updated_at'
      )
      .eq('id', requestId)
      .maybeSingle();

    if (tripErr || !trip) {
      return NextResponse.json(
        { success: false, error: 'trip_not_found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const normalizedStatus = String(trip.status || '').toUpperCase();

    // Service 11 Compliance: Immediately halt live location & captain PII visibility once trip closes
    if (CLOSED_TRIP_STATUSES.has(normalizedStatus)) {
      return NextResponse.json(
        {
          success: true,
          active: false,
          tripEnded: true,
          status: normalizedStatus,
          requestId: trip.id,
          shortId: String(trip.id).slice(0, 8).toUpperCase(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const captainId = trip.accepted_captain_id ? String(trip.accepted_captain_id) : '';
    let location: { lat: number; lng: number } | null = null;
    let updatedAt: string | null = trip.updated_at || null;
    let captainCard: {
      name: string;
      phone: string | null;
      plate: string;
      vehicle: string;
    } = {
      name: 'السائق',
      phone: null,
      plate: '',
      vehicle: '',
    };

    if (captainId) {
      const [locRes, profRes, capProfRes] = await Promise.all([
        supabaseAdmin
          .from('captain_locations')
          .select('location_lat, location_lng, updated_at')
          .eq('captain_id', captainId)
          .maybeSingle(),
        supabaseAdmin
          .from('profiles')
          .select('full_name, phone')
          .eq('id', captainId)
          .maybeSingle(),
        supabaseAdmin
          .from('captain_profiles')
          .select('plate_number, vehicle_brand, vehicle_model, vehicle_color, nickname')
          .eq('id', captainId)
          .maybeSingle(),
      ]);

      const locLat = Number(locRes.data?.location_lat);
      const locLng = Number(locRes.data?.location_lng);
      if (Number.isFinite(locLat) && Number.isFinite(locLng) && !(locLat === 0 && locLng === 0)) {
        location = { lat: locLat, lng: locLng };
      }
      if (locRes.data?.updated_at) {
        updatedAt = String(locRes.data.updated_at);
      }

      const vehicleParts = [
        capProfRes.data?.vehicle_brand,
        capProfRes.data?.vehicle_model,
        capProfRes.data?.vehicle_color,
      ]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .map((part) => part.trim());

      captainCard = {
        name:
          (capProfRes.data?.nickname && String(capProfRes.data.nickname).trim()) ||
          (profRes.data?.full_name && String(profRes.data.full_name).trim()) ||
          'السائق',
        phone: profRes.data?.phone ? String(profRes.data.phone) : null,
        plate: capProfRes.data?.plate_number ? String(capProfRes.data.plate_number) : '',
        vehicle: vehicleParts.join(' '),
      };
    }

    if (!location && Number.isFinite(Number(trip.origin_lat)) && Number.isFinite(Number(trip.origin_lng))) {
      location = {
        lat: Number(trip.origin_lat),
        lng: Number(trip.origin_lng),
      };
    }

    return NextResponse.json(
      {
        success: true,
        active: true,
        tripEnded: false,
        requestId: trip.id,
        shortId: String(trip.id).slice(0, 8).toUpperCase(),
        status: normalizedStatus,
        destination: trip.destination_address_ar || '',
        originAddress: trip.origin_address || '',
        location,
        captain: captainCard,
        updatedAt,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[api/trip/track] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
