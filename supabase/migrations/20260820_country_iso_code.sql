-- Adds an ISO 3166-1 alpha-2 code per country so the app can compare a
-- captain's live GPS-detected country against their registered one (to
-- prompt a price-per-km update when the currency would actually change).
-- Nullable/name-matched — safe to run even if a country isn't in this list.

alter table if exists public.countries
  add column if not exists iso_code text;

update public.countries set iso_code = 'EG'
  where iso_code is null and (name_en ilike '%egypt%' or name_ar ilike '%مصر%');

update public.countries set iso_code = 'AE'
  where iso_code is null and (name_en ilike '%emirates%' or name_en ilike '%uae%' or name_ar ilike '%الإمارات%' or name_ar ilike '%امارات%');

update public.countries set iso_code = 'SA'
  where iso_code is null and (name_en ilike '%saudi%' or name_ar ilike '%السعودية%');

update public.countries set iso_code = 'JO'
  where iso_code is null and (name_en ilike '%jordan%' or name_ar ilike '%الأردن%' or name_ar ilike '%الاردن%');

update public.countries set iso_code = 'KW'
  where iso_code is null and (name_en ilike '%kuwait%' or name_ar ilike '%الكويت%');

update public.countries set iso_code = 'QA'
  where iso_code is null and (name_en ilike '%qatar%' or name_ar ilike '%قطر%');

update public.countries set iso_code = 'BH'
  where iso_code is null and (name_en ilike '%bahrain%' or name_ar ilike '%البحرين%');

update public.countries set iso_code = 'OM'
  where iso_code is null and (name_en ilike '%oman%' or name_ar ilike '%عمان%' or name_ar ilike '%عُمان%');

update public.countries set iso_code = 'IQ'
  where iso_code is null and (name_en ilike '%iraq%' or name_ar ilike '%العراق%');

update public.countries set iso_code = 'LB'
  where iso_code is null and (name_en ilike '%lebanon%' or name_ar ilike '%لبنان%');

update public.countries set iso_code = 'PS'
  where iso_code is null and (name_en ilike '%palestine%' or name_ar ilike '%فلسطين%');

update public.countries set iso_code = 'SY'
  where iso_code is null and (name_en ilike '%syria%' or name_ar ilike '%سوريا%' or name_ar ilike '%سورية%');

update public.countries set iso_code = 'YE'
  where iso_code is null and (name_en ilike '%yemen%' or name_ar ilike '%اليمن%');

update public.countries set iso_code = 'SD'
  where iso_code is null and (name_en ilike '%sudan%' or name_ar ilike '%السودان%');

update public.countries set iso_code = 'LY'
  where iso_code is null and (name_en ilike '%libya%' or name_ar ilike '%ليبيا%');

update public.countries set iso_code = 'MA'
  where iso_code is null and (name_en ilike '%morocco%' or name_ar ilike '%المغرب%');

update public.countries set iso_code = 'DZ'
  where iso_code is null and (name_en ilike '%algeria%' or name_ar ilike '%الجزائر%');

update public.countries set iso_code = 'TN'
  where iso_code is null and (name_en ilike '%tunisia%' or name_ar ilike '%تونس%');
