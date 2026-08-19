-- Adds a per-country default map center so the app's first map paint (before
-- GPS resolves, or when denied) centers on the account's own country instead
-- of a single hardcoded location. Nullable — falls back to GPS/local defaults
-- when a country has no row here yet.

alter table if exists public.countries
  add column if not exists default_lat numeric,
  add column if not exists default_lng numeric;

-- Populate well-known country capitals by name match. Safe/idempotent — a
-- country not already present in this table is simply left untouched.
update public.countries set default_lat = 30.0444, default_lng = 31.2357
  where default_lat is null and (name_en ilike '%egypt%' or name_ar ilike '%مصر%');

update public.countries set default_lat = 24.4539, default_lng = 54.3773
  where default_lat is null and (name_en ilike '%emirates%' or name_en ilike '%uae%' or name_ar ilike '%الإمارات%' or name_ar ilike '%امارات%');

update public.countries set default_lat = 24.7136, default_lng = 46.6753
  where default_lat is null and (name_en ilike '%saudi%' or name_ar ilike '%السعودية%');

update public.countries set default_lat = 31.9454, default_lng = 35.9284
  where default_lat is null and (name_en ilike '%jordan%' or name_ar ilike '%الأردن%' or name_ar ilike '%الاردن%');

update public.countries set default_lat = 29.3759, default_lng = 47.9774
  where default_lat is null and (name_en ilike '%kuwait%' or name_ar ilike '%الكويت%');

update public.countries set default_lat = 25.2854, default_lng = 51.5310
  where default_lat is null and (name_en ilike '%qatar%' or name_ar ilike '%قطر%');

update public.countries set default_lat = 26.2285, default_lng = 50.5860
  where default_lat is null and (name_en ilike '%bahrain%' or name_ar ilike '%البحرين%');

update public.countries set default_lat = 23.5880, default_lng = 58.3829
  where default_lat is null and (name_en ilike '%oman%' or name_ar ilike '%عمان%' or name_ar ilike '%عُمان%');

update public.countries set default_lat = 33.3152, default_lng = 44.3661
  where default_lat is null and (name_en ilike '%iraq%' or name_ar ilike '%العراق%');

update public.countries set default_lat = 33.8938, default_lng = 35.5018
  where default_lat is null and (name_en ilike '%lebanon%' or name_ar ilike '%لبنان%');

update public.countries set default_lat = 31.9038, default_lng = 35.2034
  where default_lat is null and (name_en ilike '%palestine%' or name_ar ilike '%فلسطين%');

update public.countries set default_lat = 33.5138, default_lng = 36.2765
  where default_lat is null and (name_en ilike '%syria%' or name_ar ilike '%سوريا%' or name_ar ilike '%سورية%');

update public.countries set default_lat = 15.3694, default_lng = 44.1910
  where default_lat is null and (name_en ilike '%yemen%' or name_ar ilike '%اليمن%');

update public.countries set default_lat = 15.5007, default_lng = 32.5599
  where default_lat is null and (name_en ilike '%sudan%' or name_ar ilike '%السودان%');

update public.countries set default_lat = 32.8872, default_lng = 13.1913
  where default_lat is null and (name_en ilike '%libya%' or name_ar ilike '%ليبيا%');

update public.countries set default_lat = 34.0209, default_lng = -6.8416
  where default_lat is null and (name_en ilike '%morocco%' or name_ar ilike '%المغرب%');

update public.countries set default_lat = 36.7538, default_lng = 3.0588
  where default_lat is null and (name_en ilike '%algeria%' or name_ar ilike '%الجزائر%');

update public.countries set default_lat = 36.8065, default_lng = 10.1815
  where default_lat is null and (name_en ilike '%tunisia%' or name_ar ilike '%تونس%');
