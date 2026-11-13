-- Migration: 20261113160000_fix_governorate_english_translations_and_duplicates.sql
-- Description: Fixes corrupted English translations (Arabic text placed in name_en)
-- and cleans up duplicate governorate rows in the public.governorates table.

BEGIN;

-- 1. Correct English names for Jordan Governorates (country_id = 1)
UPDATE public.governorates SET name_ar = 'عمّان', name_en = 'Amman' WHERE country_id = 1 AND (name_ar IN ('عمان', 'عمّان') OR name_en IN ('عمان', 'عمّان', 'Amman'));
UPDATE public.governorates SET name_ar = 'إربد', name_en = 'Irbid' WHERE country_id = 1 AND (name_ar IN ('اربد', 'إربد') OR name_en IN ('اربد', 'إربد', 'Irbid'));
UPDATE public.governorates SET name_ar = 'الزرقاء', name_en = 'Zarqa' WHERE country_id = 1 AND (name_ar IN ('الزرقاء', 'الزرقا') OR name_en IN ('الزرقاء', 'الزرقا', 'Zarqa'));
UPDATE public.governorates SET name_ar = 'البلقاء', name_en = 'Balqa' WHERE country_id = 1 AND (name_ar IN ('البلقاء', 'البلقا') OR name_en IN ('البلقاء', 'البلقا', 'Balqa'));
UPDATE public.governorates SET name_ar = 'العقبة', name_en = 'Aqaba' WHERE country_id = 1 AND (name_ar IN ('العقبة', 'العقبه') OR name_en IN ('العقبة', 'العقبه', 'Aqaba'));
UPDATE public.governorates SET name_ar = 'مادبا', name_en = 'Madaba' WHERE country_id = 1 AND (name_ar IN ('مادبا', 'مأدبا') OR name_en IN ('مادبا', 'مأدبا', 'Madaba'));
UPDATE public.governorates SET name_ar = 'الكرك', name_en = 'Karak' WHERE country_id = 1 AND (name_ar = 'الكرك' OR name_en IN ('الكرك', 'Karak'));
UPDATE public.governorates SET name_ar = 'معان', name_en = 'Ma''an' WHERE country_id = 1 AND (name_ar = 'معان' OR name_en IN ('معان', 'Ma''an', 'Maan'));
UPDATE public.governorates SET name_ar = 'الطفيلة', name_en = 'Tafilah' WHERE country_id = 1 AND (name_ar IN ('الطفيلة', 'الطفيله') OR name_en IN ('الطفيلة', 'الطفيله', 'Tafilah'));
UPDATE public.governorates SET name_ar = 'عجلون', name_en = 'Ajloun' WHERE country_id = 1 AND (name_ar = 'عجلون' OR name_en IN ('عجلون', 'Ajloun'));
UPDATE public.governorates SET name_ar = 'جرش', name_en = 'Jerash' WHERE country_id = 1 AND (name_ar = 'جرش' OR name_en IN ('جرش', 'Jerash'));
UPDATE public.governorates SET name_ar = 'المفرق', name_en = 'Mafraq' WHERE country_id = 1 AND (name_ar = 'المفرق' OR name_en IN ('المفرق', 'Mafraq'));

-- 2. Safely merge duplicate rows for each governorate (keep lowest ID)
DO $$
DECLARE
  rec RECORD;
  target_id INT;
BEGIN
  FOR rec IN
    SELECT country_id, name_en, MIN(id) AS keep_id, ARRAY_AGG(id ORDER BY id ASC) AS all_ids
    FROM public.governorates
    GROUP BY country_id, name_en
    HAVING COUNT(*) > 1
  LOOP
    target_id := rec.keep_id;

    -- Re-link districts referencing duplicate governorate rows
    UPDATE public.districts
    SET governorate_id = target_id
    WHERE governorate_id = ANY(rec.all_ids) AND governorate_id <> target_id;

    -- Re-link user profiles referencing duplicate governorate rows
    UPDATE public.profiles
    SET governorate_id = target_id
    WHERE governorate_id = ANY(rec.all_ids) AND governorate_id <> target_id;

    -- Delete duplicates
    DELETE FROM public.governorates
    WHERE id = ANY(rec.all_ids) AND id <> target_id;
  END LOOP;
END $$;

-- 3. Fix common district name_en that have Arabic text
UPDATE public.districts SET name_en = 'Amman Qasabah' WHERE name_ar IN ('قصبة عمان', 'قصبة عمّان') AND (name_en IS NULL OR name_en IN ('قصبة عمان', 'قصبة عمّان'));
UPDATE public.districts SET name_en = 'Marka' WHERE name_ar = 'ماركا' AND (name_en IS NULL OR name_en = 'ماركا');
UPDATE public.districts SET name_en = 'Al Qweismeh' WHERE name_ar = 'القويسمة' AND (name_en IS NULL OR name_en = 'القويسمة');
UPDATE public.districts SET name_en = 'University District' WHERE name_ar = 'الجامعة' AND (name_en IS NULL OR name_en = 'الجامعة');
UPDATE public.districts SET name_en = 'Wadi Al Seer' WHERE name_ar = 'وادي السير' AND (name_en IS NULL OR name_en = 'وادي السير');
UPDATE public.districts SET name_en = 'Naour' WHERE name_ar = 'ناعور' AND (name_en IS NULL OR name_en = 'ناعور');
UPDATE public.districts SET name_en = 'Sahab' WHERE name_ar = 'سحاب' AND (name_en IS NULL OR name_en = 'سحاب');
UPDATE public.districts SET name_en = 'Al Jizah' WHERE name_ar = 'الجيزة' AND (name_en IS NULL OR name_en = 'الجيزة');
UPDATE public.districts SET name_en = 'Al Muwaqqar' WHERE name_ar = 'الموقر' AND (name_en IS NULL OR name_en = 'الموقر');
UPDATE public.districts SET name_en = 'Irbid Qasabah' WHERE name_ar IN ('قصبة إربد', 'قصبة اربد') AND (name_en IS NULL OR name_en IN ('قصبة إربد', 'قصبة اربد'));
UPDATE public.districts SET name_en = 'Ramtha' WHERE name_ar = 'الرمثا' AND (name_en IS NULL OR name_en = 'الرمثا');
UPDATE public.districts SET name_en = 'Bani Kinanah' WHERE name_ar IN ('بني كنانة', 'بني كنانه') AND (name_en IS NULL OR name_en IN ('بني كنانة', 'بني كنانه'));
UPDATE public.districts SET name_en = 'Salt Qasabah' WHERE name_ar = 'قصبة السلط' AND (name_en IS NULL OR name_en = 'قصبة السلط');
UPDATE public.districts SET name_en = 'Zarqa Qasabah' WHERE name_ar IN ('قصبة الزرقاء', 'قصبة الزرقا') AND (name_en IS NULL OR name_en IN ('قصبة الزرقاء', 'قصبة الزرقا'));
UPDATE public.districts SET name_en = 'Russeifa' WHERE name_ar IN ('الرصيفة', 'الرصيفه') AND (name_en IS NULL OR name_en IN ('الرصيفة', 'الرصيفه'));
UPDATE public.districts SET name_en = 'Madaba Qasabah' WHERE name_ar IN ('قصبة مادبا', 'قصبة مأدبا') AND (name_en IS NULL OR name_en IN ('قصبة مادبا', 'قصبة مأدبا'));
UPDATE public.districts SET name_en = 'Aqaba Qasabah' WHERE name_ar IN ('قصبة العقبة', 'قصبة العقبه') AND (name_en IS NULL OR name_en IN ('قصبة العقبة', 'قصبة العقبه'));
UPDATE public.districts SET name_en = 'Karak Qasabah' WHERE name_ar = 'قصبة الكرك' AND (name_en IS NULL OR name_en = 'قصبة الكرك');
UPDATE public.districts SET name_en = 'Ma''an Qasabah' WHERE name_ar = 'قصبة معان' AND (name_en IS NULL OR name_en = 'قصبة معان');
UPDATE public.districts SET name_en = 'Tafilah Qasabah' WHERE name_ar IN ('قصبة الطفيلة', 'قصبة الطفيله') AND (name_en IS NULL OR name_en IN ('قصبة الطفيلة', 'قصبة الطفيله'));
UPDATE public.districts SET name_en = 'Ajloun Qasabah' WHERE name_ar = 'قصبة عجلون' AND (name_en IS NULL OR name_en = 'قصبة عجلون');
UPDATE public.districts SET name_en = 'Jerash Qasabah' WHERE name_ar = 'قصبة جرش' AND (name_en IS NULL OR name_en = 'قصبة جرش');
UPDATE public.districts SET name_en = 'Mafraq Qasabah' WHERE name_ar = 'قصبة المفرق' AND (name_en IS NULL OR name_en = 'قصبة المفرق');

COMMIT;
