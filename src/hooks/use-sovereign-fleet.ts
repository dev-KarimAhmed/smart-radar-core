import { useEffect, useState } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

function mapProfileToUser(row: Record<string, any>): User {
  return {
    uid: String(row.id),
    name: row.full_name || row.name || 'سائق',
    phone: row.phone || '',
    role: 'driver',
    status: row.status || 'idle',
    rating: Number(row.rating ?? 5),
    rank: row.rank || 'silver',
    countryId: row.country_id ?? undefined,
    governorate: row.governorate_id ? String(row.governorate_id) : undefined,
    district: row.district_id ? String(row.district_id) : undefined,
  } as User;
}

export function useSovereignFleet() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchDrivers() {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['DRIVER', 'CAPTAIN', 'driver', 'captain']);

        if (fetchError) throw fetchError;
        if (!active) return;

        setDrivers(Array.isArray(data) ? data.map(mapProfileToUser) : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setDrivers([]);
        setError((err as { message?: string })?.message || 'تعذر تحميل السائقين.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchDrivers();

    const channel = supabase
      .channel('profiles-driver-fleet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void fetchDrivers();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { drivers, loading, error };
}
